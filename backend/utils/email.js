const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FROM_NAME = process.env.FROM_NAME || 'Evento';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || '';
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || FROM_EMAIL;
const EMAIL_DIAGNOSTIC_TO = process.env.EMAIL_DIAGNOSTIC_TO || FROM_EMAIL;
const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL || '';
const BRAND_PRIMARY = '#f45a2c';
const BRAND_PRIMARY_DARK = '#bd2f15';
const BRAND_SECONDARY = '#f43f67';
const BRAND_CREAM = '#fff7f2';
const BRAND_CREAM_DEEP = '#ffe2d5';
const BRAND_COCOA = '#3a271d';
const BRAND_COCOA_MUTED = '#976f59';

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
      <td style="border-radius:10px; background:${BRAND_PRIMARY}; background:linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_SECONDARY} 100%);">
        <a href="${escapeHtml(url)}" style="display:inline-block; padding:13px 22px; font-family:Arial, sans-serif; font-size:14px; font-weight:800; color:#ffffff; text-decoration:none; border-radius:10px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>
`;

const createLogoMark = () => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td width="44" height="44" align="center" valign="middle" style="width:44px; height:44px; border-radius:12px; background:${BRAND_PRIMARY}; background:linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_SECONDARY} 100%); box-shadow:0 10px 24px rgba(244,90,44,0.22);">
        <img src="${escapeHtml(EMAIL_LOGO_URL || createAbsoluteUrl('/favicon.svg'))}" width="44" height="44" alt="Evento logo" style="display:block; width:44px; height:44px; border:0; border-radius:12px;">
      </td>
      <td style="padding-left:12px; font-family:Arial, sans-serif;">
        <div style="font-size:24px; line-height:1; font-weight:900; letter-spacing:0.5px; text-transform:uppercase; color:${BRAND_COCOA};">Evento</div>
        <div style="padding-top:5px; font-size:11px; line-height:1; font-weight:800; letter-spacing:1.3px; text-transform:uppercase; color:${BRAND_COCOA_MUTED};">Events made easy</div>
      </td>
    </tr>
  </table>
`;

const createEmailShell = (title, bodyHtml) => {
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${safeTitle}</title></head>
<body style="margin:0; padding:0; background:${BRAND_CREAM}; color:${BRAND_COCOA};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BRAND_CREAM};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">
          <tr>
            <td style="padding:0 0 16px 0;">
              ${createLogoMark()}
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff; border:1px solid ${BRAND_CREAM_DEEP}; border-radius:14px; padding:30px; font-family:Arial, sans-serif; font-size:16px; line-height:1.6; color:${BRAND_COCOA}; box-shadow:0 20px 45px rgba(58,39,29,0.08);">
      <h1 style="font-size:24px; line-height:1.3; margin:0 0 18px 0; color:${BRAND_COCOA};">${safeTitle}</h1>
      ${bodyHtml}
      <p style="margin:24px 0 0 0; padding-top:18px; border-top:1px solid ${BRAND_CREAM_DEEP}; font-size:13px; color:${BRAND_COCOA_MUTED};">Evento keeps your events, tickets, and updates in one place.</p>
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
    ${safeOtp ? `<p style="margin:0 0 8px 0; font-size:14px; color:${BRAND_COCOA_MUTED};">Verification code:</p>
    <div style="display:inline-block; background:${BRAND_CREAM}; border:1px solid ${BRAND_CREAM_DEEP}; border-radius:12px; padding:13px 18px; font-family:'Courier New', monospace; font-size:30px; line-height:1.2; letter-spacing:6px; font-weight:bold; margin:0 0 20px 0; color:${BRAND_PRIMARY_DARK}; box-shadow:0 10px 24px rgba(244,90,44,0.12);">${safeOtp}</div>` : ''}
    ${safeEventTitle ? `<p style="margin:0 0 16px 0; font-size:14px; color:${BRAND_COCOA_MUTED};"><strong>Event:</strong> ${safeEventTitle}</p>` : ''}
    <p style="margin:0 0 10px 0; font-size:14px; color:${BRAND_COCOA_MUTED};">This code is valid for ${expiryMinutes} minutes and can only be used once.</p>
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
    frontendUrl: FRONTEND_URL,
    logoUrl: EMAIL_LOGO_URL || createAbsoluteUrl('/favicon.svg')
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
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BRAND_CREAM}; border:1px solid ${BRAND_CREAM_DEEP}; border-radius:12px; margin:0 0 18px 0;">
      <tr><td style="padding:14px 16px; color:${BRAND_COCOA_MUTED};">Tickets</td><td align="right" style="padding:14px 16px; font-weight:800; color:${BRAND_COCOA};">${bookingDetails.numberOfTickets}</td></tr>
      <tr><td style="padding:14px 16px; color:${BRAND_COCOA_MUTED}; border-top:1px solid ${BRAND_CREAM_DEEP};">Total amount</td><td align="right" style="padding:14px 16px; border-top:1px solid ${BRAND_CREAM_DEEP}; font-weight:800; color:${BRAND_PRIMARY_DARK};">INR ${amount}</td></tr>
      <tr><td style="padding:14px 16px; color:${BRAND_COCOA_MUTED}; border-top:1px solid ${BRAND_CREAM_DEEP};">Booking ID</td><td align="right" style="padding:14px 16px; border-top:1px solid ${BRAND_CREAM_DEEP}; font-weight:800; color:${BRAND_COCOA};">${escapeHtml(bookingDetails.bookingId)}</td></tr>
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
    ${actionUrl ? createActionButton('Open in Evento', actionUrl) : ''}
  `);
  return sendEmail({ to: email, subject, html, tags: ['important-notification'] });
};

exports.sendBroadcastEmail = async (email, name, broadcastSubject, content, eventTitle, hostName = '') => {
  const subject = `Evento broadcast: ${broadcastSubject}`;
  const actionUrl = createAbsoluteUrl('/dashboard?tab=broadcasts');
  const html = createEmailShell(subject, `
    <p>Hello ${escapeHtml(name || 'there')},</p>
    <p style="margin:0 0 12px 0;"><strong>Event:</strong> ${escapeHtml(eventTitle || 'Event update')}</p>
    ${hostName ? `<p style="margin:0 0 12px 0;"><strong>From:</strong> ${escapeHtml(hostName)}</p>` : ''}
    <div style="margin:18px 0; padding:16px; border-left:4px solid ${BRAND_PRIMARY}; background:${BRAND_CREAM}; border-radius:10px;">
      <p style="margin:0 0 8px 0; font-weight:800; color:${BRAND_COCOA};">${escapeHtml(broadcastSubject)}</p>
      <p style="margin:0;">${escapeHtml(content).replace(/\n/g, '<br>')}</p>
    </div>
    ${actionUrl ? createActionButton('Open broadcast center', actionUrl) : ''}
  `);

  return sendEmail({ to: email, subject, html, tags: ['broadcast'] });
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
