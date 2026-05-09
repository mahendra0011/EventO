const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const {
  sendBookingConfirmationEmail,
  sendImportantNotificationEmail,
  sendOTPEmail,
  generateSecureOTP,
  OTP_EXPIRY_MINUTES,
  OTP_RATE_LIMIT_SECONDS
} = require('../utils/email');

const sendImportantEmail = (user, title, message, link) => {
  if (!user?.email) return;

  sendImportantNotificationEmail(user.email, user.name, title, message, link)
    .then(result => {
      if (!result?.success) console.warn('Important notification email failed:', result?.error || result?.message);
    })
    .catch(err => console.error('Important notification email error:', err.message));
};

const getBookingEmailFailureMessage = () => 'Could not send booking OTP email. Please check SMTP/Nodemailer configuration and try again.';

exports.createBooking = async (req, res) => {
   try {
     const { eventId, numberOfTickets, attendeeDetails } = req.body;

     if (!eventId || !numberOfTickets) {
       return res.status(400).json({ message: 'Event ID and number of tickets are required' });
     }

     const event = await Event.findById(eventId).populate('organizer', 'name email');
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
       const oneMinuteAgo = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);
       const hasRecentActiveOtp = Boolean(
         existingPendingBooking.otp &&
         existingPendingBooking.otpExpires &&
         existingPendingBooking.otpExpires > new Date() &&
         existingPendingBooking.lastOtpSent &&
         existingPendingBooking.lastOtpSent > oneMinuteAgo
       );

       existingPendingBooking.numberOfTickets = numberOfTickets;
       existingPendingBooking.totalPrice = event.price * numberOfTickets;
       existingPendingBooking.attendeeDetails = attendeeDetails;

       let emailSent = true;
       let message = 'You already have a pending booking. Use the OTP already sent to your email.';

       if (!hasRecentActiveOtp) {
         const otp = generateSecureOTP();
         const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
         existingPendingBooking.otp = otp;
         existingPendingBooking.otpExpires = otpExpires;
         existingPendingBooking.lastOtpSent = new Date();
         await existingPendingBooking.save();

         const otpEmailResult = await sendOTPEmail(req.user.email, otp, req.user.name, event.title || 'Event Booking');
         emailSent = Boolean(otpEmailResult?.success);
         if (!emailSent) {
           existingPendingBooking.lastOtpSent = undefined;
           await existingPendingBooking.save();
           console.warn('Pending booking OTP email failed:', otpEmailResult?.error || otpEmailResult?.message);
         }

         message = emailSent
           ? 'Pending booking found. A new OTP was sent to your email.'
           : getBookingEmailFailureMessage();
       } else {
         await existingPendingBooking.save();
       }

       return res.status(200).json({
         message,
         bookingId: existingPendingBooking._id,
         totalPrice: existingPendingBooking.totalPrice,
         emailSent,
         requiresOTP: true
       });
     }

     const otp = generateSecureOTP();
     const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

     const booking = new Booking({
       user: req.user.id,
       event: eventId,
       numberOfTickets,
       totalPrice: event.price * numberOfTickets,
       attendeeDetails,
       status: 'pending',
       paymentStatus: 'pending',
       otp,
       otpExpires,
       lastOtpSent: new Date()
     });

     await booking.save();

     console.log('[Booking] Created booking', booking._id, 'for user', req.user.id);

     const otpEmailResult = await sendOTPEmail(req.user.email, otp, req.user.name, event.title || 'Event Booking');
     const emailSent = Boolean(otpEmailResult?.success);
     if (!emailSent) {
       booking.lastOtpSent = undefined;
       await booking.save();
       console.warn('OTP email failed:', otpEmailResult?.error || otpEmailResult?.message);
     }

     await Notification.create({
       user: booking.user,
       title: 'Booking Pending',
       message: `Your booking for "${event.title}" is pending OTP verification`,
       type: 'booking',
       link: `/bookings/${booking._id}/confirm`
     });

     if (event.organizer) {
       await Notification.create({
         user: event.organizer._id,
         title: 'New Booking Pending',
         message: `${req.user.name} started a booking for "${event.title}"`,
         type: 'booking',
         link: '/host/bookings'
       });
       sendImportantEmail(
         event.organizer,
         'New booking pending',
         `${req.user.name} started a booking for "${event.title}". The booking is waiting for OTP verification.`,
         '/host/bookings'
       );
     }

     res.status(201).json({
       message: emailSent
         ? 'Booking created. Please verify OTP sent to your email.'
         : getBookingEmailFailureMessage(),
       bookingId: booking._id,
       totalPrice: event.price * numberOfTickets,
       requiresOTP: true,
       emailSent
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

     if (!booking.otpExpires || booking.otpExpires < new Date()) {
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

     const event = await Event.findById(booking.event).populate('organizer', 'name email');
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
     )
       .then(result => {
         if (!result?.success) console.warn('Confirmation email failed:', result?.error || result?.message);
       })
       .catch(err => console.error('Confirmation email error:', err.message));

     await Notification.create({
       user: booking.user,
       title: 'Booking Confirmed',
       message: `Your booking for "${event.title}" is confirmed`,
       type: 'booking',
       link: `/bookings/${booking._id}/confirmation`
     });

     if (event.organizer) {
       await Notification.create({
         user: event.organizer._id,
         title: 'Booking Confirmed',
         message: `${req.user.name}'s booking for "${event.title}" is confirmed`,
         type: 'booking',
         link: '/host/bookings'
       });
       sendImportantEmail(
         event.organizer,
         'Booking confirmed',
         `${req.user.name}'s booking for "${event.title}" is confirmed for ${booking.numberOfTickets} ticket(s).`,
         '/host/bookings'
       );
     }

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
      if (booking.lastOtpSent && booking.lastOtpSent > oneMinuteAgo) {
        return res.status(429).json({
          message: `Please wait ${OTP_RATE_LIMIT_SECONDS} seconds before requesting another OTP`
        });
      }

     const otp = generateSecureOTP();
     const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

     const event = await Event.findById(booking.event).select('title');

     booking.otp = otp;
     booking.otpExpires = otpExpires;
     booking.lastOtpSent = new Date();
     await booking.save();

     const otpEmailResult = await sendOTPEmail(req.user.email, otp, req.user.name, event?.title || 'Event Booking');
     if (!otpEmailResult?.success) {
       booking.lastOtpSent = undefined;
       await booking.save();
       console.warn('Resend OTP email failed:', otpEmailResult?.error || otpEmailResult?.message);
       return res.status(502).json({ message: getBookingEmailFailureMessage(), emailSent: false });
     }

     res.json({ message: 'OTP resent successfully', emailSent: true });
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

     const event = await Event.findById(booking.event._id).populate('organizer', 'name email');

     await Notification.create({
       user: booking.user,
       title: 'Booking Cancelled',
       message: `Your booking for "${event.title}" was cancelled`,
       type: 'booking',
       link: '/dashboard'
     });

     sendImportantEmail(
       req.user,
       'Booking cancelled',
       `Your booking for "${event.title}" was cancelled.`,
       '/dashboard'
     );

     if (event.organizer) {
       await Notification.create({
         user: event.organizer._id,
         title: 'Booking Cancelled',
         message: `Booking for "${event.title}" was cancelled`,
         type: 'booking',
         link: '/host/bookings'
       });
       sendImportantEmail(
         event.organizer,
         'Booking cancelled',
         `${req.user.name}'s booking for "${event.title}" was cancelled.`,
         '/host/bookings'
       );
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

     if (booking.status === 'confirmed') {
       return res.status(400).json({ message: 'Booking already confirmed' });
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
     )
       .then(result => {
         if (!result?.success) console.warn('Confirmation email failed:', result?.error || result?.message);
       })
       .catch(err => console.error('Confirmation email error:', err.message));

     await Notification.create({
       user: booking.user._id,
       title: 'Booking Confirmed',
       message: `Your booking for "${booking.event.title}" is confirmed`,
       type: 'booking',
       link: `/bookings/${booking._id}/confirmation`
     });

     res.json({ message: 'Booking confirmed successfully', booking });
   } catch (error) {
     console.error('Confirm booking error:', error);
     res.status(500).json({ message: 'Server error' });
   }
 };

exports.rejectBooking = async (req, res) => {
   try {
     const booking = await Booking.findById(req.params.id)
       .populate('event', 'title')
       .populate('user', 'name email');

     if (!booking) {
       return res.status(404).json({ message: 'Booking not found' });
     }

     booking.status = 'rejected';
     booking.cancelledAt = new Date();
     await booking.save();

     await Notification.create({
       user: booking.user._id,
       title: 'Booking Rejected',
       message: `Your booking for "${booking.event.title}" was rejected`,
       type: 'booking',
       link: '/dashboard'
     });

     sendImportantEmail(
       booking.user,
       'Booking rejected',
       `Your booking for "${booking.event.title}" was rejected by the host.`,
       '/dashboard'
     );

     res.json({ message: 'Booking rejected successfully' });
   } catch (error) {
     console.error('Reject booking error:', error);
     res.status(500).json({ message: 'Server error' });
   }
 };
