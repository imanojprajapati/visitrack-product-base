import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, eventId } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const { db } = await connectToDatabase();

    // Check if visitor already exists
    // Handle both string and ObjectId formats for eventId
    const query: any = { email };
    if (eventId) {
      // Try both string and ObjectId formats for backwards compatibility
      query.$or = [
        { eventId: eventId }, // String format
        { eventId: new ObjectId(eventId) } // ObjectId format
      ];
    }

    const existingVisitor = await db.collection('visitors').findOne(query);

    if (existingVisitor) {
      return res.status(200).json({ 
        isRegistered: true,
        message: 'Visitor already registered for this event',
        visitorData: {
          visitorId: existingVisitor._id,
          fullName: existingVisitor.name || existingVisitor.fullName,
          email: existingVisitor.email,
          phoneNumber: existingVisitor.phone || existingVisitor.phoneNumber,
          company: existingVisitor.company || '',
          city: existingVisitor.city || '',
          state: existingVisitor.state || '',
          country: existingVisitor.country || '',
          pincode: existingVisitor.pincode || '',
          eventName: existingVisitor.eventName || '',
          eventLocation: existingVisitor.eventLocation || '',
          eventStartDate: existingVisitor.eventStartDate || '',
          eventEndDate: existingVisitor.eventEndDate || '',
          eventStartTime: existingVisitor.eventStartTime || '',
          eventEndTime: existingVisitor.eventEndTime || '',
          status: existingVisitor.status
        }
      });
    }

    res.status(200).json({ 
      isRegistered: false,
      message: 'Visitor not registered for this event, can proceed with registration' 
    });
  } catch (error) {
    console.error('Check visitor error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 