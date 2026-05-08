const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total events
    const totalEvents = await Event.countDocuments({ isActive: true });

    // Get total bookings
    const totalBookings = await Booking.countDocuments();

    // Get confirmed bookings
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });

    // Get pending bookings
    const pendingBookings = await Booking.countDocuments({ status: 'pending', isOtpVerified: true });

    // Get total users
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Calculate total revenue
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'confirmed', paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('event', 'title')
      .populate('user', 'name email')
      .sort({ bookingDate: -1 })
      .limit(5);

    // Get bookings by status
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed',
          paymentStatus: 'completed',
          confirmedAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$confirmedAt' },
            month: { $month: '$confirmedAt' }
          },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top events by bookings
    const topEvents = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$event', bookings: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { bookings: -1 } },
      { $limit: 5 }
    ]);

    // Populate event details for top events
    const topEventsWithDetails = await Event.populate(topEvents, { path: '_id', select: 'title date venue' });

    res.json({
      stats: {
        totalEvents,
        totalBookings,
        confirmedBookings,
        pendingBookings,
        totalUsers,
        totalRevenue
      },
      recentBookings,
      bookingsByStatus,
      revenueByMonth,
      topEvents: topEventsWithDetails
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users (Admin)
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

// Update user role (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
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

// Get event analytics (Admin)
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
