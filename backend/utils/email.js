const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SENDGRID_API_KEY = process.env.MAILGUN_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@evento.com';
const FROM_NAME = process.env.FROM_NAME || 'Evento';
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || 'support@evento.com';

const sendEmail = async (to, subject, text, html = null) => {
  if (!SENDGRID_API_KEY) {
    console.warn('[Email] No API key configured (MAILGUN_API_KEY env var missing)');
    return { success: false, message: 'Email skipped (no API key)' };
  }

  try {
    const data = {
      personalizations: [
        {
          to: [{ email: to }]
        }
      ],
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      reply_to: {
        email: REPLY_TO_EMAIL
      },
      subject: subject,
      mail_settings: {
        sandbox_mode: { enable: false },
        bypass_list_management: { enable: true }
      },
      headers: {
        'List-Unsubscribe': `<mailto:${REPLY_TO_EMAIL}?subject=unsubscribe>`,
        'X-Authenticated-User': to
      }
    };

    if (html) {
      data.content = [{ type: 'text/html', value: html }];
    } else {
      data.content = [{ type: 'text/plain', value: text }];
    }

    console.log(`[Email] Sending to ${to} | Subject: ${subject}`);
    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', data, {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[Email] ✓ Successfully sent to ${to}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[SendGrid] Failed to send email:', errorDetails);
    
    // Log OTP to console as fallback in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV FALLBACK] OTP for ${to}: Check backend logs for OTP value`);
    }
    
    return { success: false, error: errorDetails };
  }
};

    if (html) {
      data.content = [{ type: 'text/html', value: html }];
    } else {
      data.content = [{ type: 'text/plain', value: text }];
    }

    console.log(`[Email] Sending to ${to} | Subject: ${subject}`);
    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', data, {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[Email] ✓ Sent successfully to ${to}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error('[SendGrid] Email send error:', errorMsg);
    return { success: false, error: errorMsg };
  }
};

    if (html) {
      data.content = [{ type: 'text/html', value: html }];
    } else {
      data.content = [{ type: 'text/plain', value: text }];
    }

    console.log(`[Email] Sending to ${to} with subject: ${subject}`);
    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', data, {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[Email] Sent successfully to ${to}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[SendGrid] Email send error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

const generateSecureOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const OTP_EXPIRY_MINUTES = 10;
const OTP_RATE_LIMIT_SECONDS = 60;

exports.sendOTPEmail = async (email, otp, name, eventTitle = 'Event Booking') => {
  // Log OTP in development for testing
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n========== 📧 BOOKING OTP ==========`);
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`Event: ${eventTitle}`);
    console.log(`===================================\n`);
  }

  const subject = 'Your Event Booking Verification Code';
  const text = `Hello ${name},

Your verification code for booking ${eventTitle} is: ${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes and can only be used once.

Please do not share this code with anyone.

Evento Team`;

  return sendEmail(email, subject, text);
};

exports.sendBookingConfirmationEmail = async (email, name, eventTitle, bookingDetails) => {
  const subject = `Evento - Booking Confirmed for ${eventTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #667eea; padding: 30px; text-align: center;">
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
  `;

  return sendEmail(email, subject, '', html);
};

exports.sendLoginNotificationEmail = async (email, name, ipAddress = 'Unknown') => {
  const subject = 'Evento - Successfully Logged In';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #667eea; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Evento</h1>
        <p style="color: white; margin-top: 10px; opacity: 0.9;">Event Booking Platform</p>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333; margin-top: 0;">Welcome back, ${name}! 👋</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          You have successfully logged into your Evento account.
        </p>
        <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
          <h3 style="color: #667eea; margin-top: 0;">Login Details:</h3>
          <p style="color: #666; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="color: #666; margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="color: #666; margin: 5px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          If this was not you, please secure your account immediately.
        </p>
        <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          Go to Dashboard
        </a>
      </div>
      <div style="background: #333; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          © 2024 Evento. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail(email, subject, '', html);
};

exports.sendLoginOTPEmail = async (email, otp, name) => {
  // Log OTP in development for testing
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n========== 🔐 LOGIN OTP ==========`);
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`=================================\n`);
  }

  const subject = 'Your Login Verification Code';
  const text = `Hello ${name},

Your login verification code is: ${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes.

Please do not share this code with anyone.

Evento Team`;

  return sendEmail(email, subject, text);
};

exports.sendEmailVerificationOTP = async (email, otp, name) => {
  // Log OTP in development for testing
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n========== ✅ EMAIL VERIFICATION OTP ==========`);
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`===============================================\n`);
  }

  const subject = 'Verify Your Email - Evento';
  const text = `Hello ${name},

Welcome to Evento! Please verify your email address to complete your registration.

Your verification code is: ${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes.

Please do not share this code with anyone.

Evento Team`;

  return sendEmail(email, subject, text);
};

exports.generateSecureOTP = generateSecureOTP;
exports.OTP_EXPIRY_MINUTES = OTP_EXPIRY_MINUTES;
exports.OTP_RATE_LIMIT_SECONDS = OTP_RATE_LIMIT_SECONDS;