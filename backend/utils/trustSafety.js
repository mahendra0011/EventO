const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const User = require('../models/User');
const { logActivity } = require('./activity');

const PLATFORM_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE || 0.1);
const ESCROW_HOLD_HOURS = Number(process.env.ESCROW_HOLD_HOURS || 48);
const NEW_HOST_EVENT_LIMIT = Number(process.env.NEW_HOST_EVENT_LIMIT || 3);
const LOW_HOST_RATING_THRESHOLD = Number(process.env.LOW_HOST_RATING_THRESHOLD || 2.5);
const LOW_HOST_RATING_MIN_REVIEWS = Number(process.env.LOW_HOST_RATING_MIN_REVIEWS || 3);

const getId = (value) => value?._id || value?.id || value;

const isVerifiedHost = (user) => Boolean(
  user &&
  user.role === 'host' &&
  user.isVerified &&
  user.phoneVerification?.status === 'verified' &&
  user.hostVerification?.status === 'approved' &&
  user.bankAccount?.verificationStatus === 'verified' &&
  !user.isBlocked &&
  user.hostVerification?.status !== 'suspended' &&
  user.hostTrust?.badge !== 'suspended'
);

const isSuspendedHost = (user) => Boolean(
  user?.isBlocked ||
  user?.hostVerification?.status === 'suspended' ||
  user?.hostTrust?.badge === 'suspended'
);

const getHostBadge = (user) => {
  if (isSuspendedHost(user)) return 'suspended';
  if (isVerifiedHost(user)) return 'verified';
  return 'new';
};

const getHostChecklist = (user) => {
  const missing = [];
  if (!user?.isVerified) missing.push('Email OTP verification');
  if (user?.phoneVerification?.status !== 'verified') missing.push('Phone OTP verification');
  if (user?.hostVerification?.status !== 'approved') missing.push('Government ID and selfie KYC approval');
  if (user?.bankAccount?.verificationStatus !== 'verified') missing.push('Bank account verification');
  return missing;
};

const getHostPublishReadiness = async (user) => {
  const hostId = getId(user);
  const badge = getHostBadge(user);
  const eventLimit = user?.hostTrust?.eventPublishLimit || NEW_HOST_EVENT_LIMIT;
  const totalHostEvents = hostId
    ? await Event.countDocuments({ organizer: hostId, publishStatus: { $ne: 'cancelled' } })
    : 0;
  const missing = getHostChecklist(user);
  const suspended = isSuspendedHost(user);

  if (suspended) {
    missing.unshift(user?.hostTrust?.suspensionReason || 'Host account is suspended');
  }

  const canPublish = badge === 'verified' && missing.length === 0;
  const canCreate = badge === 'verified' || totalHostEvents < eventLimit;

  return {
    badge,
    canPublish,
    canCreate,
    eventLimit,
    totalHostEvents,
    remainingDraftSlots: badge === 'verified' ? null : Math.max(0, eventLimit - totalHostEvents),
    missing,
    message: canPublish
      ? 'Host is verified. Events can be published.'
      : `Event will stay unpublished until: ${missing.join(', ')}`
  };
};

const applyHostBadge = async (user, save = true) => {
  if (!user || user.role !== 'host') return user;
  user.hostTrust = user.hostTrust || {};
  user.hostTrust.badge = getHostBadge(user);
  if (save) await user.save();
  return user;
};

const applyEscrowHold = (booking, event) => {
  const totalPrice = Number(booking.totalPrice || 0);
  if (totalPrice <= 0) {
    booking.escrowStatus = 'none';
    booking.platformFeeAmount = 0;
    booking.hostPayoutAmount = 0;
    return;
  }

  const eventDate = event?.date ? new Date(event.date) : new Date();
  const baseDate = Number.isNaN(eventDate.getTime()) ? new Date() : eventDate;
  booking.paymentStatus = 'completed';
  booking.escrowStatus = 'held';
  booking.escrowHeldAt = booking.escrowHeldAt || new Date();
  booking.escrowReleaseEligibleAt = new Date(baseDate.getTime() + ESCROW_HOLD_HOURS * 60 * 60 * 1000);
  booking.platformFeeAmount = Math.round(totalPrice * PLATFORM_FEE_RATE);
  booking.hostPayoutAmount = totalPrice - booking.platformFeeAmount;
};

const releaseEscrowForBooking = async (booking, { req, force = false, notes = '' } = {}) => {
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.paymentStatus !== 'completed' || !['held', 'eligible'].includes(booking.escrowStatus)) {
    throw new Error('Booking is not holding releasable escrow');
  }

  if (!force && booking.escrowReleaseEligibleAt && booking.escrowReleaseEligibleAt > new Date()) {
    throw new Error('Escrow is not eligible for release yet');
  }

  booking.escrowStatus = 'released';
  booking.escrowReleasedAt = new Date();
  if (notes) booking.payoutNotes = notes;
  await booking.save();

  const event = await Event.findById(booking.event).populate('organizer', 'name email');
  if (event?.organizer) {
    await Notification.create({
      user: event.organizer._id,
      title: 'Payout released',
      message: `Payout of INR ${Number(booking.hostPayoutAmount || 0).toLocaleString('en-IN')} was released for "${event.title}".`,
      type: 'booking',
      link: '/host?tab=bookings'
    });
  }

  await logActivity({
    req,
    action: 'escrow.released',
    entity: 'Booking',
    entityId: booking._id,
    message: `Escrow released for booking ${booking._id}`,
    metadata: { hostPayoutAmount: booking.hostPayoutAmount, force }
  });

  return booking;
};

const refundBookingsForEvent = async (eventId, { req, reason = 'Event was cancelled or suspended' } = {}) => {
  const bookings = await Booking.find({
    event: eventId,
    paymentStatus: 'completed',
    status: { $in: ['pending', 'confirmed'] }
  }).populate('user', 'name email');

  let refundedAmount = 0;
  let refundedTickets = 0;

  for (const booking of bookings) {
    refundedAmount += Number(booking.totalPrice || 0);
    refundedTickets += booking.status === 'confirmed' ? Number(booking.numberOfTickets || 0) : 0;
    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.refundStatus = 'processed';
    booking.refundReason = reason;
    booking.escrowStatus = 'refunded';
    booking.escrowRefundedAt = new Date();
    booking.cancelledAt = booking.cancelledAt || new Date();
    await booking.save();

    await Notification.create({
      user: booking.user._id || booking.user,
      title: 'Ticket refunded',
      message: `${reason}. Your payment has been marked refunded.`,
      type: 'booking',
      link: '/dashboard?tab=payments'
    });
  }

  if (refundedTickets > 0) {
    const event = await Event.findById(eventId).select('availableTickets totalTickets');
    if (event) {
      event.availableTickets = Math.min(event.totalTickets, event.availableTickets + refundedTickets);
      await event.save();
    }
  }

  if (bookings.length > 0) {
    await logActivity({
      req,
      action: 'escrow.refunded_event',
      entity: 'Event',
      entityId: eventId,
      message: `Refunded ${bookings.length} booking(s) for event`,
      metadata: { refundedAmount, reason }
    });
  }

  return { refundedBookings: bookings.length, refundedAmount };
};

const notifyAdmins = async ({ title, message, link = '/admin?tab=fraud' }) => {
  const admins = await User.find({ role: 'admin', isBlocked: false }).select('_id');
  if (admins.length === 0) return 0;
  await Notification.insertMany(admins.map((admin) => ({
    user: admin._id,
    title,
    message,
    type: 'security',
    link
  })));
  return admins.length;
};

const syncHostRating = async (hostId, { req } = {}) => {
  if (!hostId) return null;
  const id = new mongoose.Types.ObjectId(hostId);
  const result = await Review.aggregate([
    { $match: { host: id } },
    { $group: { _id: '$host', average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  const rating = result[0] || { average: 0, count: 0 };
  const host = await User.findById(hostId);
  if (!host) return null;

  host.hostTrust = host.hostTrust || {};
  host.hostTrust.ratingAverage = Number((rating.average || 0).toFixed(1));
  host.hostTrust.ratingCount = rating.count || 0;

  if (
    host.role === 'host' &&
    !isSuspendedHost(host) &&
    host.hostTrust.ratingCount >= LOW_HOST_RATING_MIN_REVIEWS &&
    host.hostTrust.ratingAverage < LOW_HOST_RATING_THRESHOLD
  ) {
    host.isBlocked = true;
    host.hostVerification = host.hostVerification || {};
    host.hostVerification.status = 'suspended';
    host.hostTrust.badge = 'suspended';
    host.hostTrust.lowRatingSuspendedAt = new Date();
    host.hostTrust.suspensionReason = `Low host rating: ${host.hostTrust.ratingAverage}/5`;

    await notifyAdmins({
      title: 'Host auto-suspended',
      message: `${host.name} was auto-suspended for low rating (${host.hostTrust.ratingAverage}/5).`,
      link: '/admin?tab=users'
    });

    await logActivity({
      req,
      actor: host._id,
      action: 'host.auto_suspended_low_rating',
      entity: 'User',
      entityId: host._id,
      message: `Host auto-suspended for rating ${host.hostTrust.ratingAverage}/5`
    });
  } else {
    host.hostTrust.badge = getHostBadge(host);
  }

  await host.save();
  return host;
};

module.exports = {
  ESCROW_HOLD_HOURS,
  NEW_HOST_EVENT_LIMIT,
  applyEscrowHold,
  applyHostBadge,
  getHostBadge,
  getHostChecklist,
  getHostPublishReadiness,
  isSuspendedHost,
  isVerifiedHost,
  notifyAdmins,
  refundBookingsForEvent,
  releaseEscrowForBooking,
  syncHostRating
};
