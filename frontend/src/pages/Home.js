import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import api from '../utils/api';
import EventCard from '../components/EventCard';
import {
  Search, Calendar, Users, Shield, ArrowRight, Sparkles, Star,
  Ticket, CheckCircle, Music, Gamepad2, Briefcase, Heart, Coffee,
  CreditCard, Mail, Award, TrendingUp, Zap, Gift, Headphones, Globe
} from 'lucide-react';
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedHeading,
  AnimatedParagraph,
  AnimatedIcon,
  AnimatedContainer,
  GradientText,
  FloatingElement,
  ShimmerEffect
} from '../components/animated';

// Animated counter component
const AnimatedCounter = ({ value, duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef();
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const start = 0;
      const end = parseInt(value.replace(/\D/g, ''));
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = (currentTime - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);
        setCount(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, duration, value]);

  return <span ref={ref}>{count.toLocaleString()}{value.replace(/\d/g, '')}</span>;
};

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const res = await api.get('/events/featured');
      setFeaturedEvents(res.data);
    } catch (error) {
      console.error('Error fetching featured events:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const MotionLink = motion(Link);

  return (
    <div className="overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, 50, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl"
            animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-400/15 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Floating dots */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-500/30 rounded-full"
              style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
              animate={{ y: [0, -20, 0], opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>

        {/* Hero content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 text-center z-10">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-full text-base font-semibold text-blue-600 border border-blue-200/50 mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              ✨ Discover Amazing Events & Host Your Own
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="my-8">
            <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-tight">
              <span className="block text-gray-900">Unforgettable</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Events Await
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Book tickets for concerts, conferences, sports, and more.
            <span className="text-blue-600 font-bold"> Or host your own events</span> and manage attendees with ease.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
              {[
                { number: '10K+', label: 'Events Hosted' },
                { number: '500K+', label: 'Tickets Sold' },
                { number: '50K+', label: 'Happy Users' },
                { number: '1K+', label: 'Event Hosts' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/70 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 shadow-lg"
                >
                  <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    <AnimatedCounter value={stat.number} />
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Features pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap justify-center items-center gap-6 mb-10 text-gray-500"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Create events in minutes
            </span>
            <span className="w-px h-4 bg-gray-300"></span>
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Sell tickets online
            </span>
            <span className="w-px h-4 bg-gray-300"></span>
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Track analytics
            </span>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <MotionLink
              to="/events"
              className="group relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl px-8 py-4 text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Search className="h-5 w-5 transition-transform group-hover:scale-110" />
                Browse Events
                <motion.span initial={{ x: 0 }} whileHover={{ x: 4 }} className="ml-2 inline-block">
                  →
                </motion.span>
              </span>
              <motion.div
                className="absolute inset-0 bg-white opacity-0"
                whileHover={{ opacity: 0.1 }}
                transition={{ duration: 0.3 }}
              />
            </MotionLink>

            <MotionLink
              to="/register?host=true"
              className="group relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 overflow-hidden border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-180" />
                Become a Host
              </span>
              <motion.div
                className="absolute inset-0 bg-white opacity-0"
                whileHover={{ opacity: 0.1 }}
                transition={{ duration: 0.3 }}
              />
            </MotionLink>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex flex-col items-center text-blue-500 text-sm font-medium">
            <span className="mb-2">Scroll</span>
            <motion.div className="w-6 h-10 border-2 border-blue-300 rounded-full flex justify-center pt-2">
              <motion.div
                className="w-1.5 h-3 bg-blue-500 rounded-full"
                animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* FEATURED EVENTS SECTION */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContainer className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-semibold text-blue-600 mb-6">
                🔥 Trending Now
              </div>
              <AnimatedHeading level={2} className="text-5xl md:text-6xl font-black mb-6">
                Featured <GradientText gradient="from-blue-600 via-purple-600 to-pink-600">Events</GradientText>
              </AnimatedHeading>
              <AnimatedParagraph className="text-gray-600 text-xl max-w-2xl mx-auto">
                Don't miss out on these amazing experiences
              </AnimatedParagraph>
            </motion.div>
          </AnimatedContainer>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <motion.div
                  className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          ) : featuredEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100"
            >
              <Calendar className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Featured Events Yet</h3>
              <p className="text-gray-600 mb-6 text-lg">Check back soon for amazing events!</p>
              <AnimatedButton variant="primary">
                <Link to="/events" className="flex items-center">
                  Explore All Events <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </AnimatedButton>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredEvents.map((event, index) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <div className="h-full rounded-2xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl transition-shadow duration-300 group">
                      <EventCard event={event} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* WHY CHOOSE SECTION */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-blue-500/20 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`
              }}
              animate={{
                y: [0, -30, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContainer className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-sm font-semibold text-purple-600 mb-6">
              The Evento Advantage
            </div>
            <AnimatedHeading level={2} className="text-5xl md:text-6xl font-black mb-6">
              Why Choose <GradientText gradient="from-purple-600 via-pink-600 to-blue-600">Evento</GradientText>?
            </AnimatedHeading>
            <AnimatedParagraph className="text-gray-600 max-w-3xl mx-auto text-xl">
              We provide a seamless event booking experience with secure payments and instant confirmations.
            </AnimatedParagraph>
          </AnimatedContainer>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Wide Selection',
                description: 'Discover thousands of events across various categories',
                gradient: 'from-blue-400 to-blue-600',
                bgStyle: 'linear-gradient(to right, #60A5FA, #2563EB)'
              },
              {
                icon: Shield,
                title: 'Secure Booking',
                description: 'OTP verification ensures your bookings are safe',
                gradient: 'from-green-400 to-emerald-600',
                bgStyle: 'linear-gradient(to right, #34D399, #059669)'
              },
              {
                icon: CreditCard,
                title: 'Secure Payments',
                description: 'Multiple payment options with secure transactions',
                gradient: 'from-purple-400 to-purple-600',
                bgStyle: 'linear-gradient(to right, #C084FC, #9333EA)'
              },
              {
                icon: Mail,
                title: 'Instant Tickets',
                description: 'Get your e-tickets delivered via email',
                gradient: 'from-pink-400 to-rose-600',
                bgStyle: 'linear-gradient(to right, #FB7185, #E11D48)'
              },
              {
                icon: Users,
                title: 'Easy Management',
                description: 'Track bookings from your dashboard',
                gradient: 'from-orange-400 to-amber-600',
                bgStyle: 'linear-gradient(to right, #FB923C, #D97706)'
              },
              {
                icon: Award,
                title: 'Verified Hosts',
                description: 'All hosts are verified for your safety',
                gradient: 'from-teal-400 to-cyan-600',
                bgStyle: 'linear-gradient(to right, #2DD4BF, #0891B2)'
              },
              {
                icon: TrendingUp,
                title: 'Best Prices',
                description: 'Competitive pricing on all events',
                gradient: 'from-red-400 to-rose-600',
                bgStyle: 'linear-gradient(to right, #F87171, #E11D48)'
              },
              {
                icon: Headphones,
                title: '24/7 Support',
                description: 'Round-the-clock customer support',
                gradient: 'from-yellow-400 to-orange-500',
                bgStyle: 'linear-gradient(to right, #FACC15, #F97316)'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
              >
                <div className="p-8 h-full rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 group">
                  <div className="relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-3xl`} />
                    <AnimatedIcon
                      variant="float"
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-lg"
                      style={{ background: feature.bgStyle }}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </AnimatedIcon>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-50/30 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContainer className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full text-sm font-semibold text-blue-600 mb-6">
              Simple Process
            </div>
            <AnimatedHeading level={2} className="text-5xl md:text-6xl font-black mb-6">
              How It <GradientText gradient="from-cyan-500 via-blue-600 to-indigo-600">Works</GradientText>?
            </AnimatedHeading>
            <AnimatedParagraph className="text-gray-600 max-w-2xl mx-auto text-xl">
              Booking your dream event is just three simple steps away
            </AnimatedParagraph>
          </AnimatedContainer>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-purple-300 to-pink-200" />

            {[
              { step: '01', icon: Search, title: 'Browse Events', description: 'Explore thousands of events across concerts, sports, conferences and more', color: 'blue' },
              { step: '02', icon: Ticket, title: 'Book Tickets', description: 'Select your preferred date and seats, then book instantly with secure payment', color: 'purple' },
              { step: '03', icon: CheckCircle, title: 'Enjoy Event', description: 'Receive your digital ticket via email and enjoy unforgettable moments', color: 'pink' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <div className="p-10 h-full rounded-3xl bg-white border border-gray-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 group">
                  <div className="relative text-center">
                    <motion.div
                      className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-lg flex items-center justify-center text-2xl font-black text-gray-400"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                    >
                      {item.step}
                    </motion.div>

                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${
                        index === 0
                          ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                          : index === 1
                          ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                          : 'bg-gradient-to-br from-pink-400 to-pink-600'
                      }`}
                    >
                      <item.icon className="h-12 w-12 text-white" />
                    </motion.div>

                    <h3 className="text-2xl font-bold mb-4 text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENT CATEGORIES */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContainer className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-sm font-semibold text-indigo-600 mb-6">
              Explore
            </div>
            <AnimatedHeading level={2} className="text-5xl md:text-6xl font-black mb-6">
              Browse by <GradientText gradient="from-pink-500 via-rose-500 to-red-500">Category</GradientText>
            </AnimatedHeading>
            <AnimatedParagraph className="text-gray-600 max-w-2xl mx-auto text-xl">
              Find exactly what you're looking for across diverse event categories
            </AnimatedParagraph>
          </AnimatedContainer>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: Music, label: 'Music', gradient: 'from-rose-400 to-pink-500', shadow: 'hover:shadow-rose-200' },
              { icon: Gamepad2, label: 'Gaming', gradient: 'from-purple-400 to-indigo-500', shadow: 'hover:shadow-purple-200' },
              { icon: Briefcase, label: 'Business', gradient: 'from-blue-400 to-blue-600', shadow: 'hover:shadow-blue-200' },
              { icon: Heart, label: 'Wellness', gradient: 'from-pink-400 to-rose-500', shadow: 'hover:shadow-pink-200' },
              { icon: Coffee, label: 'Food', gradient: 'from-amber-400 to-orange-500', shadow: 'hover:shadow-amber-200' },
              { icon: Calendar, label: 'Sports', gradient: 'from-green-400 to-emerald-500', shadow: 'hover:shadow-green-200' }
            ].map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ y: -10, scale: 1.05 }}
              >
                <Link to={`/events?category=${category.label.toLowerCase()}`}>
                  <div className={`p-6 text-center cursor-pointer rounded-2xl bg-white shadow-md transition-all duration-300 ${category.shadow}`}>
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`w-16 h-16 bg-gradient-to-br ${category.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
                    >
                      <category.icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <span className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {category.label}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-900/20 to-gray-900">
        <div className="absolute inset-0 opacity-20">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-0.5 bg-blue-500"
              style={{
                top: `${Math.random() * 100}%`,
                left: 0,
                right: 0,
                opacity: Math.random() * 0.3 + 0.1
              }}
              animate={{
                scaleX: [0, 1, 0],
                x: [-100, 100]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContainer className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-semibold text-blue-600 mb-6">
              Testimonials
            </div>
            <AnimatedHeading
              level={2}
              className="text-5xl md:text-6xl font-black mb-6 text-white"
            >
              What Our <GradientText gradient="from-yellow-400 via-pink-400 to-purple-400">Users Say</GradientText>
            </AnimatedHeading>
            <AnimatedParagraph className="text-gray-400 max-w-2xl mx-auto text-xl">
              Join thousands of satisfied event goers who trust Evento
            </AnimatedParagraph>
          </AnimatedContainer>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Music Lover',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
                quote: 'Booked tickets for my favorite band in seconds! The OTP verification gave me complete peace of mind.'
              },
              {
                name: 'Michael Chen',
                role: 'Event Organizer',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
                quote: 'Hosting my conference through Evento was seamless. The dashboard makes managing attendees so easy!'
              },
              {
                name: 'Emily Davis',
                role: 'Sports Fan',
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d40?w=200&q=80',
                quote: 'Never missed a game since using Evento. Instant tickets and great customer support!'
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <div className="p-8 h-full rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-xl hover:shadow-2xl transition-shadow duration-300 relative">
                  {/* Quote Icon */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center opacity-80 z-10">
                    <span className="text-white text-2xl">"</span>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-gray-300 mb-8 text-lg leading-relaxed italic">
                    {testimonial.quote}
                  </p>

                  {/* Author */}
                  <div className="flex items-center">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover ring-4 ring-blue-500/20"
                    />
                    <div className="ml-4">
                      <p className="font-bold text-white text-lg">{testimonial.name}</p>
                      <p className="text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />

        <div className="absolute inset-0 pointer-events-none">
          <FloatingElement className="absolute top-20 left-20" duration={6} delay={0}>
            <div className="w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </FloatingElement>
          <FloatingElement className="absolute bottom-20 right-20" duration={8} delay={2}>
            <div className="w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          </FloatingElement>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <AnimatedContainer>
            <div className="inline-block px-6 py-2.5 mb-8 text-lg bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/30">
              🚀 Get Started Today
            </div>

            <AnimatedHeading
              level={2}
              className="text-5xl md:text-7xl font-black mb-8 text-white leading-tight"
            >
              Ready to Host Your{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                Event
              </span>
              ?
            </AnimatedHeading>

            <AnimatedParagraph className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto">
              Join thousands of event organizers who trust Evento for their event management needs.
            </AnimatedParagraph>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <MotionLink
                to="/register"
                className="group relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-2xl hover:shadow-blue-500/50 px-10 py-5 text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Sparkles className="h-6 w-6 group-hover:animate-pulse" />
                  Get Started Free
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-white opacity-0"
                  whileHover={{ opacity: 0.1 }}
                  transition={{ duration: 0.3 }}
                />
              </MotionLink>

              <MotionLink
                to="/events"
                className="group relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 overflow-hidden border-2 border-white text-white hover:bg-white hover:text-blue-600 backdrop-blur-sm px-10 py-5 text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Search className="h-6 w-6" />
                  Explore Events
                </span>
                <motion.div
                  className="absolute inset-0 bg-white opacity-0"
                  whileHover={{ opacity: 0.1 }}
                  transition={{ duration: 0.3 }}
                />
              </MotionLink>
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex flex-wrap justify-center items-center gap-8 text-blue-100"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm">Secure & Safe</span>
              </div>
              <div className="w-px h-6 bg-white/30" />
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Instant Confirmation</span>
              </div>
              <div className="w-px h-6 bg-white/30" />
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">50K+ Happy Users</span>
              </div>
            </motion.div>
          </AnimatedContainer>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
              fillOpacity="0.1"
            />
          </svg>
        </div>
      </section>
    </div>
  );
};

export default Home;
