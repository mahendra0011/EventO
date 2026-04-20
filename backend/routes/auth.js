const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { register, login, getMe, updateProfile, adminSecretLogin, adminRegister, adminQuickLogin } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], register);

// @route   POST /api/auth/admin-register
// @desc    Register admin with secret keyword
// @access  Public
router.post('/admin-register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('secretKeyword', 'Secret keyword is required').not().isEmpty()
], adminRegister);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], login);

// @route   POST /api/auth/admin-login
// @desc    Admin login with email, password, and secret keyword
// @access  Public
router.post('/admin-login', [
  check('email', 'Email is required').isEmail(),
  check('password', 'Password is required').exists(),
  check('secretKeyword', 'Secret keyword is required').not().isEmpty()
], adminSecretLogin);

// @route   POST /api/auth/admin-quick-login
// @desc    Admin quick login with only secret keyword
// @access  Public
router.post('/admin-quick-login', [
  check('secretKeyword', 'Secret keyword is required').not().isEmpty()
], adminQuickLogin);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, updateProfile);

module.exports = router;
