import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase, dbName } from '../../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { eventId } = req.query;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ message: 'Valid event ID is required' });
    }

    const { db } = await connectToDatabase();

    console.log('🔍 Looking for form with eventId:', eventId);

    // Find the form for this event
    const eventForm = await db.collection('forms').findOne({ 
      eventId: eventId,
      isActive: true 
    });

    if (!eventForm) {
      console.log('❌ No form found for eventId:', eventId);
      return res.status(404).json({ message: 'Registration form not found for this event' });
    }

    console.log('✅ Found form for event:', eventForm.eventName);

    res.status(200).json(eventForm);

  } catch (error) {
    console.error('Error fetching event form:', error);
    res.status(500).json({ message: 'Failed to fetch event form' });
  }
} 