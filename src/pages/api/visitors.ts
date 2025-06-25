import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

// Interface for JWT payload
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
    
    if (!decoded.ownerId || !decoded.userId || !decoded.username) {
      throw new Error('Invalid token payload');
    }

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
      
      const userInfo = extractUserFromToken(req.headers.authorization);
      
      console.log('📋 [Visitors API] Fetching visitors for user:', {
        userId: userInfo.userId,
        ownerId: userInfo.ownerId,
        username: userInfo.username
      });

      // Get query parameters for filtering and pagination
      const { page = '1', limit = '10', eventId, status, search } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter query
      const filter: any = { ownerId: userInfo.ownerId };

      if (eventId && eventId !== 'all') {
        filter.eventId = eventId;
      }

      if (status && status !== 'all') {
        filter.status = status;
      }

      if (search) {
        filter.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } }
        ];
      }

      // Get total count for pagination
      const totalCount = await db.collection('visitors').countDocuments(filter);

      // Fetch visitors with pagination
      const rawVisitors = await db.collection('visitors')
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();

      // Convert ObjectId to string for frontend consumption
      const visitors = rawVisitors.map(visitor => ({
        ...visitor,
        _id: visitor._id.toString()
      }));

      console.log(`📊 [Visitors API] Found ${visitors.length} visitors (page ${pageNum}/${Math.ceil(totalCount / limitNum)}) for ownerId: ${userInfo.ownerId}`);

      res.status(200).json({
        visitors,
        pagination: {
          current: pageNum,
          total: Math.ceil(totalCount / limitNum),
          count: totalCount,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('❌ [Visitors API] Error fetching visitors:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('authorization')) {
          return res.status(401).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: 'Error fetching visitors' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 