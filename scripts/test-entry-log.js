const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

async function testEntryLog() {
  console.log('🧪 Testing Entry Log functionality...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Create a test visitor with manual entry type
    const testVisitor = {
      eventId: "test-event-id",
      eventName: "Test Event",
      eventLocation: "Test Location",
      eventStartDate: "2025-01-15",
      eventEndDate: "2025-01-15",
      ownerId: "test-owner-id",
      fullName: "Test Visitor",
      email: "test@example.com",
      phoneNumber: "1234567890",
      company: "Test Company",
      city: "Test City",
      state: "Test State",
      country: "Test Country",
      pincode: "12345",
      source: "Website",
      entryType: "Manual",
      visitorRegistrationDate: new Date().toISOString(),
      status: "Visited",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert test visitor
    const result = await db.collection('visitors').insertOne(testVisitor);
    console.log('✅ Test visitor created:', result.insertedId);
    
    // Query for entry log data
    const entryLogData = await db.collection('visitors')
      .find({
        ownerId: "test-owner-id",
        entryType: { $in: ['manual', 'Manual', 'qr', 'QR', 'QR Code', 'qrcode'] }
      })
      .toArray();
    
    console.log('📊 Entry log data found:', entryLogData.length, 'records');
    
    if (entryLogData.length > 0) {
      console.log('📝 Sample entry:', {
        id: entryLogData[0]._id,
        name: entryLogData[0].fullName,
        entryType: entryLogData[0].entryType,
        status: entryLogData[0].status
      });
    }
    
    // Clean up test data
    await db.collection('visitors').deleteOne({ _id: result.insertedId });
    console.log('🧹 Test data cleaned up');
    
    console.log('✅ Entry Log test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

testEntryLog(); 