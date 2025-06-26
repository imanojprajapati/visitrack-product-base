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
  console.log('✅ MongoDB connected successfully (qr-entry)');
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
    const { visitorId, qrData } = req.body;

    console.log('🔍 [QR Entry API] Request:', {
      method: req.method,
      userId: userInfo.userId,
      ownerId: userInfo.ownerId,
      visitorId,
      qrData: qrData?.substring(0, 50) + '...' // Log first 50 chars only
    });

    // Validate input
    if (!visitorId) {
      return res.status(400).json({ message: 'Visitor ID is required' });
    }

    // Clean visitor ID (remove any extra characters)
    const cleanVisitorId = visitorId.toString().trim();

    // Validate ObjectId format
    if (!ObjectId.isValid(cleanVisitorId)) {
      return res.status(400).json({ 
        message: 'Invalid visitor ID format. Please scan a valid QR code.',
        details: `Received ID: ${cleanVisitorId}`
      });
    }

    // Find the visitor and verify ownership
    const visitor = await db.collection('visitors').findOne({
      _id: new ObjectId(cleanVisitorId),
      ownerId: userInfo.ownerId
    });

    if (!visitor) {
      return res.status(404).json({ 
        message: 'Visitor not found or access denied. Please check the QR code.',
        details: `Visitor ID: ${cleanVisitorId}`
      });
    }

    // Check if visitor is already checked in via QR
    if (visitor.entryType && ['QR', 'qr', 'QR Code', 'qrcode'].includes(visitor.entryType)) {
      return res.status(200).json({
        message: `${visitor.fullName} already checked in via QR code`,
        visitorId: cleanVisitorId,
        visitorName: visitor.fullName,
        visitorEmail: visitor.email,
        visitorPhone: visitor.phoneNumber,
        visitorCompany: visitor.company,
        eventName: visitor.eventName,
        eventLocation: visitor.eventLocation,
        previousEntryType: visitor.entryType,
        newEntryType: 'QR',
        previousStatus: visitor.status,
        newStatus: visitor.status, // Keep current status if already QR
        alreadyCheckedIn: true
      });
    }

    // Update the visitor's entry type to QR and status to Visited
    const updateResult = await db.collection('visitors').updateOne(
      {
        _id: new ObjectId(cleanVisitorId),
        ownerId: userInfo.ownerId
      },
      {
        $set: {
          entryType: 'QR',
          status: 'Visited', // Update status to Visited when scanned
          lastScannedAt: new Date(),
          scannedBy: userInfo.userId,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({ message: 'Failed to update visitor entry type' });
    }

    console.log(`✅ [QR Entry API] Updated visitor ${cleanVisitorId} to QR entry type`);

    // Log the QR entry action
    await db.collection('entryLogs').insertOne({
      visitorId: new ObjectId(cleanVisitorId),
      visitorName: visitor.fullName,
      visitorEmail: visitor.email,
      eventId: visitor.eventId,
      eventName: visitor.eventName,
      ownerId: userInfo.ownerId,
      entryType: 'QR',
      entryBy: userInfo.userId,
      entryByUsername: userInfo.username,
      previousEntryType: visitor.entryType || 'None',
      previousStatus: visitor.status,
      newStatus: 'Visited',
      qrData: qrData || null,
      scanMethod: 'QR Scanner',
      entryDate: new Date(),
      createdAt: new Date()
    });

    // Update scan statistics
    await db.collection('scanStats').updateOne(
      {
        ownerId: userInfo.ownerId,
        date: new Date().toISOString().split('T')[0] // Today's date
      },
      {
        $inc: {
          totalScans: 1,
          qrScans: 1
        },
        $set: {
          lastScanAt: new Date(),
          lastScannedBy: userInfo.userId
        }
      },
      { upsert: true }
    );

    return res.status(200).json({
      message: `${visitor.fullName} successfully checked in via QR code`,
      visitorId: cleanVisitorId,
      visitorName: visitor.fullName,
      visitorEmail: visitor.email,
      visitorPhone: visitor.phoneNumber,
      visitorCompany: visitor.company,
      eventName: visitor.eventName,
      eventLocation: visitor.eventLocation,
      previousEntryType: visitor.entryType || 'None',
      newEntryType: 'QR',
      previousStatus: visitor.status,
      newStatus: 'Visited',
      scanTimestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [QR Entry API] Error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    
    // Handle specific MongoDB errors
    if (error.name === 'BSONTypeError') {
      return res.status(400).json({ 
        message: 'Invalid visitor ID format in QR code',
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      message: 'Internal server error while processing QR code',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    });
  }
} 