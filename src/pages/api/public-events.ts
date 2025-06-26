import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();

    // Get all public events (events that are published and active)
    const events = await db.collection('events').find({
      status: { $in: ['upcoming', 'published'] }, // Accept both 'upcoming' and 'published'
      $or: [
        { isPublic: true },
        { isPublic: { $exists: false } } // Include events where isPublic field doesn't exist (default to public)
      ]
    }).sort({ eventStartDate: 1 }).toArray();

    // Filter out events that have ended
    const currentDate = new Date();
    const activeEvents = events.filter((event: any) => {
      try {
        const eventEndDate = new Date(event.eventEndDate);
        return eventEndDate >= currentDate;
      } catch (error) {
        console.error('Error parsing event end date:', error);
        return true; // Include events with invalid dates to avoid hiding them
      }
    });

    // Transform the data to match frontend expectations
    const publicEvents = activeEvents.map((event: any) => ({
      _id: event._id,
      eventName: event.eventName,
      eventInformation: event.eventInformation,
      eventStartDate: event.eventStartDate,
      eventEndDate: event.eventEndDate,
      eventStartTime: event.eventStartTime,
      eventEndTime: event.eventEndTime,
      eventLocation: event.eventLocation,
      capacity: event.capacity,
      visitorCount: event.visitorCount || 0,
      registrationDeadline: event.registrationDeadline,
      eventBanner: event.eventBanner,
      status: event.status,
      // Legacy field mappings for backwards compatibility
      name: event.eventName,
      description: event.eventInformation,
      startDate: event.eventStartDate,
      endDate: event.eventEndDate,
      location: event.eventLocation,
      maxAttendees: event.capacity,
      currentAttendees: event.visitorCount || 0,
      imageUrl: event.eventBanner,
      tags: event.tags || []
    }));

    console.log(`📊 Found ${publicEvents.length} public events`);
    res.status(200).json(publicEvents);
    } catch (error) {
    console.error('Public events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 