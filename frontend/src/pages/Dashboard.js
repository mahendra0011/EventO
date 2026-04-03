import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Ticket, Clock, CheckCircle, XCircle, AlertCircle, User, Mail, Phone, Edit3, Save, X } from 'lucide-react';
import { AnimatedButton, AnimatedCard, AnimatedIcon, AnimatedContainer, GradientText } from '../components/animated';

const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  useEffect(() => {
    fetchBookings();
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
            <nav className="flex -mb-px">
              {['bookings', 'profile'].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-all duration-300 ${
                    activeTab === tab
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tab === 'bookings' ? 'My Bookings' : 'Profile Settings'}
                </motion.button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'bookings' ? (
                <motion.div
                  key="bookings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <motion.div
                        className="rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                  ) : bookings.length > 0 ? (
                    <motion.div 
                      className="space-y-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {bookings.map((booking, index) => (
                        <motion.div
                          key={booking._id}
                          variants={itemVariants}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-white"
                          whileHover={{ 
                            scale: 1.02,
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start space-x-4">
                              <motion.img
                                src={booking.event?.image}
                                alt={booking.event?.title}
                                className="w-24 h-24 object-cover rounded-lg"
                                whileHover={{ scale: 1.1 }}
                              />
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {booking.event?.title}
                                </h3>
                                <div className="flex items-center text-gray-500 text-sm mt-1">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(booking.event?.date)} at {booking.event?.time}
                                </div>
                                <div className="flex items-center text-gray-500 text-sm mt-1">
                                  <Ticket className="h-4 w-4 mr-1" />
                                  {booking.numberOfTickets} ticket(s) - ₹{booking.totalPrice.toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2">
                              {getStatusBadge(booking.status)}
                              {booking.status === 'pending' && (
                                <AnimatedButton
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleCancelBooking(booking._id)}
                                >
                                  Cancel Booking
                                </AnimatedButton>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="text-center py-12"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <AnimatedIcon variant="float" className="mb-4">
                        <Ticket className="h-16 w-16 text-gray-300" />
                      </AnimatedIcon>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                      <p className="text-gray-600 mb-4">Start exploring events and book your first ticket!</p>
                      <AnimatedButton variant="primary">
                        <Link to="/events">Browse Events</Link>
                      </AnimatedButton>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
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

                      <AnimatedButton
                        variant="primary"
                        onClick={() => setEditMode(true)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </AnimatedButton>
                    </motion.div>
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
