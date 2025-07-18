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

    console.log('🏷️ Looking for badge with eventId:', eventId);

    // Find the badge for this event
    const badge = await db.collection('badges').findOne({ 
      eventId: eventId
    });

    if (!badge) {
      console.log('❌ No badge found for eventId:', eventId);
      return res.status(404).json({ message: 'Badge not found for this event' });
    }

    console.log('✅ Found badge for event:', badge.eventName);

    res.status(200).json(badge);

  } catch (error) {
    console.error('Error fetching event badge:', error);
    res.status(500).json({ message: 'Failed to fetch event badge' });
  }
} 