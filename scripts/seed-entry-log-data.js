const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

async function seedEntryLogData() {
  console.log('🌱 Seeding Entry Log test data...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Sample entry log data with different entry types
    const entryLogVisitors = [
      {
        "_id": new ObjectId("685bcfea4da2251d0ea053e1"),
        "eventId": "685bcb1d4da2251d0ea053d8",
        "eventName": "Sarvam AI Launch",
        "eventLocation": "Pune",
        "eventStartDate": "2025-09-01",
        "eventEndDate": "2025-09-01",
        "ownerId": "685bc0194da2251d0ea053d3",
        "fullName": "Scooter wale",
        "email": "visitrackoffical@gmail.com",
        "phoneNumber": "9727772798",
        "company": "Toupto Technologies",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "country": "India",
        "pincode": "382488",
        "source": "Website",
        "entryType": "Manual",
        "visitorRegistrationDate": "2025-06-25",
        "status": "Visited",
        "createdAt": new Date("2025-06-25T00:00:00.000Z"),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "eventId": "685bcb1d4da2251d0ea053d8",
        "eventName": "Sarvam AI Launch",
        "eventLocation": "Pune",
        "eventStartDate": "2025-09-01",
        "eventEndDate": "2025-09-01",
        "ownerId": "685bc0194da2251d0ea053d3",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "9876543210",
        "company": "Tech Solutions",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "pincode": "400001",
        "source": "QR Code",
        "entryType": "QR",
        "visitorRegistrationDate": "2025-06-26",
        "status": "Visited",
        "createdAt": new Date("2025-06-26T00:00:00.000Z"),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "eventId": "685bcb1d4da2251d0ea053d8",
        "eventName": "Sarvam AI Launch",
        "eventLocation": "Pune",
        "eventStartDate": "2025-09-01",
        "eventEndDate": "2025-09-01",
        "ownerId": "685bc0194da2251d0ea053d3",
        "fullName": "Jane Smith",
        "email": "jane.smith@example.com",
        "phoneNumber": "8765432109",
        "company": "Digital Innovations",
        "city": "Bangalore",
        "state": "Karnataka",
        "country": "India",
        "pincode": "560001",
        "source": "Website",
        "entryType": "Manual",
        "visitorRegistrationDate": "2025-06-27",
        "status": "Registration",
        "createdAt": new Date("2025-06-27T00:00:00.000Z"),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "eventId": "685bcb1d4da2251d0ea053d8",
        "eventName": "Sarvam AI Launch",
        "eventLocation": "Pune",
        "eventStartDate": "2025-09-01",
        "eventEndDate": "2025-09-01",
        "ownerId": "685bc0194da2251d0ea053d3",
        "fullName": "Mike Johnson",
        "email": "mike.johnson@example.com",
        "phoneNumber": "7654321098",
        "company": "AI Startups",
        "city": "Delhi",
        "state": "Delhi",
        "country": "India",
        "pincode": "110001",
        "source": "QR Scanner",
        "entryType": "QR Code",
        "visitorRegistrationDate": "2025-06-28",
        "status": "Visited",
        "createdAt": new Date("2025-06-28T00:00:00.000Z"),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "eventId": "685bcb1d4da2251d0ea053d8",
        "eventName": "Sarvam AI Launch",
        "eventLocation": "Pune",
        "eventStartDate": "2025-09-01",
        "eventEndDate": "2025-09-01",
        "ownerId": "685bc0194da2251d0ea053d3",
        "fullName": "Sarah Wilson",
        "email": "sarah.wilson@example.com",
        "phoneNumber": "6543210987",
        "company": "Future Tech",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "country": "India",
        "pincode": "600001",
        "source": "Website",
        "entryType": "manual",
        "visitorRegistrationDate": "2025-06-29",
        "status": "Visited",
        "createdAt": new Date("2025-06-29T00:00:00.000Z"),
        "updatedAt": new Date()
      }
    ];
    
    // Insert or update visitors
    for (const visitor of entryLogVisitors) {
      try {
        await db.collection('visitors').replaceOne(
          { _id: visitor._id },
          visitor,
          { upsert: true }
        );
        console.log(`✅ Seeded visitor: ${visitor.fullName} (${visitor.entryType})`);
      } catch (error) {
        console.log(`⚠️  Visitor ${visitor.fullName} may already exist or error occurred:`, error.message);
      }
    }
    
    // Verify seeded data
    const entryLogCount = await db.collection('visitors').countDocuments({
      ownerId: "685bc0194da2251d0ea053d3",
      entryType: { $in: ['manual', 'Manual', 'qr', 'QR', 'QR Code', 'qrcode'] }
    });
    
    console.log(`📊 Total entry log records for test owner: ${entryLogCount}`);
    
    // Show sample of seeded data
    const sampleData = await db.collection('visitors')
      .find({
        ownerId: "685bc0194da2251d0ea053d3",
        entryType: { $in: ['manual', 'Manual', 'qr', 'QR', 'QR Code', 'qrcode'] }
      })
      .limit(3)
      .toArray();
    
    console.log('\n📝 Sample seeded entry log data:');
    sampleData.forEach((visitor, index) => {
      console.log(`${index + 1}. ${visitor.fullName} - ${visitor.entryType} - ${visitor.status}`);
    });
    
    console.log('\n✅ Entry Log data seeding completed!');
    console.log('\n🔗 You can now test the Entry Log page at: /admin/entry-log');
    console.log('🔗 Test manual entry with visitor ID: 685bcfea4da2251d0ea053e1');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await client.close();
  }
}

seedEntryLogData(); 