import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate OTP format
    if (otp.length !== 6 || !/^[0-9]{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Invalid OTP format' });
    }

    const client = await connectToDatabase();
    const db = client.db(dbName);

    // Find OTP record
    const otpRecord = await db.collection('otps').findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP not found. Please request a new OTP.' });
    }

    // Check if OTP has expired
    const now = new Date();
    if (now > otpRecord.expiresAt) {
      // Clean up expired OTP
      await db.collection('otps').deleteOne({ email });
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Check if OTP is already verified
    if (otpRecord.verified) {
      return res.status(400).json({ message: 'OTP already used. Please request a new OTP.' });
    }

    // Mark OTP as verified
    await db.collection('otps').updateOne(
      { email },
      { 
        $set: { 
          verified: true,
          verifiedAt: new Date()
        } 
      }
    );

    res.status(200).json({ 
      message: 'OTP verified successfully',
      email: email
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
} 