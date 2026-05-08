const nodemailer = require('nodemailer');

console.log('Email Config - EMAIL_USER:', process.env.EMAIL_USER);
console.log('Email Config - EMAIL_PASS exists:', !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification error:', error);
  } else {
    console.log('Email transporter is ready');
  }
});

const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Evento - Your OTP for Booking Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Evento</h1>
          <p style="color: white; margin-top: 10px;">Event Booking Platform</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hello ${name},</h2>
          <p style="color: #666; font-size: 16px;">Your One-Time Password (OTP) for booking verification is:</p>
          <div style="background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Evento. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error:', error.message);
    return false;
  }
};

const sendBookingConfirmationEmail = async (email, name, eventTitle, bookingDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
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

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendHostMessageEmail = async (recipientEmail, recipientName, subject, content, eventTitle, senderName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
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
            ${content.split('\n').map(line => `<p style="color: #333; margin: 5px 0;">${line}</p>`).join('')}
          </div>

          <p style="color: #666; font-size: 14px;">
            You can reply to this message by logging into your Evento dashboard.
          </p>
          <p style="color: #666; font-size: 14px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/messages" style="color: #667eea; text-decoration: none; font-weight: bold;">
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

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Host message email sent to:', recipientEmail, info.messageId);
    return true;
  } catch (error) {
    console.error('Host message email error:', error.message);
    return false;
  }
};

module.exports = { sendOTPEmail, sendBookingConfirmationEmail, sendHostMessageEmail };
