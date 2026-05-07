const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { sendOTPEmail, sendBookingConfirmationEmail } = require('../utils/email');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create booking request
exports.createBooking = async (req, res) => {
  try {
    const { eventId, numberOfTickets, attendeeDetails } = req.body;

    // Validation
    if (!eventId || !numberOfTickets) {
      return res.status(400).json({ message: 'Event ID and number of tickets are required' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if enough tickets available
    if (event.availableTickets < numberOfTickets) {
      return res.status(400).json({ message: 'Not enough tickets available' });
    }

    // Calculate total price
    const totalPrice = event.price * numberOfTickets;

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create booking
    const booking = new Booking({
      user: req.user.id,
      event: eventId,
      numberOfTickets,
      totalPrice,
      attendeeDetails,
      otp,
      otpExpires
    });

    await booking.save();

    const otpEmailSent = await sendOTPEmail(req.user.email, otp, req.user.name);

    // Create notification for host
    const eventWithOrganizer = await Event.findById(eventId).populate('organizer');
    if (eventWithOrganizer && eventWithOrganizer.organizer) {
      await Notification.create({
        user: eventWithOrganizer.organizer._id,
        title: 'New Booking Received',
        message: `${req.user.name} booked ${numberOfTickets} ticket(s) for "${event.title}"`,
        type: 'booking',
        link: `/host/bookings`
      });
    }

    res.status(201).json({
      message: otpEmailSent
        ? 'Booking created. Please verify OTP sent to your email.'
        : 'Booking created. Email could not be sent — use the OTP shown below to verify.',
      bookingId: booking._id,
      totalPrice,
      emailSent: otpEmailSent,
      ...(otpEmailSent ? {} : { otp })
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP - Auto-confirm booking
exports.verifyOTP = async (req, res) => {
  try {
    const { bookingId, otp } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if OTP is expired
    if (booking.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Verify OTP
    if (booking.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Auto-confirm booking
    booking.isOtpVerified = true;
    booking.otp = undefined;
    booking.otpExpires = undefined;
    booking.status = 'confirmed';
    booking.paymentStatus = 'completed';
    booking.confirmedAt = new Date();
    await booking.save();

    // Update event available tickets
    const event = await Event.findById(booking.event);
    event.availableTickets -= booking.numberOfTickets;
    await event.save();

    // Send confirmation email after OTP verification
    sendBookingConfirmationEmail(
      req.user.email,
      req.user.name,
      event.title,
      {
        numberOfTickets: booking.numberOfTickets,
        totalPrice: booking.totalPrice,
        bookingId: booking._id
      }
    ).then(success => {
      if (!success) {
        console.log('Booking confirmation email may have failed after OTP verification');
      }
    }).catch(err => {
      console.error('OTP verification confirmation email error:', err.message);
    });

    // Create notification for user
    await Notification.create({
      user: booking.user,
      title: 'Booking Confirmed!',
      message: `Your booking for "${event.title}" is confirmed.`,
      type: 'booking',
      link: `/booking/${booking._id}/confirmation`
    });

    res.json({ 
      message: 'Booking confirmed successfully.', 
      booking 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    booking.otp = otp;
    booking.otpExpires = otpExpires;
    await booking.save();

    const otpEmailSent = await sendOTPEmail(req.user.email, otp, req.user.name);

    res.json({
      message: otpEmailSent
        ? 'OTP resent successfully'
        : 'Email could not be sent — use the OTP below.',
      emailSent: otpEmailSent,
      ...(otpEmailSent ? {} : { otp })
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user bookings
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

// Get single booking
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title date time venue image price')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'host') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only pending bookings can be cancelled by user
    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'Cannot cancel confirmed booking. Contact support.' });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // Return tickets to event
    const event = await Event.findById(booking.event._id);
    event.availableTickets += booking.numberOfTickets;
    await event.save();

    // Notify user
    await Notification.create({
      user: booking.user,
      title: 'Booking Cancelled',
      message: `Your booking for "${event.title}" has been cancelled.`,
      type: 'booking',
      link: '/dashboard'
    });

    // Notify host
    if (event.organizer) {
      await Notification.create({
        user: event.organizer._id,
        title: 'Booking Cancelled',
        message: `${req.user.name || 'A user'} cancelled booking for "${event.title}"`,
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

// Host: Get all bookings for host's events only
exports.getAllBookings = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Get host's events
    const hostEvents = await Event.find({ organizer: hostId });
    const hostEventIds = hostEvents.map(e => e._id);

    let query = { event: { $in: hostEventIds } };
    if (status) {
      query.status = status;
    }

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

// Admin: Confirm booking
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

    // Update event available tickets
    const event = await Event.findById(booking.event._id);
    event.availableTickets -= booking.numberOfTickets;
    await event.save();

    // Send confirmation email
    const emailSent = await sendBookingConfirmationEmail(
      booking.user.email,
      booking.user.name,
      booking.event.title,
      {
        numberOfTickets: booking.numberOfTickets,
        totalPrice: booking.totalPrice,
        bookingId: booking._id
      }
    );
    if (!emailSent) {
      console.log('Booking confirmation email may have failed to send to:', booking.user.email);
    }

    res.json({ message: 'Booking confirmed successfully', booking });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Reject booking
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
