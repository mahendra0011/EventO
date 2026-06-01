const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Simple in-memory cache for user lookups
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getUser = async (userId) => {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  const user = await User.findById(userId).select('-password -googleId');
  if (user) {
    userCache.set(userId, { user, timestamp: Date.now() });
  }
  return user;
};

const clearUserCache = (userId) => {
  if (userId) userCache.delete(userId.toString());
};

const rejectBlockedUser = (user, res) => {
  if (!user.isBlocked) return false;
  res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
  return true;
};

// Verify JWT token and check OTP verification (skip for OTP endpoints)
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (rejectBlockedUser(user, res)) {
      return;
    }

    req.user = user;

    // Skip OTP check for OTP verification/resend endpoints
    const otpPaths = ['/verify-email', '/resend-verification', '/verify-login-otp', '/resend-login-otp', '/verify-otp', '/resend-otp'];
    
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
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (rejectBlockedUser(user, res)) {
      return;
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

// Check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUser(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (rejectBlockedUser(user, res)) {
      return;
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
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

module.exports = { auth, hostAuth, adminAuth, clearUserCache };
