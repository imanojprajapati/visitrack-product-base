/**
 * Migration Script: Add Page Access Fields to Existing Users
 * 
 * This script updates all existing users in the database to include
 * page access fields like "dashboard:true", "events:true", etc.
 * 
 * Run with: node scripts/migrate-user-page-access.js
 */

// Load environment variables from .env file
require('dotenv').config();

const { MongoClient } = require('mongodb');

// Page access fields that should be added to all users
const generateDefaultPageAccess = () => {
  const adminRoutes = [
    { path: '/admin', name: 'Dashboard' },
    { path: '/admin/visitors', name: 'Visitor Management' },
    { path: '/admin/events', name: 'Event Management' },
    { path: '/admin/badge-management', name: 'Badge Management' },
    { path: '/admin/forms', name: 'Form Builder' },
    { path: '/admin/messages', name: 'Messages' },
    { path: '/admin/entry-log', name: 'Entry Log' },
    { path: '/admin/scanner', name: 'Quick Scanner' },
    { path: '/admin/reports', name: 'Report' },
    { path: '/admin/settings', name: 'Setting' },
    { path: '/admin/profile', name: 'Profile' }
  ];

  const pageAccess = {};
  
  adminRoutes.forEach(route => {
    // Convert path to page access key format
    let pageKey = route.path.replace('/admin/', '').replace('/admin', 'dashboard');
    
    // Handle special cases for consistent naming
    if (pageKey === 'badge-management') pageKey = 'badge-management';
    if (pageKey === 'entry-log') pageKey = 'entry-log';
    if (pageKey === 'forms') pageKey = 'form-builder';
    if (pageKey === 'settings') pageKey = 'setting';
    
    // Add page access with field name format like "dashboard:true" with boolean value
    pageAccess[`${pageKey}:true`] = true;
  });
  
  return pageAccess;
};

async function migrateUserPageAccess() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const MONGODB_DB = process.env.MONGODB_DB || 'visitrackp';
  
  console.log('🚀 Starting user page access migration...');
  console.log('📁 Database:', MONGODB_DB);
  console.log('🔗 MongoDB URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'));
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const usersCollection = db.collection('users');
    
    // Generate default page access
    const defaultPageAccess = generateDefaultPageAccess();
    console.log('📝 Page access fields to add:', Object.keys(defaultPageAccess));
    
    // Find users who don't have any page access fields
    const usersWithoutPageAccess = await usersCollection.find({
      'dashboard:true': { $exists: false }
    }).toArray();
    
    console.log(`👥 Found ${usersWithoutPageAccess.length} users without page access fields`);
    
    if (usersWithoutPageAccess.length === 0) {
      console.log('✅ All users already have page access fields. No migration needed.');
      return;
    }
    
    // Update all users without page access
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithoutPageAccess) {
      try {
        const result = await usersCollection.updateOne(
          { _id: user._id },
          { $set: { ...defaultPageAccess, updatedAt: new Date() } }
        );
        
        if (result.modifiedCount === 1) {
          successCount++;
          console.log(`✅ Updated user: ${user.fullName} (${user.email})`);
        } else {
          errorCount++;
          console.log(`❌ Failed to update user: ${user.fullName} (${user.email})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating user ${user.fullName}:`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`❌ Failed to update: ${errorCount} users`);
    console.log(`📝 Page access fields added: ${Object.keys(defaultPageAccess).length}`);
    
    // Show example of updated user structure
    if (successCount > 0) {
      const sampleUser = await usersCollection.findOne(
        { 'dashboard:true': true },
        { projection: { password: 0 } }
      );
      console.log('\n📄 Sample updated user structure:');
      console.log(JSON.stringify(sampleUser, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔐 Database connection closed');
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  migrateUserPageAccess()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUserPageAccess, generateDefaultPageAccess }; 