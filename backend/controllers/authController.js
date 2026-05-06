const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendLoginNotificationEmail } = require('../utils/email');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Host Registration with Custom Secret Keyword
exports.hostRegister = async (req, res) => {
  try {
    const { name, email, password, phone, secretKeyword } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create host user
    user = new User({
      name,
      email,
      password,
      phone,
      role: 'host',
      secretKeyword
    });

    await user.save();

    // Generate token
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

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    user = new User({
      name,
      email,
      password,
      phone
    });

    await user.save();

    // Generate token
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
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Send login notification email asynchronously (non-blocking)
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    sendLoginNotificationEmail(user.email, user.name, ipAddress).catch(err => {
      console.error('Login notification email error:', err.message);
    });

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

// Get Current User
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Host Login - Login using email, password, and custom secret keyword
exports.hostLogin = async (req, res) => {
  try {
    const { email, password, secretKeyword } = req.body;

    // Find host user by email
    const user = await User.findOne({ email, role: 'host' });
    if (!user) {
      return res.status(400).json({ message: 'Host not found' });
    }

    // Check if provided secret keyword matches user's stored keyword
    if (user.secretKeyword !== secretKeyword) {
      return res.status(400).json({ message: 'Invalid secret keyword' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Send login notification email asynchronously (non-blocking)
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    sendLoginNotificationEmail(user.email, user.name, ipAddress).catch(err => {
      console.error('Host login notification email error:', err.message);
    });

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

// Update Profile
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

// Host Login - Login using email, password, and host keyword
exports.hostKeywordLogin = async (req, res) => {
  try {
    const { email, password, hostKeyword } = req.body;

    // Find host user by email
    const user = await User.findOne({ email, role: 'host' });
    if (!user) {
      return res.status(400).json({ message: 'Host not found' });
    }

    // Check if provided host keyword matches user's stored keyword
    if (user.secretKeyword !== hostKeyword) {
      return res.status(400).json({ message: 'Invalid host keyword' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Send login notification email (fire and forget, don't block response)
    sendLoginNotificationEmail(user.email, user.name, req.ip).catch(err => {
      console.error('Failed to send login notification email:', err.message);
    });

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

// Host Registration with Custom Secret Keyword
exports.hostKeywordRegister = async (req, res) => {
  try {
    const { name, email, password, phone, secretKeyword } = req.body;

    // Validation
    if (!name || !email || !password || !secretKeyword) {
      return res.status(400).json({ message: 'Name, email, password and secretKeyword are required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create host user
    user = new User({
      name,
      email,
      password,
      phone,
      role: 'host',
      secretKeyword
    });

    await user.save();

    // Generate token
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