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

  if (!superAdminInfo.permissions.manageAllEvents) {
    return res.status(403).json({ message: 'Insufficient permissions to view all events' });
  }

  try {
    console.log('📅 [Super Admin Events API] Fetching ALL events across ALL organizations...');
    const { db } = await connectToDatabase();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const status = req.query.status as string || '';

    // Build filter query - NO ownerId filtering for super admin
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }

    const totalEvents = await db.collection('events').countDocuments(filter);
    const totalPages = Math.ceil(totalEvents / limit);
    const skip = (page - 1) * limit;

    // Fetch ALL events across ALL organizations
    const events = await db.collection('events')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get events by organization stats
    const eventsByOrg = await db.collection('events').aggregate([
      { $group: { _id: '$ownerId', eventCount: { $sum: 1 }, statuses: { $addToSet: '$status' } } },
      { $sort: { eventCount: -1 } }
    ]).toArray();

    // Get event statistics
    const eventStats = await db.collection('events').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get upcoming events across all organizations
    const upcomingEvents = await db.collection('events')
      .find({ 
        startDate: { $gte: new Date() }
      })
      .sort({ startDate: 1 })
      .limit(5)
      .toArray();

    const sanitizedEvents = events.map((event: any) => ({
      ...event,
      id: event._id.toString()
    }));

    console.log('✅ [Super Admin Events API] Successfully fetched ALL events:', {
      totalEvents,
      currentPage: page,
      eventsInPage: sanitizedEvents.length,
      organizationsCount: eventsByOrg.length,
      requestedBy: superAdminInfo.username
    });

    res.status(200).json({
      events: sanitizedEvents,
      pagination: {
        currentPage: page,
        totalPages,
        totalEvents,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      eventsByOrg: eventsByOrg.map((org: any) => ({
        ownerId: org._id,
        eventCount: org.eventCount,
        statuses: org.statuses
      })),
      eventStats: eventStats.map((stat: any) => ({
        status: stat._id,
        count: stat.count
      })),
      upcomingEvents: upcomingEvents.map((event: any) => ({
        ...event,
        id: event._id.toString()
      })),
      filters: { search, status },
      systemWide: true,
      globalView: true,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Super Admin Events API] Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
} 