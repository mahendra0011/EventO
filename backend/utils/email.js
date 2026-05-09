const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.MAILGUN_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@evento.com';
const FROM_NAME = process.env.FROM_NAME || 'Evento';
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || FROM_EMAIL;

// Generate a unique Message-ID for better deliverability
const generateMessageId = (email) => {
  const domain = FROM_EMAIL.split('@')[1] || 'evento.com';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `<${timestamp}.${random}@${domain}>`;
};

const createHtmlTemplate = (title, body, otp, eventTitle = '', name = '') => {
  // Clean event title for display
  const displayEvent = eventTitle || 'Evento';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    
    /* Prevent auto-linking phone numbers in iOS */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    
    /* Desktop-specific styles */
    @media screen and (min-width: 600px) {
      .container { max-width: 600px !important; margin: 0 auto !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #f7f8fa;">
  <center style="width: 100%; background-color: #f7f8fa;">
    
    <!-- Preheader text (hidden) -->
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
      ${title}
    </div>
    
    <!-- Main container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7f8fa;">
      <tr>
        <td align="center" style="padding: 20px 0;">
          
          <!-- Email wrapper -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                  Evento
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-family: Arial, sans-serif; font-size: 14px;">
                  Event Booking Platform
                </p>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 40px 30px 40px; font-family: Arial, sans-serif;">
                
                <!-- Greeting -->
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Hello ${name || 'there'},
                </p>
                
                <!-- Main message -->
                <div style="background-color: #f8fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
                    ${body.replace(/\n/g, '<br>')}
                  </p>
                </div>
                
                <!-- OTP Display -->
                ${otp ? `
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                  <tr>
                    <td align="center">
                      <div style="background-color: #f0f4ff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px 30px; display: inline-block;">
                        <p style="color: #667eea; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Your Verification Code</p>
                        <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #333333; letter-spacing: 8px; text-align: center; min-width: 200px;">
                          ${otp}
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
                ` : ''}
                
                <!-- Event details if provided -->
                ${eventTitle ? `
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                  <tr>
                    <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px;">
                      <p style="color: #667eea; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Event</p>
                      <p style="color: #333333; font-size: 15px; font-weight: 500; margin: 0;">${eventTitle}</p>
                    </td>
                  </tr>
                </table>
                ` : ''}
                
                <!-- Security notice -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0 0 0;">
                  <tr>
                    <td style="padding: 15px; background-color: #fff9e6; border-radius: 6px; border: 1px solid #ffd666;">
                      <p style="color: #856404; font-size: 13px; line-height: 1.5; margin: 0; display: flex; align-items: center; gap: 8px;">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                        </svg>
                        <strong>Security Notice:</strong> Never share this code with anyone. Evento staff will never ask for it.
                      </p>
                    </td>
                  </tr>
                </table>
                
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; font-size: 13px; line-height: 1.5; margin: 0 0 10px 0;">
                  This code is valid for ${OTP_EXPIRY_MINUTES} minutes and can only be used once.
                </p>
                <p style="color: #718096; font-size: 12px; line-height: 1.5; margin: 0;">
                  If you didn't request this code, please ignore this email or contact our support team.
                </p>
                <p style="color: #a0aec0; font-size: 11px; line-height: 1.5; margin: 15px 0 0 0;">
                  © ${new Date().getFullYear()} Evento. All rights reserved.<br>
                  Event Booking Platform
                </p>
              </td>
            </tr>
            
          </table>
          <!-- End email wrapper -->
          
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
};

const sendEmail = async (to, subject, text, html = null) => {
  if (!SENDGRID_API_KEY) {
    console.warn('[Email] No SendGrid API key configured (SENDGRID_API_KEY env var missing)');
    return { success: false, message: 'Email skipped (no API key)' };
  }

  try {
    // Generate HTML if not provided using our template
    const emailHtml = html || createHtmlTemplate(subject, text);
    
    // Generate unique message ID for better deliverability
    const messageId = generateMessageId(to);
    
    // Extract OTP from text if present (for logging)
    const otpMatch = text.match(/\b\d{6}\b/);
    const otp = otpMatch ? otpMatch[0] : null;

    // Build SendGrid payload with proper headers for deliverability
    const emailData = {
      personalizations: [
        {
          to: [{ email: to }],
          dynamic_template_data: {
            subject: subject,
            otp: otp,
            recipient_email: to
          }
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
      // Important headers for Gmail/Outlook deliverability
      headers: {
        'List-Unsubscribe': `<mailto:${REPLY_TO_EMAIL}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'OOF, AutoReply, NDR',
        'Feedback-ID': `evento-${new Date().getFullYear()}`,
        'X-Report-Abuse': REPLY_TO_EMAIL,
        'X-Complaints-To': REPLY_TO_EMAIL,
        'X-Message-Source': 'Evento Platform',
        'X-Mailer': 'Evento Mailer (SendGrid API)'
      },
      // Custom args for tracking
      custom_args: {
        message_id: messageId,
        campaign: 'otp-verification',
        sent_at: new Date().toISOString()
      },
      // Send both plain text and HTML
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: emailHtml }
      ]
    };

    console.log(`[Email] 📧 Sending to ${to}`);
    console.log(`[Email]    Subject: ${subject}`);
    console.log(`[Email]    OTP Code: ${otp || 'N/A'}`);

    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', emailData, {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Evento/1.0 (SendGrid API Client)'
      }
    });

    console.log(`[Email] ✓ Successfully sent to ${to} (HTTP ${response.status})`);
    return { success: true, data: response.status };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[SendGrid] ❌ Failed to send email:', errorDetails);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV FALLBACK] ⚠️  OTP for ${to}: ${otp || 'Check logs'}`);
    }
    
    return { success: false, error: errorDetails };
  }
};

    console.log(`[Email] Sending to ${to} | Subject: ${subject}`);
    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', emailData, {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[Email] ✓ Successfully sent to ${to} (Status: ${response.status})`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[SendGrid] Failed to send email:', errorDetails);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV FALLBACK] Check backend logs for OTP value`);
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

  const subject = 'Verify Your Booking - Evento';
  const plainText = `Hello ${name},

Please verify your booking for ${eventTitle}.

Your 6-digit verification code is: ${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes and can only be used once.

For security, do not share this code with anyone.

If you didn't book this ticket, please contact our support team immediately.

Evento - Event Booking Platform
${FRONTEND_URL}`;

  const htmlBody = createHtmlTemplate(
    'Verify Your Booking - Evento',
    `Please verify your booking for "${eventTitle}".

Your 6-digit verification code is:

${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes and can only be used once.`,
    otp,
    eventTitle,
    name
  );

  return sendEmail(email, subject, plainText, htmlBody);
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

  const subject = 'Your Evento Login Verification Code';
  const plainText = `Hello ${name},

Your 6-digit login verification code is: ${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes.

If you didn't attempt to login, please secure your account immediately:
- Change your password
- Enable two-factor authentication if available

Evento - Event Booking Platform
${FRONTEND_URL}`;

  const htmlBody = createHtmlTemplate(
    'Login Verification - Evento',
    `Your 6-digit login verification code is:

${otp}

If you didn't attempt to login, please secure your account immediately.`,
    otp,
    '',
    name
  );

  return sendEmail(email, subject, plainText, htmlBody);
};

exports.sendEmailVerificationOTP = async (email, otp, name) => {
  // Log OTP in development for testing
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n========== ✅ EMAIL VERIFICATION OTP ==========`);
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`===============================================\n`);
  }

  const subject = 'Verify Your Email Address - Evento';
  const plainText = `Welcome to Evento, ${name}!

Please verify your email address to activate your account.

Your 6-digit verification code is: ${otp}

This code is valid for ${OTP_EXPIRY_MINUTES} minutes.

After verification, you can:
- Browse and book events
- Create and manage your bookings
- Write reviews for events you attend
- Track your event history

If you didn't create an Evento account, please ignore this email.

Evento - Event Booking Platform
${FRONTEND_URL}`;

  const htmlBody = createHtmlTemplate(
    'Verify Your Email - Evento',
    `Welcome to Evento! Please verify your email address to activate your account.

Your 6-digit verification code is:

${otp}

After verification, you can browse events, book tickets, and more!`,
    otp,
    '',
    name
  );

  return sendEmail(email, subject, plainText, htmlBody);
};

exports.generateSecureOTP = generateSecureOTP;
exports.OTP_EXPIRY_MINUTES = OTP_EXPIRY_MINUTES;
exports.OTP_RATE_LIMIT_SECONDS = OTP_RATE_LIMIT_SECONDS;