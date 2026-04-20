import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
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
  Key
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingFilter, setBookingFilter] = useState('all');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);

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
              <div className="p-3 bg-green-100 rounded-lg">
                <Ticket className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.stats.totalBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.stats.pendingBookings || 0}</p>
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
                            {booking.status === 'pending' && booking.isOtpVerified && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleConfirmBooking(booking._id)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Confirm"
                                >
                                  <Check className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleRejectBooking(booking._id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Reject"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            )}
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Announcement</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                          <option value="">All Events</option>
                          {events.map((event) => (
                            <option key={event._id} value={event._id}>{event.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message Title</label>
                        <input
                          type="text"
                          placeholder="Important update about your event..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                          rows={4}
                          placeholder="Write your message to attendees..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <button
                        onClick={handleSendNotification}
                        disabled={sendingNotification}
                        className="btn-primary"
                      >
                        <Mail className="h-4 w-4 inline mr-2" />
                        {sendingNotification ? 'Sending...' : 'Send to All Attendees'}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Broadcast</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 cursor-pointer hover:bg-primary-100 transition-colors">
                      <div className="flex items-center">
                        <Bell className="h-8 w-8 text-primary-600 mr-3" />
                        <div>
                          <h4 className="font-semibold text-primary-900">Event Reminder</h4>
                          <p className="text-sm text-primary-700">Send reminder to upcoming event attendees</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 cursor-pointer hover:bg-green-100 transition-colors">
                      <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <h4 className="font-semibold text-green-900">Booking Confirmed</h4>
                          <p className="text-sm text-green-700">Notify confirmed booking attendees</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 cursor-pointer hover:bg-blue-100 transition-colors">
                      <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <h4 className="font-semibold text-blue-900">Event Update</h4>
                          <p className="text-sm text-blue-700">Notify about event changes</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 cursor-pointer hover:bg-amber-100 transition-colors">
                      <div className="flex items-center">
                        <QrCode className="h-8 w-8 text-amber-600 mr-3" />
                        <div>
                          <h4 className="font-semibold text-amber-900">QR Code Ready</h4>
                          <p className="text-sm text-amber-700">Tell attendees to get their tickets</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Note:</strong> Email notifications will be sent to all registered attendees for the selected event.
                  </p>
                </div>
              </div>
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
