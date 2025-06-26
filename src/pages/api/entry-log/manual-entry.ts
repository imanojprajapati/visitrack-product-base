import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({ message: 'Visitor ID is required' });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(visitorId)) {
      return res.status(400).json({ message: 'Invalid visitor ID format' });
    }

    console.log('🔍 [Manual Entry] Looking for visitor:', {
      visitorId,
      ownerId: decoded.ownerId || decoded.userId,
      userId: decoded.userId,
      username: decoded.username
    });

    const { db } = await connectToDatabase();

    // Find the visitor using ownerId (global variable) for proper filtering
    const visitor = await db.collection('visitors').findOne({
      _id: new ObjectId(visitorId),
      ownerId: decoded.ownerId || decoded.userId
    });

    console.log('👤 [Manual Entry] Visitor found:', visitor ? {
      id: visitor._id,
      name: visitor.fullName || visitor.name,
      email: visitor.email,
      ownerId: visitor.ownerId,
      status: visitor.status
    } : 'NOT FOUND');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Update visitor entry type to Manual and status to Visited
    const updateResult = await db.collection('visitors').updateOne(
      { _id: new ObjectId(visitorId) },
      { 
        $set: { 
          entryType: 'Manual',
          status: 'Visited',
          lastScannedAt: new Date(),
          scannedBy: decoded.userId,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Log the manual entry
    await db.collection('entryLogs').insertOne({
      visitorId: new ObjectId(visitorId),
      visitorName: visitor.name || visitor.fullName,
      visitorEmail: visitor.email,
      visitorPhone: visitor.phone || visitor.phoneNumber,
      entryType: 'Manual',
      entryTime: new Date(),
      ownerId: decoded.ownerId || decoded.userId,
      createdAt: new Date()
    });

    console.log('✅ [Manual Entry] Successfully updated visitor to Manual entry');

    res.status(200).json({
      message: 'Manual entry recorded successfully',
      visitorName: visitor.name || visitor.fullName,
      visitor: {
        id: visitor._id,
        name: visitor.name || visitor.fullName,
        email: visitor.email,
        phone: visitor.phone || visitor.phoneNumber,
        entryType: 'Manual',
        status: 'Visited'
      }
    });

  } catch (error) {
    console.error('Manual entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 