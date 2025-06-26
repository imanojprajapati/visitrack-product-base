import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, MongoClientOptions, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

let cachedClient: MongoClient | null = null;

const options: MongoClientOptions = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 5,
  retryWrites: true,
  retryReads: true,
  family: 4
};

async function connectToDatabase() {
  if (cachedClient) {
    try {
      await cachedClient.db(dbName).admin().ping();
      return cachedClient;
    } catch (error) {
      cachedClient = null;
    }
  }

  const client = new MongoClient(uri, options);
  await client.connect();
  await client.db(dbName).admin().ping();
  cachedClient = client;
  console.log('✅ MongoDB connected successfully (message-template-detail)');
  return client;
}

function extractUserFromToken(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authHeader.substring(7);
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return {
      userId: decoded.userId,
      ownerId: decoded.ownerId,
      username: decoded.username
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await connectToDatabase();
    const db = client.db(dbName);
    
    const userInfo = extractUserFromToken(req.headers.authorization);
    const { templateId } = req.query;

    if (!templateId || typeof templateId !== 'string') {
      return res.status(400).json({ message: 'Template ID is required' });
    }

    if (!ObjectId.isValid(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }
    
    console.log('📧 [Message Template Detail API] Request:', {
      method: req.method,
      templateId,
      userId: userInfo.userId,
      ownerId: userInfo.ownerId
    });

    switch (req.method) {
      case 'PUT':
        // Update message template
        const { templateName, subject, message } = req.body;

        if (!templateName || !subject || !message) {
          return res.status(400).json({ 
            message: 'Template name, subject, and message are required' 
          });
        }

        // Check if template exists and belongs to the user
        const existingTemplate = await db.collection('messageTemplates').findOne({
          _id: new ObjectId(templateId),
          ownerId: userInfo.ownerId
        });

        if (!existingTemplate) {
          return res.status(404).json({ message: 'Template not found' });
        }

        // Check if template name already exists for this owner (excluding current template)
        const duplicateTemplate = await db.collection('messageTemplates').findOne({
          ownerId: userInfo.ownerId,
          templateName: templateName,
          _id: { $ne: new ObjectId(templateId) }
        });

        if (duplicateTemplate) {
          return res.status(400).json({ 
            message: 'Template name already exists' 
          });
        }

        const updateData = {
          templateName: templateName.trim(),
          subject: subject.trim(),
          message: message.trim(),
          updatedAt: new Date()
        };

        await db.collection('messageTemplates').updateOne(
          { _id: new ObjectId(templateId), ownerId: userInfo.ownerId },
          { $set: updateData }
        );
        
        console.log('✅ [Message Template Detail API] Template updated:', templateId);
        return res.status(200).json({ 
          message: 'Template updated successfully'
        });

      case 'DELETE':
        // Delete message template
        const templateToDelete = await db.collection('messageTemplates').findOne({
          _id: new ObjectId(templateId),
          ownerId: userInfo.ownerId
        });

        if (!templateToDelete) {
          return res.status(404).json({ message: 'Template not found' });
        }

        await db.collection('messageTemplates').deleteOne({
          _id: new ObjectId(templateId),
          ownerId: userInfo.ownerId
        });
        
        console.log('✅ [Message Template Detail API] Template deleted:', templateId);
        return res.status(200).json({ 
          message: 'Template deleted successfully'
        });

      case 'GET':
        // Get single message template
        const template = await db.collection('messageTemplates').findOne({
          _id: new ObjectId(templateId),
          ownerId: userInfo.ownerId
        });

        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }

        console.log('✅ [Message Template Detail API] Template found:', templateId);
        return res.status(200).json(template);

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('❌ [Message Template Detail API] Error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
} 