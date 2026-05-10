const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FROM_NAME = process.env.FROM_NAME || 'Evento';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || '';
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || FROM_EMAIL;
const EMAIL_DIAGNOSTIC_TO = process.env.EMAIL_DIAGNOSTIC_TO || FROM_EMAIL;

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const createTextFromHtml = (html = '') => html
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const createActionButton = (label, url) => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 8px 0;">
    <tr>
      <td style="border-radius:8px; background:#0369a1;">
        <a href="${escapeHtml(url)}" style="display:inline-block; padding:12px 20px; font-family:Arial, sans-serif; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:8px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>
`;

const createEmailShell = (title, bodyHtml) => {
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${safeTitle}</title></head>
<body style="margin:0; padding:0; background:#f3f6fb; color:#111827;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f6fb;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="42" height="42" align="center" style="width:42px; height:42px; border-radius:10px; background:#0369a1; color:#ffffff; font-family:Arial, sans-serif; font-size:22px; font-weight:800;">E</td>
                  <td style="padding-left:10px; font-family:Arial, sans-serif; font-size:24px; line-height:1; font-weight:800; color:#0f172a;">Evento</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:28px; font-family:Arial, sans-serif; font-size:16px; line-height:1.6; color:#111827;">
      <h1 style="font-size:24px; line-height:1.3; margin:0 0 18px 0; color:#0f172a;">${safeTitle}</h1>
      ${bodyHtml}
      <p style="margin:24px 0 0 0; padding-top:18px; border-top:1px solid #e5e7eb; font-size:13px; color:#6b7280;">Evento keeps your events, tickets, and updates in one place.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const createAbsoluteUrl = (link = '') => {
  if (!link) return '';

  try {
    return new URL(link).toString();
  } catch {
    try {
      return new URL(link, FRONTEND_URL).toString();
    } catch {
      return '';
    }
  }
};

const createOtpHtml = (title, body, otp, eventTitle = '', name = '', expiryMinutes = exports.OTP_EXPIRY_MINUTES) => {
  const safeName = escapeHtml(name || 'there');
  const safeBody = escapeHtml(body).replace(/\n/g, '<br>');
  const safeOtp = escapeHtml(otp || '');
  const safeEventTitle = escapeHtml(eventTitle || '');

  return createEmailShell(title, `
    <p style="margin:0 0 16px 0;">Hello ${safeName},</p>
    <p style="margin:0 0 18px 0;">${safeBody}</p>
    ${safeOtp ? `<p style="margin:0 0 8px 0; font-size:14px; color:#374151;">Verification code:</p>
    <div style="display:inline-block; background:#eef6ff; border:1px solid #bfdbfe; border-radius:10px; padding:12px 18px; font-family:'Courier New', monospace; font-size:30px; line-height:1.2; letter-spacing:6px; font-weight:bold; margin:0 0 20px 0; color:#075985;">${safeOtp}</div>` : ''}
    ${safeEventTitle ? `<p style="margin:0 0 16px 0; font-size:14px; color:#374151;"><strong>Event:</strong> ${safeEventTitle}</p>` : ''}
    <p style="margin:0 0 10px 0; font-size:14px; color:#374151;">This code is valid for ${expiryMinutes} minutes and can only be used once.</p>
  `);
};

const getEmailDiagnostics = () => {
  const issues = [];

  if (!BREVO_API_KEY) issues.push('BREVO_API_KEY is missing');
  if (!FROM_EMAIL) issues.push('FROM_EMAIL is missing');

  return {
    provider: 'brevo',
    configured: issues.length === 0,
    issues,
    apiKeyPresent: Boolean(BREVO_API_KEY),
    fromEmail: FROM_EMAIL || null,
    replyToEmail: REPLY_TO_EMAIL || null,
    diagnosticTo: EMAIL_DIAGNOSTIC_TO || null,
    frontendUrl: FRONTEND_URL
  };
};

const formatBrevoError = async (response) => {
  const errorText = await response.text();

  try {
    const errorJson = JSON.parse(errorText);
    return errorJson.message || errorJson.code || errorText;
  } catch {
    return errorText;
  }
};

const sendEmail = async ({ to, subject, text, html, tags = [] }) => {
  try {
    const diagnostics = getEmailDiagnostics();

    if (!diagnostics.configured) {
      return {
        success: false,
        error: `Brevo email is not configured: ${diagnostics.issues.join(', ')}`
      };
    }

    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }

    const payload = {
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text || createTextFromHtml(html)
    };

    if (REPLY_TO_EMAIL) {
      payload.replyTo = { email: REPLY_TO_EMAIL, name: FROM_NAME };
    }

    if (tags.length > 0) {
      payload.tags = tags;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await formatBrevoError(response);
      console.error('[Email] Brevo API Error:', error);
      return { success: false, status: response.status, error };
    }
    
    const data = await response.json();
    console.log(`[Email] Sent "${subject}" to ${to} via Brevo (${data.messageId})`);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('[Email] Failed to send via Brevo:', error.message);
    return { success: false, error: error.message };
  }
};

const generateSecureOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.OTP_EXPIRY_MINUTES = 10;
exports.OTP_RATE_LIMIT_SECONDS = 45;
exports.generateSecureOTP = generateSecureOTP;
exports.getEmailDiagnostics = getEmailDiagnostics;

exports.sendEmailDiagnostics = async () => {
  const diagnostics = getEmailDiagnostics();

  if (!diagnostics.configured) {
    return {
      success: false,
      error: `Brevo email is not configured: ${diagnostics.issues.join(', ')}`
    };
  }

  const subject = 'Evento email diagnostics';
  const sentAt = new Date().toISOString();
  const html = createEmailShell(subject, `
    <p style="margin:0 0 16px 0;">This is a test email from Evento.</p>
    <p style="margin:0 0 8px 0;"><strong>Provider:</strong> Brevo API</p>
    <p style="margin:0 0 8px 0;"><strong>Sent at:</strong> ${escapeHtml(sentAt)}</p>
    <p style="margin:0 0 8px 0;"><strong>From:</strong> ${escapeHtml(FROM_EMAIL)}</p>
  `);

  return sendEmail({
    to: EMAIL_DIAGNOSTIC_TO,
    subject,
    html,
    tags: ['diagnostic']
  });
};

exports.sendEmailVerificationOTP = async (email, otp, name) => {
  const subject = 'Your Evento verification code';
  const html = createOtpHtml(subject, `Use this verification code to finish creating your account:`, otp, '', name);
  return sendEmail({ to: email, subject, html, tags: ['verification'] });
};

exports.sendLoginOTPEmail = async (email, otp, name) => {
  const subject = 'Your Evento login code';
  const html = createOtpHtml(subject, `Use this login code to access your Evento account:`, otp, '', name);
  return sendEmail({ to: email, subject, html, tags: ['login'] });
};

exports.sendOTPEmail = async (email, otp, name, eventTitle = 'Event Booking') => {
  const subject = 'Your Evento booking code';
  const html = createOtpHtml(subject, `Use this code to verify your booking for "${eventTitle}":`, otp, eventTitle, name);
  return sendEmail({ to: email, subject, html, tags: ['booking-otp'] });
};

exports.sendBookingConfirmationEmail = async (email, name, eventTitle, bookingDetails) => {
  const subject = `Booking confirmed: ${eventTitle}`;
  const amount = Number(bookingDetails.totalPrice || 0).toLocaleString('en-IN');
  const html = createEmailShell(subject, `
    <p style="margin:0 0 16px 0;">Hello ${escapeHtml(name)},</p>
    <p style="margin:0 0 18px 0;">Your booking for <strong>${escapeHtml(eventTitle)}</strong> is confirmed.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; margin:0 0 18px 0;">
      <tr><td style="padding:14px 16px; color:#475569;">Tickets</td><td align="right" style="padding:14px 16px; font-weight:700; color:#0f172a;">${bookingDetails.numberOfTickets}</td></tr>
      <tr><td style="padding:14px 16px; color:#475569; border-top:1px solid #e5e7eb;">Total amount</td><td align="right" style="padding:14px 16px; border-top:1px solid #e5e7eb; font-weight:700; color:#0f172a;">INR ${amount}</td></tr>
      <tr><td style="padding:14px 16px; color:#475569; border-top:1px solid #e5e7eb;">Booking ID</td><td align="right" style="padding:14px 16px; border-top:1px solid #e5e7eb; font-weight:700; color:#0f172a;">${escapeHtml(bookingDetails.bookingId)}</td></tr>
    </table>
  `);
  return sendEmail({ to: email, subject, html, tags: ['booking-confirmation'] });
};

exports.sendPasswordResetEmail = async (email, name, otp, expiryMinutes = 15) => {
  const subject = 'Reset your Evento password';
  const html = createOtpHtml(
    subject,
    'Use this OTP to reset your Evento password:',
    otp,
    '',
    name,
    expiryMinutes
  );

  return sendEmail({ to: email, subject, html, tags: ['password-reset'] });
};

exports.sendImportantNotificationEmail = async (email, name, title, message, link = '') => {
  const subject = `Evento: ${title}`;
  const actionUrl = createAbsoluteUrl(link);
  const html = createEmailShell(subject, `
    <p>Hello ${escapeHtml(name)},</p>
    <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    ${actionUrl ? `<p style="margin:18px 0 0 0;"><a href="${escapeHtml(actionUrl)}" style="color:#2563eb; font-weight:bold;">Open in Evento</a></p>` : ''}
  `);
  return sendEmail({ to: email, subject, html, tags: ['important-notification'] });
};

exports.sendHostMessageEmail = async (email, name, subject, content, eventTitle, hostName) => {
  const emailSubject = `Message from ${hostName}: ${subject}`;
  const html = createEmailShell(emailSubject, `
    <p>Hello ${escapeHtml(name || 'there')},</p>
    ${eventTitle ? `<p><strong>Event:</strong> ${escapeHtml(eventTitle)}</p>` : ''}
    <p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>
  `);
  return sendEmail({ to: email, subject: emailSubject, html, tags: ['host-message'] });
};

exports.sendLoginNotificationEmail = async (email, name, ipAddress = 'Unknown') => {
  return exports.sendImportantNotificationEmail(email, name, 'Successful login', `Your account was logged into. IP: ${ipAddress}`, '/dashboard');
};
