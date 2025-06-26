import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { connectToDatabase, dbName } from '../../lib/mongodb';

// Gmail configuration
const GMAIL_USER = process.env.GMAIL_USER || 'visitrackoffical@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'ojadmobcwskreljt';

// Generate random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
};

// Send OTP email
async function sendOTPEmail(email: string, otp: string, eventName?: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const eventText = eventName ? ` for ${eventName}` : '';
    const eventSubject = eventName ? `Your OTP for ${eventName} Registration - Visitrack` : 'Your OTP for Event Registration - Visitrack';
    
    const mailOptions = {
      from: GMAIL_USER,
      to: email,
      subject: eventSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Visitrack</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Event Registration Verification${eventText}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Your Verification Code</h2>
            ${eventName ? `<p style="color: #555; text-align: center; margin-bottom: 20px; font-size: 16px;"><strong>Event:</strong> ${eventName}</p>` : ''}
            
            <div style="background: white; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0;">${otp}</div>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Enter this code to verify your email</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⏰ Important:</strong> This code will expire in 5 minutes for security purposes.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                If you didn't request this code, please ignore this email.
              </p>
              <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
                © 2025 Visitrack. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, eventName } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const { db } = await connectToDatabase();

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // OTP expires in 5 minutes

    // Store OTP in database
    await db.collection('otps').replaceOne(
      { email },
      {
        email,
        otp,
        expiresAt,
        verified: false,
        createdAt: new Date(),
        eventName: eventName || null
      },
      { upsert: true }
    );

    // Send OTP via email with event name
    const emailSent = await sendOTPEmail(email, otp, eventName);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    console.log(`📧 OTP sent to ${email}: ${otp}${eventName ? ` for ${eventName}` : ''}`);
    
    res.status(200).json({ 
      message: 'OTP sent successfully to your email',
      success: true
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
} 