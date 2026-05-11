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
  CreditCard,
  Mail,
  BadgeCheck,
  TrendingUp,
  Headphones,
  BarChart3
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

const categories = [
  { icon: Music, label: 'Music', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  { icon: Gamepad2, label: 'Gaming', color: 'bg-violet-50 text-violet-700 border-violet-100' },
  { icon: Briefcase, label: 'Business', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { icon: Heart, label: 'Wellness', color: 'bg-pink-50 text-pink-700 border-pink-100' },
  { icon: Coffee, label: 'Food', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { icon: CalendarDays, label: 'Sports', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
];

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

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedEvents();
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

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/events?search=${encodeURIComponent(query)}` : '/events');
  };

  return (
    <div className="overflow-x-hidden bg-slate-50">
      <section className="relative min-h-[calc(100vh-7rem)] overflow-hidden bg-slate-950 text-white">
        <img
          src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1800&q=85"
          alt="Audience enjoying a live event"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-slate-950/35" aria-hidden="true" />
        <div className="absolute inset-0 subtle-grid opacity-20" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-primary-100 backdrop-blur"
            >
              <CalendarDays className="h-4 w-4" />
              Book events. Host events. Keep every detail moving.
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.65 }}
              className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl"
            >
              Evento
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.55 }}
              className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl"
            >
              A polished event booking and management platform for discovering live experiences, selling tickets, verifying bookings, and keeping attendees informed.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.55 }}
              onSubmit={handleSearch}
              className="mt-9 grid max-w-3xl gap-3 rounded-lg border border-white/15 bg-white p-2 shadow-2xl shadow-slate-950/30 sm:grid-cols-[1fr_auto]"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search concerts, workshops, conferences..."
                  className="h-12 w-full rounded-lg border-0 bg-white pl-12 pr-4 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                />
              </div>
              <button type="submit" className="btn-primary h-12 px-6">
                Explore Events
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.55 }}
              className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="border-l border-white/20 pl-4">
                  <div className="text-2xl font-extrabold text-white">
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-slate-700">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="section-kicker">
                <Ticket className="h-3.5 w-3.5" />
                Trending now
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Featured events
              </h2>
              <p className="mt-3 max-w-2xl text-slate-600">
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
                  <div className="h-56 animate-pulse bg-slate-200" />
                  <div className="space-y-4 p-5">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredEvents.length === 0 ? (
            <div className="surface-panel flex flex-col items-center justify-center px-6 py-16 text-center">
              <CalendarDays className="mb-4 h-12 w-12 text-slate-300" />
              <h3 className="text-xl font-extrabold text-slate-950">Featured events are coming soon</h3>
              <p className="mt-2 max-w-md text-slate-500">
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
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredEvents.slice(0, 3).map((event, index) => (
                <EventCard key={event._id} event={event} index={index} />
              ))}
            </div>
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
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                One platform for guests and event teams.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
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

            <div className="grid gap-4 sm:grid-cols-2">
              {featureCards.map((feature) => (
                <div key={feature.title} className="surface-panel p-6">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="section-kicker">
              <Search className="h-3.5 w-3.5" />
              Explore by interest
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Find the category that fits your calendar.
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.label}
                to={`/events?category=${category.label.toLowerCase()}`}
                className={`group rounded-lg border bg-white p-5 text-center transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${category.color}`}
              >
                <category.icon className="mx-auto h-8 w-8 transition-transform group-hover:scale-110" />
                <span className="mt-4 block text-base font-extrabold">{category.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <span className="section-kicker">
              <CheckCircle className="h-3.5 w-3.5" />
              Simple process
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              From discovery to the door in three steps.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="surface-panel p-6">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-400">
                    Step {index + 1}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <step.icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-950">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 py-20 text-white">
        <img
          src="https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1800&q=85"
          alt="Conference audience and stage lighting"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-slate-950/75" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-primary-100 backdrop-blur">
            Ready when you are
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Make the next event easier to find, book, and manage.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Start with a guest account, or register as a host and bring your audience into one organized workspace.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary bg-white text-slate-950 hover:bg-slate-100">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/events" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10">
              Browse events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
