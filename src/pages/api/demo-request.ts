import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

// Gmail configuration - using same credentials as existing system
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyName, name, email, phone, companySize, requirements } = req.body;

  // Validate required fields
  if (!companyName || !name || !email || !phone || !companySize || !requirements) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const transporter = createTransporter();

    // Email to admin
    const adminMailOptions = {
      from: GMAIL_USER,
      to: 'visitrackoffical@gmail.com', // Admin email
      subject: `🚀 New Demo Request from ${companyName} - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎯 New VisiTrack Demo Request</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #4F46E5;">
              <h2 style="color: #1e293b; margin-top: 0; margin-bottom: 20px; font-size: 20px; display: flex; align-items: center;">
                👤 Contact Information
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 16px; font-weight: 600; color: #374151; background: rgba(79, 70, 229, 0.1); border-radius: 6px 0 0 6px; width: 35%;">🏢 Company:</td>
                  <td style="padding: 12px 16px; color: #1f2937; background: rgba(79, 70, 229, 0.05); border-radius: 0 6px 6px 0; font-weight: 500;">${companyName}</td>
                </tr>
                <tr><td colspan="2" style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; font-weight: 600; color: #374151; background: rgba(79, 70, 229, 0.1); border-radius: 6px 0 0 6px;">👨‍💼 Contact Person:</td>
                  <td style="padding: 12px 16px; color: #1f2937; background: rgba(79, 70, 229, 0.05); border-radius: 0 6px 6px 0; font-weight: 500;">${name}</td>
                </tr>
                <tr><td colspan="2" style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; font-weight: 600; color: #374151; background: rgba(79, 70, 229, 0.1); border-radius: 6px 0 0 6px;">📧 Email:</td>
                  <td style="padding: 12px 16px; background: rgba(79, 70, 229, 0.05); border-radius: 0 6px 6px 0;">
                    <a href="mailto:${email}" style="color: #4F46E5; text-decoration: none; font-weight: 500; padding: 6px 12px; background: rgba(79, 70, 229, 0.1); border-radius: 4px; display: inline-block;">${email}</a>
                  </td>
                </tr>
                <tr><td colspan="2" style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; font-weight: 600; color: #374151; background: rgba(79, 70, 229, 0.1); border-radius: 6px 0 0 6px;">📞 Phone:</td>
                  <td style="padding: 12px 16px; background: rgba(79, 70, 229, 0.05); border-radius: 0 6px 6px 0;">
                    <a href="tel:${phone}" style="color: #4F46E5; text-decoration: none; font-weight: 500; padding: 6px 12px; background: rgba(79, 70, 229, 0.1); border-radius: 4px; display: inline-block;">${phone}</a>
                  </td>
                </tr>
                <tr><td colspan="2" style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; font-weight: 600; color: #374151; background: rgba(79, 70, 229, 0.1); border-radius: 6px 0 0 6px;">🏢 Company Size:</td>
                  <td style="padding: 12px 16px; color: #1f2937; background: rgba(79, 70, 229, 0.05); border-radius: 0 6px 6px 0; font-weight: 500;">
                    <span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">${companySize} employees</span>
                  </td>
                </tr>
              </table>
            </div>

            <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #f59e0b;">
              <h2 style="color: #92400e; margin-top: 0; margin-bottom: 15px; font-size: 20px; display: flex; align-items: center;">
                📋 Detailed Requirements & Needs
              </h2>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #fbbf24;">
                <p style="color: #374151; line-height: 1.8; margin: 0; font-size: 15px; white-space: pre-wrap;">${requirements}</p>
              </div>
            </div>

            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
              <h3 style="margin: 0 0 10px 0; font-size: 18px;">⚡ URGENT ACTION REQUIRED</h3>
              <p style="margin: 0; font-size: 16px; opacity: 0.95;">High-priority lead! Follow up within 24 hours for maximum conversion rate.</p>
            </div>

            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a;">
              <h3 style="color: #166534; margin-top: 0; margin-bottom: 12px;">✅ Next Steps Checklist:</h3>
              <ul style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>📞 Call ${name} at <strong>${phone}</strong> within 24 hours</li>
                <li>📧 Send personalized demo invitation to <strong>${email}</strong></li>
                <li>🗓️ Schedule demo session based on their requirements</li>
                <li>📊 Prepare demo focusing on ${companySize} company size needs</li>
                <li>💼 Customize presentation for ${companyName} use case</li>
                <li>🎯 Add to CRM and start follow-up sequence</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                🤖 Automated by VisiTrack Demo Request System | ${new Date().toISOString()}
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Confirmation email to user  
    const userMailOptions = {
      from: GMAIL_USER,
      to: email,
      subject: `🎉 Thank you ${name}! Your VisiTrack demo request is confirmed`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Demo Request Confirmed!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 18px;">Thank you for choosing VisiTrack</p>
          </div>
          
          <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">Hi <strong>${name}</strong>,</p>
            
            <p style="color: #374151; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">
              🚀 <strong>Excellent choice!</strong> We've received your demo request for <strong>${companyName}</strong> and we're thrilled to show you how VisiTrack can transform your event management experience!
            </p>

            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
              <h2 style="color: #0369a1; margin-top: 0; font-size: 20px; margin-bottom: 20px;">📋 Your Request Summary</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 35%;">🏢 Company:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${companyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">👨‍💼 Contact Person:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">📧 Email:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">📞 Phone:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${phone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">🏢 Company Size:</td>
                    <td style="padding: 8px 0; color: #1f2937;">
                      <span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 600;">${companySize} employees</span>
                    </td>
                  </tr>
                </table>
              </div>
              <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6;"><strong>Your Requirements:</strong><br>${requirements}</p>
              </div>
            </div>

            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b;">
              <h2 style="color: #d97706; margin-top: 0; font-size: 20px; margin-bottom: 15px;">🚀 What Happens Next?</h2>
              <ul style="color: #374151; line-height: 1.8; margin: 0; padding-left: 0; list-style: none;">
                <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                  <span style="background: #f59e0b; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">1</span>
                  <span><strong>Review & Analysis:</strong> Our team will analyze your specific requirements for ${companyName}</span>
                </li>
                <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                  <span style="background: #f59e0b; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">2</span>
                  <span><strong>Personal Contact:</strong> We'll call you at <strong>${phone}</strong> within 24 hours</span>
                </li>
                <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                  <span style="background: #f59e0b; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">3</span>
                  <span><strong>Customized Demo:</strong> Tailored presentation for ${companySize} company size</span>
                </li>
                <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                  <span style="background: #f59e0b; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">4</span>
                  <span><strong>Live Demonstration:</strong> See VisiTrack in action with real-world scenarios</span>
                </li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              <h3 style="margin: 0 0 12px 0; font-size: 20px;">🌟 Get Ready to Transform Your Events!</h3>
              <p style="margin: 0; font-size: 16px; opacity: 0.95;">VisiTrack will revolutionize how ${companyName} manages visitors and events</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://visitrack.com/features" 
                 style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); 
                        color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                        font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                🚀 Explore VisiTrack Features
              </a>
            </div>

            <div style="background: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">📞 Need Immediate Assistance?</h3>
              <p style="color: #6b7280; margin: 0 0 15px 0; line-height: 1.6;">
                Our team is standing by to help you succeed! Don't hesitate to reach out:
              </p>
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div>
                  <p style="margin: 0; color: #374151; font-weight: 600;">📧 Email:</p>
                  <a href="mailto:visitrackoffical@gmail.com" style="color: #4F46E5; text-decoration: none; font-weight: 500;">visitrackoffical@gmail.com</a>
                </div>
                <div>
                  <p style="margin: 0; color: #374151; font-weight: 600;">📞 Phone:</p>
                  <a href="tel:+919727772798" style="color: #4F46E5; text-decoration: none; font-weight: 500;">+91 97277 72798</a>
                </div>
              </div>
            </div>
            
            <p style="color: #374151; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
              We can't wait to show you how VisiTrack will transform ${companyName}'s event management! 🎉
            </p>

            <p style="color: #374151; line-height: 1.6; margin-bottom: 30px;">
              Best regards,<br>
              <strong style="color: #4F46E5; font-size: 18px;">The VisiTrack Team</strong>
            </p>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 5px 0;">
                <strong>VisiTrack</strong> - Transforming Event Management
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.4;">
                A-407, Ganesh Glory 11 Nr.Bsnl Office, SG highway Jagatpur, Road, Gota, Ahmedabad, Gujarat 382470
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions),
    ]);

    res.status(200).json({ 
      success: true, 
      message: 'Demo request sent successfully!' 
    });

  } catch (error) {
    console.error('Error sending demo request email:', error);
    res.status(500).json({ 
      error: 'Failed to send demo request. Please try again.' 
    });
  }
} 