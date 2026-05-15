const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');

const DEFAULT_HOST_SETTINGS = {
  notificationPreferences: {
    newBookings: true,
    bookingDecisions: true,
    eventReminders: true,
    communityMessages: true
  },
  hostPreferences: {
    autoConfirmFreeEvents: false,
    showRevenueCards: true,
    requireQrAtEntry: true,
    weeklyDigest: true
  },
  defaultEventVisibility: 'public',
  packagePricing: [
    {
      key: 'starter',
      name: 'Starter',
      description: 'Entry package',
      price: 0,
      isActive: true
    },
    {
      key: 'standard',
      name: 'Standard',
      description: 'Most booked package',
      price: 0,
      isActive: true
    },
    {
      key: 'premium',
      name: 'Premium',
      description: 'High touch package',
      price: 0,
      isActive: true
    }
  ]
};

const cloneDefaultPackages = () => DEFAULT_HOST_SETTINGS.packagePricing.map(pkg => ({ ...pkg }));

const asPlainObject = (value) => {
  if (!value) return {};
  return typeof value.toObject === 'function' ? value.toObject() : value;
};

const normalizeBooleanGroup = (defaults, incoming = {}) => (
  Object.keys(defaults).reduce((result, key) => {
    result[key] = typeof incoming[key] === 'boolean' ? incoming[key] : defaults[key];
    return result;
  }, {})
);

const normalizePackagePricing = (packages) => {
  const source = Array.isArray(packages) && packages.length > 0 ? packages : cloneDefaultPackages();
  const normalized = source
    .slice(0, 8)
    .map((pkg, index) => {
      const name = String(pkg?.name || '').trim();
      const price = Number(pkg?.price);

      if (!name) return null;

      return {
        key: String(pkg?.key || `package-${index + 1}`).trim(),
        name: name.slice(0, 60),
        description: String(pkg?.description || '').trim().slice(0, 160),
        price: Number.isFinite(price) && price >= 0 ? price : 0,
        isActive: typeof pkg?.isActive === 'boolean' ? pkg.isActive : true
      };
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : cloneDefaultPackages();
};

const normalizeHostSettings = (settings = {}) => {
  const plainSettings = asPlainObject(settings);

  return {
    notificationPreferences: normalizeBooleanGroup(
      DEFAULT_HOST_SETTINGS.notificationPreferences,
      asPlainObject(plainSettings.notificationPreferences)
    ),
    hostPreferences: normalizeBooleanGroup(
      DEFAULT_HOST_SETTINGS.hostPreferences,
      asPlainObject(plainSettings.hostPreferences)
    ),
    defaultEventVisibility: ['public', 'draft', 'review'].includes(plainSettings.defaultEventVisibility)
      ? plainSettings.defaultEventVisibility
      : DEFAULT_HOST_SETTINGS.defaultEventVisibility,
    packagePricing: normalizePackagePricing(plainSettings.packagePricing)
  };
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const hostId = req.user.id;

    // Get host's events only
    const hostEvents = await Event.find({ organizer: hostId });
    const hostEventIds = hostEvents.map(e => e._id);

    // Get total events for this host
    const totalEvents = hostEvents.length;

    // Get bookings for host's events only
    const hostBookings = await Booking.find({ event: { $in: hostEventIds } });

    // Get total bookings
    const totalBookings = hostBookings.length;

    // Get confirmed bookings
    const confirmedBookings = hostBookings.filter(b => b.status === 'confirmed').length;

    // Get pending bookings (not confirmed)
    const pendingBookings = hostBookings.filter(b => b.status === 'pending').length;

    // Calculate total revenue
    const totalRevenue = hostBookings
      .filter(b => b.status === 'confirmed' && b.paymentStatus === 'completed')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // Get recent bookings for host's events
    const recentBookings = await Booking.find({ event: { $in: hostEventIds } })
      .populate('event', 'title date')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get bookings by status
    const bookingsByStatus = [
      { _id: 'confirmed', count: confirmedBookings },
      { _id: 'pending', count: pendingBookings },
      { _id: 'cancelled', count: hostBookings.filter(b => b.status === 'cancelled').length }
    ];

    // Get top events by bookings for this host
    const topEvents = hostEvents
      .map(event => {
        const eventBookings = hostBookings.filter(b => b.event.toString() === event._id.toString());
        return {
          _id: event._id,
          title: event.title,
          bookings: eventBookings.length,
          revenue: eventBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalPrice, 0)
        };
      })
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    res.json({
      stats: {
        totalEvents,
        totalBookings,
        confirmedBookings,
        pendingBookings,
        totalRevenue
      },
      recentBookings,
      bookingsByStatus,
      topEvents
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get host settings
exports.getHostSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('role hostSettings');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'host') {
      return res.status(403).json({ message: 'Only hosts can access host settings' });
    }

    res.json({ settings: normalizeHostSettings(user.hostSettings) });
  } catch (error) {
    console.error('Get host settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update host settings
exports.updateHostSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'host') {
      return res.status(403).json({ message: 'Only hosts can update host settings' });
    }

    const currentSettings = normalizeHostSettings(user.hostSettings);
    const nextSettings = {
      notificationPreferences: req.body?.notificationPreferences
        ? normalizeBooleanGroup(currentSettings.notificationPreferences, req.body.notificationPreferences)
        : currentSettings.notificationPreferences,
      hostPreferences: req.body?.hostPreferences
        ? normalizeBooleanGroup(currentSettings.hostPreferences, req.body.hostPreferences)
        : currentSettings.hostPreferences,
      defaultEventVisibility: ['public', 'draft', 'review'].includes(req.body?.defaultEventVisibility)
        ? req.body.defaultEventVisibility
        : currentSettings.defaultEventVisibility,
      packagePricing: Array.isArray(req.body?.packagePricing)
        ? normalizePackagePricing(req.body.packagePricing)
        : currentSettings.packagePricing
    };

    user.hostSettings = nextSettings;
    await user.save();

    res.json({
      message: 'Host settings saved successfully',
      settings: normalizeHostSettings(user.hostSettings)
    });
  } catch (error) {
    console.error('Update host settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users (Host)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments();

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user role (Host)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'host'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get event analytics (Host)
exports.getEventAnalytics = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get bookings for this event
    const bookings = await Booking.find({ event: eventId })
      .populate('user', 'name email')
      .sort({ bookingDate: -1 });

    // Calculate statistics
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

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
