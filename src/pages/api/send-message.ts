import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { connectToDatabase } from '../../lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Gmail configuration
const GMAIL_USER = process.env.GMAIL_USER || 'visitrackoffical@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'ojadmobcwskreljt';

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

// Send email function
async function sendEmail(to: string, subject: string, message: string, visitorName?: string, eventName?: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: GMAIL_USER,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Visitrack</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Message from Event Organizer</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            ${visitorName ? `<h2 style="color: #333; margin-bottom: 20px;">Hello ${visitorName}!</h2>` : ''}
            ${eventName ? `<p style="color: #666; margin-bottom: 20px; font-size: 16px;"><strong>Event:</strong> ${eventName}</p>` : ''}
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="white-space: pre-wrap; color: #333; line-height: 1.6;">${message}</div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                This message was sent through Visitrack Event Management System.
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
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { visitorIds, templateId, customMessage, subject, message, eventId } = req.body;

    if (!visitorIds || !Array.isArray(visitorIds) || visitorIds.length === 0) {
      return res.status(400).json({ message: 'Visitor IDs are required' });
    }

    const { db } = await connectToDatabase();

    let messageContent = customMessage || message;
    let messageSubject = subject;

    // If templateId is provided, get the template
    if (templateId && !customMessage && !message) {
      const template = await db.collection('messageTemplates').findOne({
        _id: new ObjectId(templateId),
        ownerId: decoded.ownerId || decoded.userId
      });

      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      messageContent = template.content || template.message;
      messageSubject = template.subject;
    }

    if (!messageContent) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Get visitors
    const visitors = await db.collection('visitors').find({
      _id: { $in: visitorIds.map(id => new ObjectId(id)) },
      ownerId: decoded.ownerId || decoded.userId
    }).toArray();

    if (visitors.length === 0) {
      return res.status(404).json({ message: 'No visitors found' });
    }

    // Get event details for template variables
    let eventDetails = null;
    if (eventId) {
      try {
        eventDetails = await db.collection('events').findOne({
          _id: new ObjectId(eventId),
          ownerId: decoded.ownerId || decoded.userId
        });
      } catch (error) {
        console.error('Error fetching event details:', error);
      }
    }

    // Send actual emails and track results
    const emailResults = [];
    const sentMessages = [];

    for (const visitor of visitors) {
      try {
        const visitorEmail = visitor.email;
        if (!visitorEmail) {
          console.warn(`Visitor ${visitor._id} has no email address, skipping...`);
          continue;
        }

        // Replace template variables in message content
        let personalizedMessage = messageContent;
        let personalizedSubject = messageSubject || 'Message from Event Organizer';

        // Replace visitor variables
        personalizedMessage = personalizedMessage.replace(/{visitorName}/g, visitor.fullName || visitor.name || 'Guest');
        personalizedMessage = personalizedMessage.replace(/{visitorEmail}/g, visitor.email || '');
        personalizedMessage = personalizedMessage.replace(/{visitorPhone}/g, visitor.phone || visitor.phoneNumber || '');
        personalizedMessage = personalizedMessage.replace(/{visitorCompany}/g, visitor.company || '');
        personalizedMessage = personalizedMessage.replace(/{visitorStatus}/g, visitor.status || 'Registered');

        personalizedSubject = personalizedSubject.replace(/{visitorName}/g, visitor.fullName || visitor.name || 'Guest');

        // Replace event variables if event details are available
        if (eventDetails) {
          personalizedMessage = personalizedMessage.replace(/{eventName}/g, eventDetails.eventName || '');
          personalizedMessage = personalizedMessage.replace(/{eventLocation}/g, eventDetails.eventLocation || '');
          personalizedMessage = personalizedMessage.replace(/{eventStartDate}/g, eventDetails.eventStartDate || '');
          personalizedMessage = personalizedMessage.replace(/{eventEndDate}/g, eventDetails.eventEndDate || '');
          personalizedMessage = personalizedMessage.replace(/{eventTime}/g, eventDetails.eventStartTime || '');

          personalizedSubject = personalizedSubject.replace(/{eventName}/g, eventDetails.eventName || '');
        }

        // Replace system variables
        const currentDate = new Date();
        personalizedMessage = personalizedMessage.replace(/{currentDate}/g, currentDate.toLocaleDateString());
        personalizedMessage = personalizedMessage.replace(/{currentTime}/g, currentDate.toLocaleTimeString());
        personalizedMessage = personalizedMessage.replace(/{year}/g, currentDate.getFullYear().toString());

        // Send email
        const emailSent = await sendEmail(
          visitorEmail,
          personalizedSubject,
          personalizedMessage,
          visitor.fullName || visitor.name,
          eventDetails?.eventName
        );

        const messageRecord = {
          to: visitorEmail,
          subject: personalizedSubject,
          message: personalizedMessage,
          visitorId: visitor._id,
          visitorName: visitor.fullName || visitor.name,
          eventId: eventId,
          sentAt: new Date(),
          status: emailSent ? 'sent' : 'failed',
          ownerId: decoded.ownerId || decoded.userId
        };

        sentMessages.push(messageRecord);
        emailResults.push({
          visitorId: visitor._id,
          visitorName: visitor.fullName || visitor.name,
          email: visitorEmail,
          success: emailSent
        });

        console.log(`📧 Email ${emailSent ? 'sent' : 'failed'} to ${visitorEmail} (${visitor.fullName || visitor.name})`);

      } catch (error: any) {
        console.error(`Error sending email to visitor ${visitor._id}:`, error);
        emailResults.push({
          visitorId: visitor._id,
          visitorName: visitor.fullName || visitor.name,
          email: visitor.email,
          success: false,
          error: error?.message || 'Unknown error'
        });
      }
    }

    // Store sent messages in database for tracking
    if (sentMessages.length > 0) {
      await db.collection('sentMessages').insertMany(sentMessages);
    }

    const successCount = emailResults.filter(result => result.success).length;
    const failureCount = emailResults.filter(result => !result.success).length;

    res.status(200).json({
      message: `Messages processed: ${successCount} sent, ${failureCount} failed`,
      sentCount: successCount,
      failureCount: failureCount,
      totalCount: emailResults.length,
      results: emailResults,
      recipients: visitors.map((v: any) => ({ 
        id: v._id, 
        name: v.name || v.fullName, 
        email: v.email 
      }))
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 