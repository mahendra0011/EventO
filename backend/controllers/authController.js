const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
  sendEmailVerificationOTP,
  sendLoginOTPEmail,
  generateSecureOTP,
  OTP_EXPIRY_MINUTES,
  OTP_RATE_LIMIT_SECONDS
} = require('../utils/email');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const getEmailFailureMessage = (purpose) => (
  `Could not send ${purpose} email. Please check the SMTP/Nodemailer configuration and try again.`
);

exports.hostRegister = async (req, res) => {
  try {
    const { name, email, password, phone, secretKeyword } = req.body;

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
      phone,
      role: 'host',
      secretKeyword
    });

    // Hosts are considered verified after registration
    user.loginOtpVerified = true;

    await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
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

    const otp = generateSecureOTP();
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpires = otpExpires;
    user.loginOtpVerified = false;
    user.lastLoginOtpSent = new Date(); // Set timestamp for rate limiting

    await user.save();

    const emailResult = await sendEmailVerificationOTP(user.email, otp, user.name);
    if (!emailResult?.success) {
      console.warn('Email verification OTP failed:', emailResult?.error || emailResult?.message);
      await User.deleteOne({ _id: user._id });
      return res.status(502).json({
        message: getEmailFailureMessage('verification'),
        emailSent: false
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Please check your email for verification code to complete registration.',
      requiresVerification: true,
      emailSent: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
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

    // Check if login OTP verification is required
    if (!user.loginOtpVerified) {
      // Rate limiting for login OTP
      const oneMinuteAgo = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);
      if (user.lastLoginOtpSent && user.lastLoginOtpSent > oneMinuteAgo) {
        return res.status(429).json({
          message: `Please wait ${OTP_RATE_LIMIT_SECONDS} seconds before requesting another code`
        });
      }

      // Generate and send login OTP
      const otp = generateSecureOTP();
      const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      const emailResult = await sendLoginOTPEmail(user.email, otp, user.name);
      if (!emailResult?.success) {
        console.warn('Login OTP email failed:', emailResult?.error || emailResult?.message);
        return res.status(502).json({
          message: getEmailFailureMessage('login OTP'),
          emailSent: false
        });
      }

      user.loginOtp = otp;
      user.loginOtpExpires = otpExpires;
      user.lastLoginOtpSent = new Date();
      await user.save();

      // Return token even when OTP is required (for verification step)
      const token = generateToken(user._id);
      return res.status(200).json({
        message: 'Login OTP sent to your email. Please verify to continue.',
        requiresOTP: true,
        emailSent: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
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

    if (!user.emailVerificationOtp) {
      return res.status(400).json({ message: 'No verification pending' });
    }

    if (user.emailVerificationOtpExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    if (user.emailVerificationOtp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpires = undefined;
    user.loginOtpVerified = true;
    await user.save();

    res.json({
      message: 'Email verified successfully. You can now login.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
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

    if (!user.loginOtp) {
      return res.status(400).json({ message: 'No login OTP pending' });
    }

    if (user.loginOtpExpires < new Date()) {
      return res.status(400).json({ message: 'Login OTP has expired' });
    }

    if (user.loginOtp !== otp) {
      return res.status(400).json({ message: 'Invalid login OTP' });
    }

    user.loginOtp = undefined;
    user.loginOtpExpires = undefined;
    user.loginOtpVerified = true;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
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

    if (user.loginOtpVerified) {
      return res.status(400).json({ message: 'Login already verified' });
    }

    const oneMinuteAgo = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);
    if (user.lastLoginOtpSent && user.lastLoginOtpSent > oneMinuteAgo) {
      return res.status(429).json({
        message: `Please wait ${OTP_RATE_LIMIT_SECONDS} seconds before requesting another code`
      });
    }

    const otp = generateSecureOTP();
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const emailResult = await sendLoginOTPEmail(user.email, otp, user.name);
    if (!emailResult?.success) {
      console.warn('Resend login OTP email failed:', emailResult?.error || emailResult?.message);
      return res.status(502).json({
        message: getEmailFailureMessage('login OTP'),
        emailSent: false
      });
    }

    user.loginOtp = otp;
    user.loginOtpExpires = otpExpires;
    user.lastLoginOtpSent = new Date();
    await user.save();

    res.json({ message: 'Login OTP resent successfully', emailSent: true });
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

    if (user.loginOtpVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const oneMinuteAgo = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);
    if (user.lastLoginOtpSent && user.lastLoginOtpSent > oneMinuteAgo) {
      return res.status(429).json({
        message: `Please wait ${OTP_RATE_LIMIT_SECONDS} seconds before requesting another code`
      });
    }

    const otp = generateSecureOTP();
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const emailResult = await sendEmailVerificationOTP(user.email, otp, user.name);
    if (!emailResult?.success) {
      console.warn('Resend verification email failed:', emailResult?.error || emailResult?.message);
      return res.status(502).json({
        message: getEmailFailureMessage('verification'),
        emailSent: false
      });
    }

    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpires = otpExpires;
    user.lastLoginOtpSent = new Date();
    await user.save();

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

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
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

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
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

    // Hosts are considered verified after registration
    user.loginOtpVerified = true;

    await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Host keyword register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
