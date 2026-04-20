const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getEventAnalytics
} = require('../controllers/hostController');
const { hostAuth } = require('../middleware/auth');

// @route   GET /api/host/dashboard
// @desc    Get dashboard statistics
// @access  Private/Host
router.get('/dashboard', hostAuth, getDashboardStats);

// @route   GET /api/host/users
// @desc    Get all users
// @access  Private/Host
router.get('/users', hostAuth, getAllUsers);

// @route   PUT /api/host/users/:id/role
// @desc    Update user role
// @access  Private/Host
router.put('/users/:id/role', hostAuth, updateUserRole);

// @route   GET /api/host/events/:id/analytics
// @desc    Get event analytics
// @access  Private/Host
router.get('/events/:id/analytics', hostAuth, getEventAnalytics);

module.exports = router;
