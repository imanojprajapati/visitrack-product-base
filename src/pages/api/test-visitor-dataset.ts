import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, MongoClientOptions } from 'mongodb';
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
  console.log('✅ MongoDB connected successfully (test-visitor-dataset)');
  return client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const client = await connectToDatabase();
    const db = client.db(dbName);

    switch (method) {
      case 'GET':
        // Check for authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ message: 'Authentication required' });
        }

        const token = authHeader.substring(7);
        let decoded: any;
        
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          console.log('🔍 Test Debug - decoded token:', decoded);
        } catch (error) {
          return res.status(401).json({ message: 'Invalid token' });
        }

        const ownerId = decoded.ownerId;
        console.log('🔍 Test Debug - ownerId:', ownerId);

        // Check collection stats
        const allRecordsCount = await db.collection('visitordataset').countDocuments({});
        console.log('🔍 Test Debug - Total records in collection:', allRecordsCount);
        
        const uniqueOwners = await db.collection('visitordataset').distinct('ownerId');
        console.log('🔍 Test Debug - Unique ownerIds in collection:', uniqueOwners);
        
        const myRecordsCount = await db.collection('visitordataset').countDocuments({ ownerId });
        console.log('🔍 Test Debug - My records count:', myRecordsCount);

        return res.status(200).json({
          message: 'Test endpoint working',
          decodedToken: decoded,
          ownerId: ownerId,
          collectionStats: {
            totalRecords: allRecordsCount,
            uniqueOwners: uniqueOwners,
            myRecords: myRecordsCount
          }
        });

      case 'POST':
        // Seed test data
        const authHeaderPost = req.headers.authorization;
        if (!authHeaderPost || !authHeaderPost.startsWith('Bearer ')) {
          return res.status(401).json({ message: 'Authentication required' });
        }

        const tokenPost = authHeaderPost.substring(7);
        let decodedPost: any;
        
        try {
          decodedPost = jwt.verify(tokenPost, process.env.JWT_SECRET || 'your-secret-key');
        } catch (error) {
          return res.status(401).json({ message: 'Invalid token' });
        }

        const ownerIdPost = decodedPost.ownerId;

        // Sample visitor dataset records
        const sampleData = [
          {
            ownerId: ownerIdPost,
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            phoneNumber: '+1234567890',
            company: 'Tech Corp',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            pincode: '10001',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            ownerId: ownerIdPost,
            fullName: 'Jane Smith',
            email: 'jane.smith@example.com',
            phoneNumber: '+1234567891',
            company: 'Design Studio',
            city: 'Los Angeles',
            state: 'CA',
            country: 'USA',
            pincode: '90210',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            ownerId: ownerIdPost,
            fullName: 'Bob Johnson',
            email: 'bob.johnson@example.com',
            phoneNumber: '+1234567892',
            company: 'Marketing Inc',
            city: 'Chicago',
            state: 'IL',
            country: 'USA',
            pincode: '60601',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        // Clear existing data for this owner (optional)
        await db.collection('visitordataset').deleteMany({ ownerId: ownerIdPost });
        
        // Insert sample data
        const result = await db.collection('visitordataset').insertMany(sampleData);
        console.log(`✅ Inserted ${result.insertedCount} visitor dataset records for owner: ${ownerIdPost}`);
        
        return res.status(201).json({
          message: 'Test data seeded successfully',
          insertedCount: result.insertedCount,
          ownerId: ownerIdPost
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in test-visitor-dataset API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 