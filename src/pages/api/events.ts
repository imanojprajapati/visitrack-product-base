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

    console.log('🔍 Extracted user info from JWT:', {
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
      
      console.log('📋 Fetching events for user:', {
        userId: userInfo.userId,
        ownerId: userInfo.ownerId,
        username: userInfo.username,
        role: userInfo.role
      });

      // Get events filtered by current user's ownerId (global variable)
      const events = await db.collection('events')
        .find({ ownerId: userInfo.ownerId })
        .sort({ createdAt: -1 })
        .toArray();

      console.log(`📊 Found ${events.length} events for ownerId: ${userInfo.ownerId}`);

      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('authorization')) {
          return res.status(401).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: 'Error fetching events' });
    }
  } else if (req.method === 'POST') {
    try {
      const client = await connectToDatabase();
      const db = client.db(dbName);

      // Extract global variables from JWT token
      const userInfo = extractUserFromToken(req.headers.authorization);

      console.log('🚀 Creating event with global variables:', {
        userId: userInfo.userId,
        ownerId: userInfo.ownerId,
        username: userInfo.username,
        role: userInfo.role,
        email: userInfo.email,
        timestamp: new Date().toISOString()
      });

      // ✅ FIX: First try to find user by ownerId (primary key for user identification)
      let user = await db.collection('users').findOne({ ownerId: userInfo.ownerId });
      
      if (!user) {
        console.warn('⚠️ User not found by ownerId, trying by _id as fallback:', {
          searchedOwnerId: userInfo.ownerId,
          fallbackUserId: userInfo.userId
        });
        
        // Fallback: Try to find by _id if ownerId search failed
        try {
          user = await db.collection('users').findOne({ _id: new ObjectId(userInfo.userId) });
          
          if (user) {
            console.warn('⚠️ CRITICAL: User found by _id but not by ownerId. This suggests data inconsistency:', {
              foundUser: {
                _id: user._id,
                ownerId: user.ownerId,
                username: user.username,
                email: user.email
              },
              jwtClaims: {
                userId: userInfo.userId,
                ownerId: userInfo.ownerId,
                username: userInfo.username
              }
            });
            
            // Update the ownerId in our JWT claims to match the database
            console.log('🔧 Using database ownerId instead of JWT ownerId for event creation');
            userInfo.ownerId = user.ownerId;
          }
        } catch (err) {
          console.error('Error in fallback user lookup:', err);
        }
      }
      
      if (!user) {
        console.error('❌ User lookup failed with all methods:', {
          searchedOwnerId: userInfo.ownerId,
          searchedUserId: userInfo.userId,
          username: userInfo.username
        });
        return res.status(404).json({ 
          message: 'User not found', 
          debug: `User lookup failed for ownerId: ${userInfo.ownerId} and userId: ${userInfo.userId}` 
        });
      }

      // Log successful user lookup
      console.log('✅ User found in database:', {
        databaseOwnerId: user.ownerId,
        databaseUserId: user._id.toString(),
        jwtOwnerId: userInfo.ownerId,
        jwtUserId: userInfo.userId,
        username: user.username,
        matches: {
          ownerIdMatch: user.ownerId === userInfo.ownerId,
          userIdMatch: user._id.toString() === userInfo.userId
        }
      });

      const {
        eventName,
        status,
        eventStartDate,
        eventEndDate,
        eventStartTime,
        eventEndTime,
        eventLocation,
        registrationDeadline,
        eventInformation,
        eventBanner
      } = req.body;

      // Validate required fields
      if (!eventName || !status || !eventStartDate || !eventEndDate || 
          !eventStartTime || !eventEndTime || !eventLocation || 
          !registrationDeadline || !eventInformation) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Validate date logic
      const startDate = new Date(eventStartDate);
      const endDate = new Date(eventEndDate);
      const regDeadline = new Date(registrationDeadline);

      // Allow same start and end date for single-day events
      if (endDate < startDate) {
        return res.status(400).json({ message: 'End date cannot be before start date' });
      }

      if (regDeadline > startDate) {
        return res.status(400).json({ message: 'Registration deadline must be before event start date' });
      }

      // ✅ FIX: Use the ownerId from the database user record to ensure consistency
      const eventOwnerId = user.ownerId; // This ensures we use the correct ownerId from database

      // Create event with correct ownerId
      const newEvent = {
        ownerId: eventOwnerId, // ✅ Using database ownerId ensures consistency
        createdBy: {
          userId: user._id.toString(), // Use database _id
          username: user.username,     // Use database username
          email: user.email,           // Use database email
          role: user.role              // Use database role
        },
        eventName,
        status,
        eventStartDate,
        eventEndDate,
        eventStartTime,
        eventEndTime,
        eventLocation,
        capacity: user.capacity, // Get capacity from user collection
        visitorCount: 0, // Starting value is 0
        registrationDeadline,
        eventInformation,
        eventBanner: eventBanner || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('💾 Saving event with CORRECT ownerId from database:', {
        eventOwnerId: newEvent.ownerId,
        eventName: newEvent.eventName,
        createdBy: newEvent.createdBy,
        verification: {
          databaseOwnerId: user.ownerId,
          usedOwnerId: newEvent.ownerId,
          match: user.ownerId === newEvent.ownerId
        }
      });
      
      const result = await db.collection('events').insertOne(newEvent);
      
      console.log('✅ Event created successfully with correct ownerId:', {
        eventId: result.insertedId,
        ownerId: newEvent.ownerId,
        username: user.username,
        eventName: newEvent.eventName
      });
      
      res.status(201).json({
        message: 'Event created successfully',
        eventId: result.insertedId,
        event: { ...newEvent, _id: result.insertedId },
        globalVariables: {
          userId: user._id.toString(),
          ownerId: user.ownerId,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error creating event:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('authorization')) {
          return res.status(401).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: 'Error creating event' });
    }
  } else if (req.method === 'PUT') {
    try {
      const client = await connectToDatabase();
      const db = client.db(dbName);

      // Extract global variables from JWT token
      const userInfo = extractUserFromToken(req.headers.authorization);

      console.log('🔄 Updating event with global variables:', {
        userId: userInfo.userId,
        ownerId: userInfo.ownerId,
        username: userInfo.username,
        role: userInfo.role
      });

      const { eventId, ...updateData } = req.body;

      if (!eventId) {
        return res.status(400).json({ message: 'Event ID is required' });
      }

      // Update event only if it belongs to the authenticated user (using global variable ownerId)
      const result = await db.collection('events').updateOne(
        { _id: new ObjectId(eventId), ownerId: userInfo.ownerId }, // Security: Only update events owned by current user
        { 
          $set: { 
            ...updateData, 
            visitorCount: parseInt(updateData.visitorCount) || 0,
            updatedAt: new Date(),
            lastUpdatedBy: {
              userId: userInfo.userId,
              username: userInfo.username,
              email: userInfo.email,
              updatedAt: new Date()
            }
          } 
        }
      );

      if (result.matchedCount === 0) {
        console.log('⚠️ Event update failed - not found or unauthorized:', {
          eventId,
          ownerId: userInfo.ownerId,
          username: userInfo.username
        });
        return res.status(404).json({ message: 'Event not found or unauthorized' });
      }

      console.log('✅ Event updated successfully:', {
        eventId,
        ownerId: userInfo.ownerId,
        username: userInfo.username
      });

      res.status(200).json({ 
        message: 'Event updated successfully',
        globalVariables: {
          userId: userInfo.userId,
          ownerId: userInfo.ownerId,
          username: userInfo.username,
          role: userInfo.role
        }
      });
    } catch (error) {
      console.error('Error updating event:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('authorization')) {
          return res.status(401).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: 'Error updating event' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).json({ message: 'Method not allowed' });
  }
} 