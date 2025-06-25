const { MongoClient } = require('mongodb');
require('dotenv').config();

// Database connection using environment variables with fallback
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'visitrack';

console.log('🔧 Using database configuration:');
console.log('URI:', uri);
console.log('Database:', dbName);

const forms = [
  {
    "ownerId": "68593ac252ed4fec6f1e908b",
    "formName": "Startup Expo",
    "eventId": "685a6148ff88501e15564c89",
    "eventName": "Startup Expo",
    "fields": [
      {
        "id": "fullName",
        "type": "text",
        "label": "Full Name",
        "placeholder": "Enter your full name",
        "required": true,
        "isDefault": true
      },
      {
        "id": "phoneNumber",
        "type": "tel",
        "label": "Phone Number",
        "placeholder": "Enter your phone number",
        "required": true,
        "isDefault": true
      },
      {
        "id": "email",
        "type": "email",
        "label": "Email",
        "placeholder": "Enter your email address",
        "required": true,
        "isDefault": true
      },
      {
        "id": "company",
        "type": "text",
        "label": "Company",
        "placeholder": "Enter your company name",
        "required": false,
        "isDefault": true
      },
      {
        "id": "city",
        "type": "text",
        "label": "City",
        "placeholder": "Enter your city",
        "required": false,
        "isDefault": true
      },
      {
        "id": "state",
        "type": "text",
        "label": "State",
        "placeholder": "Enter your state",
        "required": false,
        "isDefault": true
      },
      {
        "id": "country",
        "type": "text",
        "label": "Country",
        "placeholder": "Enter your country",
        "required": false,
        "isDefault": true
      },
      {
        "id": "pincode",
        "type": "text",
        "label": "Pincode",
        "placeholder": "Enter your pincode",
        "required": false,
        "isDefault": true
      },
      {
        "id": "source",
        "type": "text",
        "label": "Source",
        "placeholder": "Enter source",
        "required": true,
        "defaultValue": "Website",
        "isDefault": true
      }
    ],
    "isActive": true,
    "submissionCount": 0,
    "createdBy": {
      "userId": "68593ac252ed4fec6f1e908c",
      "username": "jd123",
      "email": "jd64@gmail.com",
      "role": "admin"
    },
    "createdAt": new Date(),
    "updatedAt": new Date()
  },
  {
    "ownerId": "68593ac252ed4fec6f1e908b",
    "formName": "Cyber Security",
    "eventId": "685a7a6231f121a8d5d638ea",
    "eventName": "Cyber Security",
    "fields": [
      {
        "id": "fullName",
        "type": "text",
        "label": "Full Name",
        "placeholder": "Enter your full name",
        "required": true,
        "isDefault": true
      },
      {
        "id": "phoneNumber",
        "type": "tel",
        "label": "Phone Number",
        "placeholder": "Enter your phone number",
        "required": true,
        "isDefault": true
      },
      {
        "id": "email",
        "type": "email",
        "label": "Email",
        "placeholder": "Enter your email address",
        "required": true,
        "isDefault": true
      },
      {
        "id": "company",
        "type": "text",
        "label": "Company",
        "placeholder": "Enter your company name",
        "required": false,
        "isDefault": true
      },
      {
        "id": "city",
        "type": "text",
        "label": "City",
        "placeholder": "Enter your city",
        "required": false,
        "isDefault": true
      },
      {
        "id": "state",
        "type": "text",
        "label": "State",
        "placeholder": "Enter your state",
        "required": false,
        "isDefault": true
      },
      {
        "id": "country",
        "type": "text",
        "label": "Country",
        "placeholder": "Enter your country",
        "required": false,
        "isDefault": true
      },
      {
        "id": "pincode",
        "type": "text",
        "label": "Pincode",
        "placeholder": "Enter your pincode",
        "required": false,
        "isDefault": true
      },
      {
        "id": "source",
        "type": "text",
        "label": "Source",
        "placeholder": "Enter source",
        "required": true,
        "defaultValue": "Website",
        "isDefault": true
      },
      {
        "id": "field_1750826222866",
        "type": "radio",
        "label": "You have install a Kali Linux",
        "placeholder": "",
        "required": true,
        "options": ["Yes", "No"],
        "defaultValue": "",
        "isDefault": false
      }
    ],
    "isActive": true,
    "submissionCount": 0,
    "createdBy": {
      "userId": "68593ac252ed4fec6f1e908c",
      "username": "jd123",
      "email": "jd64@gmail.com",
      "role": "admin"
    },
    "createdAt": new Date(),
    "updatedAt": new Date()
  }
];

async function seedForms() {
  let client;
  
  try {
    console.log('🌱 Connecting to database...');
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const collection = db.collection('forms');
    
    console.log('🗑️ Clearing existing forms...');
    await collection.deleteMany({});
    
    console.log('📝 Inserting new forms...');
    const result = await collection.insertMany(forms);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} forms:`);
    forms.forEach((form, index) => {
      console.log(`  ${index + 1}. ${form.eventName} (ID: ${result.insertedIds[index]})`);
    });

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    await collection.createIndex({ eventId: 1 });
    await collection.createIndex({ ownerId: 1 });
    await collection.createIndex({ isActive: 1 });
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seeding function
if (require.main === module) {
  seedForms();
}

module.exports = { seedForms }; 