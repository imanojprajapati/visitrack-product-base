import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      eventId,
      eventName,
      eventLocation,
      eventStartDate,
      eventEndDate,
      fullName,
      email,
      phoneNumber,
      company,
      city,
      state,
      country,
      pincode,
      source,
      visitorRegistrationDate,
      status,
      ...additionalFields // Any additional form fields
    } = req.body;

    // Validate required fields
    if (!eventId || !fullName || !email || !phoneNumber) {
      return res.status(400).json({ 
        message: 'Event ID, full name, email, and phone number are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const client = await connectToDatabase();
    const db = client.db(dbName);

    // Fetch event details to get ownerId
    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId)
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Fetch form details to transform additional field IDs to labels
    const form = await db.collection('forms').findOne({
      eventId: eventId
    });

    // Check if user with same phone number and email already registered for this event
    const existingRegistration = await db.collection('visitors').findOne({
      eventId,
      $or: [
        { phoneNumber },
        { email }
      ]
    });

    if (existingRegistration) {
      return res.status(400).json({ 
        message: 'You have already registered for this event with this phone number or email' 
      });
    }

    // Transform additional fields from field IDs to readable labels
    const transformedAdditionalFields: Record<string, any> = {};
    
    if (form && form.fields) {
      // Create a map of field ID to label for non-default fields
      const fieldMap = form.fields.reduce((map: Record<string, string>, field: any) => {
        if (!field.isDefault) {
          map[field.id] = field.label;
        }
        return map;
      }, {});

      // Transform additional fields using the field map
      Object.keys(additionalFields).forEach(fieldId => {
        const fieldLabel = fieldMap[fieldId];
        if (fieldLabel) {
          transformedAdditionalFields[fieldLabel] = additionalFields[fieldId];
        } else {
          // Keep original field ID if no label found (fallback)
          transformedAdditionalFields[fieldId] = additionalFields[fieldId];
        }
      });
    } else {
      // If no form found, keep original additional fields
      Object.assign(transformedAdditionalFields, additionalFields);
    }

    // Format visitor registration date as YYYY-MM-DD (same format as event dates)
    let formattedRegistrationDate: string;
    
    if (visitorRegistrationDate) {
      // If date is provided, ensure it's in YYYY-MM-DD format
      const providedDate = new Date(visitorRegistrationDate);
      formattedRegistrationDate = `${providedDate.getFullYear()}-${String(providedDate.getMonth() + 1).padStart(2, '0')}-${String(providedDate.getDate()).padStart(2, '0')}`;
    } else {
      // If no date provided, use current date in YYYY-MM-DD format
      const currentDate = new Date();
      formattedRegistrationDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    }

    // Create visitor record with ownerId from event
    const visitorData = {
      eventId,
      eventName,
      eventLocation,
      eventStartDate,
      eventEndDate,
      ownerId: event.ownerId, // Add ownerId from event
      fullName,
      email,
      phoneNumber,
      company: company || '',
      city: city || '',
      state: state || '',
      country: country || '',
      pincode: pincode || '',
      source: source || 'Website', // Default to 'Website' as requested
      visitorRegistrationDate: formattedRegistrationDate, // Format as YYYY-MM-DD
      status: status || 'Registration', // Default to 'Registration' as requested
      createdAt: new Date(),
      updatedAt: new Date(),
      ...transformedAdditionalFields // Include transformed additional form fields
    };

    console.log('💾 Saving visitor registration:', {
      eventId,
      eventName,
      ownerId: event.ownerId,
      fullName,
      email,
      phoneNumber,
      visitorRegistrationDate: formattedRegistrationDate,
      additionalFields: transformedAdditionalFields,
      status: visitorData.status
    });

    // Insert visitor record
    const result = await db.collection('visitors').insertOne(visitorData);

    // Update event visitor count (optional)
    try {
      await db.collection('events').updateOne(
        { _id: new ObjectId(eventId) },
        { $inc: { visitorCount: 1 } }
      );
    } catch (error) {
      console.warn('Failed to update event visitor count:', error);
      // Don't fail the registration if this update fails
    }

    console.log('✅ Visitor registered successfully:', result.insertedId);

    res.status(201).json({ 
      message: 'Registration completed successfully',
      visitorId: result.insertedId,
      eventName,
      ownerId: event.ownerId,
      status: visitorData.status
    });

  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ message: 'Failed to complete registration' });
  }
} 