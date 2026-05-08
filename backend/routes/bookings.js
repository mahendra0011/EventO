const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  getAllBookings,
  confirmBooking,
  rejectBooking,
  verifyOTP,
  resendOTP
} = require('../controllers/bookingController');
const { auth, hostAuth } = require('../middleware/auth');

router.post('/', auth, createBooking);

router.get('/user', auth, getUserBookings);

router.get('/all', hostAuth, getAllBookings);

router.get('/:id', auth, getBooking);

router.put('/:id/cancel', auth, cancelBooking);

router.put('/:id/confirm', hostAuth, confirmBooking);

router.put('/:id/reject', hostAuth, rejectBooking);

router.post('/verify-otp', auth, verifyOTP);

router.post('/resend-otp', auth, resendOTP);

module.exports = router;