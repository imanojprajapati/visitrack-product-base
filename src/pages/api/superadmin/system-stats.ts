import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET!;

interface SuperAdminJWTPayload {
  superAdminId: string;
  username: string;
  role: 'superadmin';
  permissions: {
    viewAllData: boolean;
    manageAllUsers: boolean;
    manageAllEvents: boolean;
    manageAllVisitors: boolean;
    systemSettings: boolean;
    analytics: boolean;
    reports: boolean;
  };
}

// Helper function to verify super admin JWT
function verifySuperAdminToken(token: string): SuperAdminJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SuperAdminJWTPayload;
    if (decoded.role !== 'superadmin') {
      return null;
    }
    return decoded;
  } catch (error) {
    console.error('❌ Super admin token verification failed:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify super admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const superAdminInfo = verifySuperAdminToken(token);

  if (!superAdminInfo) {
    return res.status(401).json({ message: 'Invalid super admin token' });
  }

  if (!superAdminInfo.permissions.viewAllData) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  try {
    console.log('📊 [System Stats] Fetching system-wide statistics...');
    const { db } = await connectToDatabase();

    // Get all system statistics without any ownerId filtering
    const [
      totalUsers,
      totalEvents,
      totalVisitors,
      totalSuperAdmins,
      uniqueOrganizations,
      recentUsers,
      recentEvents,
      activeUsers,
      usersByRole,
      eventsByMonth
    ] = await Promise.all([
      // Basic counts
      db.collection('users').countDocuments(),
      db.collection('events').countDocuments(),
      db.collection('visitors').countDocuments(),
      db.collection('superadmins').countDocuments(),
      
      // Unique organizations
      db.collection('users').distinct('ownerId'),
      
      // Recent activity (last 30 days)
      db.collection('users').find({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).sort({ createdAt: -1 }).limit(10).toArray(),
      
      db.collection('events').find({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).sort({ createdAt: -1 }).limit(10).toArray(),
      
      // Active users (logged in last 7 days)
      db.collection('users').countDocuments({
        lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      
      // Users by role
      db.collection('users').aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      
      // Events by month (last 6 months)
      db.collection('events').aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]).toArray()
    ]);

    // Top organizations by user count
    const topOrganizations = await db.collection('users').aggregate([
      { $group: { _id: '$ownerId', userCount: { $sum: 1 }, users: { $push: { fullName: '$fullName', role: '$role' } } } },
      { $sort: { userCount: -1 } },
      { $limit: 10 }
    ]).toArray();

    // System health metrics
    const systemHealth = {
      totalCollections: await db.listCollections().toArray().then((collections: any[]) => collections.length),
      databaseSize: await db.stats().then((stats: any) => stats.dataSize),
      indexCount: await db.collection('users').indexes().then((indexes: any[]) => indexes.length)
    };

    const systemStats = {
      // Basic metrics
      totalUsers,
      totalOrganizations: uniqueOrganizations.length,
      totalEvents,
      totalVisitors,
      totalSuperAdmins,
      activeUsers,
      
      // Breakdown data
      usersByRole: usersByRole.map((item: any) => ({
        role: item._id,
        count: item.count
      })),
      
      // Recent activity
      recentUsers: recentUsers.map((user: any) => ({
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        ownerId: user.ownerId,
        createdAt: user.createdAt
      })),
      
      recentEvents: recentEvents.map((event: any) => ({
        id: event._id,
        title: event.title,
        ownerId: event.ownerId,
        createdAt: event.createdAt
      })),
      
      // Growth metrics
      eventsByMonth: eventsByMonth.map((item: any) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count
      })),
      
      // Top organizations
      topOrganizations: topOrganizations.map((org: any) => ({
        ownerId: org._id,
        userCount: org.userCount,
        users: org.users.slice(0, 3) // Top 3 users for preview
      })),
      
      // System health
      systemHealth,
      
      // Timestamp
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ [System Stats] Successfully fetched system statistics:', {
      totalUsers,
      totalOrganizations: uniqueOrganizations.length,
      totalEvents,
      totalVisitors,
      requestedBy: superAdminInfo.username
    });

    res.status(200).json(systemStats);

  } catch (error) {
    console.error('❌ [System Stats] Error fetching system statistics:', error);
    res.status(500).json({ message: 'Failed to fetch system statistics' });
  }
} 