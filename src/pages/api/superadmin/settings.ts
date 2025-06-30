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

  if (!superAdminInfo.permissions.systemSettings) {
    return res.status(403).json({ message: 'Insufficient permissions to view system settings' });
  }

  try {
    console.log('⚙️ [Super Admin Settings API] Fetching system settings...');
    const { db } = await connectToDatabase();

    // Get system-wide settings and statistics
    const [
      totalOrganizations,
      totalActiveUsers,
      systemUptime,
      databaseStats,
      serverHealth
    ] = await Promise.all([
      db.collection('users').distinct('ownerId').then((orgs: string[]) => orgs.length),
      db.collection('users').countDocuments({ 
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      }),
      Promise.resolve(Date.now() - process.uptime() * 1000),
      db.stats(),
      Promise.resolve({
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform
      })
    ]);

    // Get organization usage statistics
    const organizationUsage = await db.collection('users').aggregate([
      {
        $group: {
          _id: '$ownerId',
          userCount: { $sum: 1 },
          lastActivity: { $max: '$lastLoginAt' },
          createdAt: { $min: '$createdAt' }
        }
      },
      { $sort: { userCount: -1 } }
    ]).toArray();

    // Get system feature usage
    const featureUsage = await Promise.all([
      db.collection('events').countDocuments({}),
      db.collection('visitors').countDocuments({}),
      db.collection('badges').countDocuments({}),
      db.collection('forms').countDocuments({}),
      db.collection('messages').countDocuments({}),
      db.collection('entry-logs').countDocuments({})
    ]);

    const systemSettings = {
      systemInfo: {
        totalOrganizations,
        totalActiveUsers,
        systemUptime: new Date(systemUptime),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      databaseHealth: {
        connectionStatus: 'Connected',
        totalCollections: databaseStats.collections || 0,
        totalDocuments: databaseStats.objects || 0,
        databaseSize: databaseStats.dataSize || 0,
        indexSize: databaseStats.indexSize || 0
      },
      serverHealth: {
        memoryUsage: {
          used: Math.round(serverHealth.memory.heapUsed / 1024 / 1024),
          total: Math.round(serverHealth.memory.heapTotal / 1024 / 1024),
          external: Math.round(serverHealth.memory.external / 1024 / 1024)
        },
        nodeVersion: serverHealth.version,
        platform: serverHealth.platform,
        uptime: process.uptime()
      },
      organizationUsage: organizationUsage.map((org: any) => ({
        organizationId: org._id,
        userCount: org.userCount,
        lastActivity: org.lastActivity,
        accountAge: org.createdAt
      })),
      featureUsage: {
        totalEvents: featureUsage[0],
        totalVisitors: featureUsage[1],
        totalBadges: featureUsage[2],
        totalForms: featureUsage[3],
        totalMessages: featureUsage[4],
        totalEntryLogs: featureUsage[5]
      }
    };

    console.log('✅ [Super Admin Settings API] Successfully fetched system settings:', {
      organizationsTracked: totalOrganizations,
      activeUsers: totalActiveUsers,
      requestedBy: superAdminInfo.username
    });

    res.status(200).json({
      settings: systemSettings,
      lastUpdated: new Date().toISOString(),
      systemWide: true,
      requestedBy: superAdminInfo.username
    });

  } catch (error) {
    console.error('❌ [Super Admin Settings API] Error fetching system settings:', error);
    res.status(500).json({ message: 'Failed to fetch system settings' });
  }
} 