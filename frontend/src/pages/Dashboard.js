import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Calendar, Ticket, Clock, CheckCircle, XCircle, AlertCircle, User, Mail, Phone, 
  Edit3, Save, X, QrCode, Heart, CreditCard, Star, Search, Bell, Trash2, 
  Download, Eye, Filter, TrendingUp, MapPin, IndianRupee, History,
  HelpCircle, MessageCircle, Calendar as CalendarIcon, StarHalf
} from 'lucide-react';
import { AnimatedButton, AnimatedCard, AnimatedIcon, AnimatedContainer, GradientText } from '../components/animated';

const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [notification, setNotification] = useState(true);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  useEffect(() => {
    fetchBookings();
    fetchSavedEvents();
    fetchPayments();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/user');
      setBookings(res.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedEvents = async () => {
    try {
      setSavedEvents([]);
    } catch (error) {
      console.error('Error fetching saved events:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const paidBookings = bookings.filter(b => b.status === 'confirmed');
      setPayments(paidBookings.map(b => ({
        _id: b._id,
        event: b.event,
        amount: b.totalPrice,
        date: b.createdAt,
        status: 'Paid'
      })));
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleToggleSaveEvent = (event) => {
    if (savedEvents.find(e => e._id === event._id)) {
      setSavedEvents(savedEvents.filter(e => e._id !== event._id));
      toast.success('Event removed from wishlist');
    } else {
      setSavedEvents([...savedEvents, event]);
      toast.success('Event added to wishlist');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileData);
      toast.success('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Confirmed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' },
      rejected: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <motion.span 
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
        whileHover={{ scale: 1.05 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Icon className="h-4 w-4 mr-1" />
        {config.text}
      </motion.span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  const statCards = [
    { label: 'Total Bookings', value: stats.total, icon: Ticket, color: 'primary', bgColor: 'bg-primary-100' },
    { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle, color: 'green', bgColor: 'bg-green-100' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'yellow', bgColor: 'bg-yellow-100' },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'red', bgColor: 'bg-red-100' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedContainer className="mb-8">
          <motion.h1 
            className="text-4xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            My <GradientText>Dashboard</GradientText>
          </motion.h1>
          <motion.p 
            className="text-gray-600 text-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Welcome back, {user?.name}! 👋
          </motion.p>
        </AnimatedContainer>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {statCards.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <AnimatedCard className="p-6" delay={index * 0.1}>
                <div className="flex items-center">
                  <AnimatedIcon 
                    variant="bounce" 
                    className={`p-3 ${stat.bgColor} rounded-lg`}
                  >
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </AnimatedIcon>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <motion.p 
                      className="text-2xl font-bold text-gray-900"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <AnimatedCard className="overflow-hidden" delay={0.4}>
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { id: 'bookings', icon: Ticket, label: 'My Bookings' },
                { id: 'upcoming', icon: CalendarIcon, label: 'Upcoming' },
                { id: 'calendar', icon: Calendar, label: 'Calendar' },
                { id: 'wishlist', icon: Heart, label: 'Wishlist' },
                { id: 'payments', icon: CreditCard, label: 'Payments' },
                { id: 'reviews', icon: StarHalf, label: 'Reviews' },
                { id: 'support', icon: HelpCircle, label: 'Support' },
                { id: 'profile', icon: User, label: 'Profile' }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-4 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <tab.icon className="h-4 w-4 inline mr-2" />
                  {tab.label}
                </motion.button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'bookings' && (
                <motion.div
                  key="bookings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Filter */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                          filterStatus === status
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <motion.div
                        className="rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                  ) : (
                    (filterStatus === 'all' ? bookings : bookings.filter(b => b.status === filterStatus)).length > 0 ? (
                      <motion.div 
                        className="space-y-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {(filterStatus === 'all' ? bookings : bookings.filter(b => b.status === filterStatus)).map((booking, index) => (
                          <motion.div
                            key={booking._id}
                            variants={itemVariants}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-white"
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div className="flex items-start space-x-4">
                                <img
                                  src={booking.event?.image || 'https://images.unsplash.com/photo-1540575467083-2bdc3c5f8ebe?w=200'}
                                  alt={booking.event?.title}
                                  className="w-24 h-24 object-cover rounded-lg"
                                />
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{booking.event?.title}</h3>
                                  <div className="flex items-center text-gray-500 text-sm mt-1">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {formatDate(booking.event?.date)} at {booking.event?.time}
                                  </div>
                                  <div className="flex items-center text-gray-500 text-sm mt-1">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {booking.event?.venue}
                                  </div>
                                  <div className="flex items-center text-gray-500 text-sm mt-1">
                                    <Ticket className="h-4 w-4 mr-1" />
                                    {booking.numberOfTickets} ticket(s) - ₹{booking.totalPrice?.toLocaleString('en-IN')}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2">
                                {getStatusBadge(booking.status)}
                                <div className="flex space-x-2">
                                  <Link to={`/booking/${booking._id}/confirmation`} className="btn-outline text-sm">
                                    <Eye className="h-4 w-4 inline mr-1" />View Ticket
                                  </Link>
                                  {booking.status === 'pending' && (
                                    <button onClick={() => handleCancelBooking(booking._id)} className="btn-danger text-sm">
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div className="text-center py-12">
                        <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No {filterStatus} bookings</h3>
                        <Link to="/events" className="btn-primary inline-flex">
                          <Search className="h-4 w-4 mr-2" />Browse Events
                        </Link>
                      </motion.div>
                    )
                  )}
                </motion.div>
              )}

              {activeTab === 'upcoming' && (
                <motion.div
                  key="upcoming"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                  {bookings.filter(b => b.status === 'confirmed' && new Date(b.event?.date) > new Date()).length > 0 ? (
                    bookings.filter(b => b.status === 'confirmed' && new Date(b.event?.date) > new Date()).map((booking) => (
                      <div key={booking._id} className="border border-gray-200 rounded-lg p-4 flex items-center bg-green-50">
                        <img src={booking.event?.image || 'https://images.unsplash.com/photo-1540575467083-2bdc3c5f8ebe?w=100'} alt={booking.event?.title} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="ml-4 flex-1">
                          <h4 className="font-semibold">{booking.event?.title}</h4>
                          <p className="text-sm text-gray-500">{formatDate(booking.event?.date)} • {booking.numberOfTickets} tickets</p>
                        </div>
                        <Link to={`/events/${booking.event?._id}`} className="btn-secondary text-sm">
                          View Details
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No upcoming events</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'wishlist' && (
                <motion.div key="wishlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Events</h3>
                  {savedEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedEvents.map((event) => (
                        <div key={event._id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <img src={event.image} alt={event.title} className="w-full h-32 object-cover" />
                          <div className="p-4">
                            <h4 className="font-semibold">{event.title}</h4>
                            <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                            <div className="flex justify-between mt-2">
                              <Link to={`/events/${event._id}`} className="btn-primary text-sm">Book Now</Link>
                              <button onClick={() => handleToggleSaveEvent(event)} className="text-red-500"><Heart className="h-5 w-5 fill-current" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved events</h3>
                      <p className="text-gray-600 mb-4">Save events to your wishlist</p>
                      <Link to="/events" className="btn-primary inline-flex">
                        <Search className="h-4 w-4 mr-2" />Browse Events
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'payments' && (
                <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                  {payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.map((payment) => (
                        <div key={payment._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <IndianRupee className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <h4 className="font-semibold">{payment.event?.title}</h4>
                              <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">₹{payment.amount?.toLocaleString('en-IN')}</p>
                            <p className="text-sm text-green-500">Paid</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment history</h3>
                      <p className="text-gray-600">Your payment history will appear here</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'calendar' && (
                <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">My Calendar</h3>
                  {bookings.filter(b => b.status === 'confirmed').length > 0 ? (
                    <div className="space-y-3">
                      {bookings.filter(b => b.status === 'confirmed').map((booking) => (
                        <div key={booking._id} className="border border-gray-200 rounded-lg p-4 flex items-center bg-gradient-to-r from-primary-50 to-secondary-50">
                          <div className="w-16 h-16 bg-primary-100 rounded-lg flex flex-col items-center justify-center">
                            <span className="text-xs text-primary-600 uppercase">{new Date(booking.event?.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-xl font-bold text-primary-600">{new Date(booking.event?.date).getDate()}</span>
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="font-semibold">{booking.event?.title}</h4>
                            <p className="text-sm text-gray-500">{booking.event?.time} • {booking.numberOfTickets} tickets</p>
                          </div>
                          <Link to={`/booking/${booking._id}/confirmation`} className="btn-secondary text-sm">
                            View Ticket
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No events scheduled</h3>
                      <p className="text-gray-600 mb-4">Book events to see them in your calendar</p>
                      <Link to="/events" className="btn-primary inline-flex">
                        Browse Events
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews & Feedback</h3>
                  {bookings.filter(b => b.status === 'confirmed' && new Date(b.event?.date) < new Date()).length > 0 ? (
                    <div className="space-y-4">
                      {bookings.filter(b => b.status === 'confirmed' && new Date(b.event?.date) < new Date()).map((booking) => (
                        <div key={booking._id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center mb-4">
                            <img src={booking.event?.image} alt={booking.event?.title} className="w-16 h-16 rounded-lg object-cover" />
                            <div className="ml-4 flex-1">
                              <h4 className="font-semibold">{booking.event?.title}</h4>
                              <p className="text-sm text-gray-500">{formatDate(booking.event?.date)}</p>
                            </div>
                          </div>
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Rate this event:</p>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} className="text-gray-300 hover:text-yellow-400 transition-colors">
                                  <Star className="h-8 w-8 fill-current" />
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            placeholder="Share your experience..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            rows={3}
                          />
                          <button className="btn-primary mt-3">
                            <StarHalf className="h-4 w-4 inline mr-2" />
                            Submit Review
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <StarHalf className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No events to review</h3>
                      <p className="text-gray-600">Events you've attended will appear here for review</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'support' && (
                <motion.div key="support" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Help & Support</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 cursor-pointer hover:bg-primary-100 transition-colors">
                      <HelpCircle className="h-8 w-8 text-primary-600 mb-3" />
                      <h4 className="font-semibold text-primary-900">FAQs</h4>
                      <p className="text-sm text-primary-700">Find answers to common questions</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 cursor-pointer hover:bg-blue-100 transition-colors">
                      <MessageCircle className="h-8 w-8 text-blue-600 mb-3" />
                      <h4 className="font-semibold text-blue-900">Contact Us</h4>
                      <p className="text-sm text-blue-700">Chat with our support team</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 cursor-pointer hover:bg-green-100 transition-colors">
                      <Mail className="h-8 w-8 text-green-600 mb-3" />
                      <h4 className="font-semibold text-green-900">Email Support</h4>
                      <p className="text-sm text-green-700">support@evento.com</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 cursor-pointer hover:bg-purple-100 transition-colors">
                      <AlertCircle className="h-8 w-8 text-purple-600 mb-3" />
                      <h4 className="font-semibold text-purple-900">Report Issue</h4>
                      <p className="text-sm text-purple-700">Report a problem</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Quick Help</h4>
                    <details className="mb-3">
                      <summary className="cursor-pointer font-medium text-gray-700">How do I get my tickets?</summary>
                      <p className="text-sm text-gray-600 mt-2 ml-4">After booking, click "View Ticket" to see your QR code. You can also find them in My Bookings.</p>
                    </details>
                    <details className="mb-3">
                      <summary className="cursor-pointer font-medium text-gray-700">Can I cancel my booking?</summary>
                      <p className="text-sm text-gray-600 mt-2 ml-4">Yes, go to My Bookings and click Cancel on pending bookings.</p>
                    </details>
                    <details className="mb-3">
                      <summary className="cursor-pointer font-medium text-gray-700">How do I become a host?</summary>
                      <p className="text-sm text-gray-600 mt-2 ml-4">Register an account and check "Register as Host" to create events.</p>
                    </details>
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-2xl"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  
                  {editMode ? (
                    <motion.form 
                      onSubmit={handleUpdateProfile} 
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div>
                        <label className="label">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            className="input-field pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="email"
                            value={user?.email}
                            disabled
                            className="input-field pl-10 bg-gray-100 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="input-field pl-10"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <AnimatedButton type="submit" variant="primary">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </AnimatedButton>
                        <AnimatedButton
                          type="button"
                          variant="outline"
                          onClick={() => setEditMode(false)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </AnimatedButton>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {[
                        { icon: User, label: 'Full Name', value: user?.name },
                        { icon: Mail, label: 'Email Address', value: user?.email },
                        { icon: Phone, label: 'Phone Number', value: user?.phone || 'Not provided' },
                      ].map((field, index) => (
                        <motion.div 
                          key={index}
                          className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ x: 5 }}
                        >
                          <field.icon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">{field.label}</p>
                            <p className="font-medium">{field.value}</p>
                          </div>
                        </motion.div>
                      ))}

                      <div className="pt-6 mt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Bell className="h-5 w-5 mr-2" />Notification Settings
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive booking confirmations and updates</p>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={notification}
                          onChange={() => setNotification(!notification)}
                          className="h-5 w-5 text-primary-600 rounded" 
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                        <div className="flex items-center">
                          <Bell className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-gray-500">Get reminders about upcoming events</p>
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="h-5 w-5 text-primary-600 rounded" />
                      </label>
                    </div>
                  </div>

                  <AnimatedButton
                    variant="primary"
                    onClick={() => setEditMode(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </AnimatedButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
};

export default Dashboard;
