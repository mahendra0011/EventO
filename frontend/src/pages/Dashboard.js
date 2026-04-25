import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api, { getWishlist, getNotifications } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Calendar, Ticket, Clock, CheckCircle, XCircle, AlertCircle, User, Mail, Phone,
  Edit3, Heart, CreditCard, Star, MessageCircle, Calendar as CalendarIcon, Bell, Eye
} from 'lucide-react';
import { AnimatedButton, AnimatedCard, AnimatedIcon, GradientText } from '../components/animated';

const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  // Keep profileData in sync with user context
  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  // Refresh wishlist when switching to wishlist tab
  useEffect(() => {
    if (activeTab === 'wishlist' && user) {
      fetchWishlist();
    }
  }, [activeTab, user]);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/user');
      setBookings(res.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await getWishlist();
      const data = Array.isArray(res) ? res : [];
      setSavedEvents(data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setSavedEvents([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Initial data fetch on mount
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchBookings(),
        fetchNotifications()
      ]).catch(err => {
        console.error('Initial data fetch error:', err);
        toast.error('Some data failed to load');
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    rejected: bookings.filter(b => b.status === 'rejected').length
  };

  const statCards = [
    { label: 'Total Bookings', value: stats.total, icon: Ticket, color: 'primary', bgColor: 'bg-primary-100' },
    { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle, color: 'green', bgColor: 'bg-green-100' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'yellow', bgColor: 'bg-yellow-100' },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'red', bgColor: 'bg-red-100' },
    { label: 'Rejected', value: stats.rejected, icon: AlertCircle, color: 'gray', bgColor: 'bg-gray-100' }
  ];

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n =>
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  const NotificationCenter = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary-600" />
          <span className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All notifications read'}
          </span>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No notifications</h3>
          <p className="text-gray-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {unreadNotifications.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-primary-600 px-2 py-1 bg-primary-50 rounded">
                NEW ({unreadNotifications.length})
              </div>
              {unreadNotifications.map((notification) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-blue-50 border border-blue-100 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Mark as read
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {readNotifications.length > 0 && (
            <div className="space-y-2 mt-4">
              {readNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-75"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My <GradientText>Dashboard</GradientText>
          </h1>
          <p className="text-gray-600 text-lg">Welcome back, {user?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <AnimatedCard key={index} className="p-6" delay={index * 0.1}>
              <div className="flex items-center">
                <AnimatedIcon variant="bounce" className={`p-3 ${stat.bgColor} rounded-lg`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </AnimatedIcon>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>

        {/* Tabs */}
        <AnimatedCard className="overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {["bookings", "upcoming", "calendar", "wishlist", "notifications", "payments", "reviews", "support", "profile"].map((tabId) => {
                const tabDef = {
                  bookings: { icon: Ticket, label: 'My Bookings' },
                  upcoming: { icon: CalendarIcon, label: 'Upcoming' },
                  calendar: { icon: Calendar, label: 'Calendar' },
                  wishlist: { icon: Heart, label: 'Wishlist' },
                  notifications: { icon: Bell, label: 'Notifications' },
                  payments: { icon: CreditCard, label: 'Payment History' },
                  reviews: { icon: Star, label: 'Reviews' },
                  support: { icon: MessageCircle, label: 'Support' },
                  profile: { icon: User, label: 'Profile' }
                };
                const { icon, label } = tabDef[tabId];
                return (
                  <button
                    key={tabId}
                    onClick={() => setActiveTab(tabId)}
                    className={`py-4 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === tabId
                        ? 'border-primary-500 text-primary-600 bg-primary-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <icon className="h-4 w-4 inline mr-2" />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* My Bookings Tab */}
              {activeTab === 'bookings' && (
                <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                          filterStatus === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600" />
                    </div>
                  ) : bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.filter(b => filterStatus === 'all' || b.status === filterStatus).map((booking) => (
                        <div key={booking._id} className="border border-gray-200 rounded-lg p-6 bg-white">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start space-x-4">
                              <img
                                src={booking.event?.image || 'https://images.unsplash.com/photo-1540575467083-2bdc3c5f8ebe?w=200'}
                                alt={booking.event?.title}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                              <div>
                                <h3 className="text-lg font-semibold">{booking.event?.title}</h3>
                                <p className="text-gray-500 text-sm">{formatDate(booking.event?.date)} at {booking.event?.time}</p>
                                <p className="text-gray-500 text-sm">{booking.numberOfTickets} ticket(s) - ₹{booking.totalPrice?.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                            <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2">
                              {getStatusBadge(booking.status)}
                              <div className="flex space-x-2">
                                <Link to={`/booking/${booking._id}/confirmation`} className="btn-outline text-sm">
                                  <Eye className="h-4 w-4 inline mr-1" />View Ticket
                                </Link>
                                {booking.status === 'pending' && (
                                  <button onClick={() => handleCancelBooking(booking._id)} className="btn-danger text-sm">Cancel</button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No bookings</h3>
                      <Link to="/events" className="btn-primary mt-4">Browse Events</Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Wishlist Tab */}
              {activeTab === 'wishlist' && (
                <motion.div key="wishlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold mb-4">Saved Events</h3>
                  {savedEvents?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savedEvents.map((item) => {
                        if (!item || !item.event) return null;
                        return (
                          <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <img src={item.event.image || 'https://via.placeholder.com/400x200?text=No+Image'} alt={item.event.title} className="w-full h-40 object-cover" />
                            <div className="p-4">
                              <h4 className="font-semibold">{item.event.title || 'Untitled Event'}</h4>
                              <p className="text-sm text-gray-500">{item.event.date ? formatDate(item.event.date) : 'TBD'}</p>
                              <p className="text-primary-600 font-bold">₹{(item.event.price || 0).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No saved events</h3>
                      <p className="text-gray-600 mb-4">Events you save will appear here</p>
                      <Link to="/events" className="btn-primary">Browse Events</Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold mb-4">Event Notifications</h3>
                  <NotificationCenter />
                </motion.div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                  {editMode ? (
                    <form onSubmit={handleUpdateProfile} className="bg-white border border-gray-200 rounded-lg p-6 max-w-xl">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="+91 9876543210"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="btn-primary">
                            Save Changes
                          </button>
                          <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium">{user?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{user?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <AnimatedButton variant="primary" className="mt-6" onClick={() => setEditMode(true)}>
                        <Edit3 className="h-4 w-4 mr-2" />Edit Profile
                      </AnimatedButton>
                    </div>
                  )}
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
