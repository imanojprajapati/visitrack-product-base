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

    const { db } = await connectToDatabase();

    console.log('🔍 [QR Scanner] Looking for visitor:', {
      visitorId,
      ownerId: decoded.ownerId || decoded.userId,
      userId: decoded.userId
    });

    // Find the visitor using ownerId (global variable) for proper filtering
    const visitor = await db.collection('visitors').findOne({
      _id: new ObjectId(visitorId),
      ownerId: decoded.ownerId || decoded.userId
    });

    console.log('👤 [QR Scanner] Visitor found:', visitor ? {
      id: visitor._id,
      name: visitor.fullName || visitor.name,
      email: visitor.email,
      status: visitor.status,
      ownerId: visitor.ownerId
    } : 'NOT FOUND');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Check if visitor has already visited
    if (visitor.status === 'Visited') {
      console.log('⚠️ [QR Scanner] Visitor already visited');
      return res.status(409).json({ 
        message: 'Visitor already visited',
        alreadyVisited: true,
        visitorId: visitor._id,
        visitorName: visitor.fullName || visitor.name,
        visitorEmail: visitor.email,
        visitorPhone: visitor.phoneNumber || visitor.phone,
        visitorCompany: visitor.company,
        eventName: visitor.eventName,
        eventLocation: visitor.eventLocation,
        previousStatus: visitor.status,
        previousEntryType: visitor.entryType,
        visitedAt: visitor.lastScannedAt || visitor.visitedAt || visitor.updatedAt
      });
    }

    // Update visitor entry type to QR and status to Visited
    const updateResult = await db.collection('visitors').updateOne(
      { _id: new ObjectId(visitorId) },
      { 
        $set: { 
          entryType: 'QR',
          status: 'Visited',
          lastScannedAt: new Date(),
          scannedBy: decoded.userId,
          visitedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Log the entry
    await db.collection('entryLogs').insertOne({
      visitorId: new ObjectId(visitorId),
      visitorName: visitor.fullName || visitor.name,
      visitorEmail: visitor.email,
      visitorPhone: visitor.phoneNumber || visitor.phone,
      entryType: 'QR',
      entryTime: new Date(),
      ownerId: decoded.ownerId || decoded.userId,
      createdAt: new Date()
    });

    // Update scan statistics
    await db.collection('scanStats').updateOne(
      { 
        date: new Date().toISOString().split('T')[0],
        ownerId: decoded.ownerId || decoded.userId
      },
      { 
        $inc: { count: 1 },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    // Get updated visitor data
    const updatedVisitor = await db.collection('visitors').findOne({
      _id: new ObjectId(visitorId)
    });

    console.log('✅ [QR Scanner] Successfully processed QR entry');

    res.status(200).json({
      message: 'QR entry recorded successfully',
      visitorId: updatedVisitor._id,
      visitorName: updatedVisitor.fullName || updatedVisitor.name,
      visitorEmail: updatedVisitor.email,
      visitorPhone: updatedVisitor.phoneNumber || updatedVisitor.phone,
      visitorCompany: updatedVisitor.company,
      eventName: updatedVisitor.eventName,
      eventLocation: updatedVisitor.eventLocation,
      newStatus: updatedVisitor.status,
      newEntryType: updatedVisitor.entryType,
      visitedAt: updatedVisitor.lastScannedAt || updatedVisitor.visitedAt
    });

  } catch (error) {
    console.error('QR entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 