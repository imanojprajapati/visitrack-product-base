import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

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
      res.status(500).json({ message: 'Error fetching events' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: 'Method not allowed' });
  }
} 