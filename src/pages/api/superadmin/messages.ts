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
    return res.status(403).json({ message: 'Insufficient permissions to view all messages' });
  }

  try {
    console.log('📧 [Super Admin Messages API] Fetching all messages across all organizations...');
    const { db } = await connectToDatabase();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const status = req.query.status as string || '';
    const type = req.query.type as string || '';
    const ownerId = req.query.ownerId as string || '';

    // Build filter query - NO ownerId filtering by default
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { recipient: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (ownerId) {
      filter.ownerId = ownerId;
    }

    const totalMessages = await db.collection('messages').countDocuments(filter);
    const totalPages = Math.ceil(totalMessages / limit);
    const skip = (page - 1) * limit;

    // Fetch messages - ALL messages across ALL organizations
    const messages = await db.collection('messages')
      .find(filter)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get messages by organization stats
    const messagesByOrg = await db.collection('messages').aggregate([
      { $group: { _id: '$ownerId', messageCount: { $sum: 1 }, types: { $addToSet: '$type' } } },
      { $sort: { messageCount: -1 } }
    ]).toArray();

    // Get message statistics
    const messageStats = await db.collection('messages').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get message templates stats
    const templateStats = await db.collection('message-templates').aggregate([
      { $group: { _id: '$type', templateCount: { $sum: 1 } } },
      { $sort: { templateCount: -1 } }
    ]).toArray();

    const sanitizedMessages = messages.map((message: any) => ({
      ...message,
      id: message._id.toString()
    }));

    console.log('✅ [Super Admin Messages API] Successfully fetched messages:', {
      totalMessages,
      currentPage: page,
      messagesInPage: sanitizedMessages.length,
      requestedBy: superAdminInfo.username
    });

    res.status(200).json({
      messages: sanitizedMessages,
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      messagesByOrg: messagesByOrg.map((org: any) => ({
        ownerId: org._id,
        messageCount: org.messageCount,
        types: org.types
      })),
      messageStats: messageStats.map((stat: any) => ({
        status: stat._id,
        count: stat.count
      })),
      templateStats: templateStats.map((stat: any) => ({
        type: stat._id,
        templateCount: stat.templateCount
      })),
      filters: { search, status, type, ownerId },
      systemWide: true,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Super Admin Messages API] Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
} 