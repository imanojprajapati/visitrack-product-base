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
    return res.status(403).json({ message: 'Insufficient permissions to view all badges' });
  }

  try {
    console.log('🏷️ [Super Admin Badges API] Fetching ALL badges across ALL organizations...');
    const { db } = await connectToDatabase();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const eventId = req.query.eventId as string || '';

    // Build filter query - NO ownerId filtering for super admin
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { design: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (eventId) {
      filter.eventId = eventId;
    }

    const totalBadges = await db.collection('badges').countDocuments(filter);
    const totalPages = Math.ceil(totalBadges / limit);
    const skip = (page - 1) * limit;

    // Fetch ALL badges across ALL organizations
    const badges = await db.collection('badges')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get badges by organization stats
    const badgesByOrg = await db.collection('badges').aggregate([
      { $group: { _id: '$ownerId', badgeCount: { $sum: 1 }, designs: { $addToSet: '$design' } } },
      { $sort: { badgeCount: -1 } }
    ]).toArray();

    // Get badge statistics by design
    const badgeStats = await db.collection('badges').aggregate([
      {
        $group: {
          _id: '$design',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get recently created badges across all organizations
    const recentBadges = await db.collection('badges')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const sanitizedBadges = badges.map((badge: any) => ({
      ...badge,
      id: badge._id.toString()
    }));

    console.log('✅ [Super Admin Badges API] Successfully fetched ALL badges:', {
      totalBadges,
      currentPage: page,
      badgesInPage: sanitizedBadges.length,
      organizationsCount: badgesByOrg.length,
      requestedBy: superAdminInfo.username
    });

    res.status(200).json({
      badges: sanitizedBadges,
      pagination: {
        currentPage: page,
        totalPages,
        totalBadges,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      badgesByOrg: badgesByOrg.map((org: any) => ({
        ownerId: org._id,
        badgeCount: org.badgeCount,
        designs: org.designs
      })),
      badgeStats: badgeStats.map((stat: any) => ({
        design: stat._id,
        count: stat.count
      })),
      recentBadges: recentBadges.map((badge: any) => ({
        ...badge,
        id: badge._id.toString()
      })),
      filters: { search, eventId },
      systemWide: true,
      globalView: true,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Super Admin Badges API] Error fetching badges:', error);
    res.status(500).json({ message: 'Failed to fetch badges' });
  }
} 