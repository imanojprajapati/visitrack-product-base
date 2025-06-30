import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || 'visitrackp';
const JWT_SECRET = process.env.JWT_SECRET!;

interface JWTPayload {
  userId: string;
  ownerId: string;
  username: string;
  role: 'admin' | 'sub-admin' | 'manager' | 'staff';
}

interface CreateUserRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  username: string;
  password: string;
  role: 'sub-admin' | 'manager' | 'staff';
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
  if (req.method !== 'POST') {
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

  // Only admins and sub-admins can create users
  if (userInfo.role !== 'admin' && userInfo.role !== 'sub-admin') {
    return res.status(403).json({ message: 'Access denied. Admin or Sub-Admin role required.' });
  }

  const { fullName, phoneNumber, email, username, password, role }: CreateUserRequest = req.body;

  // Validate required fields
  if (!fullName || !phoneNumber || !email || !username || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate role
  if (!['sub-admin', 'manager', 'staff'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be sub-admin, manager, or staff' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    console.log('🔗 [Create User API] Connecting to MongoDB...');
    const { db } = await connectToDatabase();
    console.log('📁 [Create User API] Using database:', MONGODB_DB);

    console.log('👤 [Create User API] Fetching admin details for ownerId:', userInfo.ownerId);
    
    // Get the admin's details to inherit ownerId and capacity
    let adminUser = await db.collection('users').findOne({ ownerId: userInfo.ownerId });
    if (!adminUser) {
      // Fallback: try to find by _id if ownerId lookup fails
      adminUser = await db.collection('users').findOne({ _id: new ObjectId(userInfo.userId) });
      if (adminUser) {
        console.warn('⚠️ [Create User API] Admin found by _id but not by ownerId. Data inconsistency detected.');
        userInfo.ownerId = adminUser.ownerId; // Use the correct ownerId from database
      }
    }

    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    console.log('✅ [Create User API] Admin found:', {
      _id: adminUser._id,
      ownerId: adminUser.ownerId,
      fullName: adminUser.fullName,
      capacity: adminUser.capacity,
      role: adminUser.role
    });

    // Check if username or email already exists within the same organization (ownerId)
    console.log('🔍 [Create User API] Checking for existing username/email...');
    const existingUser = await db.collection('users').findOne({
      ownerId: adminUser.ownerId,
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'Username' : 'Email';
      return res.status(409).json({ message: `${field} already exists in your organization` });
    }

    // Hash the password
    console.log('🔐 [Create User API] Hashing password...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate a new ObjectId for the user
    const newUserId = new ObjectId();
    
    // Create new user with inherited data from admin
    const newUser = {
      _id: newUserId,
      ownerId: adminUser.ownerId,          // ✅ Same as admin (key requirement)
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.toLowerCase().trim(),
      capacity: adminUser.capacity,        // ✅ Inherited from admin
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      role: role,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,                      // ✅ Default active
      emailVerified: false,                // ✅ Default not verified
      lastLoginAt: null                    // ✅ Never logged in
    };

    console.log('👤 [Create User API] Creating new user:', {
      _id: newUser._id,
      ownerId: newUser.ownerId,
      fullName: newUser.fullName,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      capacity: newUser.capacity,
      inheritedFromAdmin: adminUser.fullName
    });

    // Insert the new user
    const result = await db.collection('users').insertOne(newUser);

    if (result.acknowledged) {
      console.log('✅ [Create User API] User created successfully:', {
        insertedId: result.insertedId,
        ownerId: newUser.ownerId,
        role: newUser.role
      });

      // Return user data without password
      const { password: _, ...userResponse } = newUser;
      
      res.status(201).json({
        message: 'User created successfully',
        user: userResponse
      });
    } else {
      throw new Error('Failed to create user');
    }

  } catch (error) {
    console.error('❌ [Create User API] Error:', error);
    
    if (error instanceof Error) {
      // Handle specific MongoDB errors
      if (error.message.includes('E11000')) {
        return res.status(409).json({ message: 'Username or email already exists' });
      }
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
} 