import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, MongoClientOptions, ObjectId } from 'mongodb';

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
  console.log('✅ MongoDB connected successfully (check-visitor)');
  return client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, eventId } = req.body;

    // Validate required fields
    if (!email || !eventId) {
      return res.status(400).json({ 
        message: 'Email and event ID are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const client = await connectToDatabase();
    const db = client.db(dbName);

    console.log('🔍 Checking if visitor already registered:', { email, eventId });

    // Check if visitor with this email is already registered for this event
    const existingVisitor = await db.collection('visitors').findOne({
      eventId,
      email
    });

    if (existingVisitor) {
      console.log('✅ Found existing visitor registration:', existingVisitor._id);
      
      // Fetch event details for complete visitor data
      const event = await db.collection('events').findOne({
        _id: new ObjectId(eventId)
      });

      const visitorData = {
        visitorId: existingVisitor._id.toString(),
        fullName: existingVisitor.fullName,
        email: existingVisitor.email,
        phoneNumber: existingVisitor.phoneNumber,
        company: existingVisitor.company || '',
        city: existingVisitor.city || '',
        state: existingVisitor.state || '',
        country: existingVisitor.country || '',
        pincode: existingVisitor.pincode || '',
        eventName: existingVisitor.eventName,
        eventLocation: existingVisitor.eventLocation,
        eventStartDate: existingVisitor.eventStartDate,
        eventEndDate: existingVisitor.eventEndDate,
        eventStartTime: event?.eventStartTime || '',
        eventEndTime: event?.eventEndTime || '',
        registrationDate: existingVisitor.visitorRegistrationDate,
        status: existingVisitor.status
      };

      return res.status(200).json({ 
        isRegistered: true,
        visitorData
      });
    } else {
      console.log('❌ No existing registration found');
      return res.status(200).json({ 
        isRegistered: false 
      });
    }

  } catch (error) {
    console.error('Error checking visitor registration:', error);
    res.status(500).json({ message: 'Failed to check registration status' });
  }
} 