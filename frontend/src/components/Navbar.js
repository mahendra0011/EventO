import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Menu, X, CalendarDays, User, LogOut, Settings, Bell, Check, Shield, ArrowRight } from 'lucide-react';

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
      const intervalId = setInterval(fetchNotifications, 30000);
      return () => clearInterval(intervalId);
    }

    setNotifications([]);
    setUnreadCount(0);
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
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Browse Events' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/host', label: 'Host Panel' },
  ];

  const isActive = (path) => location.pathname === path;

  const getNotificationLink = (notification) => {
    const link = notification?.link || '';

    if (link === '/dashboard/messages') return '/dashboard?tab=broadcasts';
    if (link === '/host/bookings') return '/host?tab=bookings';
    if (link.startsWith('/bookings/')) return '/dashboard?tab=bookings';

    return link;
  };

  const openNotification = (notification) => {
    const link = getNotificationLink(notification);

    if (link) navigate(link);
    if (!notification.isRead) handleMarkAsRead(notification._id);
    setShowNotifications(false);
  };

  const accountLink = user?.role === 'admin'
    ? { to: '/admin', label: 'Admin Panel', icon: Shield }
    : user?.role === 'host'
      ? { to: '/host', label: 'Host Panel', icon: Settings }
      : { to: '/dashboard', label: 'Dashboard', icon: User };

  const AccountIcon = accountLink.icon;

  return (
    <motion.nav
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-cocoa-100 bg-[#fffdfb]/95 shadow-sm backdrop-blur-xl'
          : 'border-cocoa-100/70 bg-[#fffdfb]/95 backdrop-blur'
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" aria-label="Evento home">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/20">
              <CalendarDays className="h-6 w-6" />
            </span>
            <span className="leading-none">
              <span className="block text-xl font-black uppercase tracking-tight text-cocoa-900">Evento</span>
              <span className="hidden text-xs font-extrabold uppercase tracking-[0.2em] text-cocoa-300 sm:block">
                Events made easy
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full px-5 py-2.5 text-sm font-extrabold transition-all ${
                  isActive(link.to)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-cocoa-500 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link
                  to={accountLink.to}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    isActive(accountLink.to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-cocoa-600 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  <AccountIcon className="h-4 w-4" />
                  {accountLink.label}
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative rounded-lg border border-cocoa-100 bg-white p-2.5 text-cocoa-600 shadow-sm transition-all hover:border-primary-200 hover:text-primary-600"
                    aria-label="Open notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 mt-3 w-96 overflow-hidden rounded-lg border border-cocoa-100 bg-white shadow-2xl shadow-cocoa-900/15"
                      >
                        <div className="flex items-center justify-between border-b border-cocoa-100 p-4">
                          <div>
                            <h4 className="font-bold text-cocoa-900">Notifications</h4>
                            <p className="text-xs text-cocoa-400">
                              {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllAsRead}
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-800"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Mark read
                            </button>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((notification) => (
                              <button
                                type="button"
                                key={notification._id}
                                className={`w-full border-b border-cocoa-100 p-4 text-left transition-colors hover:bg-primary-50/40 ${
                                  !notification.isRead ? 'bg-primary-50/60' : ''
                                }`}
                                onClick={() => openNotification(notification)}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                                    !notification.isRead ? 'bg-primary-500 text-white' : 'bg-[#f3eee9] text-cocoa-400'
                                  }`}>
                                    <Bell className="h-4 w-4" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-bold text-cocoa-900">{notification.title}</span>
                                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-cocoa-500">{notification.message}</span>
                                    <span className="mt-1 block text-xs text-cocoa-300">
                                      {new Date(notification.createdAt).toLocaleDateString()}
                                    </span>
                                  </span>
                                  {!notification.isRead && (
                                    <span className="mt-2 h-2 w-2 rounded-full bg-primary-500" />
                                  )}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-10 text-center text-cocoa-500">
                              <Bell className="mx-auto mb-3 h-10 w-10 text-cocoa-200" />
                              <p className="font-medium">No notifications</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-extrabold text-cocoa-600 transition-all hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-extrabold text-cocoa-700 transition-all hover:bg-primary-50 hover:text-primary-600"
                >
                  <User className="h-4 w-4" />
                  Login
                </Link>
                <Link to="/register" className="btn-primary px-5 py-2.5 text-sm">
                  Sign Up
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-lg border border-cocoa-100 bg-white p-2.5 text-cocoa-700 shadow-sm md:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-2 border-t border-cocoa-100 py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block rounded-lg px-4 py-3 text-sm font-semibold ${
                      isActive(link.to)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-cocoa-700 hover:bg-primary-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {user ? (
                  <>
                    <Link
                      to={accountLink.to}
                      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${
                        isActive(accountLink.to)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-cocoa-700 hover:bg-primary-50'
                      }`}
                    >
                      <AccountIcon className="h-4 w-4" />
                      {accountLink.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(user.role === 'admin' ? '/admin?tab=notifications' : user.role === 'host' ? '/host?tab=notifications' : '/dashboard?tab=notifications');
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-cocoa-700 hover:bg-primary-50"
                    >
                      <span className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-cocoa-700 hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block rounded-lg px-4 py-3 text-sm font-semibold text-cocoa-700 hover:bg-primary-50"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-3 text-sm font-bold text-white"
                    >
                      Sign Up
                      <ArrowRight className="h-4 w-4" />
                    </Link>
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
