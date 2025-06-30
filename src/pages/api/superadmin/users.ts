import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET!;

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

// Helper function to verify super admin JWT
function verifySuperAdminToken(token: string): SuperAdminJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SuperAdminJWTPayload;
    return decoded.role === 'superadmin' ? decoded : null;
  } catch (error) {
    console.error('❌ Super admin token verification failed:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const superAdminInfo = verifySuperAdminToken(token);

  if (!superAdminInfo) {
    return res.status(401).json({ message: 'Invalid super admin token' });
  }

  if (!superAdminInfo.permissions.manageAllUsers) {
    return res.status(403).json({ message: 'Insufficient permissions to manage users' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      console.log('👥 [Super Admin Users API] Fetching ONLY admin users across ALL organizations...');

      // Get query parameters for pagination and filtering
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';

      // Build filter query - Show ONLY admin users
      const filter: any = { role: 'admin' };
      
      if (search) {
        filter.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { ownerId: { $regex: search, $options: 'i' } }
        ];
      }

      // Get total count for pagination
      const totalUsers = await db.collection('users').countDocuments(filter);
      const totalPages = Math.ceil(totalUsers / limit);
      const skip = (page - 1) * limit;

      // Fetch ONLY admin users across ALL organizations
      const users = await db.collection('users')
        .find(filter, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Get user statistics by ownerId (organizations)
      const usersByOrg = await db.collection('users').aggregate([
        { $match: { role: 'admin' } },
        { $group: { _id: '$ownerId', userCount: { $sum: 1 }, adminUsers: { $push: '$$ROOT' } } },
        { $sort: { userCount: -1 } }
      ]).toArray();

      // Get recently created admin users
      const recentUsers = await db.collection('users')
        .find({ role: 'admin' }, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

      // Remove passwords from response
      const sanitizedUsers = users.map((user: any) => ({
        ...user,
        id: user._id.toString()
      }));

      console.log('✅ [Super Admin Users API] Successfully fetched ADMIN users only:', {
        totalUsers,
        currentPage: page,
        usersInPage: sanitizedUsers.length,
        organizationsCount: usersByOrg.length,
        requestedBy: superAdminInfo.username
      });

      res.status(200).json({
        users: sanitizedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        usersByOrg: usersByOrg.map((org: any) => ({
          ownerId: org._id,
          userCount: org.userCount,
          adminUsers: org.adminUsers.map((user: any) => ({
            ...user,
            id: user._id.toString()
          }))
        })),
        recentUsers: recentUsers.map((user: any) => ({
          ...user,
          id: user._id.toString()
        })),
        filters: { search },
        adminUsersOnly: true,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [Super Admin Users API] Error fetching admin users:', error);
      res.status(500).json({ message: 'Failed to fetch admin users' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { userId, pageAccess } = req.body;

      if (!userId || !pageAccess) {
        return res.status(400).json({ message: 'userId and pageAccess are required' });
      }

      console.log('🔧 [Super Admin Users API] Updating page access for user:', userId);

      // First, get the user to find their ownerId
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const ownerId = user.ownerId;

      // Update the specific user's page access
      const updateResult = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            ...pageAccess,
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If dashboard access was changed to false, update all users with the same ownerId
      if (pageAccess['dashboard:true'] === false) {
        console.log('🔄 [Super Admin Users API] Cascading dashboard access update to all users with ownerId:', ownerId);
        
        await db.collection('users').updateMany(
          { ownerId: ownerId },
          { 
            $set: { 
              'dashboard:true': false,
              updatedAt: new Date()
            }
          }
        );
      }

      console.log('✅ [Super Admin Users API] Successfully updated page access for user and cascaded if needed');

      res.status(200).json({ 
        message: 'Page access updated successfully',
        cascadeApplied: pageAccess['dashboard:true'] === false,
        affectedOwnerId: ownerId
      });

    } catch (error) {
      console.error('❌ [Super Admin Users API] Error updating page access:', error);
      res.status(500).json({ message: 'Failed to update page access' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 