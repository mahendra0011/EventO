import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import api from '../utils/api';
import EventCard from '../components/EventCard';
import {
  Search,
  CalendarDays,
  Users,
  ShieldCheck,
  ArrowRight,
  Ticket,
  CheckCircle,
  Music,
  Gamepad2,
  Briefcase,
  Heart,
  Coffee,
  Palette,
  Laptop,
  Trophy,
  CreditCard,
  Mail,
  BadgeCheck,
  TrendingUp,
  Headphones,
  BarChart3,
  MessageCircle,
  Star,
  Quote,
  Sparkles,
  Radio,
  MousePointerClick,
  BellRing
} from 'lucide-react';

const AnimatedCounter = ({ value, duration = 1.7 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef();
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const start = 0;
    const end = parseInt(value.replace(/\D/g, ''), 10);
    const startTime = performance.now();
    let animationFrameId;

    const animate = (currentTime) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOut);
      setCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isInView, duration, value]);

  return <span ref={ref}>{count.toLocaleString()}{value.replace(/[0-9]/g, '')}</span>;
};

const stats = [
  { value: '10000+', label: 'Events listed' },
  { value: '500000+', label: 'Tickets booked' },
  { value: '1000+', label: 'Active hosts' },
  { value: '24+', label: 'Event categories' }
];

const featureCards = [
  {
    icon: Ticket,
    title: 'Fast ticketing',
    description: 'Guests can browse, reserve, verify, and receive digital tickets with fewer steps.',
    color: 'bg-primary-50 text-primary-700'
  },
  {
    icon: BarChart3,
    title: 'Host dashboards',
    description: 'Organizers get booking visibility, attendee tools, broadcast messages, and support flows.',
    color: 'bg-emerald-50 text-emerald-700'
  },
  {
    icon: ShieldCheck,
    title: 'Verified access',
    description: 'OTP checks, QR tickets, and booking status keep entry and account flows clear.',
    color: 'bg-amber-50 text-amber-700'
  },
  {
    icon: Headphones,
    title: 'Built-in support',
    description: 'Attendees can raise issues and hosts can stay connected before and after the event.',
    color: 'bg-rose-50 text-rose-700'
  }
];

const defaultInterests = ['Music', 'Sports', 'Technology', 'Food', 'Gaming', 'Business', 'Workshops', 'Art', 'Other'];

const interestStyles = {
  Music: {
    icon: Music,
    description: 'Concerts, festivals, and live performances.',
    color: 'from-rose-400 to-pink-500',
    tint: 'bg-rose-50 text-rose-700 border-rose-100'
  },
  Sports: {
    icon: Trophy,
    description: 'Matches, fan zones, and active experiences.',
    color: 'from-emerald-400 to-teal-500',
    tint: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  },
  Technology: {
    icon: Laptop,
    description: 'Summits, product talks, and innovation meetups.',
    color: 'from-blue-400 to-cyan-500',
    tint: 'bg-blue-50 text-blue-700 border-blue-100'
  },
  Food: {
    icon: Coffee,
    description: 'Tastings, pop-ups, and culinary gatherings.',
    color: 'from-amber-400 to-orange-500',
    tint: 'bg-amber-50 text-amber-700 border-amber-100'
  },
  Gaming: {
    icon: Gamepad2,
    description: 'Tournaments, launches, and community nights.',
    color: 'from-violet-400 to-indigo-500',
    tint: 'bg-violet-50 text-violet-700 border-violet-100'
  },
  Business: {
    icon: Briefcase,
    description: 'Networking, conferences, and founder sessions.',
    color: 'from-sky-400 to-blue-600',
    tint: 'bg-sky-50 text-sky-700 border-sky-100'
  },
  Workshops: {
    icon: Sparkles,
    description: 'Hands-on learning, craft sessions, and classes.',
    color: 'from-purple-400 to-fuchsia-500',
    tint: 'bg-purple-50 text-purple-700 border-purple-100'
  },
  Art: {
    icon: Palette,
    description: 'Exhibitions, maker fairs, and cultural programs.',
    color: 'from-orange-400 to-rose-500',
    tint: 'bg-orange-50 text-orange-700 border-orange-100'
  },
  Other: {
    icon: Heart,
    description: 'Unique local experiences worth discovering.',
    color: 'from-primary-400 to-secondary-500',
    tint: 'bg-primary-50 text-primary-700 border-primary-100'
  }
};

const getInterestDetails = (category) => {
  const details = interestStyles[category] || interestStyles.Other;

  return {
    ...details,
    label: category
  };
};

const steps = [
  {
    icon: Search,
    title: 'Find the right event',
    description: 'Search by category, location, date, or keyword and compare your best options.'
  },
  {
    icon: CreditCard,
    title: 'Reserve your ticket',
    description: 'Choose the ticket count, verify your booking, and keep everything in your dashboard.'
  },
  {
    icon: CheckCircle,
    title: 'Show up prepared',
    description: 'Use confirmation details, chat updates, and QR tickets when it is time to attend.'
  }
];

const trustItems = [
  { icon: ShieldCheck, label: 'Secure booking flow' },
  { icon: Mail, label: 'Email confirmations' },
  { icon: BadgeCheck, label: 'Verified tickets' },
  { icon: TrendingUp, label: 'Host analytics' }
];

const comments = [
  {
    name: 'Alex Johnson',
    role: 'Festival guest',
    event: 'Summer Solstice Festival',
    comment: 'Booking was quick, the ticket stayed easy to find, and every event update arrived right on time.',
    rating: '5.0'
  },
  {
    name: 'Maya Patel',
    role: 'Workshop host',
    event: 'Creative Makers Lab',
    comment: 'The host dashboard made check-ins, attendee messages, and sales tracking feel clean and organized.',
    rating: '4.9'
  },
  {
    name: 'Chris Morgan',
    role: 'Conference attendee',
    event: 'Tech Innovators Summit',
    comment: 'I liked seeing booking status, event details, and community messages together without digging around.',
    rating: '4.8'
  }
];

const activityTicker = [
  { icon: Ticket, label: 'Tickets verified in seconds' },
  { icon: BellRing, label: 'Real-time event updates' },
  { icon: Radio, label: 'Live host broadcasts' },
  { icon: MousePointerClick, label: 'One-click event discovery' },
  { icon: Sparkles, label: 'Polished attendee experience' }
];

const operationHighlights = [
  {
    icon: Search,
    label: 'Discover',
    title: 'Find the right room',
    description: 'Search by interest, date, city, or event style before you commit.'
  },
  {
    icon: Ticket,
    label: 'Book',
    title: 'Keep tickets tidy',
    description: 'Booking status, ticket count, and event details stay together.'
  },
  {
    icon: MessageCircle,
    label: 'Connect',
    title: 'Hear from the host',
    description: 'Broadcasts and community updates keep guests in the loop.'
  },
  {
    icon: BarChart3,
    label: 'Manage',
    title: 'Run the event calmly',
    description: 'Hosts can track momentum, bookings, attendee counts, and revenue.'
  }
];

const heroActivity = [
  {
    icon: Ticket,
    title: '432 tickets',
    detail: 'verified today',
    className: 'right-8 top-7'
  },
  {
    icon: BellRing,
    title: 'Live updates',
    detail: 'sent instantly',
    className: '-left-5 top-24'
  },
  {
    icon: Users,
    title: '2.8k guests',
    detail: 'checked in',
    className: 'right-12 bottom-20'
  }
];

const revealContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const revealItem = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
  }
};

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [homeCategories, setHomeCategories] = useState(defaultInterests);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedEvents();
    fetchHomeCategories();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const res = await api.get('/events/featured');
      setFeaturedEvents(res.data || []);
    } catch (error) {
      console.error('Error fetching featured events:', error);
      setFeaturedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHomeCategories = async () => {
    try {
      const res = await api.get('/events/categories');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setHomeCategories(res.data.filter(Boolean).slice(0, 9));
      }
    } catch (error) {
      console.error('Error fetching home categories:', error);
      setHomeCategories(defaultInterests);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/events?search=${encodeURIComponent(query)}` : '/events');
  };

  return (
    <div className="overflow-x-hidden bg-[#fbf8f4]">
      <section className="subtle-grid relative overflow-hidden bg-gradient-to-br from-primary-50 via-[#fff8f2] to-[#fbf8f4]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:min-h-[620px] lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-7 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-extrabold text-primary-600"
            >
              <CalendarDays className="h-4 w-4" />
              Book events. Host events. Keep every detail moving.
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.65 }}
              className="max-w-3xl text-4xl font-extrabold leading-tight text-cocoa-900 sm:text-5xl 2xl:text-6xl"
            >
              Curate Your{' '}
              <span className="block bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Unforgettable
              </span>
              Moments
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.55 }}
              className="mt-5 max-w-2xl text-lg leading-8 text-cocoa-500 sm:text-xl"
            >
              A polished event booking and management platform for discovering live experiences, selling tickets, verifying bookings, and keeping attendees informed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.55 }}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <Link to="/events" className="btn-primary px-8">
                <Search className="h-4 w-4" />
                Explore Events
              </Link>
              <Link to="/register?host=true" className="btn-secondary px-8">
                Start Hosting
              </Link>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.55 }}
              onSubmit={handleSearch}
              className="mt-5 grid max-w-2xl gap-3 rounded-lg bg-white p-2 shadow-2xl shadow-cocoa-900/10 sm:grid-cols-[1fr_auto]"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-300" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, venues, categories..."
                  className="h-11 w-full rounded-lg border-0 bg-white pl-12 pr-4 text-cocoa-900 outline-none placeholder:text-cocoa-300 focus:ring-0"
                />
              </div>
              <button type="submit" className="btn-primary h-11 px-6">
                Explore Events
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.44, duration: 0.55 }}
              className="mt-7 grid max-w-2xl grid-cols-2 gap-5 sm:grid-cols-4"
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-extrabold text-cocoa-900">
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <div className="mt-1 text-xs font-bold uppercase text-cocoa-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.65 }}
            className="relative"
          >
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="group relative overflow-hidden rounded-lg bg-white shadow-2xl shadow-cocoa-900/15"
            >
              <img
                src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1400&q=85"
                alt="Audience enjoying a live event"
                className="h-[300px] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-[400px]"
              />
              <span className="image-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/20" />
            </motion.div>

            {heroActivity.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -8, 0]
                }}
                transition={{
                  opacity: { delay: 0.45 + index * 0.1, duration: 0.35 },
                  scale: { delay: 0.45 + index * 0.1, duration: 0.35 },
                  y: { delay: index * 0.2, duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
                }}
                className={`absolute hidden items-center gap-3 rounded-lg border border-white bg-white/95 px-4 py-3 shadow-2xl shadow-cocoa-900/12 backdrop-blur lg:flex ${item.className}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <item.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-cocoa-900">{item.title}</span>
                  <span className="block text-xs font-bold text-cocoa-400">{item.detail}</span>
                </span>
              </motion.div>
            ))}

            <div className="float-soft absolute -bottom-7 left-6 flex items-center gap-4 rounded-lg bg-white px-5 py-4 shadow-2xl shadow-cocoa-900/15">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CalendarDays className="h-6 w-6" />
              </span>
              <div>
                <p className="font-extrabold text-cocoa-900">Next Event</p>
                <p className="text-sm font-semibold text-cocoa-400">Summer Music Fest - 2 days</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-cocoa-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="flex items-center gap-3"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-extrabold text-cocoa-700">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden border-b border-cocoa-100 bg-[#fffdfb] py-4">
        <div className="marquee-track flex w-max gap-4">
          {[...activityTicker, ...activityTicker].map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="flex items-center gap-3 rounded-full border border-primary-100 bg-primary-50 px-5 py-2.5 text-sm font-extrabold text-primary-700"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#fbf8f4] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="section-kicker">
                <Ticket className="h-3.5 w-3.5" />
                Trending now
              </span>
              <h2 className="text-3xl font-extrabold text-cocoa-900 sm:text-4xl">
                Featured events
              </h2>
              <p className="mt-3 max-w-2xl text-cocoa-500">
                A quick look at the events guests are discovering first.
              </p>
            </div>
            <Link to="/events" className="btn-secondary w-full sm:w-auto">
              Browse all events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="surface-panel overflow-hidden">
                  <div className="h-56 animate-pulse bg-cocoa-100" />
                  <div className="space-y-4 p-5">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-cocoa-100" />
                    <div className="h-4 w-full animate-pulse rounded bg-primary-50" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-primary-50" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredEvents.length === 0 ? (
            <div className="surface-panel flex flex-col items-center justify-center px-6 py-16 text-center">
              <CalendarDays className="mb-4 h-12 w-12 text-primary-300" />
              <h3 className="text-xl font-extrabold text-cocoa-900">Featured events are coming soon</h3>
              <p className="mt-2 max-w-md text-cocoa-500">
                Explore all events or create an account to start hosting your own.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/events" className="btn-primary">
                  Explore events
                </Link>
                <Link to="/register?host=true" className="btn-secondary">
                  Become a host
                </Link>
              </div>
            </div>
          ) : (
            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {featuredEvents.slice(0, 3).map((event, index) => (
                <EventCard key={event._id} event={event} index={index} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <span className="section-kicker">
                <Users className="h-3.5 w-3.5" />
                Built for both sides
              </span>
              <h2 className="text-3xl font-extrabold text-cocoa-900 sm:text-4xl">
                One platform for guests and event teams.
              </h2>
              <p className="mt-4 text-lg leading-8 text-cocoa-500">
                Evento keeps the public experience simple while giving hosts the operational tools they need after publishing.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="btn-primary">
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/login?host=true" className="btn-secondary">
                  Host login
                </Link>
              </div>
            </div>

            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {featureCards.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={revealItem}
                  whileHover={{ y: -6, scale: 1.015 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                  className="surface-panel motion-surface p-6"
                >
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-cocoa-900">{feature.title}</h3>
                  <p className="mt-2 leading-7 text-cocoa-500">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-cocoa-900 py-20 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(244,90,44,0.18),transparent_42%,rgba(244,63,103,0.14))]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase text-primary-100">
                <Sparkles className="h-3.5 w-3.5" />
                Event journey
              </span>
              <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
                Every section feels connected, from first search to final check-in.
              </h2>
            </div>
            <p className="text-lg leading-8 text-cocoa-100">
              The experience is designed as one flow: guests discover with confidence, hosts keep control, and important updates never get buried.
            </p>
          </div>

          <motion.div
            variants={revealContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            {operationHighlights.map((item, index) => (
              <motion.div
                key={item.title}
                variants={revealItem}
                whileHover={{ y: -8, scale: 1.015 }}
                className="rounded-lg border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/10 backdrop-blur"
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-sm font-extrabold uppercase text-primary-100">{item.label}</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-primary-600">
                    <item.icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="text-xl font-extrabold">{item.title}</h3>
                <p className="mt-3 leading-7 text-cocoa-100">{item.description}</p>
                <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.08, duration: 0.75, ease: 'easeOut' }}
                    className="block h-full origin-left rounded-full bg-gradient-to-r from-primary-400 to-secondary-400"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-[#f7f3ee] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="section-kicker">
                <Search className="h-3.5 w-3.5" />
                Explore by interest
              </span>
              <h2 className="text-3xl font-extrabold text-cocoa-900 sm:text-4xl">
                Tap an icon to explore matching events.
              </h2>
              <p className="mt-3 max-w-2xl text-cocoa-500">
                Clean, fast interest shortcuts that open the right event filter instantly.
              </p>
            </div>
            <Link to="/events" className="btn-secondary w-full sm:w-auto">
              View all interests
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <motion.div
            variants={revealContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9"
          >
            {homeCategories.map((categoryName, index) => {
              const category = getInterestDetails(categoryName);

              return (
                <motion.div key={category.label} variants={revealItem} whileHover={{ y: -7 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to={`/events?category=${encodeURIComponent(category.label)}`}
                    className="interest-icon-card group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-white bg-white shadow-xl shadow-cocoa-900/5 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-cocoa-900/10"
                    aria-label={`Browse ${category.label} events`}
                    title={`Browse ${category.label}`}
                    style={{ animationDelay: `${index * 130}ms` }}
                  >
                    <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${category.color}`} />
                    <span className="interest-icon-orbit absolute h-16 w-16 rounded-full border border-primary-200/70" />
                    <span className="interest-icon-spark absolute right-4 top-4 h-2 w-2 rounded-full bg-primary-400" />
                    <span className={`interest-icon-glyph relative z-10 flex h-14 w-14 items-center justify-center rounded-lg border ${category.tint}`}>
                      <category.icon className="h-7 w-7" />
                    </span>
                    <span className="sr-only">{category.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <span className="section-kicker">
              <CheckCircle className="h-3.5 w-3.5" />
              Simple process
            </span>
            <h2 className="text-3xl font-extrabold text-cocoa-900 sm:text-4xl">
              From discovery to the door in three steps.
            </h2>
          </div>

          <motion.div
            variants={revealContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="grid gap-6 md:grid-cols-3"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                variants={revealItem}
                whileHover={{ y: -6, rotate: index === 1 ? 0.35 : -0.35 }}
                className="surface-panel motion-surface p-6"
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-sm font-extrabold uppercase text-cocoa-300">
                    Step {index + 1}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-500 text-white">
                    <step.icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-cocoa-900">{step.title}</h3>
                <p className="mt-3 leading-7 text-cocoa-500">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-[#fbf8f4] py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <span className="section-kicker">
              <MessageCircle className="h-3.5 w-3.5" />
              Guest comments
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-cocoa-900 sm:text-4xl">
              People remember the little details.
            </h2>
            <p className="mt-4 text-lg leading-8 text-cocoa-500">
              Helpful updates, clean tickets, and easy host tools make the full event journey feel calmer from first click to final check-in.
            </p>

            <div className="mt-8 rounded-lg border border-white bg-white p-6 shadow-xl shadow-cocoa-900/5">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Star className="h-7 w-7 fill-current" />
                </span>
                <div>
                  <p className="text-3xl font-extrabold text-cocoa-900">4.9/5</p>
                  <p className="text-sm font-bold uppercase text-cocoa-400">Average event experience</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { value: '96%', label: 'Smooth booking' },
                  { value: '88%', label: 'Clear updates' },
                  { value: '91%', label: 'Would return' }
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-[#fbf8f4] p-4">
                    <p className="text-xl font-extrabold text-cocoa-900">{item.value}</p>
                    <p className="mt-1 text-xs font-bold uppercase text-cocoa-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {comments.map((comment, index) => (
              <motion.article
                key={comment.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="surface-panel p-6"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 text-lg font-extrabold text-white shadow-lg shadow-primary-500/20">
                      {comment.name.split(' ').map((part) => part[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-cocoa-900">{comment.name}</h3>
                      <p className="font-semibold text-cocoa-400">{comment.role}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-extrabold text-amber-700">
                    <Star className="h-4 w-4 fill-current" />
                    {comment.rating}
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Quote className="mt-1 h-7 w-7 flex-shrink-0 text-primary-300" />
                  <p className="text-lg leading-8 text-cocoa-600">{comment.comment}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-cocoa-100 pt-4">
                  <span className="text-sm font-bold uppercase text-cocoa-400">Event</span>
                  <span className="text-sm font-extrabold text-primary-600">{comment.event}</span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-[#fff8f2] py-20 text-cocoa-900">
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <span className="section-kicker">
            Ready when you are
          </span>
          <h2 className="text-3xl font-extrabold sm:text-5xl">
            Make the next event easier to find, book, and manage.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-cocoa-500">
            Start with a guest account, or register as a host and bring your audience into one organized workspace.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/events" className="btn-secondary">
              Browse events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
