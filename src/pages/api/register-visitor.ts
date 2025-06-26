import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract data from request body - handle both old and new field names
    const { 
      name, 
      fullName, 
      email, 
      phone, 
      phoneNumber, 
      eventId,
      eventName,
      eventLocation,
      eventStartDate,
      eventEndDate,
      company,
      city,
      state,
      country,
      pincode,
      source,
      visitorRegistrationDate,
      status,
      ...additionalData
    } = req.body;

    // Use fullName if provided, otherwise fall back to name
    const visitorName = fullName || name;
    const visitorPhone = phoneNumber || phone;

    // Basic validation
    if (!visitorName || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const { db } = await connectToDatabase();

    // Check if visitor already exists for this event
    // Handle both string and ObjectId formats for eventId
    const eventQuery: any = { email: email };
    if (eventId) {
      // Try both string and ObjectId formats for backwards compatibility
      eventQuery.$or = [
        { eventId: eventId }, // String format
        { eventId: new ObjectId(eventId) } // ObjectId format
      ];
    } else {
      eventQuery.eventId = null;
    }

    const existingVisitor = await db.collection('visitors').findOne(eventQuery);

    if (existingVisitor) {
      return res.status(409).json({ 
        message: 'Visitor already registered for this event',
        visitorId: existingVisitor._id
      });
    }

    // Get event details if eventId is provided
    let event = null;
    let ownerId = null;
    
    if (eventId) {
      event = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      ownerId = event.ownerId;
    }

    // Create new visitor with comprehensive data structure
    const newVisitor = {
      // Core visitor information
      fullName: visitorName,
      // name: visitorName, // Keep both for compatibility
      email: email,
      phoneNumber: visitorPhone || '',
      // phone: visitorPhone || '', // Keep both for compatibility
      
      // Event information - store as string for consistency
      eventId: eventId || null,
      eventName: eventName || event?.eventName || null,
      eventLocation: eventLocation || event?.eventLocation || null,
      eventStartDate: eventStartDate || event?.eventStartDate || null,
      eventEndDate: eventEndDate || event?.eventEndDate || null,
      
      // Additional visitor details
      company: company || '',
      city: city || '',
      state: state || '',
      country: country || '',
      pincode: pincode || '',
      source: source || 'Website',
      
      // Registration metadata
      status: status || 'Registration',
      entryType: '-',
      // registrationDate: new Date(),
      visitorRegistrationDate: visitorRegistrationDate || new Date().toISOString().split('T')[0],
      
      // System fields
      ownerId: ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Include any additional form data
      ...additionalData
    };

    const result = await db.collection('visitors').insertOne(newVisitor);

    res.status(201).json({ 
      message: 'Visitor registered successfully',
      visitorId: result.insertedId,
      visitor: {
        id: result.insertedId,
        fullName: visitorName,
        name: visitorName,
        email: email,
        phoneNumber: visitorPhone,
        phone: visitorPhone,
        eventName: eventName || event?.eventName,
        status: status || 'Registration'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 