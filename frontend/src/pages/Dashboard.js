import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api, { getWishlist, getNotifications, getBroadcastMessages, markMessageAsRead } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Calendar, Ticket, Clock, CheckCircle, XCircle, AlertCircle, User, Mail, Phone,
  Edit3, Heart, CreditCard, Star, MessageCircle, MessageSquare, Calendar as CalendarIcon, Bell, Eye, Users, MapPin, HelpCircle, Megaphone
} from 'lucide-react';
import { AnimatedButton, AnimatedCard, AnimatedIcon, GradientText } from '../components/animated';

const primaryDashboardTabs = ['bookings', 'upcoming', 'calendar', 'community', 'broadcasts', 'notifications', 'payments', 'reviews', 'support'];
const topDashboardTabs = ['wishlist', 'profile'];
const dashboardTabs = [...primaryDashboardTabs, ...topDashboardTabs];

const tabDefinitions = {
  bookings: { icon: Ticket, label: 'My Bookings' },
  upcoming: { icon: CalendarIcon, label: 'Upcoming' },
  calendar: { icon: Calendar, label: 'Calendar' },
  wishlist: { icon: Heart, label: 'Wishlist', description: 'Saved events' },
  community: { icon: Users, label: 'Community' },
  broadcasts: { icon: Megaphone, label: 'Broadcasts' },
  notifications: { icon: Bell, label: 'Notifications' },
  payments: { icon: CreditCard, label: 'Payment History' },
  reviews: { icon: Star, label: 'Reviews' },
  support: { icon: MessageCircle, label: 'Support' },
  profile: { icon: User, label: 'Profile', description: 'Account details' }
};

const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [bookings, setBookings] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(dashboardTabs.includes(requestedTab) ? requestedTab : 'bookings');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editMode, setEditMode] = useState(false);

  // States for notifications and community
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userEvents, setUserEvents] = useState([]);
  const [broadcastMessages, setBroadcastMessages] = useState([]);
  const [broadcastUnreadCount, setBroadcastUnreadCount] = useState(0);
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportForm, setSupportForm] = useState({
    type: 'general',
    booking: '',
    subject: '',
    message: '',
    priority: 'medium'
  });

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

  useEffect(() => {
    const nextTab = searchParams.get('tab');
    if (dashboardTabs.includes(nextTab) && nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [searchParams, activeTab]);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/user');
      setBookings(res.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
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

  const fetchUserEvents = async () => {
    try {
      const res = await api.get('/bookings/user');
      const userBookings = res.data || [];
      // Get unique confirmed events
      const events = [...new Map(userBookings
        .filter(b => b.event && b.status === 'confirmed')
        .map(b => b.event)
        .map(event => [event._id, event])).values()];
      setUserEvents(events);
    } catch (error) {
      console.error('Error fetching user events:', error);
      setUserEvents([]);
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

  const fetchBroadcasts = async () => {
    try {
      const res = await getBroadcastMessages();
      setBroadcastMessages(res.broadcasts || []);
      setBroadcastUnreadCount(res.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching broadcast messages:', error);
      setBroadcastMessages([]);
      setBroadcastUnreadCount(0);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const res = await api.get('/support');
      setSupportTickets(res.data.tickets || []);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      setSupportTickets([]);
    }
  };

  // Initial data fetch on mount
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchBookings(),
        fetchUserEvents(),
        fetchNotifications(),
        fetchBroadcasts(),
        fetchSupportTickets()
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
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  const statCards = [
    { label: 'Total Bookings', value: stats.total, icon: Ticket, color: 'primary', bgColor: 'bg-primary-100' },
    { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle, color: 'green', bgColor: 'bg-green-100' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'yellow', bgColor: 'bg-yellow-100' },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'red', bgColor: 'bg-red-100' }
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

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      toast.error('Please add a subject and message');
      return;
    }

    try {
      const payload = Object.fromEntries(
        Object.entries(supportForm).filter(([, value]) => value !== '')
      );
      await api.post('/support', payload);
      toast.success('Support ticket submitted');
      setSupportForm({
        type: 'general',
        booking: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
      fetchSupportTickets();
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit support ticket');
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'bookings' ? {} : { tab: tabId });
  };

  const handleBroadcastRead = async (messageId) => {
    try {
      await markMessageAsRead(messageId);
      setBroadcastMessages(prev => prev.map(message =>
        message._id === messageId ? { ...message, isRead: true } : message
      ));
      setBroadcastUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking broadcast as read:', error);
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

  const BroadcastCenter = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Broadcast Messages</h3>
          <p className="text-sm text-gray-500">
            Updates from hosts for events you joined
          </p>
        </div>
        {broadcastUnreadCount > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
            {broadcastUnreadCount} unread
          </span>
        )}
      </div>

      {broadcastMessages.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No broadcasts yet</h3>
          <p className="text-gray-400">Event host announcements will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[640px] overflow-y-auto">
          {broadcastMessages.map((message) => (
            <div
              key={message._id}
              className={`border rounded-lg p-5 bg-white ${
                message.isRead ? 'border-gray-200' : 'border-primary-200 bg-primary-50/40'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="h-4 w-4 text-primary-600" />
                    <span className="text-xs font-medium uppercase tracking-wide text-primary-700">
                      {message.event?.title || 'Event broadcast'}
                    </span>
                    {!message.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900">{message.subject}</h4>
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{message.content}</p>
                  <div className="mt-3 text-xs text-gray-400">
                    From {message.sender?.name || 'Host'} · {new Date(message.createdAt).toLocaleString()}
                  </div>
                </div>
                {!message.isRead && (
                  <button
                    onClick={() => handleBroadcastRead(message._id)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
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

        {/* Top Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {topDashboardTabs.map((tabId) => {
            const { icon: Icon, label, description } = tabDefinitions[tabId];
            const isActiveTab = activeTab === tabId;

            return (
              <button
                key={tabId}
                type="button"
                onClick={() => handleTabChange(tabId)}
                className={`flex min-h-[88px] items-center justify-between rounded-xl border px-5 py-4 text-left transition-all ${
                  isActiveTab
                    ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                    : 'border-gray-200 bg-white hover:border-primary-200 hover:bg-primary-50/40 hover:shadow-sm'
                }`}
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
                    isActiveTab ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-gray-900">{label}</span>
                    <span className="block text-sm text-gray-500">{description}</span>
                  </span>
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isActiveTab ? 'bg-white text-primary-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isActiveTab ? 'Selected' : 'Open'}
                </span>
              </button>
            );
          })}
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
               {primaryDashboardTabs.map((tabId) => {
                const { icon: Icon, label } = tabDefinitions[tabId];
                return (
                  <button
                    key={tabId}
                    onClick={() => handleTabChange(tabId)}
                    className={`py-4 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === tabId
                        ? 'border-primary-500 text-primary-600 bg-primary-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 inline mr-2" />
                    {label}
                    {tabId === 'broadcasts' && broadcastUnreadCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {broadcastUnreadCount}
                      </span>
                    )}
                    {tabId === 'notifications' && unreadCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
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

               {/* Community Tab */}
               {activeTab === 'community' && (
                 <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                   <div className="mb-6">
                     <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Communities</h3>
                     <p className="text-sm text-gray-600">
                       Join the conversation! Connect with other attendees and the event host.
                     </p>
                   </div>

                   {userEvents.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {userEvents.map((event) => (
                         <div
                           key={event._id}
                           className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group"
                         >
                           {/* Event Image */}
                           <div className="relative h-40 overflow-hidden">
                             <img
                               src={event.image || 'https://images.unsplash.com/photo-1540575467083-2bdc3c5f8ebe?w=400'}
                               alt={event.title}
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                             <div className="absolute bottom-3 left-4">
                               <h4 className="font-bold text-white text-lg line-clamp-2">{event.title}</h4>
                               <p className="text-white/80 text-sm">
                                 {new Date(event.date).toLocaleDateString()} • {event.time}
                               </p>
                               {event.venue && (
                                 <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                                   <MapPin className="w-3 h-3" /> {event.venue}
                                 </p>
                               )}
                             </div>
                           </div>

                           {/* Event Actions */}
                           <div className="p-4 bg-gray-50 border-t border-gray-100">
                             <div className="flex items-center justify-between mb-3">
                               <div className="flex items-center gap-2">
                                 <Users className="w-4 h-4 text-primary-600" />
                                 <span className="text-sm text-gray-600">
                                   {event.bookings || 0} attending
                                 </span>
                               </div>
                               <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                 Confirmed
                               </span>
                             </div>
                             <Link
                               to={`/events/${event._id}/chat`}
                               className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                             >
                               <MessageSquare className="w-4 h-4" />
                               Open Community Chat
                             </Link>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                       <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 mx-auto mb-4 flex items-center justify-center">
                         <MessageCircle className="w-10 h-10 text-amber-600" />
                       </div>
                       <h3 className="text-xl font-semibold text-gray-900 mb-2">No Community Access Yet</h3>
                       <p className="text-gray-600 mb-6 max-w-md mx-auto">
                         Book and confirm tickets for events to join their community chats.
                         Chat with other attendees, ask questions, and stay updated!
                       </p>
                       <Link to="/events" className="btn-primary inline-flex items-center gap-2">
                         <Calendar className="w-4 h-4" />
                         Browse Events
                       </Link>
                     </div>
                   )}
                 </motion.div>
               )}

               {/* Broadcasts Tab */}
              {activeTab === 'broadcasts' && (
                <motion.div key="broadcasts" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <BroadcastCenter />
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

              {/* Upcoming Tab */}
              {activeTab === 'upcoming' && (
                <motion.div key="upcoming" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
                  {bookings.filter(b => b.status === 'confirmed').length > 0 ? (
                    <div className="space-y-4">
                      {bookings.filter(b => b.status === 'confirmed').map((booking) => (
                        <div key={booking._id} className="border border-gray-200 rounded-lg p-4 flex items-center bg-green-50">
                          <img src={booking.event?.image} alt={booking.event?.title} className="w-16 h-16 rounded-lg object-cover" />
                          <div className="ml-4 flex-1">
                            <h4 className="font-semibold">{booking.event?.title}</h4>
                            <p className="text-sm text-gray-500">{formatDate(booking.event?.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No upcoming events</div>
                  )}
                </motion.div>
              )}

              {/* Calendar Tab */}
              {activeTab === 'calendar' && (
                <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold mb-4">My Event Calendar</h3>
                  {bookings.filter(b => b.status === 'confirmed').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookings
                        .filter(b => b.status === 'confirmed')
                        .sort((a, b) => new Date(a.event.date) - new Date(b.event.date))
                        .map((booking) => (
                          <div key={booking._id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-primary-100 p-2 rounded-lg">
                                <Calendar className="h-5 w-5 text-primary-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm line-clamp-1">{booking.event?.title}</h4>
                                <p className="text-xs text-gray-500">{formatDate(booking.event?.date)}</p>
                              </div>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              {booking.event?.time}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {booking.event?.venue}, {booking.event?.location}
                            </div>
                          </div>
                        ))}
                      </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No upcoming events</h3>
                      <p className="text-gray-600">Confirmed bookings will appear here</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold mb-4">Payment History</h3>
                  {bookings.filter(b => b.paymentStatus === 'completed').length > 0 ? (
                    <div className="space-y-4">
                      {bookings
                        .filter(b => b.paymentStatus === 'completed')
                        .map((booking) => (
                          <div key={booking._id} className="border border-gray-200 rounded-lg p-4 flex items-center bg-white">
                            <img src={booking.event?.image} alt={booking.event?.title} className="w-16 h-16 rounded-lg object-cover" />
                            <div className="ml-4 flex-1">
                              <h4 className="font-semibold">{booking.event?.title}</h4>
                              <p className="text-sm text-gray-500">{formatDate(booking.event?.date)}</p>
                              <p className="text-sm text-gray-500">{booking.numberOfTickets} ticket(s)</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-green-600">₹{booking.totalPrice?.toLocaleString('en-IN')}</p>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid
                              </span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No payments yet</h3>
                      <p className="text-gray-600">Your payment history will appear here</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold mb-4">Reviews & Feedback</h3>
                  <div className="text-center py-12">
                    <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Reviews Coming Soon</h3>
                    <p className="text-gray-600">Share your event experiences here</p>
                  </div>
                </motion.div>
              )}

              {/* Support Tab */}
              {activeTab === 'support' && (
                <motion.div key="support" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold mb-4">Help & Support</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
                    <div className="space-y-4">
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                      <HelpCircle className="h-8 w-8 text-primary-600 mb-3" />
                      <h4 className="font-semibold">FAQs</h4>
                      <p className="text-sm text-gray-600 mt-2">Frequently asked questions</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <MessageCircle className="h-8 w-8 text-blue-600 mb-3" />
                        <h4 className="font-semibold">Contact Us</h4>
                        <p className="text-sm text-gray-600 mt-2">Get in touch with our support team</p>
                      </div>
                    </div>

                    <form onSubmit={handleSupportSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Issue Type</label>
                          <select
                            value={supportForm.type}
                            onChange={(e) => setSupportForm({ ...supportForm, type: e.target.value })}
                            className="input-field"
                          >
                            <option value="general">General support</option>
                            <option value="complaint">User complaint</option>
                            <option value="refund_issue">Refund issue</option>
                            <option value="payment_dispute">Payment dispute</option>
                            <option value="event_report">Report event</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">Related Booking</label>
                          <select
                            value={supportForm.booking}
                            onChange={(e) => setSupportForm({ ...supportForm, booking: e.target.value })}
                            className="input-field"
                          >
                            <option value="">No booking selected</option>
                            {bookings.map((booking) => (
                              <option key={booking._id} value={booking._id}>
                                {booking.event?.title || 'Event'} / {booking.status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="label">Subject</label>
                        <input
                          value={supportForm.subject}
                          onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                          className="input-field"
                          placeholder="How can we help?"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Message</label>
                        <textarea
                          value={supportForm.message}
                          onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                          className="input-field"
                          rows={4}
                          placeholder="Tell us what happened"
                          required
                        />
                      </div>
                      <button className="btn-primary w-full">
                        <MessageSquare className="h-4 w-4 inline mr-2" />
                        Submit Ticket
                      </button>
                    </form>

                    <div className="lg:col-span-2">
                      <h4 className="font-semibold text-gray-900 mb-3">Your Support Tickets</h4>
                      <div className="space-y-3">
                        {supportTickets.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                            <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-600">No support tickets yet</p>
                          </div>
                        ) : supportTickets.map((ticket) => (
                          <div key={ticket._id} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-900">{ticket.subject}</p>
                                <p className="text-sm text-gray-600 mt-1">{ticket.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {ticket.event?.title || 'General'} / {new Date(ticket.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                ticket.status === 'resolved'
                                  ? 'bg-green-100 text-green-700'
                                  : ticket.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                              }`}>
                                {ticket.status}
                              </span>
                            </div>
                            {ticket.resolution && (
                              <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
                                {ticket.resolution}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
