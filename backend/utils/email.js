const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sandbox808f4534764043d6972145653dd80fbd.mailgun.org';
const MAILGUN_BASE_URL = process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net';
const AUTHORIZED_RECIPIENTS = (process.env.AUTHORIZED_RECIPIENTS || 'sourceforget32@gmail.com').split(',').map(e => e.trim());

const mailgunAuth = {
  username: 'api',
  password: MAILGUN_API_KEY
};

const isAuthorizedRecipient = (email) => {
  return AUTHORIZED_RECIPIENTS.includes(email.toLowerCase());
};

const sendEmail = async (to, subject, text, html = null) => {
  if (!isAuthorizedRecipient(to)) {
    console.warn(`[Mailgun] Email to ${to} not in authorized recipients list`);
    console.log(`[Mailgun] Would send: Subject="${subject}", Text="${text.substring(0, 100)}..."`);
    return { success: true, message: 'Email logged (not authorized recipient)' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('from', `Evento <noreply@${MAILGUN_DOMAIN}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    if (html) {
      formData.append('html', html);
    } else {
      formData.append('text', text);
    }

    const response = await axios.post(`${MAILGUN_BASE_URL}/v3/${MAILGUN_DOMAIN}/messages`, formData, {
      auth: mailgunAuth
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Mailgun] Email send error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

const generateSecureOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const OTP_EXPIRY_MINUTES = 10;
const OTP_RATE_LIMIT_SECONDS = 60;

exports.sendOTPEmail = async (email, otp, name, eventTitle = 'Event Booking') => {
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
  const subject = 'Your Login Verification Code';
  const text = `Hello ${name},

Your login verification code is: ${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes.

Please do not share this code with anyone.

Evento Team`;

  return sendEmail(email, subject, text);
};

exports.generateSecureOTP = generateSecureOTP;
exports.OTP_EXPIRY_MINUTES = OTP_EXPIRY_MINUTES;
exports.OTP_RATE_LIMIT_SECONDS = OTP_RATE_LIMIT_SECONDS;