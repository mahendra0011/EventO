const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token and check OTP verification (skip for OTP endpoints)
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;

    // Skip OTP check for OTP verification/resend endpoints
    // req.path gives the path after the router mount point (e.g., /verify-email from /api/auth/verify-email)
    const otpPaths = [
      '/verify-email',
      '/resend-verification',
      '/verify-login-otp',
      '/resend-login-otp',
      '/verify-otp',
      '/resend-otp'
    ];
    
    if (!otpPaths.includes(req.path) && !user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email via OTP',
        requiresVerification: true,
        requiresOTP: true
      });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is host
const hostAuth = async (req, res, next) => {
  try {
    // First run auth middleware to set req.user
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (user.role !== 'host') {
      return res.status(403).json({ message: 'Access denied. Host only.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email via OTP',
        requiresVerification: true,
        requiresOTP: true
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Access denied' });
  }
};

module.exports = { auth, hostAuth };
