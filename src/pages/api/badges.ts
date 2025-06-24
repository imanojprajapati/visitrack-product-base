import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

// Interface for JWT payload to ensure type safety
interface JWTPayload {
  userId: string;
  ownerId: string;
  email: string;
  username: string;
  role: string;
  fullName: string;
  iat?: number;
  exp?: number;
}

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

// Helper function to extract and validate JWT payload
function extractUserFromToken(authHeader: string | undefined): JWTPayload {
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Validate required global variables
    if (!decoded.ownerId || !decoded.userId || !decoded.username) {
      console.error('Invalid JWT payload - missing global variables:', {
        hasOwnerId: !!decoded.ownerId,
        hasUserId: !!decoded.userId,
        hasUsername: !!decoded.username,
        hasRole: !!decoded.role
      });
      throw new Error('Invalid token payload');
    }

    console.log('🔍 [Badges API] Extracted user info from JWT:', {
      userId: decoded.userId,
      ownerId: decoded.ownerId,
      username: decoded.username,
      role: decoded.role
    });

    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const client = await connectToDatabase();
      const db = client.db(dbName);
      
      // Extract global variables from JWT token
      const userInfo = extractUserFromToken(req.headers.authorization);
      
      console.log('📋 [Badges API] Fetching badges for user:', {
        userId: userInfo.userId,
        ownerId: userInfo.ownerId,
        username: userInfo.username,
        role: userInfo.role
      });

      // Get badges filtered by current user's ownerId (global variable)
      const badges = await db.collection('badges')
        .find({ ownerId: userInfo.ownerId })
        .sort({ createdAt: -1 })
        .toArray();

      console.log(`📊 [Badges API] Found ${badges.length} badges for ownerId: ${userInfo.ownerId}`);

      res.status(200).json(badges);
    } catch (error) {
      console.error('❌ [Badges API] Error fetching badges:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('authorization')) {
          return res.status(401).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: 'Error fetching badges' });
    }
  } else if (req.method === 'POST') {
    try {
      const client = await connectToDatabase();
      const db = client.db(dbName);

      // Extract global variables from JWT token
      const userInfo = extractUserFromToken(req.headers.authorization);

      console.log('🚀 [Badges API] Creating badge with global variables:', {
        userId: userInfo.userId,
        ownerId: userInfo.ownerId,
        username: userInfo.username,
        role: userInfo.role,
        email: userInfo.email,
        timestamp: new Date().toISOString()
      });

      // First try to find user by ownerId (primary key for user identification)
      let user = await db.collection('users').findOne({ ownerId: userInfo.ownerId });
      
      if (!user) {
        console.warn('⚠️ [Badges API] User not found by ownerId, trying by _id as fallback:', {
          searchedOwnerId: userInfo.ownerId,
          fallbackUserId: userInfo.userId
        });
        
        // Fallback: Try to find by _id if ownerId search failed
        try {
          user = await db.collection('users').findOne({ _id: new ObjectId(userInfo.userId) });
          
          if (user) {
            console.warn('⚠️ [Badges API] User found by _id but not by ownerId. Data inconsistency detected.');
            userInfo.ownerId = user.ownerId;
          }
        } catch (err) {
          console.error('❌ [Badges API] Error in fallback user lookup:', err);
        }
      }
      
      if (!user) {
        console.error('❌ [Badges API] User lookup failed with all methods:', {
          searchedOwnerId: userInfo.ownerId,
          searchedUserId: userInfo.userId,
          username: userInfo.username
        });
        return res.status(404).json({ 
          message: 'User not found', 
          debug: `User lookup failed for ownerId: ${userInfo.ownerId} and userId: ${userInfo.userId}` 
        });
      }

      const { badgeName, badgeImage, eventId } = req.body;

      // Validate required fields
      if (!badgeName || !badgeImage || !eventId) {
        return res.status(400).json({ message: 'Badge name, badge image, and event selection are required' });
      }

      // Validate eventId format
      if (!ObjectId.isValid(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID format' });
      }

      // Find the selected event to get event details
      const event = await db.collection('events').findOne({ 
        _id: new ObjectId(eventId),
        ownerId: user.ownerId  // Ensure event belongs to same organization
      });

      if (!event) {
        return res.status(404).json({ message: 'Event not found or access denied' });
      }

      console.log('✅ [Badges API] Event found for badge creation:', {
        eventId: event._id,
        eventName: event.eventName,
        eventOwnerId: event.ownerId
      });

      // Use the ownerId from the database user record to ensure consistency
      const badgeOwnerId = user.ownerId;

      // Create badge with correct ownerId
      const newBadge = {
        ownerId: badgeOwnerId,
        badgeName: badgeName.trim(),
        badgeImage: badgeImage,
        eventName: event.eventName,
        eventId: event._id.toString(),
        createdBy: {
          userId: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('💾 [Badges API] Saving badge with correct ownerId from database:', {
        badgeOwnerId: newBadge.ownerId,
        badgeName: newBadge.badgeName,
        eventName: newBadge.eventName,
        createdBy: newBadge.createdBy
      });
      
      const result = await db.collection('badges').insertOne(newBadge);
      
      console.log('✅ [Badges API] Badge created successfully:', {
        badgeId: result.insertedId,
        ownerId: newBadge.ownerId,
        badgeName: newBadge.badgeName,
        eventName: newBadge.eventName
      });
      
      res.status(201).json({
        message: 'Badge created successfully',
        badge: { ...newBadge, _id: result.insertedId }
      });

    } catch (error) {
      console.error('❌ [Badges API] Error creating badge:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('authorization')) {
          return res.status(401).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: 'Error creating badge' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const client = await connectToDatabase();
      const db = client.db(dbName);

      // Extract global variables from JWT token
      const userInfo = extractUserFromToken(req.headers.authorization);

      const badgeId = req.query.id as string;

      if (!badgeId || !ObjectId.isValid(badgeId)) {
        return res.status(400).json({ message: 'Valid badge ID is required' });
      }

      // Find user to ensure authorization
      let user = await db.collection('users').findOne({ ownerId: userInfo.ownerId });
      if (!user) {
        user = await db.collection('users').findOne({ _id: new ObjectId(userInfo.userId) });
        if (user) {
          userInfo.ownerId = user.ownerId;
        }
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete badge with organization ownership check
      const deleteResult = await db.collection('badges').deleteOne({ 
        _id: new ObjectId(badgeId),
        ownerId: user.ownerId  // Ensure badge belongs to same organization
      });

      if (deleteResult.deletedCount === 1) {
        console.log('✅ [Badges API] Badge deleted successfully:', {
          badgeId,
          ownerId: user.ownerId
        });
        res.status(200).json({ message: 'Badge deleted successfully' });
      } else {
        res.status(404).json({ message: 'Badge not found or access denied' });
      }

    } catch (error) {
      console.error('❌ [Badges API] Error deleting badge:', error);
      res.status(500).json({ message: 'Error deleting badge' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 