import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for external device access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get visitor ID from the URL path parameter
    const { visitorId } = req.query;

    if (!visitorId || typeof visitorId !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: 'Visitor ID is required in the URL path',
        error: 'MISSING_VISITOR_ID',
        example: '/api/external/qr-entry/685bcda34da2251d0ea053e0'
      });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(visitorId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid visitor ID format',
        error: 'INVALID_VISITOR_ID',
        providedId: visitorId
      });
    }

    const { db } = await connectToDatabase();

    console.log('🔍 [External QR Scanner - Path] Looking for visitor:', { visitorId });

    // Find the visitor
    const visitor = await db.collection('visitors').findOne({
      _id: new ObjectId(visitorId)
    });

    console.log('👤 [External QR Scanner - Path] Visitor found:', visitor ? {
      id: visitor._id,
      name: visitor.fullName,
      email: visitor.email,
      status: visitor.status,
      eventName: visitor.eventName
    } : 'NOT FOUND');

    if (!visitor) {
      return res.status(404).json({ 
        success: false,
        message: 'Visitor not found',
        error: 'VISITOR_NOT_FOUND',
        visitorId: visitorId
      });
    }

    // Check if visitor has already visited
    if (visitor.status === 'Visited') {
      console.log('⚠️ [External QR Scanner - Path] Visitor already visited');
      return res.status(200).json({ 
        success: true,
        message: 'Visitor already checked in',
        alreadyVisited: true,
        visitor: {
          id: visitor._id,
          name: visitor.fullName,
          email: visitor.email,
          phone: visitor.phoneNumber,
          company: visitor.company,
          eventName: visitor.eventName,
          eventLocation: visitor.eventLocation,
          status: visitor.status,
          entryType: visitor.entryType,
          visitedAt: visitor.lastScannedAt || visitor.updatedAt
        }
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
          visitedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Failed to update visitor',
        error: 'UPDATE_FAILED'
      });
    }

    // Log the entry
    await db.collection('entryLogs').insertOne({
      visitorId: new ObjectId(visitorId),
      visitorName: visitor.fullName,
      visitorEmail: visitor.email,
      visitorPhone: visitor.phoneNumber,
      entryType: 'QR',
      entryTime: new Date(),
      ownerId: visitor.ownerId,
      source: 'external_device_path',
      createdAt: new Date()
    });

    // Get updated visitor data
    const updatedVisitor = await db.collection('visitors').findOne({
      _id: new ObjectId(visitorId)
    });

    console.log('✅ [External QR Scanner - Path] Successfully processed QR entry');

    res.status(200).json({
      success: true,
      message: 'QR entry recorded successfully',
      visitor: {
        id: updatedVisitor._id,
        name: updatedVisitor.fullName,
        email: updatedVisitor.email,
        phone: updatedVisitor.phoneNumber,
        company: updatedVisitor.company,
        eventName: updatedVisitor.eventName,
        eventLocation: updatedVisitor.eventLocation,
        status: updatedVisitor.status,
        entryType: updatedVisitor.entryType,
        visitedAt: updatedVisitor.lastScannedAt
      }
    });

  } catch (error) {
    console.error('External QR entry error (path):', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
} 