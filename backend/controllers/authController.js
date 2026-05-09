const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
  sendEmailVerificationOTP,
  generateSecureOTP,
  OTP_EXPIRY_MINUTES,
  OTP_RATE_LIMIT_SECONDS
} = require('../utils/email');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const getEmailFailureMessage = (purpose) => (
  `Could not send ${purpose} email. If this is deployed on Render free, Gmail SMTP is blocked on ports 465/587. Upgrade Render or use an SMTP provider on port 2525.`
);

const buildAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  isVerified: user.isVerified
});

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

const sendVerificationOtp = async (user) => {
  const otp = generateSecureOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  setVerificationOtp(user, otp, otpExpires);
  await user.save();

  sendEmailVerificationOTP(user.email, otp, user.name).then(result => {
    if (!result?.success) {
      console.warn('Email verification OTP failed:', result?.error || result?.message);
    }
  });

  return { success: true, emailSent: true };
};

const ensureVerificationOtpForLogin = async (user) => {
  const { otp, otpExpires, lastOtpSent } = getVerificationOtp(user);
  const oneMinuteAgo = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);

  if (otp && otpExpires && otpExpires > new Date() && lastOtpSent && lastOtpSent > oneMinuteAgo) {
    return { success: true, reused: true };
  }

  sendVerificationOtp(user);
  return { success: true, emailSent: true };
};

const buildUnverifiedResponse = (user, message, emailSent = true) => ({
  success: true,
  verified: false,
  requiresVerification: true,
  requiresOTP: true,
  emailSent,
  token: generateToken(user._id),
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

    await user.save();

    sendVerificationOtp(user);

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

    await user.save();

    sendVerificationOtp(user);

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

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      ensureVerificationOtpForLogin(user);

      return res.status(200).json(buildUnverifiedResponse(
        user,
        'Account is not verified. A new OTP was sent to your email.',
        true
      ));
    }

    const token = generateToken(user._id);

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
    const { otp } = req.body;
    const user = await User.findById(req.user.id);

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
    const { otp } = req.body;
    const user = await User.findById(req.user.id);

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
    const user = await User.findById(req.user.id);

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

    sendVerificationOtp(user);
    res.json({ message: 'Verification code resent successfully', emailSent: true });
  } catch (error) {
    console.error('Resend login OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

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

    sendVerificationOtp(user);
    res.json({ message: 'Verification code resent successfully', emailSent: true });
  } catch (error) {
    console.error('Resend verification error:', error);
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

    if (user.secretKeyword !== secretKeyword) {
      return res.status(400).json({ message: 'Invalid secret keyword' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      ensureVerificationOtpForLogin(user);

      return res.status(200).json(buildUnverifiedResponse(
        user,
        'Account is not verified. A new OTP was sent to your email.',
        true
      ));
    }

    const token = generateToken(user._id);

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

    if (user.secretKeyword !== hostKeyword) {
      return res.status(400).json({ message: 'Invalid host keyword' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      ensureVerificationOtpForLogin(user);

      return res.status(200).json(buildUnverifiedResponse(
        user,
        'Account is not verified. A new OTP was sent to your email.',
        true
      ));
    }

    const token = generateToken(user._id);

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

    await user.save();

    sendVerificationOtp(user);

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