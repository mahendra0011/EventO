const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FROM_NAME = process.env.FROM_NAME || process.env.EMAIL_FROM_NAME || 'Evento';
const SMTP_SERVICE = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE || '';
const SMTP_HOST = process.env.SMTP_HOST || process.env.EMAIL_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || process.env.EMAIL_SECURE || '').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '';
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || process.env.SMTP_TIMEOUT_MS || 10000);

const parseEmailAddress = (value) => {
  const email = String(value || '').trim();
  const match = email.match(/<([^>]+)>/);
  return (match ? match[1] : email).trim();
};

const configuredFromEmail = parseEmailAddress(
  process.env.FROM_EMAIL || process.env.EMAIL_FROM || SMTP_USER || 'noreply@evento.local'
);
const FROM_EMAIL = configuredFromEmail.includes('@') ? configuredFromEmail : SMTP_USER;
const REPLY_TO_EMAIL = parseEmailAddress(process.env.REPLY_TO_EMAIL || process.env.EMAIL_REPLY_TO || FROM_EMAIL);
const FROM_HEADER = `${FROM_NAME} <${FROM_EMAIL}>`;

let cachedTransporter = null;

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getTransportOptions = () => {
  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }

  const timeoutOptions = {
    connectionTimeout: EMAIL_SEND_TIMEOUT_MS,
    greetingTimeout: EMAIL_SEND_TIMEOUT_MS,
    socketTimeout: EMAIL_SEND_TIMEOUT_MS,
    dnsTimeout: Math.min(EMAIL_SEND_TIMEOUT_MS, 5000)
  };

  if (SMTP_HOST) {
    return {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE || SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      ...timeoutOptions
    };
  }

  return {
    service: SMTP_SERVICE || 'gmail',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    ...timeoutOptions
  };
};

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const options = getTransportOptions();
  if (!options) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport(options);
  return cachedTransporter;
};

const createTextFromHtml = (html = '') => html
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const withTimeout = async (promise, timeoutMs, label) => {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }

  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const error = new Error(`${label} timed out after ${timeoutMs}ms`);
          error.code = 'EMAIL_TIMEOUT';
          reject(error);
        }, timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const createEmailShell = (title, bodyHtml) => {
  const safeTitle = escapeHtml(title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; color:#111827;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;">
          <tr>
            <td style="font-family:Arial, sans-serif; font-size:16px; line-height:1.6; color:#111827;">
              <h1 style="font-size:22px; line-height:1.3; margin:0 0 18px 0; color:#111827;">${safeTitle}</h1>
              ${bodyHtml}
              <p style="margin:24px 0 0 0; font-size:13px; color:#6b7280;">Evento</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const createOtpHtml = (title, body, otp, eventTitle = '', name = '') => {
  const safeName = escapeHtml(name || 'there');
  const safeBody = escapeHtml(body).replace(/\n/g, '<br>');
  const safeOtp = escapeHtml(otp || '');
  const safeEventTitle = escapeHtml(eventTitle || '');

  return createEmailShell(title, `
    <p style="margin:0 0 16px 0;">Hello ${safeName},</p>
    <p style="margin:0 0 18px 0;">${safeBody}</p>
    ${safeOtp ? `
    <p style="margin:0 0 8px 0; font-size:14px; color:#374151;">Verification code:</p>
    <p style="font-family:'Courier New', monospace; font-size:30px; line-height:1.2; letter-spacing:6px; font-weight:bold; margin:0 0 20px 0; color:#111827;">${safeOtp}</p>
    ` : ''}
    ${safeEventTitle ? `<p style="margin:0 0 16px 0; font-size:14px; color:#374151;"><strong>Event:</strong> ${safeEventTitle}</p>` : ''}
    <p style="margin:0 0 10px 0; font-size:14px; color:#374151;">This code is valid for ${OTP_EXPIRY_MINUTES} minutes and can only be used once.</p>
    <p style="margin:0; font-size:14px; color:#374151;">If you did not request this code, you can ignore this email.</p>
  `);
};

const sendEmail = async ({ to, subject, text, html, replyTo = REPLY_TO_EMAIL }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[Email] SMTP credentials are not configured');
    return { success: false, message: 'Email skipped (SMTP not configured)' };
  }

  try {
    const sendPromise = transporter.sendMail({
      from: FROM_HEADER,
      to,
      replyTo,
      subject,
      text: text || createTextFromHtml(html),
      html,
      headers: {
        'X-Auto-Response-Suppress': 'OOF, AutoReply, NDR',
        'X-Mailer': 'Evento Nodemailer'
      }
    });
    sendPromise.catch(() => {});

    const info = await withTimeout(sendPromise, EMAIL_SEND_TIMEOUT_MS, 'Email send');

    console.log(`[Email] Sent "${subject}" to ${to} (${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };
  } catch (error) {
    if (error.code === 'EMAIL_TIMEOUT' && cachedTransporter) {
      cachedTransporter.close();
      cachedTransporter = null;
    }
    console.error('[Email] Nodemailer failed:', error.message);
    return { success: false, error: error.message };
  }
};

const generateSecureOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const OTP_EXPIRY_MINUTES = 10;
const OTP_RATE_LIMIT_SECONDS = 60;

exports.sendEmailVerificationOTP = async (email, otp, name) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n========== EMAIL VERIFICATION OTP ==========`);
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`============================================\n`);
  }

  const subject = 'Your Evento verification code';
  const plainText = `Hello ${name || 'there'},

Use this verification code to finish creating your account:

${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes.

If you did not create an Evento account, you can ignore this email.

Evento
${FRONTEND_URL}`;

  const html = createOtpHtml(
    subject,
    `Use this verification code to finish creating your account:

${otp}`,
    otp,
    '',
    name
  );

  return sendEmail({ to: email, subject, text: plainText, html });
};

exports.sendLoginOTPEmail = async (email, otp, name) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n========== LOGIN OTP ==========`);
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`===============================\n`);
  }

  const subject = 'Your Evento login code';
  const plainText = `Hello ${name || 'there'},

Use this login code to access your Evento account:

${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes.

If you did not try to log in, you can ignore this email.

Evento`;

  const html = createOtpHtml(
    subject,
    `Use this login code to access your Evento account:

${otp}`,
    otp,
    '',
    name
  );

  return sendEmail({ to: email, subject, text: plainText, html });
};

exports.sendOTPEmail = async (email, otp, name, eventTitle = 'Event Booking') => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n========== BOOKING OTP ==========`);
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`Event: ${eventTitle}`);
    console.log(`=================================\n`);
  }

  const subject = 'Your Evento booking code';
  const plainText = `Hello ${name || 'there'},

Use this code to verify your booking for ${eventTitle}:

${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes and can only be used once.

If you did not book this ticket, you can ignore this email.

Evento`;

  const html = createOtpHtml(
    subject,
    `Use this code to verify your booking for "${eventTitle}":

${otp}`,
    otp,
    eventTitle,
    name
  );

  return sendEmail({ to: email, subject, text: plainText, html });
};

exports.sendBookingConfirmationEmail = async (email, name, eventTitle, bookingDetails) => {
  const subject = `Booking confirmed: ${eventTitle}`;
  const ticketLabel = bookingDetails.numberOfTickets === 1 ? 'ticket' : 'tickets';
  const amount = Number(bookingDetails.totalPrice || 0).toLocaleString('en-IN');
  const plainText = `Hello ${name || 'there'},

Your booking for ${eventTitle} is confirmed.

Tickets: ${bookingDetails.numberOfTickets} ${ticketLabel}
Total amount: INR ${amount}
Booking ID: ${bookingDetails.bookingId}

You can view your ticket from your Evento dashboard.

Evento
${FRONTEND_URL}`;

  const html = createEmailShell(subject, `
    <p style="margin:0 0 16px 0;">Hello ${escapeHtml(name || 'there')},</p>
    <p style="margin:0 0 16px 0;">Your booking for <strong>${escapeHtml(eventTitle)}</strong> is confirmed.</p>
    <p style="margin:0 0 8px 0;"><strong>Tickets:</strong> ${escapeHtml(bookingDetails.numberOfTickets)} ${ticketLabel}</p>
    <p style="margin:0 0 8px 0;"><strong>Total amount:</strong> INR ${escapeHtml(amount)}</p>
    <p style="margin:0 0 16px 0;"><strong>Booking ID:</strong> ${escapeHtml(bookingDetails.bookingId)}</p>
    <p style="margin:0;">You can view your ticket from your Evento dashboard.</p>
  `);

  return sendEmail({ to: email, subject, text: plainText, html });
};

exports.sendImportantNotificationEmail = async (email, name, title, message, link = '') => {
  const subject = `Evento: ${title}`;
  const actionUrl = link && /^https?:\/\//i.test(link) ? link : `${FRONTEND_URL}${link || ''}`;
  const plainText = `Hello ${name || 'there'},

${message}

${link ? `Open Evento: ${actionUrl}` : ''}

Evento`;

  const html = createEmailShell(subject, `
    <p style="margin:0 0 16px 0;">Hello ${escapeHtml(name || 'there')},</p>
    <p style="margin:0 0 16px 0;">${escapeHtml(message)}</p>
    ${link ? `<p style="margin:0;"><a href="${escapeHtml(actionUrl)}" style="color:#2563eb;">Open Evento</a></p>` : ''}
  `);

  return sendEmail({ to: email, subject, text: plainText, html });
};

exports.sendHostMessageEmail = async (email, name, subject, content, eventTitle, hostName) => {
  const emailSubject = `Message from ${hostName || 'your event host'}: ${subject}`;
  const plainText = `Hello ${name || 'there'},

${hostName || 'Your event host'} sent a message about ${eventTitle}:

${subject}

${content}

Open Evento to view your messages:
${FRONTEND_URL}/dashboard/messages

Evento`;

  const html = createEmailShell(emailSubject, `
    <p style="margin:0 0 16px 0;">Hello ${escapeHtml(name || 'there')},</p>
    <p style="margin:0 0 16px 0;">${escapeHtml(hostName || 'Your event host')} sent a message about <strong>${escapeHtml(eventTitle)}</strong>.</p>
    <p style="margin:0 0 8px 0;"><strong>${escapeHtml(subject)}</strong></p>
    <p style="margin:0 0 16px 0;">${escapeHtml(content)}</p>
    <p style="margin:0;"><a href="${FRONTEND_URL}/dashboard/messages" style="color:#2563eb;">Open messages</a></p>
  `);

  return sendEmail({ to: email, subject: emailSubject, text: plainText, html });
};

exports.sendLoginNotificationEmail = async (email, name, ipAddress = 'Unknown') => {
  return exports.sendImportantNotificationEmail(
    email,
    name,
    'Successful login',
    `Your Evento account was logged into. IP address: ${ipAddress}`,
    '/dashboard'
  );
};

exports.generateSecureOTP = generateSecureOTP;
exports.OTP_EXPIRY_MINUTES = OTP_EXPIRY_MINUTES;
exports.OTP_RATE_LIMIT_SECONDS = OTP_RATE_LIMIT_SECONDS;
exports._sendEmail = sendEmail;
