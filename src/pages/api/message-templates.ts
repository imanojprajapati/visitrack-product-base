import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../lib/mongodb';

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

    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      const templates = await db.collection('messageTemplates').find({
        ownerId: decoded.ownerId || decoded.userId
      }).toArray();

      res.status(200).json(templates);
    } else if (req.method === 'POST') {
      const { name, content, type, templateName, subject, message } = req.body;

      // Support both old and new field names for backwards compatibility
      const templateNameField = templateName || name;
      const subjectField = subject;
      const messageField = message || content;

      if (!templateNameField || !messageField) {
        return res.status(400).json({ message: 'Template name and message are required' });
      }

      const newTemplate = {
        name: templateNameField,
        templateName: templateNameField,
        subject: subjectField || '',
        content: messageField,
        message: messageField,
        type: type || 'general',
        ownerId: decoded.ownerId || decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('messageTemplates').insertOne(newTemplate);

      res.status(201).json({
        message: 'Template created successfully',
        template: { _id: result.insertedId, ...newTemplate }
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Message templates error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 