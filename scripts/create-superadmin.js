/**
 * Super Admin Setup Script
 * 
 * This script creates:
 * 1. A new 'superadmins' collection
 * 2. A default super admin user
 * 3. Proper indexes for the collection
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'visitrackp';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function createSuperAdmin() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    console.log('📁 Connected to database:', MONGODB_DB);

    // Create superadmins collection if it doesn't exist
    const collections = await db.listCollections({ name: 'superadmins' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('superadmins');
      console.log('✅ Created superadmins collection');
    } else {
      console.log('📋 Superadmins collection already exists');
    }

    // Create indexes for superadmins collection
    await db.collection('superadmins').createIndex({ username: 1 }, { unique: true });
    await db.collection('superadmins').createIndex({ email: 1 }, { unique: true });
    console.log('✅ Created indexes for superadmins collection');

    // Check if default super admin already exists
    const existingSuperAdmin = await db.collection('superadmins').findOne({
      $or: [
        { username: 'superadmin' },
        { email: 'superadmin@visitrack.com' }
      ]
    });

    if (existingSuperAdmin) {
      console.log('⚠️ Default super admin already exists:', {
        username: existingSuperAdmin.username,
        email: existingSuperAdmin.email,
        createdAt: existingSuperAdmin.createdAt
      });
      return;
    }

    // Hash the default password
    const defaultPassword = 'SuperAdmin123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create default super admin user
    const superAdminUser = {
      fullName: 'Super Administrator',
      email: 'superadmin@visitrack.com',
      username: 'superadmin',
      password: hashedPassword,
      role: 'superadmin',
      permissions: {
        viewAllData: true,
        manageAllUsers: true,
        manageAllEvents: true,
        manageAllVisitors: true,
        systemSettings: true,
        analytics: true,
        reports: true
      },
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null
    };

    const result = await db.collection('superadmins').insertOne(superAdminUser);

    if (result.acknowledged) {
      console.log('🎉 Default super admin created successfully!');
      console.log('');
      console.log('📋 Super Admin Login Details:');
      console.log('   Email:    superadmin@visitrack.com');
      console.log('   Username: superadmin');
      console.log('   Password: SuperAdmin123!');
      console.log('');
      console.log('🔐 Please change the default password after first login!');
      console.log('');
      console.log('🌐 Access URL: http://localhost:3000/superadmin/login');
      
      // Also create some sample data to demonstrate the difference
      console.log('');
      console.log('📊 Super Admin Features:');
      console.log('   ✅ View all users across all organizations');
      console.log('   ✅ View all events from all owners');
      console.log('   ✅ View all visitors from all organizations');
      console.log('   ✅ System-wide analytics and reports');
      console.log('   ✅ No ownerId filtering - sees everything');
      console.log('   ✅ Separate authentication system');
    } else {
      throw new Error('Failed to create super admin user');
    }

  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Additional function to show system statistics
async function showSystemStats() {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB);

    console.log('📊 System Statistics:');
    console.log('==================');

    // Count regular users
    const userCount = await db.collection('users').countDocuments();
    console.log(`👥 Total Users: ${userCount}`);

    // Count unique organizations (ownerIds)
    const uniqueOwners = await db.collection('users').distinct('ownerId');
    console.log(`🏢 Organizations: ${uniqueOwners.length}`);

    // Count events
    const eventCount = await db.collection('events').countDocuments();
    console.log(`🎪 Total Events: ${eventCount}`);

    // Count visitors
    const visitorCount = await db.collection('visitors').countDocuments();
    console.log(`👤 Total Visitors: ${visitorCount}`);

    // Count super admins
    const superAdminCount = await db.collection('superadmins').countDocuments();
    console.log(`👑 Super Admins: ${superAdminCount}`);

    console.log('');
    console.log('🎯 This is what Super Admin can see - ALL data across ALL organizations!');

  } catch (error) {
    console.error('❌ Error fetching system stats:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the script
async function main() {
  await createSuperAdmin();
  await showSystemStats();
}

main().catch(console.error);

module.exports = {
  createSuperAdmin,
  showSystemStats
}; 