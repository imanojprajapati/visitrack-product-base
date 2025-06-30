import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
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
  if (req.method !== 'DELETE' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: 'User ID is required' });
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

  // Only admins and sub-admins can manage users
  if (userInfo.role !== 'admin' && userInfo.role !== 'sub-admin') {
    return res.status(403).json({ message: 'Access denied. Admin or Sub-Admin role required.' });
  }

  try {
    console.log('🔗 [User API] Connecting to MongoDB...');
    const { db } = await connectToDatabase();
    console.log('📁 [User API] Using database:', MONGODB_DB);

    if (req.method === 'PUT') {
      // Handle UPDATE user
      return await handleUpdateUser(req, res, db, userInfo, userId as string);
    } else {
      // Handle DELETE user
      return await handleDeleteUser(req, res, db, userInfo, userId as string);
    }
  } catch (error) {
    console.error('❌ [User API] Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleUpdateUser(req: NextApiRequest, res: NextApiResponse, db: any, userInfo: JWTPayload, userId: string) {
  const { fullName, phoneNumber, email, username, role, password } = req.body;

  // Validate required fields
  if (!fullName || !phoneNumber || !email || !username || !role) {
    return res.status(400).json({ message: 'All fields except password are required' });
  }

  // Validate role
  if (!['sub-admin', 'manager', 'staff'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  console.log('👤 [Update User API] Fetching admin details for ownerId:', userInfo.ownerId);
  
  // Get the admin's details to ensure proper authorization
  let adminUser = await db.collection('users').findOne({ ownerId: userInfo.ownerId });
  if (!adminUser) {
    // Fallback: try to find by _id if ownerId lookup fails
    adminUser = await db.collection('users').findOne({ _id: new ObjectId(userInfo.userId) });
    if (adminUser) {
      console.warn('⚠️ [Update User API] Admin found by _id but not by ownerId. Data inconsistency detected.');
      userInfo.ownerId = adminUser.ownerId;
    }
  }

  if (!adminUser) {
    return res.status(404).json({ message: 'Admin user not found' });
  }

  // Validate ObjectId format
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  // Find the user to update
  console.log('🔍 [Update User API] Finding user to update:', userId);
  const userToUpdate = await db.collection('users').findOne({ 
    _id: new ObjectId(userId),
    ownerId: adminUser.ownerId
  });

  if (!userToUpdate) {
    return res.status(404).json({ message: 'User not found or access denied' });
  }

  // Prevent updating admin users
  if (userToUpdate.role === 'admin') {
    return res.status(403).json({ message: 'Cannot edit admin users' });
  }

  // Check if username or email already exists within the same organization (excluding current user)
  const existingUser = await db.collection('users').findOne({
    ownerId: adminUser.ownerId,
    _id: { $ne: new ObjectId(userId) }, // Exclude current user
    $or: [
      { username: username.toLowerCase().trim() },
      { email: email.toLowerCase().trim() }
    ]
  });

  if (existingUser) {
    const field = existingUser.username === username.toLowerCase().trim() ? 'Username' : 'Email';
    return res.status(409).json({ message: `${field} already exists in your organization` });
  }

  // Prepare update data
  const updateData: any = {
    fullName: fullName.trim(),
    phoneNumber: phoneNumber.trim(),
    email: email.toLowerCase().trim(),
    username: username.toLowerCase().trim(),
    role: role,
    updatedAt: new Date()
  };

  // Only update password if provided
  if (password && password.trim()) {
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    updateData.password = await bcrypt.hash(password, saltRounds);
  }

  console.log('🔄 [Update User API] Updating user:', {
    _id: userId,
    updates: Object.keys(updateData)
  });

  // Update the user
  const updateResult = await db.collection('users').updateOne(
    { 
      _id: new ObjectId(userId),
      ownerId: adminUser.ownerId
    },
    { $set: updateData }
  );

  if (updateResult.modifiedCount === 1) {
    console.log('✅ [Update User API] User updated successfully:', {
      updatedUserId: userId,
      updatedUserName: updateData.fullName
    });

    // Return updated user data without password
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } else {
    throw new Error('Failed to update user');
  }
}

async function handleDeleteUser(req: NextApiRequest, res: NextApiResponse, db: any, userInfo: JWTPayload, userId: string) {

    console.log('👤 [Delete User API] Fetching admin details for ownerId:', userInfo.ownerId);
    
    // Get the admin's details to ensure proper authorization
    let adminUser = await db.collection('users').findOne({ ownerId: userInfo.ownerId });
    if (!adminUser) {
      // Fallback: try to find by _id if ownerId lookup fails
      adminUser = await db.collection('users').findOne({ _id: new ObjectId(userInfo.userId) });
      if (adminUser) {
        console.warn('⚠️ [Delete User API] Admin found by _id but not by ownerId. Data inconsistency detected.');
        userInfo.ownerId = adminUser.ownerId; // Use the correct ownerId from database
      }
    }

    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    console.log('✅ [Delete User API] Admin found:', {
      _id: adminUser._id,
      ownerId: adminUser.ownerId,
      fullName: adminUser.fullName,
      role: adminUser.role
    });

    // Validate ObjectId format
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Find the user to delete
    console.log('🔍 [Delete User API] Finding user to delete:', userId);
    const userToDelete = await db.collection('users').findOne({ 
      _id: new ObjectId(userId),
      ownerId: adminUser.ownerId  // Ensure the user belongs to the same organization
    });

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found or access denied' });
    }

    console.log('👤 [Delete User API] User to delete found:', {
      _id: userToDelete._id,
      ownerId: userToDelete.ownerId,
      fullName: userToDelete.fullName,
      role: userToDelete.role
    });

    // Prevent admin from deleting themselves
    if (userToDelete._id.toString() === userInfo.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Prevent deletion of admin users
    if (userToDelete.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Delete the user
    console.log('🗑️ [Delete User API] Deleting user...');
    const deleteResult = await db.collection('users').deleteOne({ 
      _id: new ObjectId(userId),
      ownerId: adminUser.ownerId  // Double-check organization ownership
    });

    if (deleteResult.deletedCount === 1) {
      console.log('✅ [Delete User API] User deleted successfully:', {
        deletedUserId: userId,
        deletedUserName: userToDelete.fullName,
        adminOwnerId: adminUser.ownerId
      });

      res.status(200).json({
        message: 'User deleted successfully',
        deletedUser: {
          _id: userToDelete._id,
          fullName: userToDelete.fullName,
          email: userToDelete.email,
          role: userToDelete.role
        }
      });
    } else {
      throw new Error('Failed to delete user');
    }
} 