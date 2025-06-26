import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, MongoClientOptions, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

// Gmail configuration
const GMAIL_USER = process.env.GMAIL_USER || 'visitrackoffical@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'ojadmobcwskreljt';

let cachedClient: MongoClient | null = null;

const options: MongoClientOptions = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 5,
  retryWrites: true,
  retryReads: true,
  family: 4
};

async function connectToDatabase() {
  if (cachedClient) {
    try {
      await cachedClient.db(dbName).admin().ping();
      return cachedClient;
    } catch (error) {
      cachedClient = null;
    }
  }

  const client = new MongoClient(uri, options);
  await client.connect();
  await client.db(dbName).admin().ping();
  cachedClient = client;
  console.log('✅ MongoDB connected successfully (send-message)');
  return client;
}

function extractUserFromToken(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authHeader.substring(7);
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return {
      userId: decoded.userId,
      ownerId: decoded.ownerId,
      username: decoded.username,
      email: decoded.email
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
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

// Template variable replacement function
function replaceTemplateVariables(
  text: string, 
  visitor: any, 
  event: any, 
  sender: any
): string {
  if (!text) return text;
  
  const variables = {
    // Visitor variables
    '{visitorName}': visitor?.fullName || '[Visitor Name]',
    '{visitorEmail}': visitor?.email || '[Visitor Email]',
    '{visitorPhone}': visitor?.phoneNumber || '[Visitor Phone]',
    '{visitorCompany}': visitor?.company || '[Visitor Company]',
    '{visitorStatus}': visitor?.status || '[Visitor Status]',
    
    // Event variables
    '{eventName}': event?.eventName || '[Event Name]',
    '{eventLocation}': event?.eventLocation || '[Event Location]',
    '{eventDate}': event?.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '[Event Date]',
    '{eventStartDate}': event?.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString() : '[Event Start Date]',
    '{eventEndDate}': event?.eventEndDate ? new Date(event.eventEndDate).toLocaleDateString() : '[Event End Date]',
    '{eventTime}': event?.eventStartDate ? new Date(event.eventStartDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }) : '[Event Time]',
    
    // Sender variables
    '{senderName}': sender?.username || '[Sender Name]',
    '{senderEmail}': sender?.email || '[Sender Email]',
    
    // System variables
    '{currentDate}': new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    '{currentTime}': new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    '{year}': new Date().getFullYear().toString()
  };
  
  let replacedText = text;
  
  // Replace all variables in the text
  Object.entries(variables).forEach(([placeholder, value]) => {
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'gi');
    replacedText = replacedText.replace(regex, value || '');
  });
  
  return replacedText;
}

// Real email sending function using nodemailer
async function sendEmail(to: string, subject: string, message: string, fromEmail: string, senderName?: string, eventName?: string, eventLocation?: string, eventDate?: string) {
  try {
    const transporter = createTransporter();
    
    const eventInfo = eventName ? `
      <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #1976d2; margin: 0 0 8px 0; font-size: 16px;">📅 Event Details</h3>
        <p style="color: #424242; margin: 0; font-size: 14px;"><strong>Event:</strong> ${eventName}</p>
        ${eventLocation ? `<p style="color: #424242; margin: 4px 0 0 0; font-size: 14px;"><strong>Location:</strong> ${eventLocation}</p>` : ''}
        ${eventDate ? `<p style="color: #424242; margin: 4px 0 0 0; font-size: 14px;"><strong>Date:</strong> ${eventDate}</p>` : ''}
      </div>
    ` : '';
    
    const mailOptions = {
      from: `${senderName || 'Visitrack'} <${GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Visitrack</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">${eventName ? `Message from ${eventName}` : 'Event Message'}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            ${eventInfo}
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                Sent via Visitrack Event Management System
              </p>
              <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
                © 2025 Visitrack. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('📧 [Email Service] Email sent successfully:', {
      to,
      subject,
      messageId: result.messageId
    });
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('📧 [Email Service] Failed to send email:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db(dbName);
    
    const userInfo = extractUserFromToken(req.headers.authorization);
    const { eventId, visitorIds, subject, message } = req.body;

    console.log('📧 [Send Message API] Request:', {
      eventId,
      visitorCount: visitorIds?.length,
      userId: userInfo.userId,
      ownerId: userInfo.ownerId
    });

    // Validate required fields
    if (!eventId || !visitorIds || !Array.isArray(visitorIds) || visitorIds.length === 0) {
      return res.status(400).json({ 
        message: 'Event ID and visitor IDs are required' 
      });
    }

    if (!subject || !message) {
      return res.status(400).json({ 
        message: 'Subject and message are required' 
      });
    }

    // Validate event exists and belongs to the user
    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId),
      ownerId: userInfo.ownerId
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get visitors for the specified event and owner
    const visitors = await db.collection('visitors')
      .find({
        _id: { $in: visitorIds.map(id => new ObjectId(id)) },
        eventId: eventId,
        ownerId: userInfo.ownerId
      })
      .toArray();

    if (visitors.length === 0) {
      return res.status(404).json({ message: 'No valid visitors found' });
    }

    console.log(`📧 [Send Message API] Found ${visitors.length} valid visitors for messaging`);

    // Send emails to all visitors
    const emailResults = [];
    const failedEmails = [];
    
    // Enhance subject line with event name if not already included
    const enhancedSubject = subject.toLowerCase().includes(event.eventName.toLowerCase()) 
      ? subject 
      : `${subject} - ${event.eventName}`;

    for (const visitor of visitors) {
      try {
        // Replace template variables in subject and message for each visitor
        const personalizedSubject = replaceTemplateVariables(enhancedSubject, visitor, event, userInfo);
        const personalizedMessage = replaceTemplateVariables(message, visitor, event, userInfo);
        
        const emailResult = await sendEmail(
          visitor.email,
          personalizedSubject,
          personalizedMessage,
          userInfo.email || 'noreply@visitrack.com',
          userInfo.username,
          event.eventName,
          event.eventLocation,
          new Date(event.eventStartDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        );
        
        emailResults.push({
          visitorId: visitor._id,
          email: visitor.email,
          success: true,
          messageId: emailResult.messageId
        });
        
        console.log(`✅ [Send Message API] Email sent to: ${visitor.email}`);
      } catch (emailError) {
        console.error(`❌ [Send Message API] Failed to send email to ${visitor.email}:`, emailError);
        failedEmails.push({
          visitorId: visitor._id,
          email: visitor.email,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    // Store message log in database
    const messageLog = {
      ownerId: userInfo.ownerId,
      senderUserId: userInfo.userId,
      senderEmail: userInfo.email,
      eventId: eventId,
      eventName: event.eventName,
      originalSubject: subject,
      subject: enhancedSubject,
      message: message,
      recipientCount: visitors.length,
      successCount: emailResults.length,
      failedCount: failedEmails.length,
      recipients: visitors.map(v => ({
        visitorId: v._id,
        fullName: v.fullName,
        email: v.email
      })),
      emailResults: emailResults,
      failedEmails: failedEmails,
      sentAt: new Date(),
      createdAt: new Date()
    };

    await db.collection('messageLogs').insertOne(messageLog);

    console.log(`✅ [Send Message API] Message log saved. Success: ${emailResults.length}, Failed: ${failedEmails.length}`);

    // Return response
    const response = {
      message: 'Messages processed successfully',
      summary: {
        totalRecipients: visitors.length,
        successCount: emailResults.length,
        failedCount: failedEmails.length,
        eventName: event.eventName
      }
    };

    if (failedEmails.length > 0) {
      response.message = `Messages sent with ${failedEmails.length} failures`;
      // Include failed emails in response for debugging
      (response as any).failedEmails = failedEmails;
    }

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ [Send Message API] Error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 