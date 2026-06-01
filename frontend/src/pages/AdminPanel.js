import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Edit,
  Eye,
  Flag,
  Folder,
  FileText,
  IndianRupee,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  Shield,
  Star,
  Tag,
  Ticket,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Users,
  X,
  XCircle
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'bookings', label: 'Bookings', icon: Ticket },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'support', label: 'Support', icon: MessageSquare },
  { id: 'fraud', label: 'Fraud', icon: AlertTriangle },
  { id: 'reports', label: 'Reports', icon: Download },
  { id: 'security', label: 'Security', icon: Shield }
];

const emptyNotification = {
  title: '',
  message: '',
  type: 'system',
  link: '',
  targetType: 'all',
  role: 'user',
  userId: '',
  sendEmail: false
};

const emptySupportTicket = {
  user: '',
  event: '',
  booking: '',
  type: 'general',
  subject: '',
  message: '',
  priority: 'medium'
};

const emptyLocation = {
  city: '',
  region: '',
  country: 'India',
  notes: ''
};

const money = (value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const monthLabel = (point) => {
  if (!point?._id) return 'N/A';
  return `${point._id.month}/${point._id.year}`;
};

const StatusBadge = ({ children, tone = 'gray' }) => {
  const tones = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-[#fbf8f4] text-cocoa-700 border-cocoa-100'
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
};

const DetailBlock = ({ label, value, className = '' }) => (
  <div className={`rounded-lg bg-[#fbf8f4] p-4 ${className}`}>
    <p className="text-xs font-extrabold uppercase text-cocoa-400">{label}</p>
    <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-cocoa-800">{value === undefined || value === null || value === '' ? 'N/A' : value}</p>
  </div>
);

const StatCard = ({ icon: Icon, label, value, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    slate: 'bg-[#f3eee9] text-cocoa-700'
  };

  return (
    <div className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-cocoa-400">{label}</p>
          <p className="text-2xl font-bold text-cocoa-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const ChartBars = ({ rows, labelFor, valueFor, valueLabel }) => {
  const max = Math.max(...rows.map((row) => Number(valueFor(row) || 0)), 1);

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="text-sm text-cocoa-400">No data available</p>
      ) : rows.map((row, index) => {
        const value = Number(valueFor(row) || 0);
        return (
          <div key={`${labelFor(row)}-${index}`}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-cocoa-700">{labelFor(row)}</span>
              <span className="text-cocoa-400">{valueLabel ? valueLabel(value, row) : value}</span>
            </div>
            <div className="h-2 rounded-full bg-[#f3eee9]">
              <div
                className="h-2 rounded-full bg-primary-600"
                style={{ width: `${Math.max(6, (value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdminPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [payments, setPayments] = useState(null);
  const [supportTickets, setSupportTickets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [fraudSignals, setFraudSignals] = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [notificationForm, setNotificationForm] = useState(emptyNotification);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [newSupportTicket, setNewSupportTicket] = useState(emptySupportTicket);
  const [newLocation, setNewLocation] = useState(emptyLocation);
  const [editingUser, setEditingUser] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [reviewingEvent, setReviewingEvent] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [
        dashboardRes,
        usersRes,
        eventsRes,
        bookingsRes,
        categoriesRes,
        reviewsRes,
        logsRes,
        paymentsRes,
        supportRes,
        locationsRes,
        fraudRes,
        advancedAnalyticsRes
      ] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users?limit=200'),
        api.get('/admin/events?limit=200'),
        api.get('/admin/bookings?limit=200'),
        api.get('/admin/categories'),
        api.get('/admin/reviews?limit=200'),
        api.get('/admin/security/logs?limit=200'),
        api.get('/admin/payments'),
        api.get('/admin/support?limit=200'),
        api.get('/admin/locations'),
        api.get('/admin/fraud'),
        api.get('/admin/analytics/advanced')
      ]);

      setDashboard(dashboardRes.data);
      setUsers(usersRes.data.users || []);
      setEvents(eventsRes.data.events || []);
      setBookings(bookingsRes.data.bookings || []);
      setCategories(categoriesRes.data.categories || []);
      setReviews(reviewsRes.data.reviews || []);
      setSecurityLogs(logsRes.data.logs || []);
      setPayments(paymentsRes.data);
      setSupportTickets(supportRes.data.tickets || []);
      setLocations(locationsRes.data.locations || []);
      setFraudSignals(fraudRes.data);
      setAdvancedAnalytics(advancedAnalyticsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    const nextTab = searchParams.get('tab');
    if (tabs.some((tab) => tab.id === nextTab) && nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'overview' ? {} : { tab: tabId });
  };

  const filteredUsers = useMemo(() => {
    const term = userSearch.toLowerCase();
    return users.filter((item) => {
      const matchesSearch = !term ||
        item.name?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.phone?.toLowerCase().includes(term);
      const matchesRole = !userRoleFilter || item.role === userRoleFilter;
      const matchesStatus =
        !userStatusFilter ||
        (userStatusFilter === 'blocked' && item.isBlocked) ||
        (userStatusFilter === 'active' && !item.isBlocked) ||
        (userStatusFilter === 'verified' && item.isVerified) ||
        (userStatusFilter === 'unverified' && !item.isVerified);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  const filteredEvents = useMemo(() => {
    const term = eventSearch.toLowerCase();
    return events.filter((item) => !term ||
      item.title?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
      item.venue?.toLowerCase().includes(term) ||
      item.organizer?.email?.toLowerCase().includes(term)
    );
  }, [events, eventSearch]);

  const filteredBookings = useMemo(() => bookings.filter((item) => (
    !bookingStatusFilter || item.status === bookingStatusFilter
  )), [bookings, bookingStatusFilter]);

  const updateUser = async (id, payload) => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/users/${id}`, payload);
      setUsers((prev) => prev.map((item) => item._id === id ? res.data : item));
      toast.success('User updated');
      setEditingUser(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((item) => item._id !== id));
      toast.success('User deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const updateEvent = async (id, payload) => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/events/${id}`, payload);
      setEvents((prev) => prev.map((item) => item._id === id ? res.data : item));
      toast.success('Event updated');
      setEditingEvent(null);
      setReviewingEvent(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Delete this event? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      setEvents((prev) => prev.filter((item) => item._id !== id));
      toast.success('Event deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const updateBooking = async (id, payload) => {
    try {
      const res = await api.put(`/admin/bookings/${id}`, payload);
      setBookings((prev) => prev.map((item) => item._id === id ? res.data : item));
      setViewingBooking((current) => current?._id === id ? res.data : current);
      toast.success('Booking updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const refundBooking = async (id) => {
    if (!window.confirm('Refund and cancel this booking?')) return;
    try {
      const res = await api.put(`/admin/bookings/${id}/refund`);
      setBookings((prev) => prev.map((item) => item._id === id ? res.data : item));
      setViewingBooking((current) => current?._id === id ? res.data : current);
      toast.success('Refund marked');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to refund booking');
    }
  };

  const createCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      const res = await api.post('/admin/categories', { name: newCategory.trim() });
      setCategories((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory('');
      toast.success('Category added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add category');
    }
  };

  const updateCategory = async (id, payload) => {
    try {
      const res = await api.put(`/admin/categories/${id}`, payload);
      setCategories((prev) => prev.map((item) => item._id === id ? res.data : item));
      setEditingCategoryId('');
      setEditingCategoryName('');
      toast.success('Category updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Existing events will keep their category text.')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories((prev) => prev.filter((item) => item._id !== id));
      toast.success('Category deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const createLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.city.trim()) return;
    try {
      const res = await api.post('/admin/locations', newLocation);
      setLocations((prev) => [...prev, res.data].sort((a, b) => a.city.localeCompare(b.city)));
      setNewLocation(emptyLocation);
      toast.success('Location added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add location');
    }
  };

  const updateLocation = async (id, payload) => {
    try {
      const res = await api.put(`/admin/locations/${id}`, payload);
      setLocations((prev) => prev.map((item) => item._id === id ? { ...item, ...res.data } : item));
      toast.success('Location updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update location');
    }
  };

  const deleteLocation = async (id) => {
    if (!window.confirm('Delete this location?')) return;
    try {
      await api.delete(`/admin/locations/${id}`);
      setLocations((prev) => prev.filter((item) => item._id !== id));
      toast.success('Location deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete location');
    }
  };

  const createSupportTicket = async (e) => {
    e.preventDefault();
    try {
      const payload = Object.fromEntries(
        Object.entries(newSupportTicket).filter(([, value]) => value !== '')
      );
      const res = await api.post('/admin/support', payload);
      setSupportTickets((prev) => [res.data, ...prev]);
      setNewSupportTicket(emptySupportTicket);
      toast.success('Support ticket created');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create support ticket');
    }
  };

  const updateSupportTicket = async (id, payload) => {
    try {
      const res = await api.put(`/admin/support/${id}`, payload);
      setSupportTickets((prev) => prev.map((item) => item._id === id ? res.data : item));
      toast.success('Support ticket updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update support ticket');
    }
  };

  const deleteSupportTicket = async (id) => {
    if (!window.confirm('Delete this support ticket?')) return;
    try {
      await api.delete(`/admin/support/${id}`);
      setSupportTickets((prev) => prev.filter((item) => item._id !== id));
      toast.success('Support ticket deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete support ticket');
    }
  };

  const sendEventReminder = async (id) => {
    if (!window.confirm('Send an event reminder to all confirmed attendees?')) return;
    try {
      const res = await api.post(`/admin/events/${id}/reminders`);
      toast.success(`Reminder sent to ${res.data.recipients} attendee(s)`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reminder');
    }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/notifications', notificationForm);
      setNotificationForm(emptyNotification);
      toast.success(`Notification sent to ${res.data.recipients} user(s)`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setSaving(false);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      setReviews((prev) => prev.filter((item) => item._id !== id));
      toast.success('Review deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const downloadReport = async (type) => {
    try {
      const res = await api.get(`/admin/reports/${type}`, { responseType: 'blob' });
      const href = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = href;
      link.download = `evento-${type}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export report');
    }
  };

  const openEventEditor = (event) => {
    setEditingEvent({
      ...event,
      date: event.date ? new Date(event.date).toISOString().slice(0, 10) : '',
      settlementStatus: event.settlement?.status || 'not_started',
      settlementReference: event.settlement?.reference || '',
      settlementNotes: event.settlement?.notes || '',
      moderationFlagsText: (event.moderationFlags || []).join(', ')
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbf8f4]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const charts = dashboard?.charts || {};

  return (
    <div className="min-h-screen bg-[#fbf8f4]">
      <div className="border-b border-cocoa-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-600 text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-cocoa-900">Admin Console</h1>
                  <p className="text-sm text-cocoa-400">Evento platform control center</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/events" className="inline-flex items-center gap-2 rounded-lg border border-cocoa-200 bg-white px-4 py-2 text-sm font-semibold text-cocoa-700 hover:bg-[#fbf8f4]">
                <Eye className="h-4 w-4" />
                View Site
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-[#f3eee9] text-cocoa-700 hover:bg-primary-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} label="Total Users" value={(stats.totalUsers || 0) + (stats.totalOrganizers || 0) + (stats.totalAdmins || 0)} />
              <StatCard icon={Calendar} label="Total Events" value={stats.totalEvents || 0} tone="green" />
              <StatCard icon={Ticket} label="Total Bookings" value={stats.totalBookings || 0} tone="amber" />
              <StatCard icon={IndianRupee} label="Total Revenue" value={money(stats.totalRevenue)} tone="slate" />
              <StatCard icon={CheckCircle} label="Active Events" value={stats.activeEvents || 0} tone="green" />
              <StatCard icon={Clock} label="Pending Approvals" value={stats.pendingApprovals || 0} tone="amber" />
              <StatCard icon={TrendingUp} label="Today's Ticket Sales" value={stats.todayTicketSales || 0} tone="blue" />
              <StatCard icon={Lock} label="Blocked Users" value={stats.blockedUsers || 0} tone="red" />
              <StatCard icon={MessageSquare} label="Open Support" value={stats.openSupportTickets || 0} tone="amber" />
              <StatCard icon={MapPin} label="Active Locations" value={stats.activeLocations || 0} tone="green" />
              <StatCard icon={AlertTriangle} label="High-risk Items" value={stats.highRiskBookings || 0} tone="red" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Monthly Revenue</h2>
                <ChartBars
                  rows={charts.revenueByMonth || []}
                  labelFor={monthLabel}
                  valueFor={(row) => row.revenue}
                  valueLabel={(value) => money(value)}
                />
              </section>
              <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Top-selling Events</h2>
                <ChartBars
                  rows={charts.topEvents || []}
                  labelFor={(row) => row._id?.title || 'Deleted event'}
                  valueFor={(row) => row.revenue}
                  valueLabel={(value, row) => `${money(value)} / ${row.tickets || 0} tickets`}
                />
              </section>
            </div>

            <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Recent Bookings</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-[#fbf8f4]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">User</th>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Event</th>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Tickets</th>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(dashboard?.recentBookings || []).map((booking) => (
                      <tr key={booking._id}>
                        <td className="px-4 py-3">{booking.user?.name || 'Unknown'}<div className="text-xs text-cocoa-400">{booking.user?.email}</div></td>
                        <td className="px-4 py-3">{booking.event?.title || 'Deleted event'}</td>
                        <td className="px-4 py-3">{booking.numberOfTickets}</td>
                        <td className="px-4 py-3">{money(booking.totalPrice)}</td>
                        <td className="px-4 py-3"><StatusBadge tone={booking.status === 'confirmed' ? 'green' : booking.status === 'pending' ? 'amber' : 'red'}>{booking.status}</StatusBadge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'users' && (
          <section className="rounded-lg border border-cocoa-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-cocoa-100 p-5 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-lg font-semibold text-cocoa-900">User Management</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
                  <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="input-field py-2 pl-9" placeholder="Search users" />
                </div>
                <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className="input-field py-2">
                  <option value="">All roles</option>
                  <option value="user">Users</option>
                  <option value="host">Hosts</option>
                  <option value="admin">Admins</option>
                </select>
                <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} className="input-field py-2">
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-[#fbf8f4]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">User</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Joined</th>
                    <th className="px-4 py-3 text-right font-semibold text-cocoa-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-cocoa-900">{item.name}</div>
                        <div className="text-xs text-cocoa-400">{item.email}</div>
                        {item.phone && <div className="text-xs text-cocoa-400">{item.phone}</div>}
                        {item.role === 'host' && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(item.organizerDocuments || []).length > 0 ? item.organizerDocuments.map((doc, index) => (
                              <a
                                key={`${item._id}-doc-${index}`}
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                              >
                                <FileText className="h-3 w-3" />
                                {doc.label || `Document ${index + 1}`}
                              </a>
                            )) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-cocoa-100 bg-[#fbf8f4] px-2 py-0.5 text-xs text-cocoa-400">
                                <FileText className="h-3 w-3" />
                                No organizer docs
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select value={item.role} onChange={(e) => updateUser(item._id, { role: e.target.value })} className="rounded-lg border border-cocoa-200 px-2 py-1">
                          <option value="user">user</option>
                          <option value="host">host</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge tone={item.isBlocked ? 'red' : 'green'}>{item.isBlocked ? 'blocked' : 'active'}</StatusBadge>
                          <StatusBadge tone={item.isVerified ? 'blue' : 'amber'}>{item.isVerified ? 'verified' : 'unverified'}</StatusBadge>
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingUser(item)} className="rounded-lg border border-cocoa-200 p-2 text-cocoa-500 hover:bg-[#fbf8f4]" title="Edit user"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => updateUser(item._id, { isBlocked: !item.isBlocked })} className="rounded-lg border border-amber-200 p-2 text-amber-700 hover:bg-amber-50" title={item.isBlocked ? 'Unblock user' : 'Block user'}><Lock className="h-4 w-4" /></button>
                          <button onClick={() => updateUser(item._id, { isVerified: !item.isVerified })} className="rounded-lg border border-blue-200 p-2 text-blue-700 hover:bg-blue-50" title="Toggle verification"><CheckCircle className="h-4 w-4" /></button>
                          <button onClick={() => deleteUser(item._id)} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50" title="Delete user"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'events' && (
          <section className="rounded-lg border border-cocoa-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-cocoa-100 p-5 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-lg font-semibold text-cocoa-900">Event Control</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
                <input value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} className="input-field py-2 pl-9" placeholder="Search events" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-[#fbf8f4]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Event</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Organizer</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Tickets</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Flags</th>
                    <th className="px-4 py-3 text-right font-semibold text-cocoa-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEvents.map((event) => (
                    <tr key={event._id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-cocoa-900">{event.title}</div>
                        <div className="text-xs text-cocoa-400">{event.category} / {formatDate(event.date)} / {event.venue}</div>
                      </td>
                      <td className="px-4 py-3">{event.organizer?.name || 'Unknown'}<div className="text-xs text-cocoa-400">{event.organizer?.email}</div></td>
                      <td className="px-4 py-3">{event.totalTickets - event.availableTickets} sold / {event.availableTickets} left</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge tone={event.isActive ? 'green' : 'red'}>{event.isActive ? 'active' : 'inactive'}</StatusBadge>
                          {event.isFeatured && <StatusBadge tone="blue">featured</StatusBadge>}
                          {event.isTrending && <StatusBadge tone="amber">trending</StatusBadge>}
                          <StatusBadge tone={event.moderationStatus === 'approved' ? 'green' : event.moderationStatus === 'pending' ? 'amber' : 'red'}>{event.moderationStatus}</StatusBadge>
                          <StatusBadge tone={event.ticketSaleStatus === 'live' ? 'green' : event.ticketSaleStatus === 'paused' ? 'red' : 'amber'}>{event.ticketSaleStatus || 'pending_approval'}</StatusBadge>
                          <StatusBadge tone={event.settlement?.status === 'settled' ? 'green' : event.settlement?.status === 'pending' ? 'amber' : 'blue'}>settlement {event.settlement?.status || 'not_started'}</StatusBadge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setReviewingEvent(event)} className="rounded-lg border border-primary-200 p-2 text-primary-700 hover:bg-primary-50" title="Review event details"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => updateEvent(event._id, { isFeatured: !event.isFeatured })} className="rounded-lg border border-blue-200 p-2 text-blue-700 hover:bg-blue-50" title="Featured"><Star className="h-4 w-4" /></button>
                          <button onClick={() => updateEvent(event._id, { isTrending: !event.isTrending })} className="rounded-lg border border-amber-200 p-2 text-amber-700 hover:bg-amber-50" title="Trending"><TrendingUp className="h-4 w-4" /></button>
                          <button onClick={() => sendEventReminder(event._id)} className="rounded-lg border border-green-200 p-2 text-green-700 hover:bg-green-50" title="Send reminder"><Bell className="h-4 w-4" /></button>
                          <button onClick={() => updateEvent(event._id, { moderationStatus: 'approved', moderationFlags: [] })} className="rounded-lg border border-green-200 p-2 text-green-700 hover:bg-green-50" title="Approve event"><CheckCircle className="h-4 w-4" /></button>
                          <button onClick={() => updateEvent(event._id, { lifecycleStage: 'settled', ticketSaleStatus: 'completed', settlement: { ...(event.settlement || {}), status: 'settled' } })} className="rounded-lg border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50" title="Mark settled"><IndianRupee className="h-4 w-4" /></button>
                          <button onClick={() => updateEvent(event._id, { moderationStatus: 'rejected', isActive: false, moderationFlags: ['other'] })} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50" title="Reject event"><XCircle className="h-4 w-4" /></button>
                          <button onClick={() => updateEvent(event._id, { isActive: !event.isActive })} className="rounded-lg border border-cocoa-200 p-2 text-cocoa-700 hover:bg-[#fbf8f4]" title="Toggle active"><Flag className="h-4 w-4" /></button>
                          <button onClick={() => openEventEditor(event)} className="rounded-lg border border-cocoa-200 p-2 text-cocoa-500 hover:bg-[#fbf8f4]" title="Edit event"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => deleteEvent(event._id)} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50" title="Delete event"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'categories' && (
          <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-cocoa-900">Event Categories</h2>
            </div>
            <form onSubmit={createCategory} className="mb-5 flex flex-col gap-2 sm:flex-row">
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input-field" placeholder="Category name" />
              <button className="btn-primary whitespace-nowrap">Add Category</button>
            </form>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div key={category._id} className="rounded-lg border border-cocoa-100 p-4">
                  {editingCategoryId === category._id ? (
                    <div className="flex gap-2">
                      <input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="input-field py-2" />
                      <button onClick={() => updateCategory(category._id, { name: editingCategoryName })} className="rounded-lg bg-primary-600 px-3 py-2 text-white">Save</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-cocoa-900">{category.name}</p>
                        <StatusBadge tone={category.isActive ? 'green' : 'red'}>{category.isActive ? 'active' : 'inactive'}</StatusBadge>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCategoryId(category._id); setEditingCategoryName(category.name); }} className="rounded-lg border border-cocoa-200 p-2 text-cocoa-500 hover:bg-[#fbf8f4]"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => updateCategory(category._id, { isActive: !category.isActive })} className="rounded-lg border border-amber-200 p-2 text-amber-700 hover:bg-amber-50"><XCircle className="h-4 w-4" /></button>
                        <button onClick={() => deleteCategory(category._id)} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'locations' && (
          <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-cocoa-900">Location Management</h2>
            </div>
            <form onSubmit={createLocation} className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
              <input value={newLocation.city} onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })} className="input-field" placeholder="City" required />
              <input value={newLocation.region} onChange={(e) => setNewLocation({ ...newLocation, region: e.target.value })} className="input-field" placeholder="Region / State" />
              <input value={newLocation.country} onChange={(e) => setNewLocation({ ...newLocation, country: e.target.value })} className="input-field" placeholder="Country" />
              <button className="btn-primary">Add Location</button>
              <input value={newLocation.notes} onChange={(e) => setNewLocation({ ...newLocation, notes: e.target.value })} className="input-field md:col-span-4" placeholder="Notes" />
            </form>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {locations.map((location) => (
                <div key={location._id} className="rounded-lg border border-cocoa-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-cocoa-900">{location.city}</p>
                      <p className="text-sm text-cocoa-400">{[location.region, location.country].filter(Boolean).join(', ')}</p>
                      {location.notes && <p className="mt-2 text-sm text-cocoa-500">{location.notes}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge tone={location.isActive ? 'green' : 'red'}>{location.isActive ? 'active' : 'inactive'}</StatusBadge>
                        <StatusBadge tone="blue">{location.eventCount || 0} events</StatusBadge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateLocation(location._id, { isActive: !location.isActive })} className="rounded-lg border border-amber-200 p-2 text-amber-700 hover:bg-amber-50" title="Toggle active"><XCircle className="h-4 w-4" /></button>
                      <button onClick={() => deleteLocation(location._id)} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50" title="Delete location"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'bookings' && (
          <section className="rounded-lg border border-cocoa-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-cocoa-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-cocoa-900">Ticket and Booking Management</h2>
              <select value={bookingStatusFilter} onChange={(e) => setBookingStatusFilter(e.target.value)} className="input-field py-2 sm:max-w-xs">
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-[#fbf8f4]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Booking</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Event</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Payment</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Risk</th>
                    <th className="px-4 py-3 text-right font-semibold text-cocoa-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-cocoa-900">{booking.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-cocoa-400">{booking.user?.email}</div>
                        <div className="text-xs text-cocoa-400">{booking.numberOfTickets} {booking.ticketCategoryName || 'General'} ticket(s) / {money(booking.totalPrice)}</div>
                      </td>
                      <td className="px-4 py-3">{booking.event?.title || 'Deleted event'}<div className="text-xs text-cocoa-400">{formatDate(booking.bookingDate)}</div></td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={booking.status === 'confirmed' ? 'green' : booking.status === 'cancelled' || booking.status === 'rejected' ? 'red' : 'amber'}>
                          {booking.status}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={booking.paymentStatus === 'completed' ? 'green' : booking.paymentStatus === 'refunded' ? 'blue' : booking.paymentStatus === 'failed' ? 'red' : 'amber'}>
                          {booking.paymentStatus}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge tone={(booking.paymentAttempts || 0) >= 3 ? 'red' : 'gray'}>{booking.paymentAttempts || 0} attempts</StatusBadge>
                          <StatusBadge tone={booking.refundStatus && booking.refundStatus !== 'none' ? 'amber' : 'gray'}>{booking.refundStatus || 'none'}</StatusBadge>
                          <StatusBadge tone={booking.disputeStatus && booking.disputeStatus !== 'none' ? 'red' : 'gray'}>{booking.disputeStatus || 'none'}</StatusBadge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button onClick={() => setViewingBooking(booking)} className="rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50" title="View booking details">
                            <Eye className="mr-1 inline h-4 w-4" />
                            View
                          </button>
                          <button onClick={() => updateBooking(booking._id, { refundStatus: 'approved' })} className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50" title="Approve refund">Approve Refund</button>
                          <button onClick={() => updateBooking(booking._id, { refundStatus: 'rejected' })} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50" title="Reject refund">Reject Refund</button>
                          <button onClick={() => window.confirm('Cancel this ticket?') && updateBooking(booking._id, { status: 'cancelled' })} className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50" title="Cancel ticket">Cancel Ticket</button>
                          <button onClick={() => refundBooking(booking._id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50" title="Refund booking">
                            <IndianRupee className="mr-1 inline h-4 w-4" />
                            Refund
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard icon={IndianRupee} label="Gross Revenue" value={money(payments?.totals?.grossRevenue)} />
              <StatCard icon={CreditCard} label="Platform Earnings" value={money(payments?.totals?.platformEarnings)} tone="green" />
              <StatCard icon={Users} label="Organizer Payouts" value={money(payments?.totals?.organizerPayouts)} tone="amber" />
            </div>
            <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Organizer Payouts</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-[#fbf8f4]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Organizer</th>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Bookings</th>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Revenue</th>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(payments?.byOrganizer || []).map((row) => (
                      <tr key={row._id?._id || row._id}>
                        <td className="px-4 py-3">{row._id?.name || 'Unknown'}<div className="text-xs text-cocoa-400">{row._id?.email}</div></td>
                        <td className="px-4 py-3">{row.bookings}</td>
                        <td className="px-4 py-3">{money(row.revenue)}</td>
                        <td className="px-4 py-3">{money(row.revenue * 0.9)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Pending Transactions and Disputes</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-[#fbf8f4]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">User</th>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Event</th>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(payments?.pendingTransactions || []).map((booking) => (
                      <tr key={booking._id}>
                        <td className="px-4 py-3">{booking.user?.name || 'Unknown'}<div className="text-xs text-cocoa-400">{booking.user?.email}</div></td>
                        <td className="px-4 py-3">{booking.event?.title || 'Deleted event'}</td>
                        <td className="px-4 py-3">{money(booking.totalPrice)}</td>
                        <td className="px-4 py-3"><StatusBadge tone="amber">{booking.paymentStatus}</StatusBadge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <StatCard icon={Users} label="Active Users" value={advancedAnalytics?.activeUsers || 0} />
              <StatCard icon={TrendingUp} label="Conversion Rate" value={`${advancedAnalytics?.conversionRate || 0}%`} tone="green" />
              <StatCard icon={Ticket} label="Confirmed Bookings" value={advancedAnalytics?.bookingTotals?.confirmedBookings || 0} tone="amber" />
              <StatCard icon={Clock} label="Peak Hour" value={`${advancedAnalytics?.peakBookingHours?.[0]?._id?.hour ?? 'N/A'}:00`} tone="slate" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Ticket Sales Trend</h2>
              <ChartBars rows={charts.ticketSalesTrend || []} labelFor={monthLabel} valueFor={(row) => row.tickets} />
            </section>
            <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Category-wise Events</h2>
              <ChartBars rows={charts.categoryWiseEvents || []} labelFor={(row) => row._id || 'Uncategorized'} valueFor={(row) => row.count} />
            </section>
            <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-cocoa-900">User Growth</h2>
              <ChartBars rows={charts.userGrowth || []} labelFor={monthLabel} valueFor={(row) => row.count} />
            </section>
            <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Highest Revenue Events</h2>
              <ChartBars rows={charts.topEvents || []} labelFor={(row) => row._id?.title || 'Deleted event'} valueFor={(row) => row.revenue} valueLabel={(value) => money(value)} />
            </section>
            <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Peak Booking Times</h2>
              <ChartBars rows={advancedAnalytics?.peakBookingHours || []} labelFor={(row) => `${row._id.hour}:00`} valueFor={(row) => row.bookings} />
            </section>
            <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Organizer Performance</h2>
              <ChartBars rows={advancedAnalytics?.organizerPerformance || []} labelFor={(row) => row._id?.name || 'Unknown organizer'} valueFor={(row) => row.revenue} valueLabel={(value, row) => `${money(value)} / ${row.ticketsSold || 0} tickets`} />
            </section>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-cocoa-900">Send Notification</h2>
            </div>
            <form onSubmit={sendNotification} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <input value={notificationForm.title} onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })} className="input-field" placeholder="Title" required />
              <select value={notificationForm.type} onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })} className="input-field">
                <option value="system">System announcement</option>
                <option value="event">Event update</option>
                <option value="promotion">Promotion</option>
                <option value="emergency">Emergency alert</option>
                <option value="security">Security</option>
              </select>
              <textarea value={notificationForm.message} onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })} className="input-field lg:col-span-2" rows={4} placeholder="Message" required />
              <select value={notificationForm.targetType} onChange={(e) => setNotificationForm({ ...notificationForm, targetType: e.target.value })} className="input-field">
                <option value="all">All users</option>
                <option value="role">By role</option>
                <option value="user">Specific user</option>
              </select>
              {notificationForm.targetType === 'role' && (
                <select value={notificationForm.role} onChange={(e) => setNotificationForm({ ...notificationForm, role: e.target.value })} className="input-field">
                  <option value="user">Users</option>
                  <option value="host">Hosts</option>
                  <option value="admin">Admins</option>
                </select>
              )}
              {notificationForm.targetType === 'user' && (
                <select value={notificationForm.userId} onChange={(e) => setNotificationForm({ ...notificationForm, userId: e.target.value })} className="input-field">
                  <option value="">Select user</option>
                  {users.map((item) => <option key={item._id} value={item._id}>{item.name} - {item.email}</option>)}
                </select>
              )}
              <input value={notificationForm.link} onChange={(e) => setNotificationForm({ ...notificationForm, link: e.target.value })} className="input-field" placeholder="Link, for example /events" />
              <label className="flex items-center gap-3 rounded-lg border border-cocoa-100 px-4 py-3">
                <input type="checkbox" checked={notificationForm.sendEmail} onChange={(e) => setNotificationForm({ ...notificationForm, sendEmail: e.target.checked })} className="h-4 w-4 text-primary-600" />
                <span className="flex items-center gap-2 text-sm font-medium text-cocoa-700"><Mail className="h-4 w-4" /> Also send email</span>
              </label>
              <button disabled={saving} className="btn-primary lg:col-span-2">{saving ? 'Sending...' : 'Send Notification'}</button>
            </form>
          </section>
        )}

        {activeTab === 'reviews' && (
          <section className="rounded-lg border border-cocoa-100 bg-white shadow-sm">
            <div className="border-b border-cocoa-100 p-5">
              <h2 className="text-lg font-semibold text-cocoa-900">Review and Rating Moderation</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {reviews.length === 0 ? (
                <p className="p-5 text-sm text-cocoa-400">No reviews yet</p>
              ) : reviews.map((review) => (
                <div key={review._id} className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone="amber">{review.rating} star</StatusBadge>
                      <p className="font-semibold text-cocoa-900">{review.event?.title || 'Deleted event'}</p>
                    </div>
                    <p className="mt-2 text-sm text-cocoa-700">{review.comment || 'No comment'}</p>
                    <p className="mt-1 text-xs text-cocoa-400">{review.user?.name} / {review.user?.email} / {formatDate(review.createdAt)}</p>
                  </div>
                  <button onClick={() => deleteReview(review._id)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'support' && (
          <section className="rounded-lg border border-cocoa-100 bg-white shadow-sm">
            <div className="border-b border-cocoa-100 p-5">
              <h2 className="text-lg font-semibold text-cocoa-900">Complaints, Refund Issues, and Organizer Support</h2>
            </div>
            <form onSubmit={createSupportTicket} className="grid grid-cols-1 gap-3 border-b border-cocoa-100 p-5 md:grid-cols-3">
              <input value={newSupportTicket.subject} onChange={(e) => setNewSupportTicket({ ...newSupportTicket, subject: e.target.value })} className="input-field" placeholder="Subject" required />
              <select value={newSupportTicket.type} onChange={(e) => setNewSupportTicket({ ...newSupportTicket, type: e.target.value })} className="input-field">
                <option value="general">General</option>
                <option value="complaint">User complaint</option>
                <option value="refund_issue">Refund issue</option>
                <option value="organizer_support">Organizer support</option>
                <option value="payment_dispute">Payment dispute</option>
                <option value="user_report">User report</option>
                <option value="event_report">Event report</option>
              </select>
              <select value={newSupportTicket.priority} onChange={(e) => setNewSupportTicket({ ...newSupportTicket, priority: e.target.value })} className="input-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <select value={newSupportTicket.user} onChange={(e) => setNewSupportTicket({ ...newSupportTicket, user: e.target.value })} className="input-field">
                <option value="">No linked user</option>
                {users.map((item) => <option key={item._id} value={item._id}>{item.name} - {item.email}</option>)}
              </select>
              <select value={newSupportTicket.event} onChange={(e) => setNewSupportTicket({ ...newSupportTicket, event: e.target.value })} className="input-field">
                <option value="">No linked event</option>
                {events.map((event) => <option key={event._id} value={event._id}>{event.title}</option>)}
              </select>
              <select value={newSupportTicket.booking} onChange={(e) => setNewSupportTicket({ ...newSupportTicket, booking: e.target.value })} className="input-field">
                <option value="">No linked booking</option>
                {bookings.map((booking) => <option key={booking._id} value={booking._id}>{booking.user?.email || 'Unknown'} / {booking.event?.title || 'Event'}</option>)}
              </select>
              <textarea value={newSupportTicket.message} onChange={(e) => setNewSupportTicket({ ...newSupportTicket, message: e.target.value })} className="input-field md:col-span-3" rows={3} placeholder="Message" required />
              <button className="btn-primary md:col-span-3">Create Support Ticket</button>
            </form>
            <div className="divide-y divide-gray-100">
              {supportTickets.length === 0 ? (
                <p className="p-5 text-sm text-cocoa-400">No support tickets yet</p>
              ) : supportTickets.map((ticket) => (
                <div key={ticket._id} className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-cocoa-900">{ticket.subject}</p>
                      <StatusBadge tone={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'red' : 'amber'}>{ticket.priority}</StatusBadge>
                      <StatusBadge tone={ticket.status === 'resolved' ? 'green' : ticket.status === 'rejected' ? 'red' : 'blue'}>{ticket.status}</StatusBadge>
                      <StatusBadge>{ticket.type}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-cocoa-700">{ticket.message}</p>
                    <p className="mt-1 text-xs text-cocoa-400">
                      {ticket.user?.email || 'No user'} {ticket.event?.title ? `/ ${ticket.event.title}` : ''} {ticket.booking?._id ? `/ booking ${ticket.booking._id}` : ''}
                    </p>
                    {ticket.resolution && <p className="mt-2 text-sm text-green-700">{ticket.resolution}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button onClick={() => updateSupportTicket(ticket._id, { status: 'in_progress' })} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Review</button>
                    <button onClick={() => updateSupportTicket(ticket._id, { status: 'resolved', resolution: 'Resolved by admin' })} className="rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50">Resolve</button>
                    <button onClick={() => updateSupportTicket(ticket._id, { status: 'rejected' })} className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">Reject</button>
                    <button onClick={() => deleteSupportTicket(ticket._id)} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'fraud' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <StatCard icon={Ticket} label="Suspicious Bookings" value={fraudSignals?.summary?.suspiciousBookings || 0} tone="red" />
              <StatCard icon={Flag} label="Flagged Events" value={fraudSignals?.summary?.flaggedEvents || 0} tone="amber" />
              <StatCard icon={Users} label="Spam Users" value={fraudSignals?.summary?.spamUsers || 0} tone="red" />
              <StatCard icon={Shield} label="Risk Organizers" value={fraudSignals?.summary?.fraudOrganizers || 0} tone="slate" />
            </div>
            <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Suspicious Bookings and Payment Attempts</h2>
              <div className="space-y-3">
                {(fraudSignals?.suspiciousBookings || []).length === 0 ? (
                  <p className="text-sm text-cocoa-400">No suspicious bookings detected</p>
                ) : fraudSignals.suspiciousBookings.map((booking) => (
                  <div key={booking._id} className="rounded-lg border border-red-100 bg-red-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-cocoa-900">{booking.user?.email || 'Unknown user'}</p>
                        <p className="text-sm text-cocoa-500">{booking.event?.title || 'Deleted event'} / {money(booking.totalPrice)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone="red">{booking.paymentAttempts || 0} attempts</StatusBadge>
                        <StatusBadge tone="red">{booking.paymentStatus}</StatusBadge>
                        <StatusBadge tone={booking.disputeStatus !== 'none' ? 'red' : 'gray'}>{booking.disputeStatus}</StatusBadge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-cocoa-900">Fake Events, Spam, Copyright, and Inappropriate Content</h2>
              <div className="space-y-3">
                {(fraudSignals?.flaggedEvents || []).length === 0 ? (
                  <p className="text-sm text-cocoa-400">No event moderation risks detected</p>
                ) : fraudSignals.flaggedEvents.map((event) => (
                  <div key={event._id} className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-cocoa-900">{event.title}</p>
                        <p className="text-sm text-cocoa-500">{event.organizer?.email || 'Unknown organizer'} / {event.category}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone={event.moderationStatus === 'rejected' ? 'red' : 'amber'}>{event.moderationStatus}</StatusBadge>
                        {(event.moderationFlags || []).map((flag) => <StatusBadge key={`${event._id}-${flag}`} tone="red">{flag}</StatusBadge>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'reports' && (
          <section className="rounded-lg border border-cocoa-100 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-cocoa-900">Reports and Export</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                ['users', 'Users CSV', Users],
                ['events', 'Events CSV', Calendar],
                ['bookings', 'Bookings CSV', Ticket],
                ['revenue', 'Revenue CSV', IndianRupee],
                ['daily-revenue', 'Daily Revenue', BarChart3],
                ['monthly-revenue', 'Monthly Revenue', TrendingUp],
                ['ticket-sales', 'Ticket Sales', Ticket],
                ['organizer-earnings', 'Organizer Earnings', Users],
                ['support', 'Support Tickets', MessageSquare],
                ['fraud', 'Fraud Signals', AlertTriangle]
              ].map(([type, label, Icon]) => (
                <button key={type} onClick={() => downloadReport(type)} className="flex items-center justify-between rounded-lg border border-cocoa-100 p-4 text-left hover:border-primary-300 hover:bg-primary-50">
                  <span className="font-semibold text-cocoa-900">{label}</span>
                  <Icon className="h-5 w-5 text-primary-600" />
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'security' && (
          <section className="rounded-lg border border-cocoa-100 bg-white shadow-sm">
            <div className="border-b border-cocoa-100 p-5">
              <h2 className="text-lg font-semibold text-cocoa-900">Security Activity</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-[#fbf8f4]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Action</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Actor</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">IP</th>
                    <th className="px-4 py-3 text-left font-semibold text-cocoa-500">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {securityLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-4 py-3"><div className="font-semibold text-cocoa-900">{log.action}</div><div className="text-xs text-cocoa-400">{log.message}</div></td>
                      <td className="px-4 py-3">{log.actor?.name || 'System'}<div className="text-xs text-cocoa-400">{log.actor?.email}</div></td>
                      <td className="px-4 py-3">{log.ipAddress || 'N/A'}</td>
                      <td className="px-4 py-3">{formatDateTime(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-cocoa-900">Edit User</h2>
              <button onClick={() => setEditingUser(null)} className="rounded-lg p-2 hover:bg-[#f3eee9]"><X className="h-5 w-5" /></button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUser(editingUser._id, {
                  name: editingUser.name,
                  phone: editingUser.phone || ''
                });
              }}
              className="space-y-4"
            >
              <input value={editingUser.name || ''} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="input-field" placeholder="Name" />
              <input value={editingUser.phone || ''} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} className="input-field" placeholder="Phone" />
              <input value={editingUser.email || ''} disabled className="input-field bg-[#fbf8f4] text-cocoa-400" />
              <button disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Save User'}</button>
            </form>
          </div>
        </div>
      )}

      {viewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase text-primary-600">Booking details</p>
                <h2 className="mt-1 text-xl font-extrabold text-cocoa-900">{viewingBooking.event?.title || 'Deleted event'}</h2>
                <p className="mt-1 text-sm font-semibold text-cocoa-400">
                  {viewingBooking.user?.name || 'Unknown'} / {viewingBooking.user?.email || 'No email'}
                </p>
              </div>
              <button onClick={() => setViewingBooking(null)} className="rounded-lg p-2 hover:bg-[#f3eee9]" title="Close booking details">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <StatusBadge tone={viewingBooking.status === 'confirmed' ? 'green' : viewingBooking.status === 'cancelled' || viewingBooking.status === 'rejected' ? 'red' : 'amber'}>
                {viewingBooking.status}
              </StatusBadge>
              <StatusBadge tone={viewingBooking.paymentStatus === 'completed' ? 'green' : viewingBooking.paymentStatus === 'refunded' ? 'blue' : viewingBooking.paymentStatus === 'failed' ? 'red' : 'amber'}>
                payment {viewingBooking.paymentStatus}
              </StatusBadge>
              <StatusBadge tone={viewingBooking.refundStatus && viewingBooking.refundStatus !== 'none' ? 'amber' : 'gray'}>
                refund {viewingBooking.refundStatus || 'none'}
              </StatusBadge>
              <StatusBadge tone={viewingBooking.disputeStatus && viewingBooking.disputeStatus !== 'none' ? 'red' : 'gray'}>
                dispute {viewingBooking.disputeStatus || 'none'}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailBlock label="Booking ID" value={viewingBooking._id} />
              <DetailBlock label="Booked On" value={formatDateTime(viewingBooking.bookingDate)} />
              <DetailBlock label="Event Date" value={formatDate(viewingBooking.event?.date)} />
              <DetailBlock label="Event Venue" value={[viewingBooking.event?.venue, viewingBooking.event?.location].filter(Boolean).join(', ')} />
              <DetailBlock label="Tickets" value={`${viewingBooking.numberOfTickets} ${viewingBooking.ticketCategoryName || 'General'} ticket(s)`} />
              <DetailBlock label="Total Amount" value={money(viewingBooking.totalPrice)} />
              <DetailBlock label="Payment Attempts" value={viewingBooking.paymentAttempts || 0} />
              <DetailBlock label="Refund Reason" value={viewingBooking.refundReason} />
              <DetailBlock label="Confirmed At" value={formatDateTime(viewingBooking.confirmedAt)} />
              <DetailBlock label="Cancelled At" value={formatDateTime(viewingBooking.cancelledAt)} />
              <DetailBlock label="Attendee Details" className="md:col-span-2" value={(viewingBooking.attendeeDetails || [])
                .map((attendee, index) => `${index + 1}. ${attendee.name || 'Guest'}${attendee.email ? ` / ${attendee.email}` : ''}${attendee.phone ? ` / ${attendee.phone}` : ''}`)
                .join('\n')} />
              <DetailBlock label="Admin Notes" className="md:col-span-2" value={viewingBooking.notes} />
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-cocoa-100 pt-5 sm:flex-row sm:justify-end">
              <button onClick={() => updateBooking(viewingBooking._id, { refundStatus: 'approved' })} className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-100">
                Approve Refund
              </button>
              <button onClick={() => updateBooking(viewingBooking._id, { refundStatus: 'rejected' })} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100">
                Reject Refund
              </button>
              <button onClick={() => window.confirm('Cancel this ticket?') && updateBooking(viewingBooking._id, { status: 'cancelled' })} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100">
                Cancel Ticket
              </button>
              <button onClick={() => refundBooking(viewingBooking._id)} className="btn-primary">
                <IndianRupee className="h-4 w-4" />
                Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-cocoa-100 bg-white p-5">
              <div>
                <p className="text-xs font-extrabold uppercase text-primary-600">Event review</p>
                <h2 className="mt-1 text-2xl font-extrabold text-cocoa-900">{reviewingEvent.title}</h2>
                <p className="mt-1 text-sm font-semibold text-cocoa-400">
                  {reviewingEvent.organizer?.name || 'Unknown organizer'} / {reviewingEvent.organizer?.email || 'No email'}
                </p>
              </div>
              <button onClick={() => setReviewingEvent(null)} className="rounded-lg p-2 hover:bg-[#f3eee9]" title="Close review">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="overflow-hidden rounded-lg border border-cocoa-100">
                  <img
                    src={reviewingEvent.image || 'https://images.unsplash.com/photo-1540575467083-2bdc3c5f8ebe?w=900'}
                    alt={reviewingEvent.title}
                    className="h-72 w-full object-cover"
                  />
                  <div className="flex flex-wrap gap-2 border-t border-cocoa-100 p-4">
                    <StatusBadge tone={reviewingEvent.moderationStatus === 'approved' ? 'green' : reviewingEvent.moderationStatus === 'rejected' ? 'red' : 'amber'}>
                      {reviewingEvent.moderationStatus || 'pending'}
                    </StatusBadge>
                    <StatusBadge tone={reviewingEvent.isActive ? 'green' : 'red'}>{reviewingEvent.isActive ? 'active' : 'inactive'}</StatusBadge>
                    <StatusBadge tone={reviewingEvent.ticketSaleStatus === 'live' ? 'green' : reviewingEvent.ticketSaleStatus === 'paused' ? 'red' : 'amber'}>
                      {reviewingEvent.ticketSaleStatus || 'pending_approval'}
                    </StatusBadge>
                    <StatusBadge tone="blue">{reviewingEvent.lifecycleStage || 'under_review'}</StatusBadge>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailBlock label="Category" value={reviewingEvent.category} />
                  <DetailBlock label="Event Type" value={reviewingEvent.eventType} />
                  <DetailBlock label="Date" value={formatDate(reviewingEvent.date)} />
                  <DetailBlock label="Time" value={reviewingEvent.time} />
                  <DetailBlock label="Venue" value={reviewingEvent.venue} />
                  <DetailBlock label="Location" value={reviewingEvent.location} />
                  <DetailBlock label="Budget" value={money(reviewingEvent.budget)} />
                  <DetailBlock label="Capacity" value={`${reviewingEvent.totalTickets || 0} total / ${reviewingEvent.availableTickets || 0} available`} />
                  <DetailBlock label="Organizer Phone" value={reviewingEvent.organizer?.phone} />
                  <DetailBlock label="Settlement" value={reviewingEvent.settlement?.status || 'not_started'} />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DetailBlock label="Description" value={reviewingEvent.description} className="lg:col-span-2" />

                <div className="rounded-lg border border-cocoa-100 p-4">
                  <h3 className="mb-3 text-sm font-extrabold uppercase text-cocoa-500">Ticket Categories</h3>
                  {(reviewingEvent.ticketCategories || []).length === 0 ? (
                    <p className="text-sm font-semibold text-cocoa-400">No ticket categories added.</p>
                  ) : (
                    <div className="space-y-2">
                      {reviewingEvent.ticketCategories.map((category) => (
                        <div key={category._id || category.name} className="rounded-lg bg-[#fbf8f4] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-extrabold text-cocoa-900">{category.name}</p>
                              {category.description && <p className="mt-1 text-sm text-cocoa-500">{category.description}</p>}
                            </div>
                            <p className="text-sm font-extrabold text-primary-600">{money(category.price)}</p>
                          </div>
                          <p className="mt-2 text-xs font-bold uppercase text-cocoa-400">
                            {category.availableQuantity ?? category.quantity} available / {category.quantity} total
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-cocoa-100 p-4">
                  <h3 className="mb-3 text-sm font-extrabold uppercase text-cocoa-500">Permissions and Proofs</h3>
                  <div className="space-y-3 text-sm font-semibold">
                    {[
                      ['Venue permission', reviewingEvent.venuePermissionUrl],
                      ['Ownership proof', reviewingEvent.ownershipProofUrl]
                    ].map(([label, url]) => (
                      <div key={label} className="rounded-lg bg-[#fbf8f4] p-3">
                        <p className="text-xs font-extrabold uppercase text-cocoa-400">{label}</p>
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-2 text-primary-700 hover:text-primary-800">
                            Open document
                            <Eye className="h-4 w-4" />
                          </a>
                        ) : (
                          <p className="mt-1 text-cocoa-500">N/A</p>
                        )}
                      </div>
                    ))}
                    <DetailBlock label="License Details" value={reviewingEvent.licenseDetails} />
                  </div>
                </div>

                <DetailBlock label="Terms and Conditions" value={reviewingEvent.termsAndConditions} />
                <DetailBlock label="Crowd Management Plan" value={reviewingEvent.crowdManagementPlan} />
                <DetailBlock label="Gate Instructions" value={reviewingEvent.gateInstructions} />
                <DetailBlock label="On-ground Contact" value={[reviewingEvent.onGroundContactName, reviewingEvent.onGroundContactPhone].filter(Boolean).join(' / ')} />
                <DetailBlock label="Moderation Notes" value={reviewingEvent.moderationNotes} className="lg:col-span-2" />
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-cocoa-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    openEventEditor(reviewingEvent);
                    setReviewingEvent(null);
                  }}
                  className="btn-secondary"
                >
                  <Edit className="h-4 w-4" />
                  Edit Details
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => updateEvent(reviewingEvent._id, { moderationStatus: 'rejected', isActive: false, moderationFlags: ['other'] })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Event
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => updateEvent(reviewingEvent._id, { moderationStatus: 'approved', moderationFlags: [] })}
                  className="btn-primary"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-cocoa-900">Edit Event</h2>
              <button onClick={() => setEditingEvent(null)} className="rounded-lg p-2 hover:bg-[#f3eee9]"><X className="h-5 w-5" /></button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateEvent(editingEvent._id, {
                  title: editingEvent.title,
                  description: editingEvent.description,
                  date: editingEvent.date,
                  time: editingEvent.time,
                  venue: editingEvent.venue,
                  location: editingEvent.location,
                  category: editingEvent.category,
                  price: Number(editingEvent.price),
                  totalTickets: Number(editingEvent.totalTickets),
                  availableTickets: Number(editingEvent.availableTickets),
                  moderationStatus: editingEvent.moderationStatus,
                  lifecycleStage: editingEvent.lifecycleStage,
                  ticketSaleStatus: editingEvent.ticketSaleStatus,
                  settlement: {
                    ...(editingEvent.settlement || {}),
                    status: editingEvent.settlementStatus || editingEvent.settlement?.status || 'not_started',
                    reference: editingEvent.settlementReference || editingEvent.settlement?.reference || '',
                    notes: editingEvent.settlementNotes || editingEvent.settlement?.notes || ''
                  },
                  moderationFlags: editingEvent.moderationFlagsText
                    ? editingEvent.moderationFlagsText.split(',').map((flag) => flag.trim()).filter(Boolean)
                    : [],
                  moderationNotes: editingEvent.moderationNotes || ''
                });
              }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <input value={editingEvent.title || ''} onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })} className="input-field md:col-span-2" placeholder="Title" />
              <textarea value={editingEvent.description || ''} onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })} className="input-field md:col-span-2" rows={4} placeholder="Description" />
              <input type="date" value={editingEvent.date || ''} onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })} className="input-field" />
              <input value={editingEvent.time || ''} onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })} className="input-field" placeholder="Time" />
              <input value={editingEvent.venue || ''} onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })} className="input-field" placeholder="Venue" />
              <input value={editingEvent.location || ''} onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })} className="input-field" placeholder="Location" />
              <select value={editingEvent.category || ''} onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })} className="input-field">
                {categories.map((category) => <option key={category._id} value={category.name}>{category.name}</option>)}
              </select>
              <select value={editingEvent.moderationStatus || 'approved'} onChange={(e) => setEditingEvent({ ...editingEvent, moderationStatus: e.target.value })} className="input-field">
                <option value="approved">approved</option>
                <option value="pending">pending</option>
                <option value="rejected">rejected</option>
              </select>
              <select value={editingEvent.lifecycleStage || 'under_review'} onChange={(e) => setEditingEvent({ ...editingEvent, lifecycleStage: e.target.value })} className="input-field">
                <option value="planning">planning</option>
                <option value="under_review">under_review</option>
                <option value="approved">approved</option>
                <option value="live">live</option>
                <option value="completed">completed</option>
                <option value="settlement_pending">settlement_pending</option>
                <option value="settled">settled</option>
                <option value="cancelled">cancelled</option>
              </select>
              <select value={editingEvent.ticketSaleStatus || 'pending_approval'} onChange={(e) => setEditingEvent({ ...editingEvent, ticketSaleStatus: e.target.value })} className="input-field">
                <option value="draft">draft</option>
                <option value="pending_approval">pending_approval</option>
                <option value="live">live</option>
                <option value="paused">paused</option>
                <option value="sold_out">sold_out</option>
                <option value="completed">completed</option>
              </select>
              <input value={editingEvent.moderationFlagsText || ''} onChange={(e) => setEditingEvent({ ...editingEvent, moderationFlagsText: e.target.value })} className="input-field md:col-span-2" placeholder="Moderation flags: fake_event, spam, copyright, inappropriate_content" />
              <textarea value={editingEvent.moderationNotes || ''} onChange={(e) => setEditingEvent({ ...editingEvent, moderationNotes: e.target.value })} className="input-field md:col-span-2" rows={3} placeholder="Moderation notes" />
              <input type="number" value={editingEvent.price || 0} onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value })} className="input-field" placeholder="Price" />
              <input type="number" value={editingEvent.totalTickets || 0} onChange={(e) => setEditingEvent({ ...editingEvent, totalTickets: e.target.value })} className="input-field" placeholder="Total tickets" />
              <input type="number" value={editingEvent.availableTickets || 0} onChange={(e) => setEditingEvent({ ...editingEvent, availableTickets: e.target.value })} className="input-field" placeholder="Available tickets" />
              <select value={editingEvent.settlementStatus || 'not_started'} onChange={(e) => setEditingEvent({ ...editingEvent, settlementStatus: e.target.value })} className="input-field">
                <option value="not_started">settlement not_started</option>
                <option value="pending">settlement pending</option>
                <option value="processing">settlement processing</option>
                <option value="settled">settlement settled</option>
                <option value="on_hold">settlement on_hold</option>
              </select>
              <input value={editingEvent.settlementReference || ''} onChange={(e) => setEditingEvent({ ...editingEvent, settlementReference: e.target.value })} className="input-field" placeholder="Settlement reference" />
              <textarea value={editingEvent.settlementNotes || ''} onChange={(e) => setEditingEvent({ ...editingEvent, settlementNotes: e.target.value })} className="input-field md:col-span-2" rows={2} placeholder="Settlement notes" />
              <button disabled={saving} className="btn-primary md:col-span-2">{saving ? 'Saving...' : 'Save Event'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
