const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { sendOTPEmail, sendBookingConfirmationEmail } = require('../utils/email');
const crypto = require('crypto');

const OTP_EXPIRY_MINUTES = 10;
const OTP_RATE_LIMIT_SECONDS = 60;

const generateSecureOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

exports.createBooking = async (req, res) => {
  try {
    const { eventId, numberOfTickets, attendeeDetails } = req.body;

    if (!eventId || !numberOfTickets) {
      return res.status(400).json({ message: 'Event ID and number of tickets are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.availableTickets < numberOfTickets) {
      return res.status(400).json({ message: 'Not enough tickets available' });
    }

    const existingPendingBooking = await Booking.findOne({
      user: req.user.id,
      event: eventId,
      status: 'pending'
    });

    if (existingPendingBooking) {
      return res.status(400).json({
        message: 'You already have a pending booking for this event',
        bookingId: existingPendingBooking._id
      });
    }

    const oneMinuteAgo = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);
    const recentOtpRequest = await Booking.findOne({
      user: req.user.id,
      event: eventId,
      lastOtpSent: { $gt: oneMinuteAgo }
    });

    if (recentOtpRequest) {
      return res.status(429).json({
        message: `Please wait ${OTP_RATE_LIMIT_SECONDS} seconds before requesting another OTP`
      });
    }

    const totalPrice = event.price * numberOfTickets;
    const otp = generateSecureOTP();
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const booking = new Booking({
      user: req.user.id,
      event: eventId,
      numberOfTickets,
      totalPrice,
      attendeeDetails,
      otp,
      otpExpires,
      lastOtpSent: new Date(),
      usedOtps: []
    });

    await booking.save();

    console.log('[Booking] Created booking', booking._id, 'for user', req.user.id, 'with email', req.user.email);
    sendOTPEmail(req.user.email, otp, req.user.name, event.title)
      .then(success => {
        if (!success) {
          console.warn('OTP email failed for booking', booking._id, 'to:', req.user.email);
          // FALLBACK: Log OTP to console for testing when email fails
          console.log('=============================================');
          console.log('OTP FOR TESTING (EMAIL FAILED):', otp);
          console.log('Email to:', req.user.email);
          console.log('Valid until:', otpExpires.toISOString());
          console.log('=============================================');
        } else {
          console.log('OTP email sent for booking', booking._id, 'to:', req.user.email, 'OTP:', otp);
        }
      })
      .catch(err => {
        console.error('OTP email error:', err.message);
        // FALLBACK: Log OTP to console for testing when email fails
        console.log('=============================================');
        console.log('OTP FOR TESTING (EMAIL ERROR):', otp);
        console.log('Email to:', req.user.email);
        console.log('Valid until:', otpExpires.toISOString());
        console.log('=============================================');
      });

    const eventWithOrganizer = await Event.findById(eventId).populate('organizer');
    if (eventWithOrganizer?.organizer) {
      await Notification.create({
        user: eventWithOrganizer.organizer._id,
        title: 'New Booking Request',
        message: `${req.user.name} requested booking for "${event.title}"`,
        type: 'booking',
        link: '/host/bookings'
      });
    }

    res.status(201).json({
      message: 'Booking created. Check your email for OTP verification.',
      bookingId: booking._id,
      totalPrice
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { bookingId, otp } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.isOtpVerified) {
      return res.status(400).json({ message: 'Booking already verified' });
    }

    if (booking.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (booking.usedOtps?.includes(otp)) {
      return res.status(400).json({ message: 'OTP has already been used' });
    }

    if (booking.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    booking.usedOtps = [...(booking.usedOtps || []), otp];
    booking.isOtpVerified = true;
    booking.otp = undefined;
    booking.otpExpires = undefined;
    booking.status = 'confirmed';
    booking.paymentStatus = 'completed';
    booking.confirmedAt = new Date();

    await booking.save();

    const event = await Event.findById(booking.event);
    event.availableTickets -= booking.numberOfTickets;
    await event.save();

    sendBookingConfirmationEmail(
      req.user.email,
      req.user.name,
      event.title,
      {
        numberOfTickets: booking.numberOfTickets,
        totalPrice: booking.totalPrice,
        bookingId: booking._id
      }
    ).catch(err => console.error('Confirmation email error:', err.message));

    await Notification.create({
      user: booking.user,
      title: 'Booking Confirmed',
      message: `Your booking for "${event.title}" is confirmed`,
      type: 'booking',
      link: `/bookings/${booking._id}/confirmation`
    });

    res.json({ message: 'Booking confirmed successfully', booking });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.isOtpVerified) {
      return res.status(400).json({ message: 'Booking already verified' });
    }

    const oneMinuteAgo = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);
    if (booking.lastOtpSent > oneMinuteAgo) {
      return res.status(429).json({
        message: `Please wait ${OTP_RATE_LIMIT_SECONDS} seconds before requesting another OTP`
      });
    }

    const otp = generateSecureOTP();
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    booking.otp = otp;
    booking.otpExpires = otpExpires;
    booking.lastOtpSent = new Date();
    await booking.save();

    const event = await Event.findById(booking.event).select('title');
    sendOTPEmail(req.user.email, otp, req.user.name, event?.title)
      .then(success => {
        if (!success) console.warn('Resend OTP email failed');
      })
      .catch(err => console.error('Resend OTP error:', err.message));

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('event', 'title date time venue image price')
      .sort({ bookingDate: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title date time venue image price')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'host') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'Cannot cancel confirmed booking' });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    const event = await Event.findById(booking.event._id);
    event.availableTickets += booking.numberOfTickets;
    await event.save();

    await Notification.create({
      user: booking.user,
      title: 'Booking Cancelled',
      message: `Your booking for "${event.title}" was cancelled`,
      type: 'booking',
      link: '/dashboard'
    });

    if (event.organizer) {
      await Notification.create({
        user: event.organizer._id,
        title: 'Booking Cancelled',
        message: `Booking for "${event.title}" was cancelled`,
        type: 'booking',
        link: '/host/bookings'
      });
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const hostEvents = await Event.find({ organizer: hostId });
    const hostEventIds = hostEvents.map(e => e._id);

    let query = { event: { $in: hostEventIds } };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('event', 'title date time venue image price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalBookings: count
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.isOtpVerified) {
      return res.status(400).json({ message: 'OTP not verified' });
    }

    booking.status = 'confirmed';
    booking.paymentStatus = 'completed';
    booking.confirmedAt = new Date();
    await booking.save();

    const event = await Event.findById(booking.event._id);
    event.availableTickets -= booking.numberOfTickets;
    await event.save();

    sendBookingConfirmationEmail(
      booking.user.email,
      booking.user.name,
      booking.event.title,
      {
        numberOfTickets: booking.numberOfTickets,
        totalPrice: booking.totalPrice,
        bookingId: booking._id
      }
    ).catch(err => console.error('Confirmation email error:', err.message));

    res.json({ message: 'Booking confirmed successfully', booking });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'rejected';
    booking.cancelledAt = new Date();
    await booking.save();

    res.json({ message: 'Booking rejected successfully' });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};