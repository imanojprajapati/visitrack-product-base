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
    return res.status(403).json({ message: 'Insufficient permissions to view scanner data' });
  }

  try {
    console.log('📱 [Super Admin Scanner API] Fetching QR scanner data across all organizations...');
    const { db } = await connectToDatabase();

    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || '';
    const ownerId = req.query.ownerId as string || '';
    const dateFrom = req.query.dateFrom as string || '';
    const dateTo = req.query.dateTo as string || '';

    // Build filter query - NO ownerId filtering by default
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { visitorName: { $regex: search, $options: 'i' } },
        { visitorEmail: { $regex: search, $options: 'i' } },
        { eventTitle: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (ownerId) {
      filter.ownerId = ownerId;
    }

    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
      if (dateTo) filter.timestamp.$lte = new Date(dateTo);
    }

    // Get recent QR scan activity - ALL scans across ALL organizations
    const recentScans = await db.collection('entry-logs')
      .find({ ...filter, type: 'qr-scan' })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    // Get scan statistics by organization
    const scansByOrg = await db.collection('entry-logs').aggregate([
      { $match: { type: 'qr-scan' } },
      { $group: { _id: '$ownerId', scanCount: { $sum: 1 } } },
      { $sort: { scanCount: -1 } }
    ]).toArray();

    // Get scan statistics by event
    const scansByEvent = await db.collection('entry-logs').aggregate([
      { $match: { type: 'qr-scan' } },
      { $group: { _id: '$eventId', scanCount: { $sum: 1 }, eventTitle: { $first: '$eventTitle' } } },
      { $sort: { scanCount: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Get daily scan activity for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyScanActivity = await db.collection('entry-logs').aggregate([
      {
        $match: {
          type: 'qr-scan',
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]).toArray();

    // Get top scanned visitors
    const topScannedVisitors = await db.collection('entry-logs').aggregate([
      { $match: { type: 'qr-scan' } },
      { 
        $group: { 
          _id: '$visitorId', 
          scanCount: { $sum: 1 },
          visitorName: { $first: '$visitorName' },
          lastScan: { $max: '$timestamp' }
        } 
      },
      { $sort: { scanCount: -1 } },
      { $limit: 10 }
    ]).toArray();

    const sanitizedScans = recentScans.map((scan: any) => ({
      ...scan,
      id: scan._id.toString()
    }));

    console.log('✅ [Super Admin Scanner API] Successfully fetched scanner data:', {
      totalRecentScans: sanitizedScans.length,
      organizationsWithScans: scansByOrg.length,
      requestedBy: superAdminInfo.username
    });

    res.status(200).json({
      recentScans: sanitizedScans,
      scansByOrg: scansByOrg.map((org: any) => ({
        organizationId: org._id,
        scanCount: org.scanCount
      })),
      scansByEvent: scansByEvent.map((event: any) => ({
        eventId: event._id,
        eventTitle: event.eventTitle,
        scanCount: event.scanCount
      })),
      dailyScanActivity: dailyScanActivity.map((day: any) => ({
        date: day._id,
        scans: day.count
      })),
      topScannedVisitors: topScannedVisitors.map((visitor: any) => ({
        visitorId: visitor._id,
        visitorName: visitor.visitorName,
        scanCount: visitor.scanCount,
        lastScan: visitor.lastScan
      })),
      filters: { search, ownerId, dateFrom, dateTo },
      systemWide: true,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Super Admin Scanner API] Error fetching scanner data:', error);
    res.status(500).json({ message: 'Failed to fetch scanner data' });
  }
} 