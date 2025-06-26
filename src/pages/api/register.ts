import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { connectToDatabase, dbName } from '../../lib/mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const JWT_SECRET = process.env.JWT_SECRET;

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
    const { fullName, phoneNumber, email, capacity, username, password, role, ownerId } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber || !email || !capacity || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate capacity
    const validCapacities = [3000, 6000, 10000];
    if (!validCapacities.includes(capacity)) {
      return res.status(400).json({ message: 'Invalid capacity selection' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email.toLowerCase() 
          ? 'User with this email already exists' 
          : 'Username already taken' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate or use provided ownerId
    // If ownerId is provided, use it; otherwise create a new one using MongoDB ObjectId
    const userOwnerId = ownerId || new ObjectId().toString();

    // Create user object
    const newUser = {
      ownerId: userOwnerId,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.toLowerCase().trim(),
      capacity: capacity,
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      emailVerified: false
    };

    // Insert user into database
    const result = await usersCollection.insertOne(newUser);

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: result.insertedId, 
        ownerId: newUser.ownerId,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      },
      JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // Remove password from response
    const { password: _, ...userResponse } = newUser;

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.insertedId,
        ...userResponse
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error) {
      // Handle specific MongoDB errors
      if (error.message.includes('duplicate key')) {
        return res.status(400).json({ message: 'User already exists' });
      }
    }

    return res.status(500).json({ 
      message: 'Internal server error. Please try again later.' 
    });
  }
} 