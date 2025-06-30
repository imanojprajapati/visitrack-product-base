/**
 * Update Users with Page Access Fields
 * 
 * This script demonstrates how to update existing users with page access fields
 * to transform them from the old format to the new format with page access control.
 * 
 * Example transformation:
 * OLD: Basic user with just core fields
 * NEW: User with page access fields like "dashboard:true": true, "visitors:true": true, etc.
 * 
 * Run with: node scripts/update-users-with-page-access.js
 */

// Load environment variables from .env file
require('dotenv').config();

const { MongoClient, ObjectId } = require('mongodb');

// Page access fields that should be added to all users
const generatePageAccessFields = () => {
  return {
    "dashboard:true": true,
    "visitors:true": true,
    "events:true": true,
    "badge-management:true": true,
    "form-builder:true": true,
    "messages:true": true,
    "entry-log:true": true,
    "scanner:true": true,
    "reports:true": true,
    "setting:true": true,
    "profile:true": true
  };
};

// Sample user data (as provided by user) - for demonstration
const sampleUserData = [
  {
    "_id": {"$oid": "685bc0194da2251d0ea053d4"},
    "ownerId": "685bc0194da2251d0ea053d3",
    "fullName": "Kishan Modi",
    "phoneNumber": "9988776655",
    "email": "km@gmail.com",
    "capacity": {"$numberInt": "10000"},
    "username": "km1234",
    "password": "$2b$12$EwFlfBZq9u62s353/te3zeqhsko7nzXsHX/wfYCipok9800Nr3uEe",
    "role": "admin",
    "createdAt": {"$date": {"$numberLong": "1750843417303"}},
    "updatedAt": {"$date": {"$numberLong": "1751270364507"}},
    "isActive": true,
    "emailVerified": false,
    "lastLoginAt": {"$date": {"$numberLong": "1751270364507"}}
  },
  {
    "_id": {"$oid": "685bc16d4da2251d0ea053d7"},
    "ownerId": "685bc16d4da2251d0ea053d6",
    "fullName": "John Don",
    "phoneNumber": "9727772798",
    "email": "jd@gmail.com",
    "capacity": {"$numberInt": "6000"},
    "username": "jd1234",
    "password": "$2b$12$Lq051r0W1gk6yRxWoZe4l.y1TXOSZh69aCkFNd8iBhfIH7D0UZiFm",
    "role": "admin",
    "createdAt": {"$date": {"$numberLong": "1750843757683"}},
    "updatedAt": {"$date": {"$numberLong": "1751270787055"}},
    "isActive": true,
    "emailVerified": false,
    "lastLoginAt": {"$date": {"$numberLong": "1751270787055"}}
  },
  {
    "_id": {"$oid": "685bdebde29f14496671281f"},
    "ownerId": "685bdebde29f14496671281e",
    "fullName": "Manoj Prajapati",
    "phoneNumber": "09913715449",
    "email": "touptotechnologies@gmail.com",
    "capacity": {"$numberInt": "6000"},
    "username": "toupto",
    "password": "$2b$12$WZMMCV.4ws8SQ07fZzCxiuqLbe0zehUMrjzla0DAliRApELrli3Lq",
    "role": "admin",
    "createdAt": {"$date": {"$numberLong": "1750851261252"}},
    "updatedAt": {"$date": {"$numberLong": "1750953259361"}},
    "isActive": true,
    "emailVerified": false,
    "lastLoginAt": {"$date": {"$numberLong": "1750953259361"}}
  },
  {
    "_id": {"$oid": "68622a67a12e228f7cadfcbf"},
    "ownerId": "68622a67a12e228f7cadfcbe",
    "fullName": "Aakarvisitors",
    "phoneNumber": "9727772798",
    "email": "admin@admin.com",
    "capacity": {"$numberInt": "10000"},
    "username": "aakarvisitors",
    "password": "$2b$12$frzIWoW6Z89dbEllVbEjAuoTRd7k5XRaka1LFF1XA/Q2SZgCuj.BO",
    "role": "admin",
    "createdAt": {"$date": {"$numberLong": "1751263847620"}},
    "updatedAt": {"$date": {"$numberLong": "1751269604481"}},
    "isActive": true,
    "emailVerified": false,
    "lastLoginAt": {"$date": {"$numberLong": "1751269604481"}}
  }
];

async function updateUsersWithPageAccess() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const MONGODB_DB = process.env.MONGODB_DB || 'visitrackp';
  
  console.log('🚀 Starting user page access update...');
  console.log('📁 Database:', MONGODB_DB);
  console.log('🔗 MongoDB URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'));
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const usersCollection = db.collection('users');
    
    // Generate page access fields
    const pageAccessFields = generatePageAccessFields();
    console.log('📝 Page access fields to add:', Object.keys(pageAccessFields));
    
    // Update all users who don't have page access fields
    const bulkUpdateResult = await usersCollection.updateMany(
      { 
        "dashboard:true": { $exists: false } // Find users without page access
      },
      { 
        $set: {
          ...pageAccessFields,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`📊 Updated ${bulkUpdateResult.modifiedCount} users`);
    
    // Show sample updated user
    const sampleUser = await usersCollection.findOne(
      { "dashboard:true": true },
      { projection: { password: 0 } }
    );
    
    if (sampleUser) {
      console.log('\n📄 Sample updated user structure:');
      console.log(JSON.stringify(sampleUser, null, 2));
    }
    
    // Verification
    const totalUsers = await usersCollection.countDocuments({});
    const usersWithPageAccess = await usersCollection.countDocuments({
      "dashboard:true": true
    });
    
    console.log(`\n📊 Total users: ${totalUsers}`);
    console.log(`✅ Users with page access: ${usersWithPageAccess}`);
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.close();
    console.log('🔐 Database connection closed');
  }
}

// Utility function to show the transformation
function showTransformation() {
  console.log('📋 USER DATA TRANSFORMATION EXAMPLE:');
  console.log('=' .repeat(60));
  
  const pageAccess = generatePageAccessFields();
  
  console.log('\n🔴 BEFORE (Original user structure):');
  console.log(JSON.stringify({
    "_id": {"$oid": "685bc0194da2251d0ea053d4"},
    "ownerId": "685bc0194da2251d0ea053d3",
    "fullName": "Kishan Modi",
    "phoneNumber": "9988776655",
    "email": "km@gmail.com",
    "capacity": {"$numberInt": "10000"},
    "username": "km1234",
    "role": "admin",
    "isActive": true,
    "emailVerified": false
  }, null, 2));
  
  console.log('\n🟢 AFTER (With page access fields):');
  console.log(JSON.stringify({
    "_id": {"$oid": "685bc0194da2251d0ea053d4"},
    "ownerId": "685bc0194da2251d0ea053d3",
    "fullName": "Kishan Modi",
    "phoneNumber": "9988776655",
    "email": "km@gmail.com",
    "capacity": {"$numberInt": "10000"},
    "username": "km1234",
    "role": "admin",
    "isActive": true,
    "emailVerified": false,
    ...pageAccess
  }, null, 2));
}

// Command line options
const args = process.argv.slice(2);

if (args.includes('--show-transformation')) {
  showTransformation();
  process.exit(0);
}

// Run update if script is executed directly
if (require.main === module) {
  console.log('💡 Tip: Run with --show-transformation to see the data transformation example\n');
  
  updateUsersWithPageAccess()
    .then(() => {
      console.log('🎉 Update completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateUsersWithPageAccess, generatePageAccessFields, showTransformation }; 