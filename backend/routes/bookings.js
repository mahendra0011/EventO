const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const {
  createBooking,
  verifyOTP,
  resendOTP,
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
router.post('/', auth, [
  check('eventId', 'Event ID is required').not().isEmpty(),
  check('numberOfTickets', 'Number of tickets is required').isNumeric()
], createBooking);

// @route   POST /api/bookings/verify-otp
// @desc    Verify OTP
// @access  Private
router.post('/verify-otp', auth, [
  check('bookingId', 'Booking ID is required').not().isEmpty(),
  check('otp', 'OTP is required').not().isEmpty()
], verifyOTP);

// @route   POST /api/bookings/resend-otp
// @desc    Resend OTP
// @access  Private
router.post('/resend-otp', auth, [
  check('bookingId', 'Booking ID is required').not().isEmpty()
], resendOTP);

// @route   GET /api/bookings/user
// @desc    Get user bookings
// @access  Private
router.get('/user', auth, getUserBookings);

// @route   GET /api/bookings/all
// @desc    Get all bookings (Admin)
// @access  Private/Admin
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
// @desc    Confirm booking (Admin)
// @access  Private/Admin
router.put('/:id/confirm', hostAuth, confirmBooking);

// @route   PUT /api/bookings/:id/reject
// @desc    Reject booking (Admin)
// @access  Private/Admin
router.put('/:id/reject', hostAuth, rejectBooking);

module.exports = router;
