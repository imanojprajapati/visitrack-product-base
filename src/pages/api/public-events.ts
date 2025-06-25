import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, MongoClientOptions } from 'mongodb';

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
      console.log('🔄 Cached connection failed, resetting...');
      cachedClient = null;
    }
  }

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 MongoDB connection attempt ${attempt}/${maxRetries}`);
      const client = new MongoClient(uri, options);
      await client.connect();
      await client.db(dbName).admin().ping();
      cachedClient = client;
      console.log('✅ MongoDB connected successfully (public-events)');
      return client;
    } catch (error) {
      lastError = error;
      console.log(`❌ Connection attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
      
      if (attempt < maxRetries) {
        const delay = attempt * 1000; // 1s, 2s, 3s delays
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const client = await connectToDatabase();
      const db = client.db(dbName);
      
      console.log('📋 Fetching all public events...');

      // Get all events that are not draft status (public events)
      const events = await db.collection('events')
        .find({ 
          status: { $ne: 'draft' } // Exclude draft events from public display
        })
        .sort({ createdAt: -1 })
        .toArray();

      console.log(`📊 Found ${events.length} public events`);

      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching public events:', error);
      
      // Return empty array instead of error to prevent UI breaking
      if (error instanceof Error && (error.message.includes('SSL') || error.message.includes('TLS'))) {
        console.log('🔄 SSL/TLS error detected, returning empty events array');
        res.status(200).json([]);
      } else {
        res.status(500).json({ message: 'Error fetching events' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: 'Method not allowed' });
  }
} 