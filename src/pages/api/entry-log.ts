import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, MongoClientOptions } from 'mongodb';
import jwt from 'jsonwebtoken';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

let cachedClient: MongoClient | null = null;

const options: MongoClientOptions = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 5,
  retryWrites: true,
  retryReads: true,
  family: 4
};

async function connectToDatabase() {
  if (cachedClient) {
    try {
      await cachedClient.db(dbName).admin().ping();
      return cachedClient;
    } catch (error) {
      cachedClient = null;
    }
  }

  const client = new MongoClient(uri, options);
  await client.connect();
  await client.db(dbName).admin().ping();
  cachedClient = client;
  console.log('✅ MongoDB connected successfully (entry-log)');
  return client;
}

function extractUserFromToken(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authHeader.substring(7);
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return {
      userId: decoded.userId,
      ownerId: decoded.ownerId,
      username: decoded.username
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db(dbName);
    
    const userInfo = extractUserFromToken(req.headers.authorization);
    
    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    console.log('📊 [Entry Log API] Request:', {
      method: req.method,
      userId: userInfo.userId,
      ownerId: userInfo.ownerId,
      page,
      limit
    });

    // Build query to filter visitors with manual or QR entry types
    const query = {
      ownerId: userInfo.ownerId,
      entryType: { 
        $in: ['manual', 'Manual', 'qr', 'QR', 'QR Code', 'qrcode'] 
      }
    };

    // Get total count for pagination
    const totalCount = await db.collection('visitors').countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch visitors with entry log data
    const visitors = await db.collection('visitors')
      .find(query)
      .sort({ updatedAt: -1, createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log(`✅ [Entry Log API] Found ${visitors.length} entry log records for owner: ${userInfo.ownerId}`);

    return res.status(200).json({
      visitors,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });

  } catch (error: any) {
    console.error('❌ [Entry Log API] Error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
} 