import { MongoClient, MongoClientOptions } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!dbName) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

// Improved MongoDB connection options to fix SSL/TLS issues
const options: MongoClientOptions = {
  // SSL/TLS Configuration
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  
  // Connection settings
  serverSelectionTimeoutMS: 10000, // Increased timeout
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 1,
  
  // Retry settings
  retryWrites: true,
  retryReads: true,
  
  // Network settings
  family: 4, // Use IPv4
  
  // Additional stability options
  heartbeatFrequencyMS: 10000,
  
  // Compression
  compressors: ['zlib'],
  
  // Auth settings
  authSource: 'admin'
};

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToDatabase() {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    try {
      // Test the connection
      await cachedClient.db(dbName).admin().ping();
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      console.log('🔄 Cached connection failed, creating new connection...');
      cachedClient = null;
      cachedDb = null;
    }
  }

  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Create new connection
    const client = new MongoClient(uri, options);
    await client.connect();
    
    // Test the connection
    await client.db(dbName).admin().ping();
    
    const db = client.db(dbName);
    
    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    console.log('✅ MongoDB connected successfully');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    
    // Reset cache on failure
    cachedClient = null;
    cachedDb = null;
    
    throw error;
  }
}

// Alternative connection function for backward compatibility
export async function connectToMongoDB() {
  const { client } = await connectToDatabase();
  return client;
}

// Get database instance
export async function getDatabase() {
  const { db } = await connectToDatabase();
  return db;
}

// Close connection (useful for cleanup)
export async function closeConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('🔌 MongoDB connection closed');
  }
}

export { dbName }; 