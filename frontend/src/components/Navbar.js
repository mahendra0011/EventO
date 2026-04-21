import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Menu, X, Calendar, User, LogOut, Settings, Shield, Bell, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications.slice(0, 10));
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg' 
          : 'bg-white shadow-sm'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
          >
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Calendar className="h-8 w-8 text-primary-600" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Evento
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.to}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={link.to}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isActive(link.to)
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600"
                      layoutId="navbar-indicator"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}

            {user ? (
              <motion.div 
                className="flex items-center space-x-2 ml-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/dashboard"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isActive('/dashboard')
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </motion.div>
                
                 {user.role === 'host' && (
                   <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                     <Link
                       to="/host"
                       className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                         isActive('/host')
                           ? 'bg-primary-50 text-primary-600'
                           : 'text-gray-700 hover:bg-gray-100'
                       }`}
                     >
                       <Settings className="h-4 w-4" />
                       <span>Host Panel</span>
                     </Link>
                   </motion.div>
                 )}

                 {/* Notifications */}
                 <div className="relative">
                   <motion.button
                     onClick={() => setShowNotifications(!showNotifications)}
                     className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                   >
                     <Bell className="h-5 w-5" />
                     {unreadCount > 0 && (
                       <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                         {unreadCount > 9 ? '9+' : unreadCount}
                       </span>
                     )}
                   </motion.button>

                   <AnimatePresence>
                     {showNotifications && (
                       <motion.div
                         initial={{ opacity: 0, y: -10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
                       >
                         <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                           <h4 className="font-semibold">Notifications</h4>
                           {unreadCount > 0 && (
                             <button
                               onClick={handleMarkAllAsRead}
                               className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                             >
                               <Check className="h-3 w-3" />
                               Mark all read
                             </button>
                           )}
                         </div>
                         <div className="max-h-80 overflow-y-auto">
                           {notifications.length > 0 ? (
                             notifications.map((notification) => (
                               <div
                                 key={notification._id}
                                 className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                                   !notification.isRead ? 'bg-blue-50/50' : ''
                                 }`}
                                 onClick={() => {
                                   if (notification.link) navigate(notification.link);
                                   if (!notification.isRead) handleMarkAsRead(notification._id);
                                   setShowNotifications(false);
                                 }}
                               >
                                 <div className="flex items-start gap-3">
                                   <div className={`p-2 rounded-full ${!notification.isRead ? 'bg-primary-100' : 'bg-gray-100'}`}>
                                     <Bell className={`h-4 w-4 ${!notification.isRead ? 'text-primary-600' : 'text-gray-500'}`} />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <h5 className="font-medium text-sm line-clamp-1">{notification.title}</h5>
                                     <p className="text-xs text-gray-500 line-clamp-2 mt-1">{notification.message}</p>
                                     <p className="text-xs text-gray-400 mt-1">
                                       {new Date(notification.createdAt).toLocaleDateString()}
                                     </p>
                                   </div>
                                   {!notification.isRead && (
                                     <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                                   )}
                                 </div>
                               </div>
                             ))
                           ) : (
                             <div className="p-8 text-center text-gray-500">
                               <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                               <p>No notifications</p>
                             </div>
                           )}
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>

                 <motion.button
                   onClick={handleLogout}
                   className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                 >
                   <LogOut className="h-4 w-4" />
                   <span>Logout</span>
                 </motion.button>
               </motion.div>
              ) : (
                <motion.div
                  className="flex items-center space-x-3 ml-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/login"
                      className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300"
                    >
                      Login
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/register"
                      className="px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                </motion.div>
              )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden pb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.to}
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                        isActive(link.to)
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {user ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Link
                        to="/dashboard"
                        className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                          isActive('/dashboard')
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </motion.div>
                    
                     {user.role === 'host' && (
                       <motion.div
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.3 }}
                       >
                         <Link
                           to="/host"
                           className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                             isActive('/host')
                               ? 'bg-primary-50 text-primary-600'
                               : 'text-gray-700 hover:bg-gray-100'
                           }`}
                           onClick={() => setIsMenuOpen(false)}
                         >
                           <Settings className="h-4 w-4" />
                           <span>Host Panel</span>
                         </Link>
                       </motion.div>
                     )}

                     <motion.div
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: 0.35 }}
                     >
                       <button
                         onClick={() => {
                           setShowNotifications(!showNotifications);
                           setIsMenuOpen(false);
                         }}
                         className="flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all duration-300 w-full"
                       >
                         <Bell className="h-4 w-4" />
                         <span>Notifications</span>
                         {unreadCount > 0 && (
                           <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                             {unreadCount}
                           </span>
                         )}
                       </button>
                     </motion.div>

                    <motion.button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-300 text-left"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </motion.button>
                   </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Link
                          to="/login"
                          className="px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all duration-300"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Login
                        </Link>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Link
                          to="/register"
                          className="px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white text-center hover:from-primary-700 hover:to-primary-800 transition-all duration-300"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </motion.div>
                    </>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
