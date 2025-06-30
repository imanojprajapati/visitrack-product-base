import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../lib/mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || 'visitrackp';
const JWT_SECRET = process.env.JWT_SECRET!;

interface JWTPayload {
  userId: string;
  ownerId: string;
  username: string;
  role: 'admin' | 'sub-admin' | 'manager' | 'staff';
}

// Helper function to extract JWT payload
function extractJWTPayload(token: string): JWTPayload | null {
  try {
    console.log('🔑 [JWT] Extracting payload from token');
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log('✅ [JWT] Token decoded successfully:', {
      userId: decoded.userId,
      ownerId: decoded.ownerId,
      username: decoded.username,
      role: decoded.role
    });
    return decoded;
  } catch (error) {
    console.error('❌ [JWT] Token verification failed:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const userInfo = extractJWTPayload(token);

  if (!userInfo) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Only admins and sub-admins can fetch users
  if (userInfo.role !== 'admin' && userInfo.role !== 'sub-admin') {
    return res.status(403).json({ message: 'Access denied. Admin or Sub-Admin role required.' });
  }

  try {
    console.log('🔗 [Users API] Connecting to MongoDB...');
    const { db } = await connectToDatabase();
    console.log('✅ [Users API] MongoDB connected successfully');
    console.log('📁 [Users API] Using database:', MONGODB_DB);

    console.log('👤 [Users API] Fetching admin details for ownerId:', userInfo.ownerId);
    
    // First get the admin's details to ensure we have the correct ownerId
    let adminUser = await db.collection('users').findOne({ ownerId: userInfo.ownerId });
    if (!adminUser) {
      // Fallback: try to find by _id if ownerId lookup fails
      adminUser = await db.collection('users').findOne({ _id: new ObjectId(userInfo.userId) });
      if (adminUser) {
        console.warn('⚠️ [Users API] Admin found by _id but not by ownerId. Data inconsistency detected.');
        userInfo.ownerId = adminUser.ownerId; // Use the correct ownerId from database
      }
    }

    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    console.log('✅ [Users API] Admin found:', {
      _id: adminUser._id,
      ownerId: adminUser.ownerId,
      fullName: adminUser.fullName,
      role: adminUser.role
    });

    // Fetch all users with the same ownerId (including the admin)
    console.log('👥 [Users API] Fetching all users with ownerId:', adminUser.ownerId);
    const users = await db.collection('users')
      .find({ ownerId: adminUser.ownerId })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`✅ [Users API] Found ${users.length} users with ownerId: ${adminUser.ownerId}`);

    // Remove password field from response
    const sanitizedUsers = users.map((user: any) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.status(200).json(sanitizedUsers);

  } catch (error) {
    console.error('❌ [Users API] Error:', error);
    console.error('❌ [Users API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
} 