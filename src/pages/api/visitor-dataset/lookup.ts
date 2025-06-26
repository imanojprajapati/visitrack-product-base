import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, eventId } = req.body;

    // Validate required fields
    if (!email || !eventId) {
      return res.status(400).json({ message: 'Email and event ID are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const { db } = await connectToDatabase();

    // First, get the event to find the ownerId
    const event = await db.collection('events').findOne({ 
      $or: [
        { _id: new ObjectId(eventId) },
        { _id: eventId }
      ]
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('🔍 [Visitor Lookup] Searching for visitor data:', {
      email,
      eventId,
      ownerId: event.ownerId
    });

    // Look for visitor data in the dataset for this owner
    const visitorData = await db.collection('visitordataset').findOne({ 
      email: email,
      ownerId: event.ownerId 
    });

    if (!visitorData) {
      console.log('📝 [Visitor Lookup] No existing data found for:', email);
      return res.status(404).json({ 
        message: 'No existing visitor data found',
        found: false 
      });
    }

    console.log('✅ [Visitor Lookup] Found existing data for:', email);

    // Return the visitor data (excluding sensitive fields)
    return res.status(200).json({
      found: true,
      data: {
        fullName: visitorData.fullName || '',
        phoneNumber: visitorData.phoneNumber || '',
        company: visitorData.company || '',
        city: visitorData.city || '',
        state: visitorData.state || '',
        country: visitorData.country || '',
        pincode: visitorData.pincode || ''
      }
    });

  } catch (error) {
    console.error('Error in visitor dataset lookup:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 