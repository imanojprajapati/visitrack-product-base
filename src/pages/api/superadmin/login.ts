import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET!;

interface LoginRequest {
  username: string;
  password: string;
}

interface SuperAdminJWTPayload {
  superAdminId: string;
  username: string;
  role: 'superadmin';
  permissions: {
    viewAllData: boolean;
    manageAllUsers: boolean;
    manageAllEvents: boolean;
    manageAllVisitors: boolean;
    systemSettings: boolean;
    analytics: boolean;
    reports: boolean;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password }: LoginRequest = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    console.log('👑 [Super Admin Login] Attempting login for:', username);
    const { db } = await connectToDatabase();

    // Find super admin user
    const superAdmin = await db.collection('superadmins').findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });

    if (!superAdmin) {
      console.log('❌ [Super Admin Login] Super admin not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!superAdmin.isActive) {
      console.log('❌ [Super Admin Login] Super admin account is disabled:', username);
      return res.status(401).json({ message: 'Account is disabled' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
    if (!isPasswordValid) {
      console.log('❌ [Super Admin Login] Invalid password for:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT payload
    const jwtPayload: SuperAdminJWTPayload = {
      superAdminId: superAdmin._id.toString(),
      username: superAdmin.username,
      role: 'superadmin',
      permissions: superAdmin.permissions
    };

    // Generate JWT token
    const token = jwt.sign(jwtPayload, JWT_SECRET, { 
      expiresIn: '24h' // Super admin sessions expire in 24 hours
    });

    // Update last login
    await db.collection('superadmins').updateOne(
      { _id: superAdmin._id },
      { 
        $set: { 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ [Super Admin Login] Login successful:', {
      superAdminId: superAdmin._id,
      username: superAdmin.username,
      permissions: superAdmin.permissions
    });

    // Return super admin data (without password)
    const { password: _, ...superAdminData } = superAdmin;
    
    res.status(200).json({
      message: 'Login successful',
      token,
      superAdmin: {
        ...superAdminData,
        id: superAdmin._id.toString()
      }
    });

  } catch (error) {
    console.error('❌ [Super Admin Login] Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 