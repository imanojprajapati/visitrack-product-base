import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';

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

function verifySuperAdminToken(token: string): SuperAdminJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SuperAdminJWTPayload;
    return decoded.role === 'superadmin' ? decoded : null;
  } catch (error) {
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
  const superAdminInfo = verifySuperAdminToken(token);

  if (!superAdminInfo) {
    return res.status(401).json({ message: 'Invalid super admin token' });
  }

  if (!superAdminInfo.permissions.viewAllData) {
    return res.status(403).json({ message: 'Insufficient permissions to view all forms' });
  }

  try {
    console.log('📋 [Super Admin Forms API] Fetching ALL forms across ALL organizations...');
    const { db } = await connectToDatabase();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const status = req.query.status as string || '';

    // Build filter query - NO ownerId filtering for super admin
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }

    const totalForms = await db.collection('forms').countDocuments(filter);
    const totalPages = Math.ceil(totalForms / limit);
    const skip = (page - 1) * limit;

    // Fetch ALL forms across ALL organizations
    const forms = await db.collection('forms')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get forms by organization stats
    const formsByOrg = await db.collection('forms').aggregate([
      { $group: { _id: '$ownerId', formCount: { $sum: 1 }, statuses: { $addToSet: '$status' } } },
      { $sort: { formCount: -1 } }
    ]).toArray();

    // Get form statistics
    const formStats = await db.collection('forms').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get recently created forms across all organizations
    const recentForms = await db.collection('forms')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const sanitizedForms = forms.map((form: any) => ({
      ...form,
      id: form._id.toString()
    }));

    console.log('✅ [Super Admin Forms API] Successfully fetched ALL forms:', {
      totalForms,
      currentPage: page,
      formsInPage: sanitizedForms.length,
      organizationsCount: formsByOrg.length,
      requestedBy: superAdminInfo.username
    });

    res.status(200).json({
      forms: sanitizedForms,
      pagination: {
        currentPage: page,
        totalPages,
        totalForms,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      formsByOrg: formsByOrg.map((org: any) => ({
        ownerId: org._id,
        formCount: org.formCount,
        statuses: org.statuses
      })),
      formStats: formStats.map((stat: any) => ({
        status: stat._id,
        count: stat.count
      })),
      recentForms: recentForms.map((form: any) => ({
        ...form,
        id: form._id.toString()
      })),
      filters: { search, status },
      systemWide: true,
      globalView: true,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Super Admin Forms API] Error fetching forms:', error);
    res.status(500).json({ message: 'Failed to fetch forms' });
  }
} 