import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCity } from '../context/CityContext';
import { INDIAN_CITY_OPTIONS } from '../data/indianCities';
import api from '../utils/api';
import { Menu, X, CalendarDays, User, LogOut, Settings, Bell, Check, Shield, ArrowRight, Moon, Sun, MapPin, ChevronDown, Search } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { selectedCity, selectCity, clearCity } = useCity();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const { scrollYProgress } = useScroll();
  const scrollProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 28,
    mass: 0.25
  });

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
    setShowCityMenu(false);
    setCitySearch('');
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Browse Events' },
  ];

  const filteredCityOptions = useMemo(() => {
    const query = citySearch.trim().toLowerCase();
    if (!query) return INDIAN_CITY_OPTIONS;

    return INDIAN_CITY_OPTIONS.filter((option) => (
      option.city.toLowerCase().includes(query) ||
      option.state.toLowerCase().includes(query)
    ));
  }, [citySearch]);

  const handleCitySelect = (option) => {
    selectCity(option);
    setShowCityMenu(false);
    setCitySearch('');
  };

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
  const ThemeIcon = isDark ? Sun : Moon;
  const nextThemeLabel = isDark ? 'light' : 'dark';

  const ThemeToggle = ({ mobile = false }) => (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={mobile ? undefined : { y: -2 }}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center gap-2 rounded-lg border border-cocoa-100 bg-white text-sm font-extrabold text-cocoa-700 shadow-sm transition-all hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 ${
        mobile ? 'w-full justify-between px-4 py-3' : 'px-3 py-2.5'
      }`}
      aria-label={`Switch to ${nextThemeLabel} theme`}
      title={`Switch to ${nextThemeLabel} theme`}
    >
      <span className="inline-flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-50 text-primary-600">
          <ThemeIcon className="h-4 w-4" />
        </span>
        <span className={mobile ? '' : 'hidden xl:inline'}>
          {isDark ? 'Light' : 'Dark'}
        </span>
      </span>
      {mobile && (
        <span className="text-xs font-bold uppercase text-cocoa-400">
          {isDark ? 'On' : 'Off'}
        </span>
      )}
    </motion.button>
  );

  const renderCitySelector = (mobile = false) => (
    <div className={`relative ${mobile ? 'w-full' : ''}`}>
      <motion.button
        type="button"
        onClick={() => {
          setShowCityMenu((open) => !open);
          setShowNotifications(false);
        }}
        whileHover={mobile ? undefined : { y: -2 }}
        whileTap={{ scale: 0.96 }}
        className={`inline-flex items-center gap-2 rounded-lg border border-cocoa-100 bg-white text-left text-sm font-extrabold text-cocoa-700 shadow-sm transition-all hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 ${
          mobile ? 'w-full justify-between px-4 py-3' : 'max-w-[210px] px-3 py-2.5'
        }`}
        aria-expanded={showCityMenu}
        aria-label="Select city"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
            <MapPin className="h-4 w-4" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate">{selectedCity?.city || 'All Cities'}</span>
            <span className="block truncate text-[11px] font-bold text-cocoa-400">
              {selectedCity?.state || 'India'}
            </span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${showCityMenu ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {showCityMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`${mobile ? 'mt-2 w-full' : 'absolute right-0 mt-3 w-80'} overflow-hidden rounded-lg border border-cocoa-100 bg-white shadow-2xl shadow-cocoa-900/15`}
          >
            <div className="border-b border-cocoa-100 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(event) => setCitySearch(event.target.value)}
                  placeholder="Search city or state"
                  className="h-10 w-full rounded-lg border border-cocoa-100 bg-[#fbf8f4] pl-9 pr-3 text-sm font-semibold text-cocoa-800 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => {
                  clearCity();
                  setShowCityMenu(false);
                  setCitySearch('');
                }}
                className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                  !selectedCity ? 'bg-primary-50 text-primary-700' : 'text-cocoa-700 hover:bg-primary-50'
                }`}
              >
                <span>
                  <span className="block text-sm font-extrabold">All Cities</span>
                  <span className="mt-0.5 block text-xs font-bold text-cocoa-400">India</span>
                </span>
                {!selectedCity && <Check className="h-4 w-4 text-primary-600" />}
              </button>

              {filteredCityOptions.map((option) => {
                const isSelected = selectedCity?.city === option.city && selectedCity?.state === option.state;

                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => handleCitySelect(option)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-primary-50 text-primary-700' : 'text-cocoa-700 hover:bg-primary-50'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold">{option.city}</span>
                      <span className="mt-0.5 block truncate text-xs font-bold text-cocoa-400">{option.state}</span>
                    </span>
                    {isSelected && <Check className="h-4 w-4 flex-shrink-0 text-primary-600" />}
                  </button>
                );
              })}

              {filteredCityOptions.length === 0 && (
                <div className="px-3 py-8 text-center text-sm font-semibold text-cocoa-400">
                  No matching city found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

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
            <motion.span
              whileHover={{ rotate: -4, scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/20"
            >
              <CalendarDays className="h-6 w-6" />
            </motion.span>
            <span className="leading-none">
              <span className="block text-xl font-extrabold uppercase text-cocoa-900">Evento</span>
              <span className="hidden text-xs font-extrabold uppercase text-cocoa-300 sm:block">
                Events made easy
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative isolate rounded-full px-5 py-2.5 text-sm font-extrabold transition-all ${
                  isActive(link.to)
                    ? 'text-primary-600'
                    : 'text-cocoa-500 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                {isActive(link.to) && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary-50 shadow-sm"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {renderCitySelector()}
            <ThemeToggle />

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
                  <motion.button
                    type="button"
                    onClick={() => setShowNotifications(!showNotifications)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="relative rounded-lg border border-cocoa-100 bg-white p-2.5 text-cocoa-600 shadow-sm transition-all hover:border-primary-200 hover:text-primary-600"
                    aria-label="Open notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </motion.button>

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

          <motion.button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileTap={{ scale: 0.94 }}
            className="rounded-lg border border-cocoa-100 bg-white p-2.5 text-cocoa-700 shadow-sm md:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
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
                {renderCitySelector(true)}
                <ThemeToggle mobile />

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
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-gradient-to-r from-primary-500 via-secondary-500 to-emerald-400"
        style={{ scaleX: scrollProgress }}
      />
    </motion.nav>
  );
};

export default Navbar;
