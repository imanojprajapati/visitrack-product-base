const { MongoClient } = require('mongodb');
require('dotenv').config();

// Database connection using environment variables with fallback
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'visitrack';

console.log('🔧 Using database configuration:');
console.log('URI:', uri);
console.log('Database:', dbName);

const badges = [
  {
    "ownerId": "68590d003401bd2e74c3b858",
    "badgeName": "AI Masterclasses Badge",
    "badgeImage": "https://res.cloudinary.com/dady3vzbc/image/upload/v1750762474/visitrack/event-banners/yih1jviqp3w32avfl1wz.jpg",
    "eventName": "AI Masterclassess",
    "eventId": "685a607fff88501e15564c88",
    "createdBy": {
      "userId": "68590d003401bd2e74c3b859",
      "username": "sp123",
      "email": "sejal.prajapati64@gmail.com",
      "role": "admin"
    },
    "createdAt": new Date(),
    "updatedAt": new Date()
  }
];

async function seedBadges() {
  let client;
  
  try {
    console.log('🌱 Connecting to database...');
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const collection = db.collection('badges');
    
    console.log('🗑️ Clearing existing badges...');
    await collection.deleteMany({});
    
    console.log('🏷️ Inserting new badges...');
    const result = await collection.insertMany(badges);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} badges:`);
    badges.forEach((badge, index) => {
      console.log(`  ${index + 1}. ${badge.badgeName} for ${badge.eventName} (ID: ${result.insertedIds[index]})`);
    });

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    await collection.createIndex({ eventId: 1 });
    await collection.createIndex({ ownerId: 1 });
    
    console.log('🎉 Badge seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding badges:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seeding function
if (require.main === module) {
  seedBadges();
}

module.exports = { seedBadges }; 