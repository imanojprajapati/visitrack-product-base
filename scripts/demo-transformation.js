/**
 * Demo: User Data Transformation with Page Access Fields
 * 
 * This script demonstrates the exact transformation process from
 * the old user structure to the new structure with page access fields.
 * 
 * Run with: node scripts/demo-transformation.js
 */

// Original user data (as provided by user)
const originalUsers = [
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
  }
];

// Page access fields to be added
const pageAccessFields = {
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

// Target structure (as provided by user)
const targetStructure = {
  "_id": {"$oid": "686259fb05aa996fc32300c1"},
  "ownerId": "686259fb05aa996fc32300c0",
  "fullName": "Admin",
  "phoneNumber": "9727772798",
  "email": "admin@gmail.com",
  "capacity": {"$numberInt": "6000"},
  "username": "admin",
  "password": "$2b$12$X3coHrN7jcRT4PcJ5o/ASeL37fVALoqC1hvoMJ0TmrRDBfPw0X54.",
  "role": "admin",
  "createdAt": {"$date": {"$numberLong": "1751276027317"}},
  "updatedAt": {"$date": {"$numberLong": "1751276039545"}},
  "isActive": true,
  "emailVerified": false,
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
  "profile:true": true,
  "lastLoginAt": {"$date": {"$numberLong": "1751276039545"}}
};

function transformUser(originalUser) {
  return {
    ...originalUser,
    ...pageAccessFields,
    updatedAt: new Date()
  };
}

function demonstrateTransformation() {
  console.log('🎯 USER DATA TRANSFORMATION DEMONSTRATION');
  console.log('=' .repeat(70));
  
  console.log('\n📋 Page Access Fields to Add:');
  Object.entries(pageAccessFields).forEach(([key, value]) => {
    console.log(`   "${key}": ${value}`);
  });
  
  console.log('\n🔄 TRANSFORMATION PROCESS:');
  console.log('=' .repeat(50));
  
  originalUsers.forEach((user, index) => {
    console.log(`\n👤 User ${index + 1}: ${user.fullName}`);
    console.log('─'.repeat(30));
    
    console.log('\n🔴 BEFORE (Original):');
    console.log(JSON.stringify({
      "_id": user._id,
      "ownerId": user.ownerId,
      "fullName": user.fullName,
      "phoneNumber": user.phoneNumber,
      "email": user.email,
      "capacity": user.capacity,
      "username": user.username,
      "role": user.role,
      "isActive": user.isActive,
      "emailVerified": user.emailVerified
    }, null, 2));
    
    const transformedUser = transformUser(user);
    
    console.log('\n🟢 AFTER (With Page Access):');
    console.log(JSON.stringify({
      "_id": transformedUser._id,
      "ownerId": transformedUser.ownerId,
      "fullName": transformedUser.fullName,
      "phoneNumber": transformedUser.phoneNumber,
      "email": transformedUser.email,
      "capacity": transformedUser.capacity,
      "username": transformedUser.username,
      "role": transformedUser.role,
      "isActive": transformedUser.isActive,
      "emailVerified": transformedUser.emailVerified,
      "dashboard:true": transformedUser["dashboard:true"],
      "visitors:true": transformedUser["visitors:true"],
      "events:true": transformedUser["events:true"],
      "badge-management:true": transformedUser["badge-management:true"],
      "form-builder:true": transformedUser["form-builder:true"],
      "messages:true": transformedUser["messages:true"],
      "entry-log:true": transformedUser["entry-log:true"],
      "scanner:true": transformedUser["scanner:true"],
      "reports:true": transformedUser["reports:true"],
      "setting:true": transformedUser["setting:true"],
      "profile:true": transformedUser["profile:true"]
    }, null, 2));
  });
  
  console.log('\n🎯 TARGET STRUCTURE EXAMPLE:');
  console.log('=' .repeat(40));
  console.log('This matches your desired format:');
  console.log(JSON.stringify(targetStructure, null, 2));
  
  console.log('\n✅ MONGODB UPDATE QUERY:');
  console.log('=' .repeat(30));
  console.log('// Update all users without page access fields');
  console.log('db.users.updateMany(');
  console.log('  { "dashboard:true": { $exists: false } },');
  console.log('  { $set: {');
  Object.entries(pageAccessFields).forEach(([key, value]) => {
    console.log(`    "${key}": ${value},`);
  });
  console.log('    updatedAt: new Date()');
  console.log('  }}');
  console.log(')');
  
  console.log('\n📊 SUMMARY:');
  console.log('=' .repeat(20));
  console.log(`✅ Page access fields added: ${Object.keys(pageAccessFields).length}`);
  console.log('✅ All admin pages now have access control');
  console.log('✅ Backward compatible with existing users');
  console.log('✅ Automatic access granted to all admin features');
}

// Run demonstration
if (require.main === module) {
  demonstrateTransformation();
}

module.exports = { 
  transformUser, 
  pageAccessFields,
  demonstrateTransformation 
}; 