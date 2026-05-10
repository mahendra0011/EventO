const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  sendEmailVerificationOTP,
  sendLoginNotificationEmail,
  sendPasswordResetEmail,
  generateSecureOTP,
  OTP_EXPIRY_MINUTES,
  OTP_RATE_LIMIT_SECONDS
} = require('../utils/email');
const { getClientIp, logActivity } = require('../utils/activity');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const PASSWORD_RESET_EXPIRY_MINUTES = 15;
const PASSWORD_RESET_RATE_LIMIT_SECONDS = 60;
const hashResetToken = (token) => crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

const getEmailFailureMessage = (purpose) => (
  `Could not send ${purpose} email. Please check the Brevo API key, verified sender email, and Render environment variables.`
);

const buildAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  isBlocked: user.isBlocked,
  isVerified: user.isVerified
});

const recordSuccessfulLogin = async (req, user) => {
  user.lastLoginAt = new Date();
  user.lastLoginIp = getClientIp(req);
  await user.save();

  await logActivity({
    req,
    actor: user._id,
    action: 'auth.login',
    entity: 'User',
    entityId: user._id,
    message: `${user.email} logged in`
  });

  if (user.role === 'admin') {
    sendLoginNotificationEmail(user.email, user.name, user.lastLoginIp)
      .then(result => {
        if (!result?.success) console.warn('Admin login notification failed:', result?.error || result?.message);
      })
      .catch(err => console.error('Admin login notification error:', err.message));
  }
};

const setVerificationOtp = (user, otp, otpExpires) => {
  user.otp = otp;
  user.otpExpiry = otpExpires;
  user.emailVerificationOtp = otp;
  user.emailVerificationOtpExpires = otpExpires;
  user.loginOtp = undefined;
  user.loginOtpExpires = undefined;
  user.lastOtpSent = new Date();
  user.lastLoginOtpSent = user.lastOtpSent;
};

const getVerificationOtp = (user) => ({
  otp: user.otp || user.emailVerificationOtp || user.loginOtp,
  otpExpires: user.otpExpiry || user.emailVerificationOtpExpires || user.loginOtpExpires,
  lastOtpSent: user.lastOtpSent || user.lastLoginOtpSent
});

const sendVerificationOtp = async (user, save = true) => {
  const otp = generateSecureOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  setVerificationOtp(user, otp, otpExpires);
  if (save) await user.save();

  const result = await sendEmailVerificationOTP(user.email, otp, user.name);
  const emailSent = Boolean(result?.success);

  if (!emailSent) {
    user.lastOtpSent = undefined;
    user.lastLoginOtpSent = undefined;
    if (save) await user.save();
    console.warn('Email verification OTP failed:', result?.error || result?.message);
  }

  return {
    success: emailSent,
    emailSent,
    error: result?.error || result?.message,
    messageId: result?.messageId
  };
};

const ensureVerificationOtpForLogin = async (user) => {
  const { otp, otpExpires, lastOtpSent } = getVerificationOtp(user);
  const oneMinuteAgo = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);

  if (otp && otpExpires && otpExpires > new Date() && lastOtpSent && lastOtpSent > oneMinuteAgo) {
    return { success: true, emailSent: true, reused: true };
  }

  return sendVerificationOtp(user);
};

const buildUnverifiedResponse = (user, message, emailSent = true) => ({
  success: true,
  verified: false,
  requiresVerification: true,
  requiresOTP: true,
  emailSent,
  role: user.role,
  user: buildAuthUser(user),
  message
});

const completeVerification = async (user) => {
  user.isVerified = true;
  user.loginOtpVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.emailVerificationOtp = undefined;
  user.emailVerificationOtpExpires = undefined;
  user.loginOtp = undefined;
  user.loginOtpExpires = undefined;
  user.lastOtpSent = undefined;
  user.lastLoginOtpSent = undefined;
  await user.save();

  const token = generateToken(user._id);
  return {
    success: true,
    verified: true,
    token,
    role: user.role,
    user: buildAuthUser(user),
    message: 'Email verified successfully'
  };
};

exports.hostRegister = async (req, res) => {
  try {
    const { name, email, password, phone, secretKeyword } = req.body;

    if (!name || !email || !password || !secretKeyword) {
      return res.status(400).json({ message: 'Name, email, password and secretKeyword are required' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      phone,
      role: 'host',
      secretKeyword
    });

    const otpResult = await sendVerificationOtp(user, false);
    if (!otpResult.success) {
      return res.status(502).json({
        message: getEmailFailureMessage('host verification'),
        emailSent: false
      });
    }

    await user.save();

    res.status(201).json(buildUnverifiedResponse(
      user,
      'Host account created. Please verify the OTP sent to your email.',
      true
    ));
  } catch (error) {
    console.error('Host register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      phone
    });

    const otpResult = await sendVerificationOtp(user, false);
    if (!otpResult.success) {
      return res.status(502).json({
        message: getEmailFailureMessage('verification'),
        emailSent: false
      });
    }

    await user.save();

    res.status(201).json(buildUnverifiedResponse(
      user,
      'Account created. Please verify the OTP sent to your email.',
      true
    ));
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      const otpResult = await ensureVerificationOtpForLogin(user);

      return res.status(200).json(buildUnverifiedResponse(
        user,
        otpResult.emailSent
          ? 'Account is not verified. A new OTP was sent to your email.'
          : getEmailFailureMessage('verification'),
        otpResult.emailSent
      ));
    }

    const token = generateToken(user._id);
    await recordSuccessfulLogin(req, user);

    res.json({
      success: true,
      verified: true,
      token,
      role: user.role,
      user: buildAuthUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { otp, email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { otp: storedOtp, otpExpires } = getVerificationOtp(user);

    if (!storedOtp) {
      return res.status(400).json({ message: 'No verification pending' });
    }

    if (!otpExpires || otpExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const response = await completeVerification(user);
    res.json(response);
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { otp: storedOtp, otpExpires } = getVerificationOtp(user);

    if (!storedOtp) {
      return res.status(400).json({ message: 'No verification pending' });
    }

    if (!otpExpires || otpExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const response = await completeVerification(user);
    res.json({ ...response, message: 'Login verified successfully' });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account already verified' });
    }

    const oneMinuteAgo = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);
    const { lastOtpSent } = getVerificationOtp(user);
    if (lastOtpSent && lastOtpSent > oneMinuteAgo) {
      return res.status(429).json({
        message: `Please wait ${OTP_RATE_LIMIT_SECONDS} seconds before requesting another code`
      });
    }

    const otpResult = await sendVerificationOtp(user);
    if (!otpResult.success) {
      return res.status(502).json({
        message: getEmailFailureMessage('verification'),
        emailSent: false
      });
    }

    res.json({ message: 'Verification code resent successfully', emailSent: true });
  } catch (error) {
    console.error('Resend login OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const oneMinuteAgo = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);
    const { lastOtpSent } = getVerificationOtp(user);
    if (lastOtpSent && lastOtpSent > oneMinuteAgo) {
      return res.status(429).json({
        message: `Please wait ${OTP_RATE_LIMIT_SECONDS} seconds before requesting another code`
      });
    }

    const otpResult = await sendVerificationOtp(user);
    if (!otpResult.success) {
      return res.status(502).json({
        message: getEmailFailureMessage('verification'),
        emailSent: false
      });
    }

    res.json({ message: 'Verification code resent successfully', emailSent: true });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const genericMessage = 'If an Evento account exists for this email, a password reset OTP has been sent.';

    if (!user) {
      return res.json({ message: genericMessage });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    const oneMinuteAgo = new Date(Date.now() - PASSWORD_RESET_RATE_LIMIT_SECONDS * 1000);
    if (user.lastPasswordResetSentAt && user.lastPasswordResetSentAt > oneMinuteAgo) {
      return res.status(429).json({
        message: `Please wait ${PASSWORD_RESET_RATE_LIMIT_SECONDS} seconds before requesting another password reset OTP`
      });
    }

    const resetOtp = generateSecureOTP();
    user.passwordResetToken = hashResetToken(resetOtp);
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);
    user.passwordResetAttempts = 0;
    user.lastPasswordResetSentAt = new Date();
    await user.save();

    const result = await sendPasswordResetEmail(user.email, user.name, resetOtp, PASSWORD_RESET_EXPIRY_MINUTES);

    if (!result?.success) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordResetAttempts = 0;
      user.lastPasswordResetSentAt = undefined;
      await user.save();
      console.warn('Password reset email failed:', result?.error || result?.message);
      return res.status(502).json({
        message: getEmailFailureMessage('password reset'),
        emailSent: false
      });
    }

    await logActivity({
      req,
      actor: user._id,
      action: 'auth.password_reset_requested',
      entity: 'User',
      entityId: user._id,
      message: `${user.email} requested a password reset`
    });

    res.json({ message: genericMessage, emailSent: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({ message: 'Enter a valid 6-digit OTP' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !user.passwordResetToken || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ message: 'Password reset OTP is invalid or expired' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    if ((user.passwordResetAttempts || 0) >= 5) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordResetAttempts = 0;
      user.lastPasswordResetSentAt = undefined;
      await user.save();
      return res.status(429).json({ message: 'Too many invalid OTP attempts. Please request a new OTP.' });
    }

    const otpHash = hashResetToken(String(otp));
    if (user.passwordResetToken !== otpHash) {
      user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: 'Password reset OTP is invalid or expired' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetAttempts = 0;
    user.lastPasswordResetSentAt = undefined;
    await user.save();

    await logActivity({
      req,
      actor: user._id,
      action: 'auth.password_reset_completed',
      entity: 'User',
      entityId: user._id,
      message: `${user.email} reset their password`
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hostLogin = async (req, res) => {
  try {
    const { email, password, secretKeyword } = req.body;

    const user = await User.findOne({ email, role: 'host' });
    if (!user) {
      return res.status(400).json({ message: 'Host not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    if (user.secretKeyword !== secretKeyword) {
      return res.status(400).json({ message: 'Invalid secret keyword' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      const otpResult = await ensureVerificationOtpForLogin(user);

      return res.status(200).json(buildUnverifiedResponse(
        user,
        otpResult.emailSent
          ? 'Account is not verified. A new OTP was sent to your email.'
          : getEmailFailureMessage('verification'),
        otpResult.emailSent
      ));
    }

    const token = generateToken(user._id);
    await recordSuccessfulLogin(req, user);

    res.json({
      success: true,
      verified: true,
      token,
      role: user.role,
      user: buildAuthUser(user)
    });
  } catch (error) {
    console.error('Host login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hostKeywordLogin = async (req, res) => {
  try {
    const { email, password, hostKeyword } = req.body;

    const user = await User.findOne({ email, role: 'host' });
    if (!user) {
      return res.status(400).json({ message: 'Host not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    if (user.secretKeyword !== hostKeyword) {
      return res.status(400).json({ message: 'Invalid host keyword' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      const otpResult = await ensureVerificationOtpForLogin(user);

      return res.status(200).json(buildUnverifiedResponse(
        user,
        otpResult.emailSent
          ? 'Account is not verified. A new OTP was sent to your email.'
          : getEmailFailureMessage('verification'),
        otpResult.emailSent
      ));
    }

    const token = generateToken(user._id);
    await recordSuccessfulLogin(req, user);

    res.json({
      success: true,
      verified: true,
      token,
      role: user.role,
      user: buildAuthUser(user)
    });
  } catch (error) {
    console.error('Host keyword login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hostKeywordRegister = async (req, res) => {
  try {
    const { name, email, password, phone, secretKeyword } = req.body;

    if (!name || !email || !password || !secretKeyword) {
      return res.status(400).json({ message: 'Name, email, password and secretKeyword are required' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      phone,
      role: 'host',
      secretKeyword
    });

    const otpResult = await sendVerificationOtp(user, false);
    if (!otpResult.success) {
      return res.status(502).json({
        message: getEmailFailureMessage('host verification'),
        emailSent: false
      });
    }

    await user.save();

    res.status(201).json(buildUnverifiedResponse(
      user,
      'Host account created. Please verify the OTP sent to your email.',
      true
    ));
  } catch (error) {
    console.error('Host keyword register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
