import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { connectToDatabase, dbName } from '../../../lib/mongodb';

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

    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query;

  if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();

      if (!eventId || typeof eventId !== 'string') {
        return res.status(400).json({ message: 'Valid event ID is required' });
      }

      console.log('🔍 Fetching event with ID:', eventId);

      // Find event by ID (public access for registration)
      const event = await db.collection('events').findOne({
        _id: new ObjectId(eventId)
      });

      if (!event) {
        console.log('❌ Event not found:', eventId);
        return res.status(404).json({ message: 'Event not found' });
      }

      console.log('✅ Event found:', event.eventName);
      res.status(200).json(event);

    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Error fetching event' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { db } = await connectToDatabase();

      // Extract global variables from JWT token using helper function
      const userInfo = extractUserFromToken(req.headers.authorization);

      console.log('🗑️ Deleting event with global variables:', {
        userId: userInfo.userId,
        ownerId: userInfo.ownerId,
        username: userInfo.username,
        eventId: eventId
      });

      if (!eventId || typeof eventId !== 'string') {
        return res.status(400).json({ message: 'Valid event ID is required' });
      }

      // Delete event only if it belongs to the authenticated user (using ownerId from JWT)
      const result = await db.collection('events').deleteOne({
        _id: new ObjectId(eventId),
        ownerId: userInfo.ownerId // ✅ Use ownerId from JWT for authorization
      });

      if (result.deletedCount === 0) {
        console.log('⚠️ Event deletion failed - not found or unauthorized:', {
          eventId,
          ownerId: userInfo.ownerId,
          username: userInfo.username
        });
        return res.status(404).json({ message: 'Event not found or unauthorized' });
      }

      console.log('✅ Event deleted successfully:', {
        eventId,
        ownerId: userInfo.ownerId,
        username: userInfo.username
      });

      res.status(200).json({ 
        message: 'Event deleted successfully',
        globalVariables: {
          userId: userInfo.userId,
          ownerId: userInfo.ownerId,
          username: userInfo.username,
          role: userInfo.role
        }
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('authorization')) {
          return res.status(401).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: 'Error deleting event' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE']);
    res.status(405).json({ message: 'Method not allowed' });
  }
} 