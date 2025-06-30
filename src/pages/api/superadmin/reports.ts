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

  if (!superAdminInfo.permissions.reports) {
    return res.status(403).json({ message: 'Insufficient permissions to view reports' });
  }

  try {
    console.log('📊 [Super Admin Reports API] Fetching ALL reports data across ALL organizations...');
    const { db } = await connectToDatabase();

    const reportType = req.query.type as string || 'overview';
    const dateFrom = req.query.dateFrom as string || '';
    const dateTo = req.query.dateTo as string || '';

    // Build date filter if provided
    const dateFilter: any = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) {
        dateFilter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateFilter.createdAt.$lte = new Date(dateTo);
      }
    }

    let reportData: any = {};

    if (reportType === 'overview' || reportType === 'all') {
      // Get ALL visitors data across all organizations
      const totalVisitors = await db.collection('visitors').countDocuments(dateFilter);
      const visitorsByStatus = await db.collection('visitors').aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray();

      const visitorsByOrg = await db.collection('visitors').aggregate([
        { $match: dateFilter },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();

      // Get ALL entry logs across all organizations
      const totalEntries = await db.collection('entry-logs').countDocuments(dateFilter);
      const entriesByType = await db.collection('entry-logs').aggregate([
        { $match: dateFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]).toArray();

      // Get ALL visitor dataset (centerdb) across all organizations
      const totalCenterDbRecords = await db.collection('visitor-dataset').countDocuments(dateFilter);
      const centerDbByOrg = await db.collection('visitor-dataset').aggregate([
        { $match: dateFilter },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();

      // Get ALL events across all organizations
      const totalEvents = await db.collection('events').countDocuments(dateFilter);
      const eventsByStatus = await db.collection('events').aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray();

      reportData = {
        overview: {
          totalVisitors,
          totalEntries,
          totalCenterDbRecords,
          totalEvents,
          visitorsByStatus,
          visitorsByOrg,
          entriesByType,
          centerDbByOrg,
          eventsByStatus
        }
      };
    }

    if (reportType === 'visitors' || reportType === 'all') {
      // Detailed visitor report across ALL organizations
      const visitorDetails = await db.collection('visitors')
        .find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      reportData.visitors = {
        details: visitorDetails.map((visitor: any) => ({
          ...visitor,
          id: visitor._id.toString()
        })),
        totalCount: await db.collection('visitors').countDocuments(dateFilter)
      };
    }

    if (reportType === 'centerdb' || reportType === 'all') {
      // Detailed center DB report across ALL organizations
      const centerDbDetails = await db.collection('visitor-dataset')
        .find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      reportData.centerDb = {
        details: centerDbDetails.map((record: any) => ({
          ...record,
          id: record._id.toString()
        })),
        totalCount: await db.collection('visitor-dataset').countDocuments(dateFilter)
      };
    }

    if (reportType === 'entries' || reportType === 'all') {
      // Detailed entry logs report across ALL organizations
      const entryDetails = await db.collection('entry-logs')
        .find(dateFilter)
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();

      reportData.entries = {
        details: entryDetails.map((entry: any) => ({
          ...entry,
          id: entry._id.toString()
        })),
        totalCount: await db.collection('entry-logs').countDocuments(dateFilter)
      };
    }

    console.log('✅ [Super Admin Reports API] Successfully generated global reports:', {
      reportType,
      dateFilter: Object.keys(dateFilter).length > 0 ? dateFilter : 'No date filter',
      requestedBy: superAdminInfo.username
    });

    res.status(200).json({
      reportType,
      dateFilter: { dateFrom, dateTo },
      data: reportData,
      systemWide: true,
      globalView: true,
      generatedAt: new Date().toISOString(),
      generatedBy: superAdminInfo.username
    });

  } catch (error) {
    console.error('❌ [Super Admin Reports API] Error generating reports:', error);
    res.status(500).json({ message: 'Failed to generate reports' });
  }
} 