const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const EMAIL_PROVIDER_RAW = process.env.EMAIL_PROVIDER || 'gmail';

/** Gmail app passwords are often pasted with spaces; SMTP expects 16 chars without spaces. */
function normalizeCredentials() {
  const rawUser = (process.env.EMAIL_USER || '').trim();
  let rawPass = (process.env.EMAIL_PASS || '').trim();
  const isEtherealUser = rawUser.endsWith('@ethereal.email');
  const provider = EMAIL_PROVIDER_RAW;
  const useEthereal = provider === 'ethereal' && isEtherealUser;
  if (!useEthereal) {
    rawPass = rawPass.replace(/\s+/g, '');
  }
  return { EMAIL_USER: rawUser, EMAIL_PASS: rawPass, useEthereal };
}

const { EMAIL_USER, EMAIL_PASS, useEthereal } = normalizeCredentials();

let transporter;
let emailEnabled = true;

// Initialize transporter based on provider
function initializeTransporter() {
  try {
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn('========================================');
      console.warn('Email credentials (EMAIL_USER / EMAIL_PASS) not found in .env');
      console.warn('Email sending will be disabled.');
      console.warn('Run "node setup-ethereal.js" for free testing SMTP');
      console.warn('========================================');
      emailEnabled = false;
      return;
    }

    if (EMAIL_PROVIDER_RAW === 'ethereal' && !useEthereal) {
      console.warn('EMAIL_PROVIDER is ethereal but EMAIL_USER is not @ethereal.email — using Gmail SMTP.');
    }

    if (useEthereal) {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        pool: true,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS
        }
      });
      console.log('Email transporter: Ethereal (testing, pooled)');
    } else {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS
        }
      });
      console.log('Email transporter: Gmail (pool, App Password recommended)');
    }

    // Log-only verify — do not toggle emailEnabled off on failure (hosted networks often fail verify while sendMail works).
    transporter.verify((error) => {
      if (error) {
        console.warn('Email transporter verify warning (sends may still work):', error.message);
      } else {
        console.log('Email transporter is ready');
      }
    });
  } catch (error) {
    console.error('Failed to initialize email transporter:', error.message);
    emailEnabled = false;
  }
}

initializeTransporter();

// Generic send with single retry after short delay (helps flaky SMTP connections)
const sendEmail = async (mailOptions) => {
  if (!emailEnabled || !transporter) {
    console.log('Email disabled. Would send to:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    return false;
  }

  const attempt = async () => {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Preview URL:', previewUrl);
      }
      return true;
    } catch (error) {
      console.error('Email send failed:', error.message);
      console.error('To:', mailOptions.to, 'From:', mailOptions.from);
      throw error;
    }
  };

  try {
    return await attempt();
  } catch (error) {
    try {
      await new Promise((r) => setTimeout(r, 400));
      return await attempt();
    } catch (retryErr) {
      console.error('Email retry failed:', retryErr.message);
      return false;
    }
  }
};

// Login notification email
exports.sendLoginNotificationEmail = async (email, name, ipAddress = 'Unknown') => {
  const mailOptions = {
    from: `"Evento" <${EMAIL_USER}>`,
    to: email,
    subject: 'Evento - Successfully Logged In',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Evento</h1>
          <p style="color: white; margin-top: 10px; opacity: 0.9;">Event Booking Platform</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Welcome back, ${name}! 👋</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You have successfully logged into your Evento account. This login notification is for your security.
          </p>
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0;">Login Details:</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p style="color: #666; margin: 5px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If this was not you, please secure your account immediately by changing your password or contact our support team.
          </p>
          <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Go to Dashboard
          </a>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            © 2024 Evento. All rights reserved.<br>
            You received this email because you logged into your Evento account.
          </p>
        </div>
      </div>
    `
  };

  return sendEmail(mailOptions);
};

// Stylish OTP Email (safe to fire-and-forget from controllers)
exports.sendOTPEmail = async (email, otp, name, eventTitle = 'Event Booking') => {
  const mailOptions = {
    from: `"Evento" <${EMAIL_USER}>`,
    to: email,
    subject: '🔐 Your Verification Code - Evento Booking',
    text: `Hello ${name},

Your verification code for booking ${eventTitle} is: ${otp}

This code is valid for 10 minutes and can only be used once.

Evento Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="#667eea" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="#667eea"/>
              </svg>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Evento</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 14px;">Secure Event Booking Platform</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Hello ${name}! 👋</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Your verification code for <strong>${eventTitle}</strong> is ready. Please enter it below to complete your booking.
            </p>
            
            <div style="background: linear-gradient(135deg, #f5f7fa 0%, #e4e7f1 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 24px 0;">
              <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Verification Code</p>
              <div style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 700; color: #667eea; letter-spacing: 8px; margin: 0;">
                ${otp}
              </div>
            </div>
            
            <div style="display: flex; gap: 20px; margin: 24px 0; padding: 20px; background: #f8f9ff; border-radius: 8px;">
              <div style="flex: 1; text-align: center;">
                <div style="color: #999; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Valid For</div>
                <div style="color: #667eea; font-weight: 600; font-size: 14px;">10 Minutes</div>
              </div>
              <div style="width: 1px; background: #ddd;"></div>
              <div style="flex: 1; text-align: center;">
                <div style="color: #999; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Usage</div>
                <div style="color: #667eea; font-weight: 600; font-size: 14px;">Single Use</div>
              </div>
            </div>
            
            <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0;">
              🔒 This code is confidential. Never share it with anyone.<br>
              ⏰ Expires in 10 minutes. Request a new code if expired.
            </p>
          </div>
          
          <div style="background: #f5f7fa; padding: 24px 30px; text-align: center; border-top: 1px solid #eee;">
            <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; margin-bottom: 16px;">
              Go to Dashboard
            </a>
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 Evento. Secure Event Management.<br>
              Need help? Contact <a href="mailto:support@evento.com" style="color: #667eea; text-decoration: none;">support@evento.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return sendEmail(mailOptions);
};

// Booking Confirmation Email
exports.sendBookingConfirmationEmail = async (email, name, eventTitle, bookingDetails) => {
  const mailOptions = {
    from: `"Evento" <${EMAIL_USER}>`,
    to: email,
    subject: `Evento - Booking Confirmed for ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Evento</h1>
          <p style="color: white; margin-top: 10px;">Event Booking Platform</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Booking Confirmed! 🎉</h2>
          <p style="color: #666; font-size: 16px;">Hello ${name},</p>
          <p style="color: #666; font-size: 16px;">Your booking for <strong>${eventTitle}</strong> has been confirmed.</p>
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #667eea; margin-top: 0;">Booking Details:</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Event:</strong> ${eventTitle}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Tickets:</strong> ${bookingDetails.numberOfTickets}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Total Amount:</strong> $${bookingDetails.totalPrice}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Thank you for choosing Evento!</p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Evento. All rights reserved.</p>
        </div>
      </div>
    `
  };

  return sendEmail(mailOptions);
};

// Host Message Email
exports.sendHostMessageEmail = async (recipientEmail, recipientName, subject, content, eventTitle, senderName) => {
  const mailOptions = {
    from: `"Evento" <${EMAIL_USER}>`,
    to: recipientEmail,
    subject: `Evento - Message from ${senderName} regarding ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Evento</h1>
          <p style="color: white; margin-top: 10px;">Event Booking Platform</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Message from Event Host</h2>
          <p style="color: #666; font-size: 16px;">Hello ${recipientName},</p>
          <p style="color: #666; font-size: 16px;">You have received a message from <strong>${senderName}</strong> regarding <strong>${eventTitle}</strong>:</p>
          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
            ${content.split('\n').map((line) => `<p style="color: #333; margin: 5px 0;">${line}</p>`).join('')}
          </div>
          <p style="color: #666; font-size: 14px;">
            You can reply to this message by logging into your Evento dashboard.
          </p>
          <p style="color: #666; font-size: 14px;">
            <a href="${FRONTEND_URL}/dashboard/messages" style="color: #667eea; text-decoration: none; font-weight: bold;">
              Go to Messages
            </a>
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Evento. All rights reserved.</p>
        </div>
      </div>
    `
  };

  return sendEmail(mailOptions);
};
