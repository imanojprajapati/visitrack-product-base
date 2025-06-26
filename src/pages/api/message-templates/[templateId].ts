import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { templateId } = req.query;

    if (!templateId || typeof templateId !== 'string') {
      return res.status(400).json({ message: 'Template ID is required' });
    }

    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      const template = await db.collection('messageTemplates').findOne({
        _id: new ObjectId(templateId),
        ownerId: decoded.ownerId || decoded.userId
      });

      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      res.status(200).json(template);
    } else if (req.method === 'PUT') {
      const { name, content, type, templateName, subject, message } = req.body;

      // Support both old and new field names for backwards compatibility
      const templateNameField = templateName || name;
      const subjectField = subject;
      const messageField = message || content;

      if (!templateNameField || !messageField) {
        return res.status(400).json({ message: 'Template name and message are required' });
      }

      const updateResult = await db.collection('messageTemplates').updateOne(
        { 
          _id: new ObjectId(templateId),
          ownerId: decoded.ownerId || decoded.userId
        },
        { 
          $set: { 
            name: templateNameField,
            templateName: templateNameField,
            subject: subjectField || '',
            content: messageField,
            message: messageField,
            type: type || 'general',
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: 'Template not found' });
      }

      res.status(200).json({ message: 'Template updated successfully' });
    } else if (req.method === 'DELETE') {
      const deleteResult = await db.collection('messageTemplates').deleteOne({
        _id: new ObjectId(templateId),
        ownerId: decoded.ownerId || decoded.userId
      });

      if (deleteResult.deletedCount === 0) {
        return res.status(404).json({ message: 'Template not found' });
      }

      res.status(200).json({ message: 'Template deleted successfully' });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 