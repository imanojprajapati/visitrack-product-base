import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, MongoClientOptions, ObjectId } from 'mongodb';
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
  console.log('✅ MongoDB connected successfully (manual-entry)');
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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db(dbName);
    
    const userInfo = extractUserFromToken(req.headers.authorization);
    const { visitorId } = req.body;

    console.log('🔄 [Manual Entry API] Request:', {
      method: req.method,
      userId: userInfo.userId,
      ownerId: userInfo.ownerId,
      visitorId
    });

    // Validate input
    if (!visitorId) {
      return res.status(400).json({ message: 'Visitor ID is required' });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(visitorId)) {
      return res.status(400).json({ message: 'Invalid visitor ID format' });
    }

    // Find the visitor and verify ownership
    const visitor = await db.collection('visitors').findOne({
      _id: new ObjectId(visitorId),
      ownerId: userInfo.ownerId
    });

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found or access denied' });
    }

    // Update the visitor's entry type to Manual
    const updateResult = await db.collection('visitors').updateOne(
      {
        _id: new ObjectId(visitorId),
        ownerId: userInfo.ownerId
      },
      {
        $set: {
          entryType: 'Manual',
          status: 'Visited', // Also update status to Visited when manually checked in
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({ message: 'Failed to update visitor entry type' });
    }

    console.log(`✅ [Manual Entry API] Updated visitor ${visitorId} to Manual entry type`);

    // Log the manual entry action
    await db.collection('entryLogs').insertOne({
      visitorId: new ObjectId(visitorId),
      visitorName: visitor.fullName,
      visitorEmail: visitor.email,
      eventId: visitor.eventId,
      eventName: visitor.eventName,
      ownerId: userInfo.ownerId,
      entryType: 'Manual',
      entryBy: userInfo.userId,
      entryByUsername: userInfo.username,
      previousEntryType: visitor.entryType,
      previousStatus: visitor.status,
      newStatus: 'Visited',
      entryDate: new Date(),
      createdAt: new Date()
    });

    return res.status(200).json({
      message: 'Entry type updated successfully',
      visitorId: visitorId,
      visitorName: visitor.fullName,
      previousEntryType: visitor.entryType,
      newEntryType: 'Manual',
      previousStatus: visitor.status,
      newStatus: 'Visited'
    });

  } catch (error: any) {
    console.error('❌ [Manual Entry API] Error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
} 