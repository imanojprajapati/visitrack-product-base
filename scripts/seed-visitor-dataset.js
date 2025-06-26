const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'your-mongodb-uri';
const dbName = process.env.MONGODB_DB || 'visitrack';

async function seedVisitorDataset() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('visitordataset');
    
    // Sample visitor dataset records
    const sampleData = [
      {
        ownerId: '675b0d0a0ca2251d0ea053de', // Replace with your actual user ID
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        company: 'Tech Corp',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        pincode: '10001',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ownerId: '675b0d0a0ca2251d0ea053de', // Replace with your actual user ID
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        phoneNumber: '+1234567891',
        company: 'Design Studio',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        pincode: '90210',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ownerId: '675b0d0a0ca2251d0ea053de', // Replace with your actual user ID
        fullName: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phoneNumber: '+1234567892',
        company: 'Marketing Inc',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        pincode: '60601',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Clear existing data for this owner (optional)
    await collection.deleteMany({ ownerId: '675b0d0a0ca2251d0ea053de' });
    
    // Insert sample data
    const result = await collection.insertMany(sampleData);
    console.log(`✅ Inserted ${result.insertedCount} visitor dataset records`);
    
    // Verify the data
    const count = await collection.countDocuments({ ownerId: '675b0d0a0ca2251d0ea053de' });
    console.log(`📊 Total records for owner: ${count}`);
    
  } catch (error) {
    console.error('Error seeding visitor dataset:', error);
  } finally {
    await client.close();
  }
}

seedVisitorDataset(); 