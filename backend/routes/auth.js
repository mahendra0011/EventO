const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { register, login, getMe, updateProfile, hostRegister, hostLogin, adminLogin, adminRegister } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], register);

// @route   POST /api/auth/host-register
// @desc    Register host with custom secret keyword
// @access  Public
router.post('/host-register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('secretKeyword', 'Secret keyword is required').not().isEmpty()
], hostRegister);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], login);

// @route   POST /api/auth/host-login
// @desc    Host login with email, password, and custom secret keyword
// @access  Public
router.post('/host-login', [
  check('email', 'Email is required').isEmail(),
  check('password', 'Password is required').exists(),
  check('secretKeyword', 'Secret keyword is required').not().isEmpty()
], hostLogin);

// @route   POST /api/auth/admin-login
// @desc    Admin login with email, password, and admin keyword
// @access  Public
router.post('/admin-login', [
  check('email', 'Email is required').isEmail(),
  check('password', 'Password is required').exists(),
  check('adminKeyword', 'Admin keyword is required').not().isEmpty()
], adminLogin);

// @route   POST /api/auth/admin-register
// @desc    Register admin with custom secret keyword
// @access  Public
router.post('/admin-register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('secretKeyword', 'Secret keyword is required').not().isEmpty()
], adminRegister);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, updateProfile);

module.exports = router;
