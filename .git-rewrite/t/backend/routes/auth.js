const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, hostRegister, hostLogin, hostKeywordLogin, hostKeywordRegister } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/host-register
// @desc    Register host with custom secret keyword
// @access  Public
router.post('/host-register', hostRegister);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/host-login
// @desc    Host login with email, password, and custom secret keyword
// @access  Public
router.post('/host-login', hostLogin);

// @route   POST /api/auth/host-keyword-login
// @desc    Host login with email, password, and host keyword
// @access  Public
router.post('/host-keyword-login', hostKeywordLogin);

// @route   POST /api/auth/host-keyword-register
// @desc    Register host with custom secret keyword
// @access  Public
router.post('/host-keyword-register', hostKeywordRegister);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, updateProfile);

module.exports = router;
