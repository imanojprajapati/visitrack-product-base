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

  if (!superAdminInfo.permissions.viewAllData) {
    return res.status(403).json({ message: 'Insufficient permissions to view all entry logs' });
  }

  try {
    console.log('📝 [Super Admin Entry Logs API] Fetching ALL entry logs across ALL organizations...');
    const { db } = await connectToDatabase();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const type = req.query.type as string || '';
    const dateFrom = req.query.dateFrom as string || '';
    const dateTo = req.query.dateTo as string || '';

    // Build filter query - NO ownerId filtering for super admin
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { visitorName: { $regex: search, $options: 'i' } },
        { visitorEmail: { $regex: search, $options: 'i' } },
        { eventTitle: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) {
      filter.type = type;
    }

    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) {
        filter.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.timestamp.$lte = new Date(dateTo);
      }
    }

    const totalEntries = await db.collection('entry-logs').countDocuments(filter);
    const totalPages = Math.ceil(totalEntries / limit);
    const skip = (page - 1) * limit;

    // Fetch ALL entry logs across ALL organizations
    const entryLogs = await db.collection('entry-logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get entry logs by organization stats
    const entriesByOrg = await db.collection('entry-logs').aggregate([
      { $group: { _id: '$ownerId', entryCount: { $sum: 1 }, types: { $addToSet: '$type' } } },
      { $sort: { entryCount: -1 } }
    ]).toArray();

    // Get entry statistics by type
    const entryStats = await db.collection('entry-logs').aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get recent entries across all organizations
    const recentEntries = await db.collection('entry-logs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // Get hourly stats for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hourlyStats = await db.collection('entry-logs').aggregate([
      {
        $match: {
          timestamp: { $gte: today }
        }
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]).toArray();

    const sanitizedEntryLogs = entryLogs.map((entry: any) => ({
      ...entry,
      id: entry._id.toString()
    }));

    console.log('✅ [Super Admin Entry Logs API] Successfully fetched ALL entry logs:', {
      totalEntries,
      currentPage: page,
      entriesInPage: sanitizedEntryLogs.length,
      organizationsCount: entriesByOrg.length,
      requestedBy: superAdminInfo.username
    });

    res.status(200).json({
      entryLogs: sanitizedEntryLogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalEntries,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      entriesByOrg: entriesByOrg.map((org: any) => ({
        ownerId: org._id,
        entryCount: org.entryCount,
        types: org.types
      })),
      entryStats: entryStats.map((stat: any) => ({
        type: stat._id,
        count: stat.count
      })),
      recentEntries: recentEntries.map((entry: any) => ({
        ...entry,
        id: entry._id.toString()
      })),
      hourlyStats: hourlyStats.map((stat: any) => ({
        hour: stat._id,
        count: stat.count
      })),
      filters: { search, type, dateFrom, dateTo },
      systemWide: true,
      globalView: true,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Super Admin Entry Logs API] Error fetching entry logs:', error);
    res.status(500).json({ message: 'Failed to fetch entry logs' });
  }
} 