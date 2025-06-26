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
  console.log('✅ MongoDB connected successfully (message-templates)');
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
    
    console.log('📧 [Message Templates API] Request:', {
      method: req.method,
      userId: userInfo.userId,
      ownerId: userInfo.ownerId
    });

    switch (req.method) {
      case 'GET':
        // Get all message templates for the owner
        const templates = await db.collection('messageTemplates')
          .find({ ownerId: userInfo.ownerId })
          .sort({ updatedAt: -1 })
          .toArray();

        console.log(`✅ [Message Templates API] Found ${templates.length} templates for owner: ${userInfo.ownerId}`);
        return res.status(200).json(templates);

      case 'POST':
        // Create new message template
        const { templateName, subject, message } = req.body;

        if (!templateName || !subject || !message) {
          return res.status(400).json({ 
            message: 'Template name, subject, and message are required' 
          });
        }

        // Check if template name already exists for this owner
        const existingTemplate = await db.collection('messageTemplates').findOne({
          ownerId: userInfo.ownerId,
          templateName: templateName
        });

        if (existingTemplate) {
          return res.status(400).json({ 
            message: 'Template name already exists' 
          });
        }

        const newTemplate = {
          ownerId: userInfo.ownerId,
          templateName: templateName.trim(),
          subject: subject.trim(),
          message: message.trim(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection('messageTemplates').insertOne(newTemplate);
        
        console.log('✅ [Message Templates API] Template created:', result.insertedId);
        return res.status(201).json({ 
          message: 'Template created successfully',
          templateId: result.insertedId
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('❌ [Message Templates API] Error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
} 