import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { broadcastToEventBookers, changeHostKeyword, changePassword, getNotifications } from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    Ticket,
    IndianRupee,
    Clock,
    MapPin,
    CheckCircle,
    XCircle,
    Plus,
    Eye,
    X,
    TrendingUp,
    DollarSign,
    BarChart3,
    Settings,
    Edit,
    Trash2,
    Mail,
    Bell,
    LogOut,
    User,
    Key,
    Lock,
    ShieldCheck,
    Save,
    Globe,
    Smartphone,
    CreditCard,
    Activity,
    MessageSquare,
    Send,
    Megaphone,
    Users
  } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const hostDashboardTabs = ['overview', 'analytics', 'bookings', 'events', 'communications', 'notifications', 'community', 'settings'];
const statusPalette = {
  confirmed: '#10b981',
  pending: '#f59e0b',
  cancelled: '#ef4444'
};

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const AnalyticsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const title = payload[0]?.payload?.name || label || payload[0]?.name;

  return (
    <div className="rounded-lg border border-cocoa-100 bg-white px-3 py-2 shadow-xl shadow-cocoa-900/10">
      {title && <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-cocoa-400">{title}</p>}
      <div className="space-y-1">
        {payload.map((entry) => (
          <p key={entry.dataKey || entry.name} className="flex items-center gap-2 text-sm font-bold text-cocoa-700">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span>{entry.name}: {entry.name === 'Revenue' ? formatMoney(entry.value) : Number(entry.value || 0).toLocaleString('en-IN')}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [, setAttendees] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages] = useState([]);
  const [individualSelectedEvent, setIndividualSelectedEvent] = useState('');
  const [broadcastSelectedEvent, setBroadcastSelectedEvent] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(hostDashboardTabs.includes(requestedTab) ? requestedTab : 'overview');
  const [bookingFilter, setBookingFilter] = useState('all');
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
   
   const [profileData, setProfileData] = useState({
     name: user?.name || '',
     phone: user?.phone || ''
   });
   const [passwordData, setPasswordData] = useState({
     currentPassword: '',
     newPassword: '',
     confirmPassword: ''
   });
   const [keywordData, setKeywordData] = useState({
     currentPassword: '',
     currentKeyword: '',
     newKeyword: ''
   });
   const [notificationPreferences, setNotificationPreferences] = useState({
     newBookings: true,
     bookingDecisions: true,
     eventReminders: true,
     communityMessages: true
   });
   const [hostPreferences, setHostPreferences] = useState({
     autoConfirmFreeEvents: false,
     showRevenueCards: true,
     requireQrAtEntry: true,
     weeklyDigest: true
   });
   const [updatingProfile, setUpdatingProfile] = useState(false);
   const [savingPassword, setSavingPassword] = useState(false);
   const [savingKeyword, setSavingKeyword] = useState(false);

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await updateProfile(profileData);
      toast.success('Profile updated successfully');
      // updateProfile already updates the user in context
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeHostKeyword = async (e) => {
    e.preventDefault();
    setSavingKeyword(true);
    try {
      await changeHostKeyword(
        keywordData.currentPassword,
        keywordData.currentKeyword,
        keywordData.newKeyword
      );
      toast.success('Host keyword changed successfully');
      setKeywordData({ currentPassword: '', currentKeyword: '', newKeyword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change host keyword');
    } finally {
      setSavingKeyword(false);
    }
  };

  const toggleNotificationPreference = (key) => {
    setNotificationPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleHostPreference = (key) => {
    setHostPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
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

  useEffect(() => {
    const nextTab = searchParams.get('tab');
    if (hostDashboardTabs.includes(nextTab) && nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'overview' ? {} : { tab: tabId });
  };

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

   useEffect(() => {
     fetchDashboardData();
     if (user?.role === 'host') {
       fetchAttendees();
       fetchHostConversations();
       fetchNotifications();
     }
   }, [user]);

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

  const handleBroadcastMessage = async (e) => {
    e.preventDefault();
    if (!broadcastSelectedEvent || !broadcastSubject.trim() || !broadcastContent.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    setBroadcastSending(true);
    try {
      const result = await broadcastToEventBookers(broadcastSelectedEvent, broadcastSubject, broadcastContent);
      const data = result.data || {};
      const failedEmailText = data.failedEmails ? ` (${data.failedEmails} email failed)` : '';
      toast.success(`Broadcast sent to ${data.totalSent || data.recipients || 0} attendee(s)${failedEmailText}`);
      setBroadcastSubject('');
      setBroadcastContent('');
      setBroadcastSelectedEvent('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setBroadcastSending(false);
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
      // This would be implemented via individual messaging API
      toast.success('Message sent successfully!');
      setContent('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Confirmed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' },
      rejected: { color: 'bg-[#f3eee9] text-cocoa-800', icon: XCircle, text: 'Rejected' }
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

  const analyticsStats = stats?.stats || {};
  const totalRevenue = Number(analyticsStats.totalRevenue || 0);
  const totalBookings = Number(analyticsStats.totalBookings || 0);
  const confirmedBookings = Number(analyticsStats.confirmedBookings || 0);
  const pendingBookings = Number(analyticsStats.pendingBookings || 0);
  const totalEvents = Number(analyticsStats.totalEvents || 0);
  const ticketsSold = events.reduce((sum, event) => {
    const sold = Number(event.totalTickets || 0) - Number(event.availableTickets || 0);
    return sum + Math.max(0, sold);
  }, 0);
  const totalCapacity = events.reduce((sum, event) => sum + Number(event.totalTickets || 0), 0);
  const fillRate = totalCapacity ? Math.round((ticketsSold / totalCapacity) * 100) : 0;
  const approvalRate = totalBookings ? Math.round((confirmedBookings / totalBookings) * 100) : 0;
  const pendingRate = totalBookings ? Math.round((pendingBookings / totalBookings) * 100) : 0;
  const avgBookingValue = totalBookings ? Math.round(totalRevenue / totalBookings) : 0;
  const activeEvents = events.filter((event) => new Date(event.date) >= new Date()).length;
  const maxTopRevenue = Math.max(...(stats?.topEvents || []).map((item) => Number(item.revenue || 0)), 1);
  const maxStatusCount = Math.max(...(stats?.bookingsByStatus || []).map((item) => Number(item.count || 0)), 1);
  const topEventsChartData = (stats?.topEvents || []).slice(0, 6).map((item, index) => ({
    name: item.title || item._id?.title || `Event ${index + 1}`,
    shortName: (item.title || item._id?.title || `Event ${index + 1}`).length > 16
      ? `${(item.title || item._id?.title || `Event ${index + 1}`).slice(0, 16)}...`
      : item.title || item._id?.title || `Event ${index + 1}`,
    revenue: Number(item.revenue || 0),
    bookings: Number(item.bookings || 0)
  }));
  const eventCapacityChartData = events
    .map((event, index) => {
      const capacity = Number(event.totalTickets || 0);
      const available = Math.max(0, Number(event.availableTickets || 0));
      const sold = Math.max(0, capacity - available);
      const name = event.title || `Event ${index + 1}`;

      return {
        name,
        shortName: name.length > 16 ? `${name.slice(0, 16)}...` : name,
        sold,
        available,
        capacity,
        fillRate: capacity ? Math.round((sold / capacity) * 100) : 0
      };
    })
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 6);
  const revenueLeader = topEventsChartData[0];
  const revenueLeaderShare = totalRevenue && revenueLeader
    ? Math.round((Number(revenueLeader.revenue || 0) / totalRevenue) * 100)
    : 0;
  const strongestCapacityEvent = eventCapacityChartData.reduce((best, item) => {
    if (!best || item.fillRate > best.fillRate) return item;
    return best;
  }, null);
  const bookingStatusData = (stats?.bookingsByStatus || [])
    .filter((item) => Number(item.count || 0) > 0)
    .map((item) => ({
      name: item._id || 'unknown',
      value: Number(item.count || 0),
      color: statusPalette[item._id] || '#976f59'
    }));
  const insightCards = [
    {
      label: 'Revenue leader',
      value: revenueLeader?.name || 'No revenue yet',
      detail: revenueLeader ? `${formatMoney(revenueLeader.revenue)} • ${revenueLeaderShare}% of total revenue` : 'Confirmed paid bookings will appear here.',
      icon: TrendingUp
    },
    {
      label: 'Strongest fill rate',
      value: strongestCapacityEvent?.name || 'No capacity data',
      detail: strongestCapacityEvent ? `${strongestCapacityEvent.fillRate}% sold • ${strongestCapacityEvent.sold}/${strongestCapacityEvent.capacity} tickets` : 'Ticket capacity will appear after events are created.',
      icon: Ticket
    },
    {
      label: 'Action queue',
      value: pendingBookings > 0 ? `${pendingBookings} pending` : 'All clear',
      detail: pendingBookings > 0 ? 'Review pending requests to keep conversion moving.' : 'No pending booking requests right now.',
      icon: ShieldCheck
    }
  ];
  const analyticsCards = [
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      detail: `${confirmedBookings} confirmed paid bookings`,
      icon: IndianRupee,
      color: 'from-primary-500 to-secondary-500'
    },
    {
      label: 'Approval Rate',
      value: `${approvalRate}%`,
      detail: `${confirmedBookings} confirmed bookings`,
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      label: 'Tickets Sold',
      value: ticketsSold.toLocaleString('en-IN'),
      detail: `${fillRate}% capacity filled`,
      icon: Ticket,
      color: 'from-amber-500 to-orange-500'
    },
    {
      label: 'Live Events',
      value: activeEvents.toLocaleString('en-IN'),
      detail: `${totalEvents} total hosted events`,
      icon: Calendar,
      color: 'from-violet-500 to-fuchsia-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f4]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf8f4] py-10 text-cocoa-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-cocoa-900">Host Dashboard</h1>
            <p className="text-cocoa-500 text-lg font-semibold">Manage events, bookings, and analytics</p>
          </div>
          <Link to="/host/create-event" className="mt-4 md:mt-0 btn-primary inline-flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-xl shadow-cocoa-900/5 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-50 rounded-lg">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold text-cocoa-400">Total Events</p>
                <p className="text-2xl font-extrabold text-cocoa-900">{stats?.stats.totalEvents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl shadow-cocoa-900/5 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold text-cocoa-400">Total Bookings</p>
                <p className="text-2xl font-extrabold text-cocoa-900">{stats?.stats.totalBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl shadow-cocoa-900/5 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold text-cocoa-400">Confirmed</p>
                <p className="text-2xl font-extrabold text-cocoa-900">{stats?.stats.confirmedBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl shadow-cocoa-900/5 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold text-cocoa-400">Total Revenue</p>
                <p className="text-2xl font-extrabold text-cocoa-900">₹{(stats?.stats.totalRevenue || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>

{/* Tabs */}
          <div className="bg-white rounded-lg shadow-xl shadow-cocoa-900/5 overflow-hidden">
            <div className="border-b border-cocoa-100">
                <nav className="flex gap-2 overflow-x-auto p-3">
                 <button
                   onClick={() => handleTabChange('overview')}
                   className={`rounded-full px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-all ${
                     activeTab === 'overview'
                       ? 'bg-primary-500 text-white'
                       : 'bg-[#f3eee9] text-cocoa-500 hover:bg-primary-50 hover:text-primary-600'
                   }`}
                 >
                   <BarChart3 className="h-4 w-4 inline mr-2" />
                   Overview
                 </button>
                 <button
                   onClick={() => handleTabChange('analytics')}
                   className={`rounded-full px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-all ${
                     activeTab === 'analytics'
                       ? 'bg-primary-500 text-white'
                       : 'bg-[#f3eee9] text-cocoa-500 hover:bg-primary-50 hover:text-primary-600'
                   }`}
                 >
                   <TrendingUp className="h-4 w-4 inline mr-2" />
                   Analytics
                 </button>
                 <button
                   onClick={() => handleTabChange('bookings')}
                   className={`rounded-full px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-all ${
                     activeTab === 'bookings'
                       ? 'bg-primary-500 text-white'
                       : 'bg-[#f3eee9] text-cocoa-500 hover:bg-primary-50 hover:text-primary-600'
                   }`}
                 >
                   <Ticket className="h-4 w-4 inline mr-2" />
                   Bookings
                 </button>
                  <button
                    onClick={() => handleTabChange('events')}
                    className={`rounded-full px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-all ${
                      activeTab === 'events'
                        ? 'bg-primary-500 text-white'
                        : 'bg-[#f3eee9] text-cocoa-500 hover:bg-primary-50 hover:text-primary-600'
                    }`}
                  >
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Events
                  </button>
                  <button
                    onClick={() => handleTabChange('communications')}
                    className={`rounded-full px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-all ${
                      activeTab === 'communications'
                        ? 'bg-primary-500 text-white'
                        : 'bg-[#f3eee9] text-cocoa-500 hover:bg-primary-50 hover:text-primary-600'
                    }`}
                  >
                    <Mail className="h-4 w-4 inline mr-2" />
                    Messages
                  </button>
                  <button
                    onClick={() => handleTabChange('notifications')}
                    className={`rounded-full px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-all ${
                      activeTab === 'notifications'
                        ? 'bg-primary-500 text-white'
                        : 'bg-[#f3eee9] text-cocoa-500 hover:bg-primary-50 hover:text-primary-600'
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
                    onClick={() => handleTabChange('community')}
                    className={`rounded-full px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-all ${
                      activeTab === 'community'
                        ? 'bg-primary-500 text-white'
                        : 'bg-[#f3eee9] text-cocoa-500 hover:bg-primary-50 hover:text-primary-600'
                    }`}
                  >
                    <Users className="h-4 w-4 inline mr-2" />
                    Community
                  </button>
                  <button
                    onClick={() => handleTabChange('settings')}
                    className={`rounded-full px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-all ${
                      activeTab === 'settings'
                        ? 'bg-primary-500 text-white'
                        : 'bg-[#f3eee9] text-cocoa-500 hover:bg-primary-50 hover:text-primary-600'
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
                  <h3 className="text-lg font-semibold text-cocoa-900 mb-4">Recent Bookings</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-[#fbf8f4]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cocoa-400 uppercase">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cocoa-400 uppercase">
                            Event
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cocoa-400 uppercase">
                            Tickets
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cocoa-400 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cocoa-400 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats?.recentBookings.slice(0, 5).map((booking) => (
                          <tr key={booking._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-cocoa-900">{booking.user?.name}</div>
                              <div className="text-sm text-cocoa-400">{booking.user?.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-cocoa-900">{booking.event?.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-cocoa-400">
                              {booking.numberOfTickets}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-cocoa-900">
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
                  <h3 className="text-lg font-semibold text-cocoa-900 mb-4">Top Events by Bookings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats?.topEvents.map((item, index) => (
                      <div key={index} className="border border-cocoa-100 rounded-lg p-4">
                        <h4 className="font-semibold text-cocoa-900">{item._id?.title}</h4>
                        <div className="flex items-center justify-between mt-2 text-sm text-cocoa-400">
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
                          : 'bg-[#f3eee9] text-cocoa-700 hover:bg-primary-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Bookings Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#fbf8f4]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cocoa-400 uppercase">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cocoa-400 uppercase">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cocoa-400 uppercase">
                          Tickets
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cocoa-400 uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cocoa-400 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-cocoa-400 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBookings.map((booking) => (
                        <tr key={booking._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-cocoa-900">{booking.user?.name}</div>
                            <div className="text-sm text-cocoa-400">{booking.user?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-cocoa-900">{booking.event?.title}</div>
                            <div className="text-sm text-cocoa-400">{formatDate(booking.event?.date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cocoa-400">
                            {booking.numberOfTickets}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cocoa-900">
                            ₹{booking.totalPrice?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(booking.status)}
                          </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm">
                             {/* Manual confirmation removed - bookings auto-confirm */}
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
                    <div key={event._id} className="border border-cocoa-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={event.image || 'https://images.unsplash.com/photo-1540575467083-2bdc3c5f8ebe?w=400'}
                        alt={event.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-4">
                        <h4 className="font-semibold text-cocoa-900 mb-2">{event.title}</h4>
                        <div className="flex items-center text-sm text-cocoa-400 mb-2">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-cocoa-400">
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
                 <div className="bg-white border border-cocoa-100 rounded-lg p-6">
                   <h3 className="text-lg font-semibold mb-4 flex items-center">
                     <Megaphone className="h-5 w-5 mr-2 text-primary-600" />
                     Broadcast to Event Attendees
                   </h3>
                   <p className="text-sm text-cocoa-500 mb-4">
                     Send a message to all confirmed attendees of one of your events. The message will be delivered via in-app messaging and email.
                   </p>
                   <form onSubmit={handleBroadcastMessage} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-cocoa-700 mb-2">Select Event</label>
                          <select
                            value={broadcastSelectedEvent}
                            onChange={(e) => setBroadcastSelectedEvent(e.target.value)}
                            className="w-full px-4 py-2 border border-cocoa-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                         <label className="block text-sm font-medium text-cocoa-700 mb-2">Subject</label>
                         <input
                           type="text"
                           value={broadcastSubject}
                           onChange={(e) => setBroadcastSubject(e.target.value)}
                           placeholder="Enter message subject"
                           className="w-full px-4 py-2 border border-cocoa-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                           required
                         />
                       </div>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-cocoa-700 mb-2">Message</label>
                       <textarea
                         value={broadcastContent}
                         onChange={(e) => setBroadcastContent(e.target.value)}
                         placeholder="Write your broadcast message..."
                         className="w-full px-4 py-2 border border-cocoa-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                   <div className="md:col-span-1 border border-cocoa-100 rounded-lg overflow-hidden bg-white">
                     <div className="p-4 border-b border-cocoa-100 bg-[#fbf8f4]">
                       <h3 className="font-semibold">Conversations</h3>
                     </div>
                     <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                       {conversations.length > 0 ? (
                         conversations.map((conv) => (
                           <div
                             key={conv.user._id}
                             onClick={() => setSelectedUser(conv.user)}
                             className={`p-3 cursor-pointer hover:bg-[#fbf8f4] transition-colors ${
                               selectedUser?._id === conv.user._id ? 'bg-primary-50' : ''
                             } ${!conv.lastMessage.isRead && conv.lastMessage.sender._id !== user?.id ? 'border-l-4 border-l-primary-500' : ''}`}
                           >
                             <div className="flex items-center gap-2">
                               <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                 <User className="h-4 w-4 text-primary-600" />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className="font-medium text-sm truncate">{conv.user.name}</p>
                                 <p className="text-xs text-cocoa-400 truncate">
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
                         <p className="p-4 text-center text-cocoa-400 text-sm">No conversations</p>
                       )}
                     </div>
                   </div>

                   {/* Message Area */}
                   <div className="md:col-span-2 border border-cocoa-100 rounded-lg overflow-hidden bg-white flex flex-col h-[500px]">
                     {selectedUser ? (
                       <>
                         {/* Header */}
                         <div className="p-3 border-b border-cocoa-100 bg-[#fbf8f4] flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                               <User className="h-4 w-4 text-primary-600" />
                             </div>
                             <div>
                               <p className="font-medium text-sm">{selectedUser.name}</p>
                               <p className="text-xs text-cocoa-400">{selectedUser.email}</p>
                             </div>
                           </div>
                           <button
                             onClick={() => setSelectedUser(null)}
                             className="text-cocoa-300 hover:text-cocoa-500"
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
                                     : 'bg-[#f3eee9] text-cocoa-800'
                                 }`}
                               >
                                 {msg.subject && (
                                   <p className={`text-sm font-semibold mb-1 ${msg.sender._id === user?.id ? 'text-primary-100' : 'text-cocoa-500'}`}>
                                     {msg.subject}
                                   </p>
                                 )}
                                 <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                 <p className={`text-xs mt-1 ${msg.sender._id === user?.id ? 'text-primary-100' : 'text-cocoa-400'}`}>
                                   {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                               </div>
                             </div>
                           ))}
                         </div>

                        {/* Reply */}
                        <form onSubmit={handleSendMessage} className="p-3 border-t border-cocoa-100">
                          <div className="space-y-2">
                            <div>
                              <label className="block text-sm font-medium text-cocoa-700 mb-1">Event</label>
                              <select
                                value={individualSelectedEvent}
                                onChange={(e) => setIndividualSelectedEvent(e.target.value)}
                                className="w-full px-3 py-2 border border-cocoa-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
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
                                className="flex-1 px-3 py-2 border border-cocoa-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Your message..."
                                className="flex-1 px-3 py-2 border border-cocoa-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
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
                       <div className="flex-1 flex items-center justify-center text-cocoa-400">
                         <div className="text-center">
                           <MessageSquare className="h-12 w-12 mx-auto mb-3 text-cocoa-200" />
                           <p>Select a conversation to view messages</p>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
                </div>
              )}

              {activeTab === 'community' && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-cocoa-900 mb-2">Event Communities</h3>
                    <p className="text-sm text-cocoa-500">
                      Join and manage your event community chats. Engage with attendees and moderate conversations.
                    </p>
                  </div>

                  {events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {events.map((event) => (
                        <div
                          key={event._id}
                          className="bg-white border border-cocoa-100 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group"
                        >
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

                          <div className="p-4 bg-[#fbf8f4] border-t border-cocoa-100">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary-600" />
                                <span className="text-sm text-cocoa-500">
                                  {event.bookings || 0} attending
                                </span>
                              </div>
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Active
                              </span>
                            </div>
                            <Link
                              to={`/events/${event._id}/chat`}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-cocoa-900 rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Open Community Chat
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-[#fbf8f4] rounded-lg border border-cocoa-100">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 mx-auto mb-4 flex items-center justify-center">
                        <Users className="w-10 h-10 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-cocoa-900 mb-2">No Events Yet</h3>
                      <p className="text-cocoa-500 mb-6 max-w-md mx-auto">
                        Create your first event to start building its community. Once attendees join, you can chat together!
                      </p>
                      <Link to="/host/create-event" className="btn-primary inline-flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Create Event
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'analytics' && (
               <div className="space-y-8">
                  <div className="overflow-hidden rounded-lg bg-gradient-to-br from-cocoa-900 via-cocoa-800 to-primary-900 text-white shadow-2xl shadow-cocoa-900/15">
                    <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
                      <div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase text-primary-100">
                          <Activity className="h-4 w-4" />
                          Host analytics
                        </span>
                        <h3 className="mt-5 text-3xl font-extrabold">Performance snapshot</h3>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-50/80">
                          Track revenue, approvals, capacity, and the event doing the most work for your business.
                        </p>
                        <div className="mt-7 grid gap-4 sm:grid-cols-3">
                          <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <p className="text-sm text-primary-50/75">Average booking</p>
                            <p className="mt-2 text-2xl font-extrabold">₹{avgBookingValue.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <p className="text-sm text-primary-50/75">Pending queue</p>
                            <p className="mt-2 text-2xl font-extrabold">{pendingBookings}</p>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <p className="text-sm text-primary-50/75">Capacity filled</p>
                            <p className="mt-2 text-2xl font-extrabold">{fillRate}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/10 p-5">
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-primary-50/75">Revenue by event</p>
                            <p className="mt-1 text-2xl font-extrabold">{formatMoney(totalRevenue)}</p>
                            <p className="mt-1 text-xs font-semibold text-primary-50/60">Confirmed ticket revenue</p>
                          </div>
                          <BarChart3 className="h-10 w-10 text-primary-200" />
                        </div>
                        <div className="h-64">
                          {topEventsChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={topEventsChartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} />
                                <XAxis dataKey="shortName" tick={{ fill: '#fff2ec', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} tick={{ fill: '#fff2ec', fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                                <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: 'rgba(255,255,255,0.08)' }} />
                                <Bar dataKey="revenue" name="Revenue" radius={[8, 8, 0, 0]} fill="#ff9a72" />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 text-center">
                              <BarChart3 className="h-10 w-10 text-primary-100/70" />
                              <p className="mt-3 text-sm font-bold text-primary-50/80">Charts will appear after bookings start.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {analyticsCards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <div key={card.label} className="rounded-lg border border-white bg-white p-5 shadow-xl shadow-cocoa-900/5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-cocoa-400">{card.label}</p>
                              <p className="mt-2 text-3xl font-extrabold text-cocoa-900">{card.value}</p>
                              <p className="mt-2 text-sm text-cocoa-500">{card.detail}</p>
                            </div>
                            <span className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${card.color} text-white shadow-lg shadow-primary-500/15`}>
                              <Icon className="h-6 w-6" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {insightCards.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="rounded-lg border border-white bg-white p-5 shadow-xl shadow-cocoa-900/5">
                          <div className="flex items-start gap-3">
                            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                              <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold uppercase tracking-wide text-cocoa-400">{item.label}</p>
                              <p className="mt-2 truncate text-lg font-extrabold text-cocoa-900">{item.value}</p>
                              <p className="mt-1 text-sm leading-5 text-cocoa-500">{item.detail}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-lg border border-white bg-white p-6 shadow-xl shadow-cocoa-900/5">
                      <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-extrabold text-cocoa-900">Revenue and bookings mix</h3>
                          <p className="mt-1 text-sm text-cocoa-500">Compare earning power with actual booking movement.</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-primary-500" />
                      </div>
                      <div className="h-80">
                        {topEventsChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={topEventsChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                              <CartesianGrid stroke="#f4eee6" vertical={false} />
                              <XAxis dataKey="shortName" tick={{ fill: '#76523f', fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis yAxisId="revenue" tickFormatter={(value) => `₹${Number(value) / 1000}k`} tick={{ fill: '#976f59', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                              <YAxis yAxisId="bookings" orientation="right" tick={{ fill: '#976f59', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                              <Tooltip content={<AnalyticsTooltip />} />
                              <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ color: '#583d2f', fontSize: 12, fontWeight: 700 }} />
                              <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue" stroke="#f45a2c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                              <Line yAxisId="bookings" type="monotone" dataKey="bookings" name="Bookings" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-cocoa-100 bg-[#fbf8f4] text-center">
                            <TrendingUp className="h-10 w-10 text-cocoa-300" />
                            <p className="mt-3 text-sm font-bold text-cocoa-500">Revenue and booking trends will appear here.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-white bg-white p-6 shadow-xl shadow-cocoa-900/5">
                      <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-extrabold text-cocoa-900">Ticket capacity by event</h3>
                          <p className="mt-1 text-sm text-cocoa-500">Sold versus available tickets for your most active events.</p>
                        </div>
                        <Ticket className="h-5 w-5 text-primary-500" />
                      </div>
                      <div className="h-80">
                        {eventCapacityChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eventCapacityChartData} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                              <CartesianGrid stroke="#f4eee6" horizontal={false} />
                              <XAxis type="number" tick={{ fill: '#976f59', fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="shortName" tick={{ fill: '#76523f', fontSize: 11 }} axisLine={false} tickLine={false} width={96} />
                              <Tooltip content={<AnalyticsTooltip />} />
                              <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ color: '#583d2f', fontSize: 12, fontWeight: 700 }} />
                              <Bar dataKey="sold" name="Sold" stackId="tickets" fill="#f45a2c" radius={[0, 0, 0, 0]} />
                              <Bar dataKey="available" name="Available" stackId="tickets" fill="#e6d8ca" radius={[0, 8, 8, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-cocoa-100 bg-[#fbf8f4] text-center">
                            <Ticket className="h-10 w-10 text-cocoa-300" />
                            <p className="mt-3 text-sm font-bold text-cocoa-500">Ticket capacity data will appear after events are created.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-lg border border-white bg-white p-6 shadow-xl shadow-cocoa-900/5">
                      <div className="mb-6 flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-extrabold text-cocoa-900">Top performing events</h3>
                          <p className="mt-1 text-sm text-cocoa-500">Ranked by revenue and booking momentum.</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-primary-500" />
                      </div>

                      <div className="space-y-4">
                        {(stats?.topEvents || []).slice(0, 5).map((item, index) => {
                          const revenue = Number(item.revenue || 0);
                          const width = Math.max(8, Math.round((revenue / maxTopRevenue) * 100));
                          return (
                            <div key={item._id || index} className="rounded-lg border border-cocoa-100 bg-[#fbf8f4] p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 font-extrabold text-primary-600">
                                    {index + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <h4 className="truncate font-extrabold text-cocoa-900">{item.title || item._id?.title || 'Untitled event'}</h4>
                                    <p className="text-sm text-cocoa-500">{item.bookings || 0} bookings</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-extrabold text-emerald-600">₹{revenue.toLocaleString('en-IN')}</p>
                                  <p className="text-xs text-cocoa-400">revenue</p>
                                </div>
                              </div>
                              <div className="mt-4 h-2 overflow-hidden rounded-full bg-cocoa-100">
                                <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" style={{ width: `${width}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        {(stats?.topEvents || []).length === 0 && (
                          <div className="rounded-lg border border-cocoa-100 bg-[#fbf8f4] p-8 text-center">
                            <BarChart3 className="mx-auto h-10 w-10 text-cocoa-300" />
                            <p className="mt-3 font-bold text-cocoa-500">No event performance yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-lg border border-white bg-white p-6 shadow-xl shadow-cocoa-900/5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-extrabold text-cocoa-900">Booking health</h3>
                            <p className="mt-1 text-sm text-cocoa-500">Status distribution across all event bookings.</p>
                          </div>
                          <Activity className="h-5 w-5 text-primary-500" />
                        </div>
                        <div className="mt-5 h-64">
                          {bookingStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Tooltip content={<AnalyticsTooltip />} />
                                <Pie
                                  data={bookingStatusData}
                                  dataKey="value"
                                  nameKey="name"
                                  innerRadius={58}
                                  outerRadius={92}
                                  paddingAngle={4}
                                >
                                  {bookingStatusData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-cocoa-100 bg-[#fbf8f4] text-center">
                              <Activity className="h-10 w-10 text-cocoa-300" />
                              <p className="mt-3 text-sm font-bold text-cocoa-500">No booking data yet</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          {(stats?.bookingsByStatus || []).map((item) => {
                            const status = item._id || 'unknown';
                            const width = Math.max(5, Math.round((Number(item.count || 0) / maxStatusCount) * 100));
                            return (
                              <div key={status} className="rounded-lg border border-cocoa-100 bg-[#fbf8f4] p-3">
                                <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                                  <span className="flex items-center gap-2 font-bold capitalize text-cocoa-700">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusPalette[status] || '#976f59' }} />
                                    {status}
                                  </span>
                                  <span className="font-extrabold text-cocoa-900">{item.count}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-cocoa-100">
                                  <div className="h-1.5 rounded-full" style={{ width: `${width}%`, backgroundColor: statusPalette[status] || '#976f59' }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-lg border border-primary-100 bg-primary-50 p-6">
                        <h3 className="text-xl font-extrabold text-cocoa-900">Quick insights</h3>
                        <div className="mt-5 space-y-4">
                          <div className="flex gap-3">
                            <ShieldCheck className="mt-1 h-5 w-5 text-primary-600" />
                            <p className="text-sm leading-6 text-cocoa-600">
                              {pendingBookings > 0
                                ? `${pendingBookings} booking request${pendingBookings > 1 ? 's need' : ' needs'} your review.`
                                : 'All booking requests are handled.'}
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <Ticket className="mt-1 h-5 w-5 text-primary-600" />
                            <p className="text-sm leading-6 text-cocoa-600">
                              {ticketsSold.toLocaleString('en-IN')} of {totalCapacity.toLocaleString('en-IN')} tickets are sold.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <DollarSign className="mt-1 h-5 w-5 text-primary-600" />
                            <p className="text-sm leading-6 text-cocoa-600">
                              Average booking value is ₹{avgBookingValue.toLocaleString('en-IN')} with {pendingRate}% still pending.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-cocoa-900">Event Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          await api.put('/notifications/read-all');
                          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
                  <div className="text-center py-12 bg-white rounded-lg shadow-lg">
                    <Bell className="h-16 w-16 text-cocoa-200 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-cocoa-400">No notifications</h3>
                    <p className="text-cocoa-300">You're all caught up!</p>
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
                                <p className="font-medium text-cocoa-900 text-sm">{notification.title}</p>
                                <p className="text-sm text-cocoa-500 mt-1">{notification.message}</p>
                                <p className="text-xs text-cocoa-300 mt-2">
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
                            className="p-4 bg-[#fbf8f4] border border-cocoa-100 rounded-lg opacity-75"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-cocoa-100 flex items-center justify-center flex-shrink-0">
                                <Bell className="h-4 w-4 text-cocoa-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-cocoa-900 text-sm">{notification.title}</p>
                                <p className="text-sm text-cocoa-500 mt-1">{notification.message}</p>
                                <p className="text-xs text-cocoa-300 mt-2">
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
                <div className="overflow-hidden rounded-lg bg-gradient-to-br from-primary-50 via-white to-[#fbf8f4] p-6 shadow-xl shadow-cocoa-900/5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="section-kicker">
                        <Settings className="h-3.5 w-3.5" />
                        Host settings
                      </span>
                      <h3 className="text-3xl font-extrabold text-cocoa-900">Control your host workspace</h3>
                      <p className="mt-3 max-w-2xl text-cocoa-500">
                        Manage account security, login keyword, notifications, and event workflow preferences from one place.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-white bg-white p-4 shadow-lg shadow-cocoa-900/5">
                        <p className="font-bold text-cocoa-400">Role</p>
                        <p className="mt-1 font-extrabold text-cocoa-900">Host</p>
                      </div>
                      <div className="rounded-lg border border-white bg-white p-4 shadow-lg shadow-cocoa-900/5">
                        <p className="font-bold text-cocoa-400">Events</p>
                        <p className="mt-1 font-extrabold text-cocoa-900">{totalEvents}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <form onSubmit={handleUpdateProfile} className="rounded-lg border border-white bg-white p-6 shadow-xl shadow-cocoa-900/5">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <User className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-xl font-extrabold text-cocoa-900">Profile details</h3>
                        <p className="text-sm text-cocoa-500">Shown on event and host communications.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="label">Full name</label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label">Phone number</label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="input-field"
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div>
                        <label className="label">Email address</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="input-field bg-[#fbf8f4] text-cocoa-400"
                        />
                      </div>
                      <button type="submit" disabled={updatingProfile} className="btn-primary">
                        <Save className="h-4 w-4" />
                        {updatingProfile ? 'Saving...' : 'Save profile'}
                      </button>
                    </div>
                  </form>

                  <div className="grid gap-6">
                    <form onSubmit={handleChangePassword} className="rounded-lg border border-white bg-white p-6 shadow-xl shadow-cocoa-900/5">
                      <div className="mb-6 flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Lock className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-xl font-extrabold text-cocoa-900">Change password</h3>
                          <p className="text-sm text-cocoa-500">Use a strong password with at least 6 characters.</p>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="input-field"
                          placeholder="Current password"
                          required
                        />
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="input-field"
                          placeholder="New password"
                          minLength={6}
                          required
                        />
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="input-field"
                          placeholder="Confirm password"
                          minLength={6}
                          required
                        />
                      </div>
                      <button type="submit" disabled={savingPassword} className="btn-primary mt-4">
                        <ShieldCheck className="h-4 w-4" />
                        {savingPassword ? 'Updating...' : 'Update password'}
                      </button>
                    </form>

                    <form onSubmit={handleChangeHostKeyword} className="rounded-lg border border-white bg-white p-6 shadow-xl shadow-cocoa-900/5">
                      <div className="mb-6 flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <Key className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-xl font-extrabold text-cocoa-900">Change host keyword</h3>
                          <p className="text-sm text-cocoa-500">This keyword is required for host login.</p>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <input
                          type="password"
                          value={keywordData.currentPassword}
                          onChange={(e) => setKeywordData({ ...keywordData, currentPassword: e.target.value })}
                          className="input-field"
                          placeholder="Current password"
                          required
                        />
                        <input
                          type="password"
                          value={keywordData.currentKeyword}
                          onChange={(e) => setKeywordData({ ...keywordData, currentKeyword: e.target.value })}
                          className="input-field"
                          placeholder="Current keyword"
                          required
                        />
                        <input
                          type="password"
                          value={keywordData.newKeyword}
                          onChange={(e) => setKeywordData({ ...keywordData, newKeyword: e.target.value })}
                          className="input-field"
                          placeholder="New keyword"
                          minLength={4}
                          required
                        />
                      </div>
                      <button type="submit" disabled={savingKeyword} className="btn-secondary mt-4">
                        <Key className="h-4 w-4" />
                        {savingKeyword ? 'Changing...' : 'Change keyword'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-lg border border-white bg-white p-6 shadow-xl shadow-cocoa-900/5">
                    <h3 className="text-xl font-extrabold text-cocoa-900">Notification controls</h3>
                    <p className="mt-1 text-sm text-cocoa-500">Choose which host alerts should stay active.</p>
                    <div className="mt-5 space-y-3">
                      {[
                        { key: 'newBookings', icon: Ticket, label: 'New booking requests', description: 'Alert me when an attendee requests a ticket.' },
                        { key: 'bookingDecisions', icon: CheckCircle, label: 'Confirmations and rejections', description: 'Notify me when booking states change.' },
                        { key: 'eventReminders', icon: Calendar, label: 'Event reminders', description: 'Send operational reminders before event day.' },
                        { key: 'communityMessages', icon: MessageSquare, label: 'Community messages', description: 'Surface attendee chat activity.' }
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            type="button"
                            key={item.key}
                            onClick={() => toggleNotificationPreference(item.key)}
                            className="flex w-full items-center justify-between gap-4 rounded-lg border border-cocoa-100 bg-[#fbf8f4] p-4 text-left transition hover:border-primary-200 hover:bg-primary-50"
                          >
                            <div className="flex items-start gap-3">
                              <Icon className="mt-1 h-5 w-5 text-primary-600" />
                              <div>
                                <p className="font-bold text-cocoa-900">{item.label}</p>
                                <p className="text-sm text-cocoa-500">{item.description}</p>
                              </div>
                            </div>
                            <span className={`h-6 w-11 rounded-full p-1 transition ${notificationPreferences[item.key] ? 'bg-primary-500' : 'bg-cocoa-200'}`}>
                              <span className={`block h-4 w-4 rounded-full bg-white transition ${notificationPreferences[item.key] ? 'translate-x-5' : ''}`} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-white bg-white p-6 shadow-xl shadow-cocoa-900/5">
                    <h3 className="text-xl font-extrabold text-cocoa-900">Host workflow preferences</h3>
                    <p className="mt-1 text-sm text-cocoa-500">Fine tune common host operations.</p>
                    <div className="mt-5 grid gap-3">
                      {[
                        { key: 'autoConfirmFreeEvents', icon: CreditCard, label: 'Auto-confirm free events' },
                        { key: 'showRevenueCards', icon: BarChart3, label: 'Show revenue cards by default' },
                        { key: 'requireQrAtEntry', icon: Smartphone, label: 'Require QR check-in at entry' },
                        { key: 'weeklyDigest', icon: Mail, label: 'Send weekly host digest' }
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <label key={item.key} className="flex items-center justify-between rounded-lg border border-cocoa-100 bg-[#fbf8f4] p-4">
                            <span className="flex items-center gap-3 font-bold text-cocoa-800">
                              <Icon className="h-5 w-5 text-primary-600" />
                              {item.label}
                            </span>
                            <input
                              type="checkbox"
                              checked={hostPreferences[item.key]}
                              onChange={() => toggleHostPreference(item.key)}
                              className="h-5 w-5 rounded border-cocoa-200 text-primary-600 focus:ring-primary-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-5 rounded-lg border border-cocoa-100 bg-[#fbf8f4] p-4">
                      <label className="label flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary-600" />
                        Default event visibility
                      </label>
                      <select className="input-field">
                        <option>Public after publishing</option>
                        <option>Private draft first</option>
                        <option>Manual review before listing</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-red-100 bg-red-50 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-extrabold text-red-800">Account session</h3>
                      <p className="mt-1 text-sm text-red-700">Sign out from this device when you finish host operations.</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-3 font-bold text-red-600 transition hover:bg-red-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
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
