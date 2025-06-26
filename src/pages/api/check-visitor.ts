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
      return res.status(409).json({ 
        message: 'Visitor already registered',
        visitor: {
          id: existingVisitor._id,
          name: existingVisitor.name || existingVisitor.fullName,
          email: existingVisitor.email,
          phone: existingVisitor.phone || existingVisitor.phoneNumber,
          status: existingVisitor.status
        }
      });
    }

    res.status(200).json({ message: 'Visitor not found, can proceed with registration' });
  } catch (error) {
    console.error('Check visitor error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 