import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { connectToDatabase, dbName } from '../../lib/mongodb';

// Interface for JWT payload
interface JWTPayload {
  userId: string;
  ownerId: string;
  email: string;
  username: string;
  role: string;
  fullName: string;
  iat?: number;
  exp?: number;
}

// Helper function to extract and validate JWT payload
function extractUserFromToken(authHeader: string | undefined): JWTPayload {
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    if (!decoded.ownerId || !decoded.userId || !decoded.username) {
      throw new Error('Invalid token payload');
    }

    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      
      const userInfo = extractUserFromToken(req.headers.authorization);
      
      console.log('📋 [Forms API] Fetching forms for user:', {
        userId: userInfo.userId,
        ownerId: userInfo.ownerId,
        username: userInfo.username
      });

      const forms = await db.collection('forms')
        .find({ ownerId: userInfo.ownerId })
        .sort({ createdAt: -1 })
        .toArray();

      console.log(`📊 [Forms API] Found ${forms.length} forms for ownerId: ${userInfo.ownerId}`);

      res.status(200).json(forms);
    } catch (error) {
      console.error('❌ [Forms API] Error fetching forms:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('authorization')) {
          return res.status(401).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: 'Error fetching forms' });
    }
  } else if (req.method === 'POST') {
    try {
      const { db } = await connectToDatabase();

      const userInfo = extractUserFromToken(req.headers.authorization);

      console.log('🚀 [Forms API] Creating form with user info:', {
        userId: userInfo.userId,
        ownerId: userInfo.ownerId,
        username: userInfo.username
      });

      // Find user to ensure authorization
      let user = await db.collection('users').findOne({ ownerId: userInfo.ownerId });
      
      if (!user) {
        try {
          user = await db.collection('users').findOne({ _id: new ObjectId(userInfo.userId) });
          if (user) {
            userInfo.ownerId = user.ownerId;
          }
        } catch (err) {
          console.error('❌ [Forms API] Error in fallback user lookup:', err);
        }
      }
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { formName, eventId, fields } = req.body;

      // Validate required fields
      if (!formName || !eventId || !fields || !Array.isArray(fields)) {
        return res.status(400).json({ message: 'Form name, event ID, and fields are required' });
      }

      // Validate field structure
      for (const field of fields) {
        if (!field.id || !field.type || !field.label) {
          return res.status(400).json({ message: 'Each field must have id, type, and label' });
        }
      }

      // Get event details
      const event = await db.collection('events').findOne({ 
        _id: new ObjectId(eventId),
        ownerId: user.ownerId 
      });
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Check if a form already exists for this event
      const existingForm = await db.collection('forms').findOne({
        eventId: eventId,
        ownerId: user.ownerId
      });

      if (existingForm) {
        return res.status(400).json({ 
          message: `A form already exists for the event "${event.eventName}". Each event can have only one form.`,
          existingForm: {
            formName: existingForm.formName,
            formId: existingForm._id,
            eventName: existingForm.eventName
          }
        });
      }

      const newForm = {
        ownerId: user.ownerId,
        formName: formName.trim(),
        eventId: eventId,
        eventName: event.eventName,
        fields,
        isActive: true,
        submissionCount: 0,
        createdBy: {
          userId: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('💾 [Forms API] Saving form:', {
        formName: newForm.formName,
        fieldsCount: newForm.fields.length,
        ownerId: newForm.ownerId
      });
      
      const result = await db.collection('forms').insertOne(newForm);
      
      console.log('✅ [Forms API] Form created successfully:', {
        formId: result.insertedId,
        formName: newForm.formName
      });
      
      res.status(201).json({
        message: 'Form created successfully',
        form: { ...newForm, _id: result.insertedId }
      });

    } catch (error) {
      console.error('❌ [Forms API] Error creating form:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('authorization')) {
          return res.status(401).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: 'Error creating form' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { db } = await connectToDatabase();

      const userInfo = extractUserFromToken(req.headers.authorization);

      const { formId, formName, eventId, fields, isActive } = req.body;

      if (!formId || !ObjectId.isValid(formId)) {
        return res.status(400).json({ message: 'Valid form ID is required' });
      }

      // Find user to ensure authorization
      let user = await db.collection('users').findOne({ ownerId: userInfo.ownerId });
      if (!user) {
        user = await db.collection('users').findOne({ _id: new ObjectId(userInfo.userId) });
        if (user) {
          userInfo.ownerId = user.ownerId;
        }
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If eventId is being changed, check if another form already exists for the new event
      if (eventId) {
        const existingForm = await db.collection('forms').findOne({
          eventId: eventId,
          ownerId: user.ownerId,
          _id: { $ne: new ObjectId(formId) } // Exclude current form from check
        });

        if (existingForm) {
          // Get event name for better error message
          const event = await db.collection('events').findOne({ 
            _id: new ObjectId(eventId),
            ownerId: user.ownerId 
          });
          
          return res.status(400).json({ 
            message: `A form already exists for the event "${event?.eventName || 'selected event'}". Each event can have only one form.`,
            existingForm: {
              formName: existingForm.formName,
              formId: existingForm._id,
              eventName: existingForm.eventName
            }
          });
        }
      }

      // Update form with organization ownership check
      const updateResult = await db.collection('forms').updateOne(
        { 
          _id: new ObjectId(formId),
          ownerId: user.ownerId
        },
        {
          $set: {
            formName: formName?.trim(),
            eventId: eventId,
            fields,
            isActive,
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.matchedCount === 1) {
        console.log('✅ [Forms API] Form updated successfully:', {
          formId,
          ownerId: user.ownerId
        });
        res.status(200).json({ message: 'Form updated successfully' });
      } else {
        res.status(404).json({ message: 'Form not found or access denied' });
      }

    } catch (error) {
      console.error('❌ [Forms API] Error updating form:', error);
      res.status(500).json({ message: 'Error updating form' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { db } = await connectToDatabase();

      const userInfo = extractUserFromToken(req.headers.authorization);

      const formId = req.query.id as string;

      if (!formId || !ObjectId.isValid(formId)) {
        return res.status(400).json({ message: 'Valid form ID is required' });
      }

      // Find user to ensure authorization
      let user = await db.collection('users').findOne({ ownerId: userInfo.ownerId });
      if (!user) {
        user = await db.collection('users').findOne({ _id: new ObjectId(userInfo.userId) });
        if (user) {
          userInfo.ownerId = user.ownerId;
        }
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete form with organization ownership check
      const deleteResult = await db.collection('forms').deleteOne({ 
        _id: new ObjectId(formId),
        ownerId: user.ownerId
      });

      if (deleteResult.deletedCount === 1) {
        console.log('✅ [Forms API] Form deleted successfully:', {
          formId,
          ownerId: user.ownerId
        });
        res.status(200).json({ message: 'Form deleted successfully' });
      } else {
        res.status(404).json({ message: 'Form not found or access denied' });
      }

    } catch (error) {
      console.error('❌ [Forms API] Error deleting form:', error);
      res.status(500).json({ message: 'Error deleting form' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 