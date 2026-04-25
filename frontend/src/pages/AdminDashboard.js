import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api, { broadcastToEventBookers, getCommunityMessages, getNotifications, markAllNotificationsAsRead, postCommunityMessage } from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
   Calendar,
   Ticket,
   IndianRupee,
   Clock,
   CheckCircle,
   XCircle,
   Plus,
   Eye,
   Check,
   X,
   TrendingUp,
   Users,
   DollarSign,
   BarChart3,
   Settings,
   Edit,
   Trash2,
   QrCode,
   Mail,
   Bell,
   LogOut,
   User,
   Key,
   MessageSquare,
   MessageCircle,
   Search,
   Send,
   Megaphone
 } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [individualSelectedEvent, setIndividualSelectedEvent] = useState('');
  const [broadcastSelectedEvent, setBroadcastSelectedEvent] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingFilter, setBookingFilter] = useState('all');
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
   
   const [profileData, setProfileData] = useState({
     name: user?.name || '',
     phone: user?.phone || ''
   });
   const [updatingProfile, setUpdatingProfile] = useState(false);
    const [sendingNotification, setSendingNotification] = useState(false);
    
    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Community chat states
    const [selectedCommunityEvent, setSelectedCommunityEvent] = useState(null);
    const [communityMessages, setCommunityMessages] = useState([]);
    const [communityMessageContent, setCommunityMessageContent] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileData);
      toast.success('Profile updated successfully');
      // updateProfile already updates the user in context
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  // Reset profileData when user changes (e.g., after update)
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleSendNotification = async () => {
    setSendingNotification(true);
    try {
      toast.success('Notification feature coming soon!');
    } catch (error) {
      toast.error('Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

   useEffect(() => {
     fetchDashboardData();
     if (user && user.role === 'host') {
       fetchAttendees();
       fetchHostConversations();
       fetchNotifications();
     }
   }, []);

   const fetchDashboardData = async () => {
     try {
       const [statsRes, bookingsRes, eventsRes] = await Promise.all([
         api.get('/host/dashboard'),
         api.get('/bookings/all'),
         api.get('/events/organizer')
       ]);

       setStats(statsRes.data);
       setBookings(bookingsRes.data.bookings);
       setEvents(eventsRes.data);
     } catch (error) {
       console.error('Error fetching dashboard data:', error);
       toast.error('Failed to load dashboard data');
     } finally {
       setLoading(false);
     }
   };

   const fetchAttendees = async () => {
     try {
       const res = await api.get('/messages/attendees');
       setAttendees(res.data.users || []);
     } catch (error) {
       console.error('Error fetching attendees:', error);
     }
   };

     const fetchHostConversations = async () => {
       try {
         const res = await api.get('/messages/conversations');
         setConversations(res.data.conversations || []);
       } catch (error) {
         console.error('Error fetching conversations:', error);
       }
     };

      const fetchNotifications = async () => {
       try {
         const res = await getNotifications();
         setNotifications(res.notifications || []);
         setUnreadCount(res.unreadCount || 0);
       } catch (error) {
         console.error('Error fetching notifications:', error);
       }
     };

      const fetchCommunityMessages = async (eventId, page = 1, limit = 50) => {
       try {
         const res = await getCommunityMessages(eventId, page, limit);
         setCommunityMessages(res.messages || []);
       } catch (error) {
         console.error('Error fetching community messages:', error);
         setCommunityMessages([]);
       }
     };

    const handleSendMessage = async (e) => {
      e.preventDefault();
      if (!selectedUser || !individualSelectedEvent) {
        toast.error('Please select a user and event');
        return;
      }
      setSending(true);
      try {
        await api.post('/messages', {
          receiverId: selectedUser._id,
          eventId: individualSelectedEvent,
          subject,
          content
        });
        toast.success('Message sent successfully');
        setSubject('');
        setContent('');
        setSelectedUser(null);
        setIndividualSelectedEvent('');
        fetchHostConversations();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to send message');
      } finally {
        setSending(false);
      }
    };

    const handleBroadcastMessage = async (e) => {
      e.preventDefault();
      if (!broadcastSelectedEvent || !broadcastSubject.trim() || !broadcastContent.trim()) {
        toast.error('Please select an event and fill in both subject and message');
        return;
      }
      setBroadcastSending(true);
      try {
        const res = await broadcastToEventBookers(broadcastSelectedEvent, broadcastSubject, broadcastContent);
        toast.success(res.message);
        setBroadcastSubject('');
        setBroadcastContent('');
        setBroadcastSelectedEvent('');
       } catch (error) {
         toast.error(error.response?.data?.message || 'Failed to broadcast message');
       } finally {
         setBroadcastSending(false);
       }
     };

     const handleCommunityMessageSubmit = async (e) => {
       e.preventDefault();
       if (!selectedCommunityEvent) {
         toast.error('Please select an event');
         return;
       }
       if (!communityMessageContent.trim()) {
         toast.error('Please enter a message');
         return;
       }

       try {
         await postCommunityMessage(selectedCommunityEvent, communityMessageContent);
         toast.success('Message posted to community');
         setCommunityMessageContent('');
         fetchCommunityMessages(selectedCommunityEvent);
       } catch (error) {
         toast.error(error.response?.data?.message || 'Failed to post message');
       }
     };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/confirm`);
      toast.success('Booking confirmed successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm booking');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) {
      return;
    }

    try {
      await api.put(`/bookings/${bookingId}/reject`);
      toast.success('Booking rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reject booking');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Confirmed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' },
      rejected: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Rejected' }
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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredBookings = bookingFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === bookingFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Host Dashboard</h1>
            <p className="text-gray-600">Manage events, bookings, and analytics</p>
          </div>
          <Link to="/host/create-event" className="mt-4 md:mt-0 btn-primary inline-flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.stats.totalEvents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.stats.totalBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.stats.confirmedBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{(stats?.stats.totalRevenue || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>

{/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="border-b border-gray-200">
                <nav className="flex -mb-px overflow-x-auto">
                 <button
                   onClick={() => setActiveTab('overview')}
                   className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                     activeTab === 'overview'
                       ? 'border-primary-500 text-primary-600'
                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                   }`}
                 >
                   <BarChart3 className="h-4 w-4 inline mr-2" />
                   Overview
                 </button>
                 <button
                   onClick={() => setActiveTab('analytics')}
                   className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                     activeTab === 'analytics'
                       ? 'border-primary-500 text-primary-600'
                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                   }`}
                 >
                   <TrendingUp className="h-4 w-4 inline mr-2" />
                   Analytics
                 </button>
                 <button
                   onClick={() => setActiveTab('bookings')}
                   className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                     activeTab === 'bookings'
                       ? 'border-primary-500 text-primary-600'
                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                   }`}
                 >
                   <Ticket className="h-4 w-4 inline mr-2" />
                   Bookings
                 </button>
                 <button
                   onClick={() => setActiveTab('events')}
                   className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                     activeTab === 'events'
                       ? 'border-primary-500 text-primary-600'
                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                   }`}
                 >
                   <Calendar className="h-4 w-4 inline mr-2" />
                   Events
                 </button>
                 <button
                   onClick={() => setActiveTab('communications')}
                   className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                     activeTab === 'communications'
                       ? 'border-primary-500 text-primary-600'
                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                   }`}
                 >
                   <Mail className="h-4 w-4 inline mr-2" />
                   Messages
                  </button>
                  <button
                    onClick={() => setActiveTab('community')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === 'community'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <MessageCircle className="h-4 w-4 inline mr-2" />
                    Community
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === 'notifications'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Bell className="h-4 w-4 inline mr-2" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                      activeTab === 'settings'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Settings className="h-4 w-4 inline mr-2" />
                    Settings
                  </button>
               </nav>
            </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Recent Bookings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Event
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tickets
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats?.recentBookings.slice(0, 5).map((booking) => (
                          <tr key={booking._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{booking.user?.name}</div>
                              <div className="text-sm text-gray-500">{booking.user?.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{booking.event?.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {booking.numberOfTickets}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{booking.totalPrice.toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(booking.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Events */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Events by Bookings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats?.topEvents.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900">{item._id?.title}</h4>
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                          <span>{item.bookings} bookings</span>
                          <span className="font-semibold text-primary-600">₹{item.revenue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                {/* Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['all', 'pending', 'confirmed', 'cancelled', 'rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setBookingFilter(status)}
                      className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                        bookingFilter === status
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Bookings Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tickets
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBookings.map((booking) => (
                        <tr key={booking._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booking.user?.name}</div>
                            <div className="text-sm text-gray-500">{booking.user?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{booking.event?.title}</div>
                            <div className="text-sm text-gray-500">{formatDate(booking.event?.date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.numberOfTickets}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{booking.totalPrice?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(booking.status)}
                          </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm">
                             {/* Manual confirmation removed - bookings auto-confirm after OTP */}
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <div key={event._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={event.image || 'https://images.unsplash.com/photo-1540575467083-2bdc3c5f8ebe?w=400'}
                        alt={event.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {event.availableTickets} / {event.totalTickets} tickets
                          </span>
                          <span className="font-semibold text-primary-600">₹{event.price?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Link
                            to={`/events/${event._id}`}
                            className="flex-1 btn-secondary text-center text-sm py-2"
                          >
                            <Eye className="h-4 w-4 inline mr-1" />
                            View
                          </Link>
                          <Link
                            to={`/host/create-event?edit=${event._id}`}
                            className="flex-1 btn-outline text-center text-sm py-2"
                          >
                            <Edit className="h-4 w-4 inline mr-1" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            className="px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm"
                            title="Delete Event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

             {activeTab === 'communications' && (
               <div className="space-y-6">
                 {/* Broadcast Message Section */}
                 <div className="bg-white border border-gray-200 rounded-lg p-6">
                   <h3 className="text-lg font-semibold mb-4 flex items-center">
                     <Megaphone className="h-5 w-5 mr-2 text-primary-600" />
                     Broadcast to Event Attendees
                   </h3>
                   <p className="text-sm text-gray-600 mb-4">
                     Send a message to all confirmed attendees of one of your events. The message will be delivered via in-app messaging and email.
                   </p>
                   <form onSubmit={handleBroadcastMessage} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
                          <select
                            value={broadcastSelectedEvent}
                            onChange={(e) => setBroadcastSelectedEvent(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          >
                            <option value="">Choose an event...</option>
                            {events.map((event) => (
                              <option key={event._id} value={event._id}>
                                {event.title} - {formatDate(event.date)}
                              </option>
                            ))}
                          </select>
                        </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                         <input
                           type="text"
                           value={broadcastSubject}
                           onChange={(e) => setBroadcastSubject(e.target.value)}
                           placeholder="Enter message subject"
                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                           required
                         />
                       </div>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                       <textarea
                         value={broadcastContent}
                         onChange={(e) => setBroadcastContent(e.target.value)}
                         placeholder="Write your broadcast message..."
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                         rows="4"
                         required
                       />
                     </div>
                     <button
                       type="submit"
                       disabled={broadcastSending}
                       className="btn-primary inline-flex items-center"
                     >
                       <Send className="h-4 w-4 mr-2" />
                       {broadcastSending ? 'Sending...' : 'Send Broadcast'}
                     </button>
                   </form>
                 </div>

                 {/* Individual Messaging Section */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {/* Conversations List */}
                   <div className="md:col-span-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
                     <div className="p-4 border-b border-gray-200 bg-gray-50">
                       <h3 className="font-semibold">Conversations</h3>
                     </div>
                     <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                       {conversations.length > 0 ? (
                         conversations.map((conv) => (
                           <div
                             key={conv.user._id}
                             onClick={() => setSelectedUser(conv.user)}
                             className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                               selectedUser?._id === conv.user._id ? 'bg-primary-50' : ''
                             } ${!conv.lastMessage.isRead && conv.lastMessage.sender._id !== user?.id ? 'border-l-4 border-l-primary-500' : ''}`}
                           >
                             <div className="flex items-center gap-2">
                               <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                 <User className="h-4 w-4 text-primary-600" />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className="font-medium text-sm truncate">{conv.user.name}</p>
                                 <p className="text-xs text-gray-500 truncate">
                                   {conv.lastMessage.subject || conv.lastMessage.content.substring(0, 20)}...
                                 </p>
                               </div>
                               {conv.unreadCount > 0 && (
                                 <span className="bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                   {conv.unreadCount}
                                 </span>
                               )}
                             </div>
                           </div>
                         ))
                       ) : (
                         <p className="p-4 text-center text-gray-500 text-sm">No conversations</p>
                       )}
                     </div>
                   </div>

                   {/* Message Area */}
                   <div className="md:col-span-2 border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col h-[500px]">
                     {selectedUser ? (
                       <>
                         {/* Header */}
                         <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                               <User className="h-4 w-4 text-primary-600" />
                             </div>
                             <div>
                               <p className="font-medium text-sm">{selectedUser.name}</p>
                               <p className="text-xs text-gray-500">{selectedUser.email}</p>
                             </div>
                           </div>
                           <button
                             onClick={() => setSelectedUser(null)}
                             className="text-gray-400 hover:text-gray-600"
                           >
                             <X className="h-5 w-5" />
                           </button>
                         </div>

                         {/* Messages */}
                         <div className="flex-1 overflow-y-auto p-4 space-y-3">
                           {messages.map((msg) => (
                             <div
                               key={msg._id}
                               className={`flex ${msg.sender._id === user?.id ? 'justify-end' : 'justify-start'}`}
                             >
                               <div
                                 className={`max-w-xs md:max-w-sm p-3 rounded-lg ${
                                   msg.sender._id === user?.id
                                     ? 'bg-primary-600 text-white'
                                     : 'bg-gray-100 text-gray-800'
                                 }`}
                               >
                                 {msg.subject && (
                                   <p className={`text-sm font-semibold mb-1 ${msg.sender._id === user?.id ? 'text-primary-100' : 'text-gray-600'}`}>
                                     {msg.subject}
                                   </p>
                                 )}
                                 <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                 <p className={`text-xs mt-1 ${msg.sender._id === user?.id ? 'text-primary-100' : 'text-gray-500'}`}>
                                   {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                               </div>
                             </div>
                           ))}
                         </div>

                        {/* Reply */}
                        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
                          <div className="space-y-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                              <select
                                value={individualSelectedEvent}
                                onChange={(e) => setIndividualSelectedEvent(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                required
                              >
                                <option value="">Select an event...</option>
                                {events.map((event) => (
                                  <option key={event._id} value={event._id}>
                                    {event.title} - {formatDate(event.date)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Subject (optional)"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Your message..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                rows="2"
                                required
                              />
                              <button type="submit" disabled={sending} className="btn-primary px-4 self-start">
                                {sending ? '...' : 'Send'}
                              </button>
                            </div>
                          </div>
                        </form>
                       </>
                     ) : (
                       <div className="flex-1 flex items-center justify-center text-gray-500">
                         <div className="text-center">
                           <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                           <p>Select a conversation to view messages</p>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             )}

             {activeTab === 'community' && (
                   <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     <h3 className="text-lg font-semibold mb-4">Community Chat</h3>
                     <p className="text-sm text-gray-600 mb-6">
                       View and participate in community conversations for your events. Attendees can post public messages that everyone can see.
                     </p>
                     <div className="space-y-6">
                       {/* Events List */}
                       <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                         <div className="p-4 border-b border-gray-200 bg-gray-50">
                           <h4 className="font-semibold">Your Events</h4>
                         </div>
                        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                            {events.length > 0 ? (
                              <>
                                {events.map((event) => (
                                  <div
                                    key={event._id}
                                    onClick={() => {
                                      setSelectedCommunityEvent(event._id);
                                      fetchCommunityMessages(event._id);
                                    }}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                      selectedCommunityEvent === event._id ? 'bg-primary-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-primary-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium">{event.title}</p>
                                        <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                                      </div>
                                      {communityMessages.length > 0 && selectedCommunityEvent === event._id && (
                                        <span className="bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                          {communityMessages.length}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <p className="p-4 text-center text-gray-500">
                                No events found. Create events to enable community chat.
                              </p>
                            )}
                          </div>
                       </div>

                       {/* Community Messages */}
                       <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col h-[500px]">
                         {selectedCommunityEvent ? (
                           <>
                             {/* Header */}
                             <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                   <Users className="h-4 w-4 text-primary-600" />
                                 </div>
                                 <div>
                                   <p className="font-medium">{events.find(e => e._id === selectedCommunityEvent)?.title || 'Event'}</p>
                                   <p className="text-xs text-gray-500">Community Chat</p>
                                 </div>
                               </div>
                               <button
                                 onClick={() => {
                                   setSelectedCommunityEvent(null);
                                   setCommunityMessages([]);
                                 }}
                                 className="text-gray-400 hover:text-gray-600"
                               >
                                 <X className="h-5 w-5" />
                               </button>
                             </div>

                             {/* Messages List */}
                             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                               {communityMessages.length > 0 ? (
                                 communityMessages.map((msg) => (
                                   <div
                                     key={msg._id}
                                     className="flex items-start"
                                   >
                                     <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                       <User className="h-5 w-5 text-primary-600" />
                                     </div>
                                     <div className="flex-1 min-w-0 space-y-1">
                                       <p className="font-medium text-gray-900">{msg.sender.name}</p>
                                       <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.content}</p>
                                       <p className="text-xs text-gray-400">
                                         {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                       </p>
                                     </div>
                                   </div>
                                 ))
                               ) : (
                                 <div className="flex-1 flex items-center justify-center text-gray-500 py-12">
                                   <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                   <p>No community messages yet for this event.</p>
                                 </div>
                               )}
                             </div>

                             {/* Message Input (for host to post in community) */}
                             <form onSubmit={handleCommunityMessageSubmit} className="p-4 border-t border-gray-200">
                               <div className="space-y-2">
                                 <textarea
                                   value={communityMessageContent}
                                   onChange={(e) => setCommunityMessageContent(e.target.value)}
                                   placeholder="Post a message to the community..."
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                   rows="2"
                                   required
                                 />
                                 <button type="submit" className="btn-primary w-full text-sm py-2">
                                   Post to Community
                                 </button>
                               </div>
                             </form>
                           </>
                         ) : (
                           <div className="flex-1 flex items-center justify-center text-gray-500 py-12">
                             <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                             <p>Select an event to view community chat</p>
                           </div>
                         )}
                       </div>
                     </div>
                   </motion.div>
                 )}
                 
             {activeTab === 'analytics' && (
               <div className="space-y-8">
                 {/* Analytics Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Revenue</p>
                        <p className="text-3xl font-bold">₹{(stats?.stats.totalRevenue || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <DollarSign className="h-12 w-12 text-blue-300" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Confirmed Bookings</p>
                        <p className="text-3xl font-bold">{stats?.stats.totalBookings || 0}</p>
                      </div>
                      <CheckCircle className="h-12 w-12 text-green-300" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Total Events</p>
                        <p className="text-3xl font-bold">{stats?.stats.totalEvents || 0}</p>
                      </div>
                      <Calendar className="h-12 w-12 text-purple-300" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100 text-sm">Avg per Booking</p>
                        <p className="text-3xl font-bold">
                          ₹{stats?.stats.totalBookings ? Math.round(stats.stats.totalRevenue / stats.stats.totalBookings).toLocaleString('en-IN') : 0}
                        </p>
                      </div>
                      <TrendingUp className="h-12 w-12 text-amber-300" />
                    </div>
                  </div>
                </div>

                {/* Top Performing Events */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Events</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats?.topEvents?.slice(0, 4).map((item, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                          index === 0 ? 'bg-yellow-100 text-yellow-600' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-amber-100 text-amber-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item._id?.title}</h4>
                          <p className="text-sm text-gray-500">{item.bookings} bookings</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">₹{item.revenue?.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-gray-500">revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-primary-50 rounded-lg p-6 border border-primary-100">
                    <h4 className="font-semibold text-primary-900 mb-2">📈 Sales Trend</h4>
                    <p className="text-primary-700 text-sm">
                      {stats?.stats.pendingBookings > 0 
                        ? `You have ${stats.stats.pendingBookings} bookings waiting for approval!`
                        : 'All bookings are processed.'
                      }
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6 border border-green-100">
                    <h4 className="font-semibold text-green-900 mb-2">🎫 Ticket Status</h4>
                    <p className="text-green-700 text-sm">
                      {events.reduce((acc, e) => acc + (e.totalTickets - e.availableTickets), 0)} tickets sold across all events
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-2">💰 Revenue Goal</h4>
                    <p className="text-blue-700 text-sm">
                      Track your earnings in the analytics tab
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Event Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          await api.put('/notifications/read-all');
                          setNotifications([]);
                          setUnreadCount(0);
                          toast.success('All notifications marked as read');
                        } catch (error) {
                          console.error('Error marking all as read:', error);
                        }
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                    <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500">No notifications</h3>
                    <p className="text-gray-400">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-primary-600 px-2 py-1 bg-primary-50 rounded">
                          NEW ({notifications.filter(n => !n.isRead).length})
                        </div>
                        {notifications.filter(n => !n.isRead).map((notification) => (
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
                                onClick={async () => {
                                  try {
                                    await api.put(`/notifications/${notification._id}/read`);
                                    setNotifications(prev => prev.map(n => 
                                      n._id === notification._id ? { ...n, isRead: true } : n
                                    ));
                                    setUnreadCount(prev => Math.max(0, prev - 1));
                                  } catch (error) {
                                    console.error('Error marking as read:', error);
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap"
                              >
                                Mark as read
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    {notifications.filter(n => n.isRead).length > 0 && (
                      <div className="space-y-2 mt-4">
                        {notifications.filter(n => n.isRead).map((notification) => (
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
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                {/* Profile Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Profile Settings
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-xl">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                       <button
                         onClick={handleUpdateProfile}
                         className="btn-primary"
                       >
                         <Edit className="h-4 w-4 inline mr-2" />
                         Update Profile
                       </button>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    Security
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-xl">
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <Key className="h-5 w-5 text-yellow-600 mr-2" />
                          <div>
                            <p className="font-medium text-yellow-800">Host Secret Keyword</p>
                            <p className="text-sm text-yellow-700">Used for secure host login - keep it private!</p>
                          </div>
                        </div>
                      </div>
                      <button className="btn-outline">
                        <Key className="h-4 w-4 inline mr-2" />
                        Change Keyword
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-xl">
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-gray-700">Email notifications for new bookings</span>
                        </div>
                        <input type="checkbox" defaultChecked className="h-5 w-5 text-primary-600" />
                      </label>
                      <label className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                        <div className="flex items-center">
                          <Bell className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-gray-700">Push notifications</span>
                        </div>
                        <input type="checkbox" defaultChecked className="h-5 w-5 text-primary-600" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 inline mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
