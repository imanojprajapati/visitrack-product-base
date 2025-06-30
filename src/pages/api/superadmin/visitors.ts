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

function verifySuperAdminToken(token: string): SuperAdminJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SuperAdminJWTPayload;
    return decoded.role === 'superadmin' ? decoded : null;
  } catch (error) {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const superAdminInfo = verifySuperAdminToken(token);

  if (!superAdminInfo) {
    return res.status(401).json({ message: 'Invalid super admin token' });
  }

  if (!superAdminInfo.permissions.manageAllVisitors) {
    return res.status(403).json({ message: 'Insufficient permissions to view all visitors' });
  }

  try {
    console.log('👤 [Super Admin Visitors API] Fetching ALL visitors across ALL organizations...');
    const { db } = await connectToDatabase();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const status = req.query.status as string || '';

    // Build filter query - NO ownerId filtering for super admin
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }

    const totalVisitors = await db.collection('visitors').countDocuments(filter);
    const totalPages = Math.ceil(totalVisitors / limit);
    const skip = (page - 1) * limit;

    // Fetch ALL visitors across ALL organizations
    const visitors = await db.collection('visitors')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get visitors by organization stats
    const visitorsByOrg = await db.collection('visitors').aggregate([
      { $group: { _id: '$ownerId', visitorCount: { $sum: 1 }, statuses: { $addToSet: '$status' } } },
      { $sort: { visitorCount: -1 } }
    ]).toArray();

    // Get visitor statistics
    const visitorStats = await db.collection('visitors').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get recent check-ins across all organizations
    const recentCheckIns = await db.collection('entry-logs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    const sanitizedVisitors = visitors.map((visitor: any) => ({
      ...visitor,
      id: visitor._id.toString()
    }));

    console.log('✅ [Super Admin Visitors API] Successfully fetched ALL visitors:', {
      totalVisitors,
      currentPage: page,
      visitorsInPage: sanitizedVisitors.length,
      organizationsCount: visitorsByOrg.length,
      requestedBy: superAdminInfo.username
    });

    res.status(200).json({
      visitors: sanitizedVisitors,
      pagination: {
        currentPage: page,
        totalPages,
        totalVisitors,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      visitorsByOrg: visitorsByOrg.map((org: any) => ({
        ownerId: org._id,
        visitorCount: org.visitorCount,
        statuses: org.statuses
      })),
      visitorStats: visitorStats.map((stat: any) => ({
        status: stat._id,
        count: stat.count
      })),
      recentCheckIns: recentCheckIns.map((entry: any) => ({
        ...entry,
        id: entry._id.toString()
      })),
      filters: { search, status },
      systemWide: true,
      globalView: true,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Super Admin Visitors API] Error fetching visitors:', error);
    res.status(500).json({ message: 'Failed to fetch visitors' });
  }
} 