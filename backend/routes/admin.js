const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getEventAnalytics
} = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/dashboard', adminAuth, getDashboardStats);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', adminAuth, getAllUsers);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.put('/users/:id/role', adminAuth, updateUserRole);

// @route   GET /api/admin/events/:id/analytics
// @desc    Get event analytics
// @access  Private/Admin
router.get('/events/:id/analytics', adminAuth, getEventAnalytics);

module.exports = router;
