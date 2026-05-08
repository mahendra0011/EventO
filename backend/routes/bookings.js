const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  getAllBookings,
  confirmBooking,
  rejectBooking
} = require('../controllers/bookingController');
const { auth, hostAuth } = require('../middleware/auth');

// @route   POST /api/bookings
// @desc    Create booking request
// @access  Private
router.post('/', auth, createBooking);

// @route   GET /api/bookings/user
// @desc    Get user bookings
// @access  Private
router.get('/user', auth, getUserBookings);

// @route   GET /api/bookings/all
// @desc    Get all bookings (Host)
// @access  Private/Host
router.get('/all', hostAuth, getAllBookings);

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', auth, getBooking);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put('/:id/cancel', auth, cancelBooking);

// @route   PUT /api/bookings/:id/confirm
// @desc    Confirm booking (Host)
// @access  Private/Host
router.put('/:id/confirm', hostAuth, confirmBooking);

// @route   PUT /api/bookings/:id/reject
// @desc    Reject booking (Host)
// @access  Private/Host
router.put('/:id/reject', hostAuth, rejectBooking);

module.exports = router;
