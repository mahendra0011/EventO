import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api, {
  getWishlist,
  getNotifications, markNotificationAsRead, markAllNotificationsAsRead,
  getCommunityMessages, postCommunityMessage
} from '../utils/api';
import toast from 'react-hot-toast';
import {
    Calendar, Ticket, Clock, CheckCircle, XCircle, AlertCircle, User, Mail, Phone,
    Edit3, Save, X, QrCode, Heart, CreditCard, Star, Search, Filter, TrendingUp, MapPin, IndianRupee, History,
    HelpCircle, MessageCircle, Calendar as CalendarIcon, Bell, Eye, Users
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

  // New states for notifications and community
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userEvents, setUserEvents] = useState([]);

   const [profileData, setProfileData] = useState({
     name: user?.name || '',
     phone: user?.phone || ''
   });

   // Community chat states
   const [selectedCommunityEvent, setSelectedCommunityEvent] = useState(null);
   const [communityMessages, setCommunityMessages] = useState([]);
   const [communityMessageContent, setCommunityMessageContent] = useState('');

   // Keep profileData in sync with user context
   useEffect(() => {
     if (user) {
       setProfileData({ name: user.name || '', phone: user.phone || '' });
     }
   }, [user]);

    useEffect(() => {
      fetchBookings();
      if (user) {
        fetchWishlist();
        fetchNotifications();
        fetchUserEvents();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await getWishlist();
      const data = Array.isArray(res.data) ? res.data : [];
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
        // Get unique events from confirmed and pending bookings
        const events = [...new Map(userBookings
          .filter(b => b.event)
          .map(b => b.event)
          .map(event => [event._id, event])).values()];
        setUserEvents(events);
      } catch (error) {
        console.error('Error fetching user events:', error);
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
        toast.success('Message sent to community');
        setCommunityMessageContent('');
        fetchCommunityMessages(selectedCommunityEvent);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    };

     const fetchNotifications = async () => {
      try {
        const res = await getNotifications();
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    const fetchCommunityMessages = async (eventId, page = 1, limit = 50) => {
      try {
        const res = await getCommunityMessages(eventId, page, limit);
        setCommunityMessages(res.data.messages || []);
      } catch (error) {
        console.error('Error fetching community messages:', error);
        setCommunityMessages([]);
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

   // Notification Center Component
   const NotificationCenter = () => {
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

     return (
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
   };

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
                 {["bookings", "upcoming", "calendar", "wishlist", "community", "notifications", "payments", "reviews", "support", "profile"].map((tabId) => {
                   const tabDef = {
                   bookings: { icon: Ticket, label: 'My Bookings' },
                   upcoming: { icon: CalendarIcon, label: 'Upcoming' },
                   calendar: { icon: Calendar, label: 'Calendar' },
                   wishlist: { icon: Heart, label: 'Wishlist' },
                   community: { icon: MessageCircle, label: 'Community' },
                   notifications: { icon: Bell, label: 'Notifications' },
                   payments: { icon: CreditCard, label: 'Payment History' },
                   reviews: { icon: Star, label: 'Reviews' },
                   support: { icon: HelpCircle, label: 'Support' },
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
                              <img src={booking.event?.image || 'https://images.unsplash.com/photo-1540575467083-2bdc3c5f8ebe?w=200'} alt={booking.event?.title} className="w-24 h-24 object-cover rounded-lg" />
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
                       <p className="text-gray-600 mb-4">Bookings you confirm will appear here</p>
                       <Link to="/events" className="btn-primary">Browse Events</Link>
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
                        // Defensive: ensure item and event exist
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

                 {/* Community Tab */}
                 {activeTab === 'community' && (
                   <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     <h3 className="text-lg font-semibold mb-4">Community Chat</h3>
                     <p className="text-sm text-gray-600 mb-6">
                       Join the community conversation for events you're attending. Share experiences, ask questions, and connect with other attendees.
                     </p>
                     <div className="space-y-6">
                       {/* Community Chat List - will show events with community chat */}
                       <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                         <div className="p-4 border-b border-gray-200 bg-gray-50">
                           <h4 className="font-semibold">Event Chats</h4>
                         </div>
                          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                            {userEvents.length > 0 ? (
                              <>
                                {userEvents.map((event) => (
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
                                No events with community chat. Book confirmed events to access community chat.
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
                                   <p className="font-medium">{userEvents.find(e => e._id === selectedCommunityEvent)?.title || 'Event'}</p>
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
                                   <p>No messages yet. Start the conversation!</p>
                                 </div>
                               )}
                             </div>

                             {/* Message Input */}
                             <form onSubmit={handleCommunityMessageSubmit} className="p-4 border-t border-gray-200">
                               <div className="space-y-2">
                                 <textarea
                                   value={communityMessageContent}
                                   onChange={(e) => setCommunityMessageContent(e.target.value)}
                                   placeholder="Write a message to the community..."
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                   rows="2"
                                   required
                                 />
                                 <button type="submit" className="btn-primary w-full text-sm py-2">
                                   Send
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
                         ))}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                      <HelpCircle className="h-8 w-8 text-primary-600 mb-3" />
                      <h4 className="font-semibold">FAQs</h4>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <MessageCircle className="h-8 w-8 text-blue-600 mb-3" />
                      <h4 className="font-semibold">Contact Us</h4>
                    </div>
                  </div>
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