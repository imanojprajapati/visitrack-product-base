import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const JWT_SECRET = process.env.JWT_SECRET;

// Interface for JWT payload to ensure type safety
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

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Validate environment variables
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    return res.status(500).json({ message: 'Server configuration error: MongoDB URI not configured' });
  }

  if (!MONGODB_DB) {
    console.error('MONGODB_DB environment variable is not set');
    return res.status(500).json({ message: 'Server configuration error: MongoDB database not configured' });
  }

  if (!JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set');
    return res.status(500).json({ message: 'Server configuration error: JWT secret not configured' });
  }

  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB!);
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log(`Login attempt failed: User account deactivated for email: ${email}`);
      return res.status(401).json({ message: 'Account is deactivated. Please contact support.' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log(`Login attempt failed: Invalid password for email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Ensure required fields exist for JWT payload
    if (!user.ownerId || !user.username || !user.role) {
      console.error('Critical user data missing:', {
        ownerId: !!user.ownerId,
        username: !!user.username,
        role: !!user.role,
        email: user.email
      });
      return res.status(500).json({ message: 'User data incomplete. Please contact support.' });
    }

    // Create JWT token with comprehensive user data for global variables
    const jwtPayload: JWTPayload = {
      userId: user._id.toString(),
      ownerId: user.ownerId,
      email: user.email,
      username: user.username,
      role: user.role,
      fullName: user.fullName || user.username
    };

    const token = jwt.sign(
      jwtPayload,
      JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // Log successful login with global variable values
    console.log('🔐 User Login Successful - Global Variables Set:', {
      userId: jwtPayload.userId,
      ownerId: jwtPayload.ownerId,
      username: jwtPayload.username,
      role: jwtPayload.role,
      email: jwtPayload.email,
      loginTime: new Date().toISOString()
    });

    // Remove password from response
    const { password: _, ...userResponse } = user;

    // Update last login time
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Return user data with global variables clearly identified
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        ...userResponse
      },
      token,
      globalVariables: {
        userId: jwtPayload.userId,
        ownerId: jwtPayload.ownerId,
        username: jwtPayload.username,
        role: jwtPayload.role,
        email: jwtPayload.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return res.status(500).json({ 
      message: 'Internal server error. Please try again later.' 
    });
  }
} 