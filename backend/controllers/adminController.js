const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const SupportTicket = require('../models/SupportTicket');
const Location = require('../models/Location');
const EventReport = require('../models/EventReport');
const { clearUserCache } = require('../middleware/auth');
const { logActivity } = require('../utils/activity');
const { sendBookingConfirmationEmail, sendImportantNotificationEmail } = require('../utils/email');
const {
  applyHostBadge,
  notifyAdmins,
  refundBookingsForEvent,
  releaseEscrowForBooking,
  syncHostRating
} = require('../utils/trustSafety');

const PLATFORM_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE || 0.1);

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const csvEscape = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const sendCsv = (res, filename, rows) => {
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
};

const monthStart = (monthsBack = 6) => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsBack);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getRevenuePipeline = (dateField = '$confirmedAt') => ([
  { $match: { status: 'confirmed', paymentStatus: { $in: ['completed', 'refunded'] }, confirmedAt: { $gte: monthStart(6) } } },
  {
    $group: {
      _id: {
        year: { $year: dateField },
        month: { $month: dateField }
      },
      revenue: { $sum: '$totalPrice' },
      count: { $sum: 1 },
      tickets: { $sum: '$numberOfTickets' }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } }
]);

const buildFraudSignals = async () => {
  const suspiciousBookings = await Booking.find({
    $or: [
      { paymentAttempts: { $gte: 3 } },
      { paymentStatus: 'failed' },
      { disputeStatus: { $in: ['open', 'under_review'] } }
    ]
  })
    .populate('event', 'title organizer')
    .populate('user', 'name email')
    .sort({ bookingDate: -1 })
    .limit(30);

  const fakeEventPattern = /(fake|spam|scam|copyright|duplicate|test event)/i;
  const flaggedEvents = await Event.find({
    $or: [
      { moderationStatus: { $ne: 'approved' } },
      { moderationFlags: { $exists: true, $ne: [] } },
      { reportCount: { $gte: 3 } },
      { title: fakeEventPattern },
      { description: fakeEventPattern }
    ]
  })
    .populate('organizer', 'name email')
    .sort({ updatedAt: -1 })
    .limit(30);

  const spamUserCandidates = await Booking.aggregate([
    { $match: { status: 'pending' } },
    { $group: { _id: '$user', pendingBookings: { $sum: 1 }, paymentAttempts: { $sum: '$paymentAttempts' } } },
    { $match: { $or: [{ pendingBookings: { $gte: 3 } }, { paymentAttempts: { $gte: 5 } }] } },
    { $sort: { pendingBookings: -1 } },
    { $limit: 30 }
  ]);
  const spamUsers = await User.populate(spamUserCandidates, { path: '_id', select: 'name email role isBlocked isVerified createdAt' });

  const fraudOrganizerCandidates = await Event.aggregate([
    {
      $group: {
        _id: '$organizer',
        totalEvents: { $sum: 1 },
        inactiveEvents: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
        rejectedEvents: { $sum: { $cond: [{ $eq: ['$moderationStatus', 'rejected'] }, 1, 0] } },
        pendingEvents: { $sum: { $cond: [{ $eq: ['$moderationStatus', 'pending'] }, 1, 0] } },
        flaggedEvents: {
          $sum: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$moderationFlags', []] } }, 0] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $match: {
        $or: [
          { rejectedEvents: { $gte: 1 } },
          { flaggedEvents: { $gte: 1 } },
          { inactiveEvents: { $gte: 3 } },
          { pendingEvents: { $gte: 3 } }
        ]
      }
    },
    { $sort: { flaggedEvents: -1, rejectedEvents: -1, inactiveEvents: -1 } },
    { $limit: 30 }
  ]);
  const fraudOrganizers = await User.populate(fraudOrganizerCandidates, { path: '_id', select: 'name email phone isBlocked isVerified' });

  return {
    suspiciousBookings,
    flaggedEvents,
    spamUsers,
    fraudOrganizers,
    summary: {
      suspiciousBookings: suspiciousBookings.length,
      flaggedEvents: flaggedEvents.length,
      spamUsers: spamUsers.length,
      fraudOrganizers: fraudOrganizers.length,
      openReports: await EventReport.countDocuments({ status: 'open' })
    }
  };
};

exports.getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalOrganizers,
      totalAdmins,
      blockedUsers,
      totalEvents,
      activeEvents,
      featuredEvents,
      trendingEvents,
      pendingApprovals,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      refundRequests,
      totalRevenueResult,
      todaySalesResult,
      revenueByMonth,
      ticketSalesTrend,
      categoryWiseEvents,
      userGrowth,
      topEvents,
      recentBookings,
      recentUsers,
      recentSecurityLogs,
      openSupportTickets,
      activeLocations,
      highRiskBookings,
      reportedEvents,
      suspendedEvents,
      escrowHeldResult,
      releasedPayoutResult,
      refundedEscrowResult
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'host' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isBlocked: true }),
      Event.countDocuments(),
      Event.countDocuments({ isActive: true }),
      Event.countDocuments({ isFeatured: true }),
      Event.countDocuments({ isTrending: true }),
      Event.countDocuments({ moderationStatus: 'pending' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: { $in: ['cancelled', 'rejected'] } }),
      Booking.countDocuments({ paymentStatus: 'refunded' }),
      Booking.aggregate([
        { $match: { status: 'confirmed', paymentStatus: { $in: ['completed', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' }, tickets: { $sum: '$numberOfTickets' } } }
      ]),
      Booking.aggregate([
        { $match: { status: 'confirmed', confirmedAt: { $gte: todayStart } } },
        { $group: { _id: null, revenue: { $sum: '$totalPrice' }, tickets: { $sum: '$numberOfTickets' }, bookings: { $sum: 1 } } }
      ]),
      Booking.aggregate(getRevenuePipeline('$confirmedAt')),
      Booking.aggregate(getRevenuePipeline('$confirmedAt')),
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: monthStart(6) } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: '$event', bookings: { $sum: 1 }, tickets: { $sum: '$numberOfTickets' }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { revenue: -1 } },
        { $limit: 8 }
      ]),
      Booking.find()
        .populate('event', 'title date venue')
        .populate('user', 'name email')
        .sort({ bookingDate: -1 })
        .limit(8),
      User.find().select('-password -otp -loginOtp -emailVerificationOtp -passwordResetToken -phoneVerification.otp').sort({ createdAt: -1 }).limit(8),
      ActivityLog.find().populate('actor', 'name email role').sort({ createdAt: -1 }).limit(8),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Location.countDocuments({ isActive: true }),
      Booking.countDocuments({
        $or: [
          { paymentAttempts: { $gte: 3 } },
          { paymentStatus: 'failed' },
          { disputeStatus: { $in: ['open', 'under_review'] } }
        ]
      }),
      Event.countDocuments({ reportCount: { $gte: 3 } }),
      Event.countDocuments({ publishStatus: 'suspended' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'completed', escrowStatus: { $in: ['held', 'eligible'] } } },
        { $group: { _id: null, amount: { $sum: '$hostPayoutAmount' }, bookings: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        { $match: { escrowStatus: 'released' } },
        { $group: { _id: null, amount: { $sum: '$hostPayoutAmount' }, bookings: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        { $match: { paymentStatus: 'refunded' } },
        { $group: { _id: null, amount: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } }
      ])
    ]);

    const topEventsWithDetails = await Event.populate(topEvents, { path: '_id', select: 'title date venue category organizer' });
    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const todaySales = todaySalesResult[0] || { revenue: 0, tickets: 0, bookings: 0 };

    res.json({
      stats: {
        totalUsers,
        totalOrganizers,
        totalAdmins,
        blockedUsers,
        totalEvents,
        activeEvents,
        featuredEvents,
        trendingEvents,
        pendingApprovals,
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        refundRequests,
        totalRevenue,
        platformEarnings: Math.round(totalRevenue * PLATFORM_FEE_RATE),
        organizerPayouts: Math.round(totalRevenue * (1 - PLATFORM_FEE_RATE)),
        todayTicketSales: todaySales.tickets || 0,
        todayRevenue: todaySales.revenue || 0,
        todayBookings: todaySales.bookings || 0,
        openSupportTickets,
        activeLocations,
        highRiskBookings,
        reportedEvents,
        suspendedEvents,
        escrowHeld: escrowHeldResult[0]?.amount || 0,
        releasedPayouts: releasedPayoutResult[0]?.amount || 0,
        refundedAmount: refundedEscrowResult[0]?.amount || 0
      },
      charts: {
        revenueByMonth,
        ticketSalesTrend,
        categoryWiseEvents,
        userGrowth,
        topEvents: topEventsWithDetails
      },
      recentBookings,
      recentUsers,
      recentSecurityLogs
    });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { search = '', role = '', status = '', page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status === 'blocked') query.isBlocked = true;
    if (status === 'active') query.isBlocked = false;
    if (status === 'verified') query.isVerified = true;
    if (status === 'unverified') query.isVerified = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = toInt(page, 1);
    const pageSize = toInt(limit, 20);
    const [users, count] = await Promise.all([
      User.find(query)
        .select('-password -otp -loginOtp -emailVerificationOtp -passwordResetToken -phoneVerification.otp')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip((pageNumber - 1) * pageSize),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      totalPages: Math.ceil(count / pageSize),
      currentPage: pageNumber,
      totalUsers: count
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      phone,
      role,
      isVerified,
      isBlocked,
      hostVerificationStatus,
      hostVerificationNotes,
      bankVerificationStatus,
      bankNotes,
      phoneVerificationStatus,
      eventPublishLimit,
      hostBadge,
      suspensionReason
    } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSelf = user._id.toString() === req.user.id;
    if (isSelf && (role && role !== 'admin')) {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }
    if (isSelf && isBlocked === true) {
      return res.status(400).json({ message: 'You cannot block your own account' });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) {
      if (!['user', 'host', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = role;
    }
    if (isVerified !== undefined) user.isVerified = Boolean(isVerified);
    if (isBlocked !== undefined) user.isBlocked = Boolean(isBlocked);
    if (phoneVerificationStatus !== undefined) {
      if (!['unverified', 'pending', 'verified'].includes(phoneVerificationStatus)) {
        return res.status(400).json({ message: 'Invalid phone verification status' });
      }
      user.phoneVerification = {
        ...(user.phoneVerification?.toObject?.() || user.phoneVerification || {}),
        status: phoneVerificationStatus,
        verifiedAt: phoneVerificationStatus === 'verified' ? (user.phoneVerification?.verifiedAt || new Date()) : undefined,
        otp: undefined,
        otpExpires: undefined
      };
    }
    if (hostVerificationStatus !== undefined) {
      if (!['unsubmitted', 'pending', 'approved', 'rejected', 'suspended'].includes(hostVerificationStatus)) {
        return res.status(400).json({ message: 'Invalid host verification status' });
      }
      user.hostVerification = {
        ...(user.hostVerification?.toObject?.() || user.hostVerification || {}),
        status: hostVerificationStatus,
        notes: hostVerificationNotes !== undefined ? hostVerificationNotes : user.hostVerification?.notes,
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      };
      if (hostVerificationStatus === 'suspended') user.isBlocked = true;
    }
    if (bankVerificationStatus !== undefined) {
      if (!['unsubmitted', 'pending', 'verified', 'rejected'].includes(bankVerificationStatus)) {
        return res.status(400).json({ message: 'Invalid bank verification status' });
      }
      user.bankAccount = {
        ...(user.bankAccount?.toObject?.() || user.bankAccount || {}),
        verificationStatus: bankVerificationStatus,
        notes: bankNotes !== undefined ? bankNotes : user.bankAccount?.notes,
        verifiedAt: bankVerificationStatus === 'verified' ? (user.bankAccount?.verifiedAt || new Date()) : undefined,
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      };
    }
    if (eventPublishLimit !== undefined) {
      user.hostTrust = user.hostTrust || {};
      user.hostTrust.eventPublishLimit = Math.max(0, Number(eventPublishLimit) || 0);
    }
    if (hostBadge === 'suspended') {
      user.hostTrust = user.hostTrust || {};
      user.hostTrust.badge = 'suspended';
      user.hostTrust.suspensionReason = suspensionReason || user.hostTrust.suspensionReason || 'Suspended by admin';
      user.hostVerification = {
        ...(user.hostVerification?.toObject?.() || user.hostVerification || {}),
        status: 'suspended',
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      };
      user.isBlocked = true;
    }

    if (user.role === 'host' && hostBadge !== 'suspended') {
      if (user.isBlocked === false && user.hostVerification?.status !== 'suspended' && user.hostTrust?.badge === 'suspended') {
        user.hostTrust.badge = 'new';
        user.hostTrust.lowRatingSuspendedAt = undefined;
        user.hostTrust.suspensionReason = suspensionReason !== undefined ? suspensionReason : user.hostTrust.suspensionReason;
      }
      await applyHostBadge(user, false);
    }

    await user.save();
    clearUserCache(user._id);

    await logActivity({
      req,
      action: 'admin.user_updated',
      entity: 'User',
      entityId: user._id,
      message: `Admin updated ${user.email}`,
      metadata: { role: user.role, isBlocked: user.isBlocked, isVerified: user.isVerified }
    });

    res.json(await User.findById(user._id).select('-password -otp -loginOtp -emailVerificationOtp -passwordResetToken -phoneVerification.otp'));
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserRole = async (req, res) => {
  req.body = { role: req.body.role };
  return exports.updateUser(req, res);
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    clearUserCache(req.params.id);
    await logActivity({
      req,
      action: 'admin.user_deleted',
      entity: 'User',
      entityId: user._id,
      message: `Admin deleted ${user.email}`
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const { search = '', category = '', status = '', moderation = '', page = 1, limit = 20 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (moderation) query.moderationStatus = moderation;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = toInt(page, 1);
    const pageSize = toInt(limit, 20);
    const [events, count] = await Promise.all([
      Event.find(query)
        .populate('organizer', 'name email phone hostTrust hostVerification phoneVerification bankAccount')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip((pageNumber - 1) * pageSize),
      Event.countDocuments(query)
    ]);

    res.json({
      events,
      totalPages: Math.ceil(count / pageSize),
      currentPage: pageNumber,
      totalEvents: count
    });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const allowedFields = [
      'title',
      'description',
      'date',
      'time',
      'venue',
      'location',
      'category',
      'image',
      'price',
      'totalTickets',
      'availableTickets',
      'isActive',
      'isFeatured',
      'isTrending',
      'publishStatus',
      'moderationStatus',
      'moderationFlags',
      'moderationNotes',
      'tags'
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.date) updates.date = new Date(updates.date);
    if (updates.moderationStatus && !['pending', 'approved', 'rejected'].includes(updates.moderationStatus)) {
      return res.status(400).json({ message: 'Invalid moderation status' });
    }
    if (updates.publishStatus && !['draft', 'pending_verification', 'published', 'suspended', 'cancelled'].includes(updates.publishStatus)) {
      return res.status(400).json({ message: 'Invalid publish status' });
    }
    if (updates.moderationStatus === 'approved' && updates.publishStatus === undefined) {
      updates.publishStatus = 'published';
      if (updates.isActive === undefined) updates.isActive = true;
    }
    if (updates.moderationStatus === 'rejected' && updates.publishStatus === undefined) {
      updates.publishStatus = 'suspended';
      updates.isActive = false;
    }
    if (updates.publishStatus === 'suspended') {
      updates.isActive = false;
      updates.suspendedAt = new Date();
      updates.suspensionReason = updates.moderationNotes || 'Suspended by admin';
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('organizer', 'name email phone');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await logActivity({
      req,
      action: 'admin.event_updated',
      entity: 'Event',
      entityId: event._id,
      message: `Admin updated event ${event.title}`
    });

    let refundResult = null;
    if (
      event.publishStatus === 'suspended' ||
      event.publishStatus === 'cancelled' ||
      event.moderationStatus === 'rejected' ||
      event.isActive === false
    ) {
      refundResult = await refundBookingsForEvent(event._id, {
        req,
        reason: `Event "${event.title}" was ${event.publishStatus || event.moderationStatus} by admin`
      });
    }

    res.json({ ...event.toObject(), refundResult });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await logActivity({
      req,
      action: 'admin.event_deleted',
      entity: 'Event',
      entityId: event._id,
      message: `Admin deleted event ${event.title}`
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { status = '', paymentStatus = '', page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const pageNumber = toInt(page, 1);
    const pageSize = toInt(limit, 20);
    const [bookings, count] = await Promise.all([
      Booking.find(query)
        .populate('event', 'title date time venue price organizer category')
        .populate('user', 'name email phone')
        .sort({ bookingDate: -1 })
        .limit(pageSize)
        .skip((pageNumber - 1) * pageSize),
      Booking.countDocuments(query)
    ]);

    res.json({
      bookings,
      totalPages: Math.ceil(count / pageSize),
      currentPage: pageNumber,
      totalBookings: count
    });
  } catch (error) {
    console.error('Get admin bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { status, paymentStatus, paymentAttempts, refundStatus, refundReason, disputeStatus, notes } = req.body;
    const booking = await Booking.findById(req.params.id).populate('event', 'title availableTickets');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const previousStatus = booking.status;
    const previousRefundStatus = booking.refundStatus;
    const previousDisputeStatus = booking.disputeStatus;
    if (status) {
      if (!['pending', 'confirmed', 'cancelled', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid booking status' });
      }
      booking.status = status;
      if (status === 'confirmed') booking.confirmedAt = booking.confirmedAt || new Date();
      if (['cancelled', 'rejected'].includes(status)) booking.cancelledAt = booking.cancelledAt || new Date();
    }

    if (paymentStatus) {
      if (!['pending', 'completed', 'failed', 'refunded'].includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }
      booking.paymentStatus = paymentStatus;
      if (paymentStatus === 'refunded') {
        booking.escrowStatus = 'refunded';
        booking.escrowRefundedAt = booking.escrowRefundedAt || new Date();
      }
    }
    if (paymentAttempts !== undefined) booking.paymentAttempts = Number(paymentAttempts) || 0;
    if (refundStatus) {
      if (!['none', 'requested', 'approved', 'rejected', 'processed'].includes(refundStatus)) {
        return res.status(400).json({ message: 'Invalid refund status' });
      }
      booking.refundStatus = refundStatus;
      if (refundStatus === 'processed') {
        booking.paymentStatus = 'refunded';
        booking.escrowStatus = 'refunded';
        booking.escrowRefundedAt = booking.escrowRefundedAt || new Date();
      }
    }
    if (refundReason !== undefined) booking.refundReason = refundReason;
    if (disputeStatus) {
      if (!['none', 'open', 'under_review', 'resolved', 'rejected'].includes(disputeStatus)) {
        return res.status(400).json({ message: 'Invalid dispute status' });
      }
      booking.disputeStatus = disputeStatus;
      if (['open', 'under_review'].includes(disputeStatus) && booking.escrowStatus === 'held') {
        booking.escrowStatus = 'disputed';
      }
      if (disputeStatus === 'resolved' && booking.escrowStatus === 'disputed') {
        booking.escrowStatus = booking.escrowReleaseEligibleAt && booking.escrowReleaseEligibleAt <= new Date()
          ? 'eligible'
          : 'held';
      }
    }
    if (notes !== undefined) booking.notes = notes;

    await booking.save();

    if (
      previousStatus === 'confirmed' &&
      ['cancelled', 'rejected'].includes(booking.status) &&
      booking.event
    ) {
      await Event.findByIdAndUpdate(booking.event._id, { $inc: { availableTickets: booking.numberOfTickets } });
    }

    await logActivity({
      req,
      action: 'admin.booking_updated',
      entity: 'Booking',
      entityId: booking._id,
      message: `Admin updated booking ${booking._id}`,
      metadata: { status: booking.status, paymentStatus: booking.paymentStatus }
    });

    if (refundStatus && refundStatus !== previousRefundStatus) {
      await Notification.create({
        user: booking.user,
        title: `Refund ${refundStatus}`,
        message: `Your refund request has been marked as ${refundStatus}.`,
        type: 'booking',
        link: '/dashboard?tab=support'
      });
    }

    if (disputeStatus && disputeStatus !== previousDisputeStatus) {
      await Notification.create({
        user: booking.user,
        title: `Payment dispute ${disputeStatus}`,
        message: `Your payment dispute has been marked as ${disputeStatus}.`,
        type: 'booking',
        link: '/dashboard?tab=support'
      });
    }

    res.json(await Booking.findById(booking._id).populate('event', 'title date time venue price').populate('user', 'name email phone'));
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refundBooking = async (req, res) => {
  req.body = { ...req.body, status: 'cancelled', paymentStatus: 'refunded', refundStatus: 'processed' };
  return exports.updateBooking(req, res);
};

exports.releaseBookingPayout = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await releaseEscrowForBooking(booking, {
      req,
      force: req.body.force === true,
      notes: req.body.notes || ''
    });

    res.json(await Booking.findById(booking._id).populate('event', 'title date time venue price organizer').populate('user', 'name email phone'));
  } catch (error) {
    console.error('Release payout error:', error);
    res.status(400).json({ message: error.message || 'Could not release payout' });
  }
};

exports.getPaymentsSummary = async (req, res) => {
  try {
    const [summary, byOrganizer, pendingTransactions, escrowSummary, releasableBookings] = await Promise.all([
      Booking.aggregate([
        { $match: { paymentStatus: { $in: ['completed', 'refunded', 'pending'] } } },
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        }
      ]),
      Booking.aggregate([
        { $match: { status: 'confirmed', paymentStatus: 'completed' } },
        {
          $lookup: {
            from: 'events',
            localField: 'event',
            foreignField: '_id',
            as: 'event'
          }
        },
        { $unwind: '$event' },
        {
          $group: {
            _id: '$event.organizer',
            revenue: { $sum: '$totalPrice' },
            bookings: { $sum: 1 },
            tickets: { $sum: '$numberOfTickets' }
          }
        },
        { $sort: { revenue: -1 } }
      ]),
      Booking.find({ paymentStatus: 'pending' })
        .populate('event', 'title')
        .populate('user', 'name email')
        .sort({ bookingDate: -1 })
        .limit(20),
      Booking.aggregate([
        { $match: { paymentStatus: { $in: ['completed', 'refunded'] } } },
        {
          $group: {
            _id: '$escrowStatus',
            count: { $sum: 1 },
            gross: { $sum: '$totalPrice' },
            payout: { $sum: '$hostPayoutAmount' }
          }
        }
      ]),
      Booking.find({
        paymentStatus: 'completed',
        escrowStatus: { $in: ['held', 'eligible'] },
        escrowReleaseEligibleAt: { $lte: new Date() }
      })
        .populate('event', 'title organizer')
        .populate('user', 'name email')
        .sort({ escrowReleaseEligibleAt: 1 })
        .limit(20)
    ]);

    const organizers = await User.populate(byOrganizer, { path: '_id', select: 'name email phone' });
    const completed = summary.find((item) => item._id === 'completed')?.revenue || 0;

    res.json({
      summary,
      totals: {
        grossRevenue: completed,
        platformEarnings: Math.round(completed * PLATFORM_FEE_RATE),
        organizerPayouts: Math.round(completed * (1 - PLATFORM_FEE_RATE)),
        escrowHeld: escrowSummary
          .filter((item) => ['held', 'eligible', 'disputed'].includes(item._id))
          .reduce((sum, item) => sum + item.payout, 0),
        releasedPayouts: escrowSummary.find((item) => item._id === 'released')?.payout || 0,
        refundedAmount: escrowSummary.find((item) => item._id === 'refunded')?.gross || 0,
        releasablePayouts: releasableBookings.reduce((sum, booking) => sum + (booking.hostPayoutAmount || 0), 0)
      },
      byOrganizer: organizers,
      pendingTransactions,
      escrowSummary,
      releasableBookings
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.create({
      name: name.trim(),
      description,
      createdBy: req.user.id
    });

    await logActivity({
      req,
      action: 'admin.category_created',
      entity: 'Category',
      entityId: category._id,
      message: `Admin created category ${category.name}`
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await logActivity({
      req,
      action: 'admin.category_updated',
      entity: 'Category',
      entityId: category._id,
      message: `Admin updated category ${category.name}`
    });

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await logActivity({
      req,
      action: 'admin.category_deleted',
      entity: 'Category',
      entityId: category._id,
      message: `Admin deleted category ${category.name}`
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'system',
      link = '',
      targetType = 'all',
      role = 'user',
      userId,
      sendEmail = false
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    let userQuery = { isBlocked: false };
    if (targetType === 'role') userQuery.role = role;
    if (targetType === 'user') userQuery = { _id: userId, isBlocked: false };

    const users = await User.find(userQuery).select('name email');
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users matched this notification target' });
    }

    await Notification.insertMany(users.map((targetUser) => ({
      user: targetUser._id,
      title,
      message,
      type,
      link
    })));

    if (sendEmail) {
      users.forEach((targetUser) => {
        sendImportantNotificationEmail(targetUser.email, targetUser.name, title, message, link)
          .then(result => {
            if (!result?.success) console.warn('Notification email failed:', result?.error || result?.message);
          })
          .catch(err => console.error('Notification email error:', err.message));
      });
    }

    await logActivity({
      req,
      action: 'admin.notification_sent',
      entity: 'Notification',
      message: `Admin sent notification "${title}" to ${users.length} user(s)`,
      metadata: { targetType, role, userId, sendEmail }
    });

    res.json({ message: 'Notification sent successfully', recipients: users.length });
  } catch (error) {
    console.error('Send admin notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('event', 'title')
      .populate('host', 'name email hostTrust')
      .sort({ createdAt: -1 })
      .limit(toInt(req.query.limit, 100));

    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.host) await syncHostRating(review.host, { req });

    await logActivity({
      req,
      action: 'admin.review_deleted',
      entity: 'Review',
      entityId: review._id,
      message: 'Admin deleted a review'
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSecurityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(toInt(req.query.limit, 100));

    res.json({ logs });
  } catch (error) {
    console.error('Get security logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSupportTickets = async (req, res) => {
  try {
    const { status = '', type = '', priority = '', limit = 100 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email phone role')
      .populate('event', 'title date venue')
      .populate('booking', 'numberOfTickets totalPrice status paymentStatus refundStatus disputeStatus')
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .limit(toInt(limit, 100));

    res.json({ tickets });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createSupportTicket = async (req, res) => {
  try {
    const { user, event, booking, type = 'general', subject, message, priority = 'medium', status = 'open' } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const ticket = await SupportTicket.create({
      user: user || undefined,
      event: event || undefined,
      booking: booking || undefined,
      type,
      subject,
      message,
      priority,
      status,
      createdBy: req.user.id,
      assignedTo: req.user.id
    });

    await logActivity({
      req,
      action: 'admin.support_ticket_created',
      entity: 'SupportTicket',
      entityId: ticket._id,
      message: `Admin created support ticket: ${ticket.subject}`
    });

    res.status(201).json(await SupportTicket.findById(ticket._id)
      .populate('user', 'name email phone role')
      .populate('event', 'title date venue')
      .populate('booking', 'numberOfTickets totalPrice status paymentStatus refundStatus disputeStatus')
      .populate('assignedTo', 'name email'));
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSupportTicket = async (req, res) => {
  try {
    const allowedFields = ['type', 'subject', 'message', 'priority', 'status', 'resolution', 'assignedTo'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (updates.status === 'resolved') updates.resolvedAt = new Date();

    const existingTicket = await SupportTicket.findById(req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('user', 'name email phone role')
      .populate('event', 'title date venue')
      .populate('booking', 'numberOfTickets totalPrice status paymentStatus refundStatus disputeStatus')
      .populate('assignedTo', 'name email');

    await logActivity({
      req,
      action: 'admin.support_ticket_updated',
      entity: 'SupportTicket',
      entityId: ticket._id,
      message: `Admin updated support ticket: ${ticket.subject}`
    });

    if (ticket.user && (ticket.status !== existingTicket.status || ticket.resolution !== existingTicket.resolution)) {
      await Notification.create({
        user: ticket.user._id,
        title: `Support ticket ${ticket.status}`,
        message: ticket.resolution || `Your support ticket "${ticket.subject}" is now ${ticket.status}.`,
        type: 'system',
        link: '/dashboard?tab=support'
      });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteSupportTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    await logActivity({
      req,
      action: 'admin.support_ticket_deleted',
      entity: 'SupportTicket',
      entityId: ticket._id,
      message: `Admin deleted support ticket: ${ticket.subject}`
    });

    res.json({ message: 'Support ticket deleted successfully' });
  } catch (error) {
    console.error('Delete support ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const [locations, eventCounts] = await Promise.all([
      Location.find().sort({ country: 1, region: 1, city: 1 }),
      Event.aggregate([
        { $group: { _id: '$location', events: { $sum: 1 }, activeEvents: { $sum: { $cond: ['$isActive', 1, 0] } } } }
      ])
    ]);

    const counts = eventCounts.reduce((acc, item) => {
      acc[String(item._id || '').toLowerCase()] = item;
      return acc;
    }, {});

    res.json({
      locations: locations.map((location) => {
        const exact = counts[String(location.city || '').toLowerCase()] || counts[String(`${location.city}, ${location.region}`).toLowerCase()];
        return {
          ...location.toObject(),
          eventCount: exact?.events || 0,
          activeEventCount: exact?.activeEvents || 0
        };
      })
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const { city, region = '', country = 'India', notes = '' } = req.body;
    if (!city || !city.trim()) {
      return res.status(400).json({ message: 'City is required' });
    }

    const location = await Location.create({
      city: city.trim(),
      region: region.trim(),
      country: country.trim() || 'India',
      notes,
      createdBy: req.user.id
    });

    await logActivity({
      req,
      action: 'admin.location_created',
      entity: 'Location',
      entityId: location._id,
      message: `Admin created location ${location.city}`
    });

    res.status(201).json(location);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Location already exists' });
    }
    console.error('Create location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const allowedFields = ['city', 'region', 'country', 'notes', 'isActive'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const location = await Location.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    await logActivity({
      req,
      action: 'admin.location_updated',
      entity: 'Location',
      entityId: location._id,
      message: `Admin updated location ${location.city}`
    });

    res.json(location);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    await logActivity({
      req,
      action: 'admin.location_deleted',
      entity: 'Location',
      entityId: location._id,
      message: `Admin deleted location ${location.city}`
    });

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFraudSignals = async (req, res) => {
  try {
    res.json(await buildFraudSignals());
  } catch (error) {
    console.error('Get fraud signals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdvancedAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      activeUsers,
      peakBookingHours,
      bookingTotals,
      organizerPerformance,
      revenueByOrganizer
    ] = await Promise.all([
      User.countDocuments({
        $or: [
          { lastLoginAt: { $gte: thirtyDaysAgo } },
          { createdAt: { $gte: thirtyDaysAgo } }
        ]
      }),
      Booking.aggregate([
        { $group: { _id: { hour: { $hour: '$bookingDate' } }, bookings: { $sum: 1 }, tickets: { $sum: '$numberOfTickets' } } },
        { $sort: { bookings: -1 } },
        { $limit: 8 }
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
            pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            cancelledBookings: { $sum: { $cond: [{ $in: ['$status', ['cancelled', 'rejected']] }, 1, 0] } }
          }
        }
      ]),
      Event.aggregate([
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'event',
            as: 'bookings'
          }
        },
        {
          $group: {
            _id: '$organizer',
            totalEvents: { $sum: 1 },
            activeEvents: { $sum: { $cond: ['$isActive', 1, 0] } },
            ticketsSold: {
              $sum: {
                $sum: {
                  $map: {
                    input: '$bookings',
                    as: 'booking',
                    in: { $cond: [{ $eq: ['$$booking.status', 'confirmed'] }, '$$booking.numberOfTickets', 0] }
                  }
                }
              }
            },
            revenue: {
              $sum: {
                $sum: {
                  $map: {
                    input: '$bookings',
                    as: 'booking',
                    in: { $cond: [{ $eq: ['$$booking.status', 'confirmed'] }, '$$booking.totalPrice', 0] }
                  }
                }
              }
            }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 20 }
      ]),
      Booking.aggregate([
        { $match: { status: 'confirmed', paymentStatus: { $in: ['completed', 'refunded'] } } },
        {
          $lookup: {
            from: 'events',
            localField: 'event',
            foreignField: '_id',
            as: 'event'
          }
        },
        { $unwind: '$event' },
        { $group: { _id: '$event.organizer', revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 20 }
      ])
    ]);

    const totals = bookingTotals[0] || { totalBookings: 0, confirmedBookings: 0, pendingBookings: 0, cancelledBookings: 0 };
    const conversionRate = totals.totalBookings
      ? Math.round((totals.confirmedBookings / totals.totalBookings) * 100)
      : 0;

    res.json({
      activeUsers,
      peakBookingHours,
      conversionRate,
      bookingTotals: totals,
      organizerPerformance: await User.populate(organizerPerformance, { path: '_id', select: 'name email phone' }),
      revenueByOrganizer: await User.populate(revenueByOrganizer, { path: '_id', select: 'name email phone' })
    });
  } catch (error) {
    console.error('Get advanced analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendEventReminder = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const bookings = await Booking.find({ event: event._id, status: 'confirmed' })
      .populate('user', 'name email');

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No confirmed attendees for this event' });
    }

    const title = `Reminder: ${event.title}`;
    const message = `Your event "${event.title}" is coming up on ${event.date.toDateString()} at ${event.time}. Venue: ${event.venue}.`;

    await Notification.insertMany(bookings.map((booking) => ({
      user: booking.user._id,
      title,
      message,
      type: 'reminder',
      link: `/events/${event._id}`
    })));

    bookings.forEach((booking) => {
      sendImportantNotificationEmail(booking.user.email, booking.user.name, title, message, `/events/${event._id}`)
        .then(result => {
          if (!result?.success) console.warn('Event reminder email failed:', result?.error || result?.message);
        })
        .catch(err => console.error('Event reminder email error:', err.message));
    });

    await logActivity({
      req,
      action: 'admin.event_reminder_sent',
      entity: 'Event',
      entityId: event._id,
      message: `Admin sent reminder for ${event.title} to ${bookings.length} attendee(s)`
    });

    res.json({ message: 'Event reminder sent', recipients: bookings.length });
  } catch (error) {
    console.error('Send event reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resendBookingConfirmation = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.user?.email || !booking.event?.title) {
      return res.status(400).json({ message: 'Booking is missing user or event details' });
    }

    const result = await sendBookingConfirmationEmail(
      booking.user.email,
      booking.user.name,
      booking.event.title,
      {
        numberOfTickets: booking.numberOfTickets,
        totalPrice: booking.totalPrice,
        bookingId: booking._id
      }
    );

    if (!result?.success) {
      return res.status(502).json({ message: result?.error || 'Could not send confirmation email' });
    }

    await logActivity({
      req,
      action: 'admin.booking_confirmation_resent',
      entity: 'Booking',
      entityId: booking._id,
      message: `Admin resent confirmation for booking ${booking._id}`
    });

    res.json({ message: 'Booking confirmation resent' });
  } catch (error) {
    console.error('Resend booking confirmation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrganizerEarningsRows = async () => {
  const rows = await Booking.aggregate([
    { $match: { status: 'confirmed', paymentStatus: { $in: ['completed', 'refunded'] } } },
    {
      $lookup: {
        from: 'events',
        localField: 'event',
        foreignField: '_id',
        as: 'event'
      }
    },
    { $unwind: '$event' },
    {
      $group: {
        _id: '$event.organizer',
        revenue: { $sum: '$totalPrice' },
        bookings: { $sum: 1 },
        tickets: { $sum: '$numberOfTickets' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  return User.populate(rows, { path: '_id', select: 'name email phone' });
};

exports.exportReport = async (req, res) => {
  try {
    const { type } = req.params;

    if (type === 'users') {
      const users = await User.find().select('-password -otp -loginOtp -emailVerificationOtp -passwordResetToken -phoneVerification.otp').sort({ createdAt: -1 });
      return sendCsv(res, 'evento-users.csv', [
        ['Name', 'Email', 'Role', 'Verified', 'Blocked', 'Phone', 'Created At', 'Last Login'],
        ...users.map((user) => [
          user.name,
          user.email,
          user.role,
          user.isVerified,
          user.isBlocked,
          user.phone || '',
          user.createdAt?.toISOString?.() || '',
          user.lastLoginAt?.toISOString?.() || ''
        ])
      ]);
    }

    if (type === 'events') {
      const events = await Event.find().populate('organizer', 'name email').sort({ createdAt: -1 });
      return sendCsv(res, 'evento-events.csv', [
        ['Title', 'Category', 'Date', 'Venue', 'Location', 'Organizer', 'Price', 'Total Tickets', 'Available Tickets', 'Active', 'Featured', 'Trending', 'Moderation'],
        ...events.map((event) => [
          event.title,
          event.category,
          event.date?.toISOString?.() || '',
          event.venue,
          event.location,
          event.organizer?.email || '',
          event.price,
          event.totalTickets,
          event.availableTickets,
          event.isActive,
          event.isFeatured,
          event.isTrending,
          event.moderationStatus
        ])
      ]);
    }

    if (type === 'bookings') {
      const bookings = await Booking.find().populate('event', 'title').populate('user', 'name email').sort({ bookingDate: -1 });
      return sendCsv(res, 'evento-bookings.csv', [
        ['Booking ID', 'User', 'User Email', 'Event', 'Tickets', 'Total Price', 'Status', 'Payment Status', 'Booking Date'],
        ...bookings.map((booking) => [
          booking._id,
          booking.user?.name || '',
          booking.user?.email || '',
          booking.event?.title || '',
          booking.numberOfTickets,
          booking.totalPrice,
          booking.status,
          booking.paymentStatus,
          booking.bookingDate?.toISOString?.() || ''
        ])
      ]);
    }

    if (type === 'revenue') {
      const bookings = await Booking.find({ status: 'confirmed' }).populate('event', 'title organizer').sort({ confirmedAt: -1 });
      return sendCsv(res, 'evento-revenue.csv', [
        ['Booking ID', 'Event', 'Tickets', 'Gross Revenue', 'Platform Earnings', 'Organizer Payout', 'Payment Status', 'Confirmed At'],
        ...bookings.map((booking) => [
          booking._id,
          booking.event?.title || '',
          booking.numberOfTickets,
          booking.totalPrice,
          Math.round(booking.totalPrice * PLATFORM_FEE_RATE),
          Math.round(booking.totalPrice * (1 - PLATFORM_FEE_RATE)),
          booking.paymentStatus,
          booking.confirmedAt?.toISOString?.() || ''
        ])
      ]);
    }

    if (type === 'daily-revenue') {
      const rows = await Booking.aggregate([
        { $match: { status: 'confirmed', paymentStatus: { $in: ['completed', 'refunded'] } } },
        {
          $group: {
            _id: {
              year: { $year: '$confirmedAt' },
              month: { $month: '$confirmedAt' },
              day: { $dayOfMonth: '$confirmedAt' }
            },
            revenue: { $sum: '$totalPrice' },
            bookings: { $sum: 1 },
            tickets: { $sum: '$numberOfTickets' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
      ]);

      return sendCsv(res, 'evento-daily-revenue.csv', [
        ['Date', 'Revenue', 'Bookings', 'Tickets'],
        ...rows.map((row) => [`${row._id.year}-${row._id.month}-${row._id.day}`, row.revenue, row.bookings, row.tickets])
      ]);
    }

    if (type === 'monthly-revenue') {
      const rows = await Booking.aggregate(getRevenuePipeline('$confirmedAt'));
      return sendCsv(res, 'evento-monthly-revenue.csv', [
        ['Month', 'Revenue', 'Bookings', 'Tickets'],
        ...rows.map((row) => [`${row._id.year}-${row._id.month}`, row.revenue, row.count, row.tickets])
      ]);
    }

    if (type === 'ticket-sales') {
      const rows = await Booking.aggregate([
        { $group: { _id: '$event', tickets: { $sum: '$numberOfTickets' }, bookings: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { tickets: -1 } }
      ]);
      const populated = await Event.populate(rows, { path: '_id', select: 'title category date venue' });
      return sendCsv(res, 'evento-ticket-sales.csv', [
        ['Event', 'Category', 'Date', 'Venue', 'Tickets', 'Bookings', 'Revenue'],
        ...populated.map((row) => [
          row._id?.title || 'Deleted event',
          row._id?.category || '',
          row._id?.date?.toISOString?.() || '',
          row._id?.venue || '',
          row.tickets,
          row.bookings,
          row.revenue
        ])
      ]);
    }

    if (type === 'organizer-earnings') {
      const analytics = await exports.getOrganizerEarningsRows();
      return sendCsv(res, 'evento-organizer-earnings.csv', [
        ['Organizer', 'Email', 'Revenue', 'Platform Earnings', 'Payout', 'Bookings', 'Tickets'],
        ...analytics.map((row) => [
          row._id?.name || 'Unknown',
          row._id?.email || '',
          row.revenue,
          Math.round(row.revenue * PLATFORM_FEE_RATE),
          Math.round(row.revenue * (1 - PLATFORM_FEE_RATE)),
          row.bookings,
          row.tickets
        ])
      ]);
    }

    if (type === 'support') {
      const tickets = await SupportTicket.find()
        .populate('user', 'name email')
        .populate('event', 'title')
        .sort({ createdAt: -1 });
      return sendCsv(res, 'evento-support.csv', [
        ['Subject', 'Type', 'Priority', 'Status', 'User', 'Email', 'Event', 'Created At', 'Resolution'],
        ...tickets.map((ticket) => [
          ticket.subject,
          ticket.type,
          ticket.priority,
          ticket.status,
          ticket.user?.name || '',
          ticket.user?.email || '',
          ticket.event?.title || '',
          ticket.createdAt?.toISOString?.() || '',
          ticket.resolution || ''
        ])
      ]);
    }

    if (type === 'fraud') {
      const signals = await buildFraudSignals();
      return sendCsv(res, 'evento-fraud-signals.csv', [
        ['Signal Type', 'Subject', 'Detail', 'Status'],
        ...signals.suspiciousBookings.map((booking) => [
          'Suspicious booking',
          booking.user?.email || '',
          `${booking.event?.title || 'Deleted event'} / attempts: ${booking.paymentAttempts || 0}`,
          `${booking.status}/${booking.paymentStatus}/${booking.disputeStatus}`
        ]),
        ...signals.flaggedEvents.map((event) => [
          'Flagged event',
          event.title,
          event.organizer?.email || '',
          `${event.moderationStatus} ${event.moderationFlags?.join('|') || ''}`
        ]),
        ...signals.spamUsers.map((row) => [
          'Spam user',
          row._id?.email || '',
          `pending bookings: ${row.pendingBookings}`,
          row._id?.isBlocked ? 'blocked' : 'active'
        ]),
        ...signals.fraudOrganizers.map((row) => [
          'Fraud organizer',
          row._id?.email || '',
          `events: ${row.totalEvents}, flagged: ${row.flaggedEvents}, rejected: ${row.rejectedEvents}`,
          row._id?.isBlocked ? 'blocked' : 'active'
        ])
      ]);
    }

    return res.status(400).json({ message: 'Unknown report type' });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEventAnalytics = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const bookings = await Booking.find({ event: eventId })
      .populate('user', 'name email')
      .sort({ bookingDate: -1 });

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = bookings.filter(b => ['cancelled', 'rejected'].includes(b.status)).length;
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    const ticketsSold = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.numberOfTickets, 0);

    res.json({
      event,
      analytics: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        totalRevenue,
        ticketsSold,
        availableTickets: event.availableTickets,
        totalTickets: event.totalTickets
      },
      bookings
    });
  } catch (error) {
    console.error('Get event analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
