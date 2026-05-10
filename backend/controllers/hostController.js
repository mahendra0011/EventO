const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { getHostPublishReadiness } = require('../utils/trustSafety');

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

    const escrowHeld = hostBookings
      .filter(b => b.paymentStatus === 'completed' && ['held', 'eligible'].includes(b.escrowStatus))
      .reduce((sum, b) => sum + (b.hostPayoutAmount || 0), 0);

    const releasedPayouts = hostBookings
      .filter(b => b.escrowStatus === 'released')
      .reduce((sum, b) => sum + (b.hostPayoutAmount || 0), 0);

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
        totalRevenue,
        escrowHeld,
        releasedPayouts,
        hostRating: req.user.hostTrust?.ratingAverage || 0,
        hostRatingCount: req.user.hostTrust?.ratingCount || 0,
        hostBadge: req.user.hostTrust?.badge || 'new'
      },
      recentBookings,
      bookingsByStatus,
      topEvents,
      publishReadiness: await getHostPublishReadiness(req.user)
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
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
