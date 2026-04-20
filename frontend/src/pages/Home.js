import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import EventCard from '../components/EventCard';
import { Search, Calendar, Users, Shield, ArrowRight, Sparkles, Star, Zap, Ticket, CheckCircle, Clock, MapPin, Music, Gamepad2, Briefcase, Heart, Coffee, CreditCard, Mail, Award, TrendingUp } from 'lucide-react';
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
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <FloatingElement className="absolute top-20 left-10 opacity-20" duration={4}>
            <Calendar className="h-32 w-32" />
          </FloatingElement>
          <FloatingElement className="absolute top-40 right-20 opacity-20" duration={5} delay={1}>
            <Star className="h-24 w-24" />
          </FloatingElement>
          <FloatingElement className="absolute bottom-20 left-1/4 opacity-20" duration={6} delay={2}>
            <Sparkles className="h-28 w-28" />
          </FloatingElement>
          <FloatingElement className="absolute bottom-40 right-1/3 opacity-20" duration={4.5} delay={0.5}>
            <Zap className="h-20 w-20" />
          </FloatingElement>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 z-10">
          <motion.div 
            className="text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <ShimmerEffect className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4 inline mr-2" />
                Discover Amazing Events
              </ShimmerEffect>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              <GradientText gradient="from-white via-primary-200 to-white">
                Unforgettable
              </GradientText>
              <br />
              <span className="text-white">Events Await</span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto"
            >
              Book tickets for concerts, conferences, sports, and more. 
              Experience moments that matter with Evento.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <AnimatedButton 
                variant="secondary" 
                size="lg"
                className="shadow-2xl"
              >
                <Link to="/events" className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Browse Events
                </Link>
              </AnimatedButton>
              
              <AnimatedButton 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-primary-600"
              >
                <Link to="/register" className="flex items-center">
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </AnimatedButton>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={itemVariants}
              className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              {[
                { number: '10K+', label: 'Events' },
                { number: '500K+', label: 'Tickets Sold' },
                { number: '50K+', label: 'Happy Users' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-primary-200 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <motion.div 
              className="w-1.5 h-3 bg-white rounded-full mt-2"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContainer className="text-center mb-16">
            <AnimatedHeading level={2} className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose <GradientText>Evento</GradientText>?
            </AnimatedHeading>
            <AnimatedParagraph className="text-gray-600 max-w-2xl mx-auto text-lg">
              We provide a seamless event booking experience with secure payments and instant confirmations.
            </AnimatedParagraph>
          </AnimatedContainer>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {[
              {
                icon: Calendar,
                title: 'Wide Selection',
                description: 'Discover thousands of events across various categories',
                color: 'primary',
                delay: 0,
              },
              {
                icon: Shield,
                title: 'Secure Booking',
                description: 'OTP verification ensures your bookings are safe',
                color: 'secondary',
                delay: 0.1,
              },
              {
                icon: CreditCard,
                title: 'Secure Payments',
                description: 'Multiple payment options with secure transactions',
                color: 'blue',
                delay: 0.2,
              },
              {
                icon: Mail,
                title: 'Instant Tickets',
                description: 'Get your e-tickets delivered via email',
                color: 'green',
                delay: 0.3,
              },
              {
                icon: Users,
                title: 'Easy Management',
                description: 'Track bookings from your dashboard',
                color: 'purple',
                delay: 0.4,
              },
              {
                icon: Award,
                title: 'Verified Hosts',
                description: 'All hosts are verified for your safety',
                color: 'amber',
                delay: 0.5,
              },
              {
                icon: TrendingUp,
                title: 'Best Prices',
                description: 'Competitive pricing on all events',
                color: 'rose',
                delay: 0.6,
              },
              {
                icon: Sparkles,
                title: '24/7 Support',
                description: 'Round-the-clock customer support',
                color: 'cyan',
                delay: 0.7,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
              >
                <AnimatedCard className="p-6 text-center h-full hover:shadow-xl transition-shadow" delay={feature.delay}>
                  <AnimatedIcon 
                    variant="bounce" 
                    className={`w-14 h-14 bg-${feature.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <feature.icon className={`h-7 w-7 text-${feature.color}-600`} />
                  </AnimatedIcon>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </AnimatedCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Animated Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '10K+', label: 'Events', suffix: '' },
              { number: '500K+', label: 'Tickets Sold', suffix: '' },
              { number: '50K+', label: 'Happy Users', suffix: '' },
              { number: '1000+', label: 'Verified Hosts', suffix: '' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-primary-200">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContainer className="text-center mb-16">
            <AnimatedHeading level={2} className="text-4xl font-bold text-gray-900 mb-4">
              How It <GradientText>Works</GradientText>?
            </AnimatedHeading>
            <AnimatedParagraph className="text-gray-600 max-w-2xl mx-auto text-lg">
              Booking your dream event is just three simple steps away
            </AnimatedParagraph>
          </AnimatedContainer>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Browse Events',
                description: 'Explore thousands of events across concerts, sports, conferences and more',
                color: 'primary',
              },
              {
                step: '02',
                icon: Ticket,
                title: 'Book Tickets',
                description: 'Select your preferred date and seats, then book instantly with secure payment',
                color: 'secondary',
              },
              {
                step: '03',
                icon: CheckCircle,
                title: 'Enjoy Event',
                description: 'Receive your digital ticket via email and enjoy unforgettable moments',
                color: 'primary',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
              >
                <AnimatedCard className="p-8 text-center h-full relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 text-8xl font-bold text-gray-100 opacity-50">
                    {item.step}
                  </div>
                  <div className={`w-20 h-20 bg-${item.color}-100 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10`}>
                    <item.icon className={`h-10 w-10 text-${item.color}-600`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 relative z-10">{item.title}</h3>
                  <p className="text-gray-600 relative z-10">{item.description}</p>
                </AnimatedCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContainer className="text-center mb-16">
            <AnimatedHeading level={2} className="text-4xl font-bold text-gray-900 mb-4">
              Browse by <GradientText>Category</GradientText>
            </AnimatedHeading>
            <AnimatedParagraph className="text-gray-600 max-w-2xl mx-auto text-lg">
              Find exactly what you're looking for across diverse event categories
            </AnimatedParagraph>
          </AnimatedContainer>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: Music, label: 'Music', color: 'rose' },
              { icon: Gamepad2, label: 'Gaming', color: 'purple' },
              { icon: Briefcase, label: 'Business', color: 'blue' },
              { icon: Heart, label: 'Wellness', color: 'pink' },
              { icon: Coffee, label: 'Food', color: 'amber' },
              { icon: Calendar, label: 'Sports', color: 'green' },
            ].map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Link to={`/events?category=${category.label.toLowerCase()}`}>
                  <AnimatedCard className="p-6 text-center hover:shadow-xl transition-shadow cursor-pointer">
                    <div className={`w-14 h-14 bg-${category.color}-100 rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <category.icon className={`h-7 w-7 text-${category.color}-600`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{category.label}</span>
                  </AnimatedCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContainer className="text-center mb-16">
            <AnimatedHeading level={2} className="text-4xl font-bold mb-4">
              What Our <GradientText gradient="from-primary-400 to-secondary-400">Users Say</GradientText>
            </AnimatedHeading>
            <AnimatedParagraph className="text-gray-400 max-w-2xl mx-auto text-lg">
              Join thousands of satisfied event goers who trust Evento
            </AnimatedParagraph>
          </AnimatedContainer>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Music Lover',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
                quote: 'Booked tickets for my favorite band in seconds! The OTP verification gave me complete peace of mind.',
              },
              {
                name: 'Michael Chen',
                role: 'Event Organizer',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
                quote: 'Hosting my conference through Evento was seamless. The dashboard makes managing attendees so easy!',
              },
              {
                name: 'Emily Davis',
                role: 'Sports Fan',
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d40?w=150&h=150&fit=crop',
                quote: 'Never missed a game since using Evento. Instant tickets and great customer support!',
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <AnimatedCard className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 h-full">
                  <div className="flex items-center mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-gray-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContainer className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <AnimatedHeading level={2} className="text-4xl font-bold text-gray-900 mb-2">
                Featured <GradientText>Events</GradientText>
              </AnimatedHeading>
              <AnimatedParagraph className="text-gray-600 text-lg">
                Don't miss out on these amazing events
              </AnimatedParagraph>
            </div>
            <AnimatedButton variant="primary" className="hidden md:inline-flex">
              <Link to="/events" className="flex items-center">
                View All Events
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </AnimatedButton>
          </AnimatedContainer>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <motion.div
                className="rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ) : featuredEvents.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Featured Events Yet</h3>
              <p className="text-gray-600 mb-6">Check back soon for amazing events!</p>
              <AnimatedButton variant="primary">
                <Link to="/events" className="flex items-center">
                  Browse All Events
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </AnimatedButton>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {featuredEvents.map((event, index) => (
                <motion.div key={event._id} variants={itemVariants}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="text-center mt-8 md:hidden">
            <AnimatedButton variant="primary">
              <Link to="/events" className="flex items-center">
                View All Events
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </AnimatedButton>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <FloatingElement className="absolute top-10 left-10 opacity-10" duration={5}>
            <Star className="h-40 w-40" />
          </FloatingElement>
          <FloatingElement className="absolute bottom-10 right-10 opacity-10" duration={6} delay={1}>
            <Sparkles className="h-32 w-32" />
          </FloatingElement>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <AnimatedContainer>
            <AnimatedHeading level={2} className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Host Your <GradientText gradient="from-primary-400 to-secondary-400">Event</GradientText>?
            </AnimatedHeading>
            <AnimatedParagraph className="text-gray-400 mb-8 max-w-2xl mx-auto text-lg">
              Join thousands of event organizers who trust Evento for their event management needs.
            </AnimatedParagraph>
            <AnimatedButton variant="primary" size="lg" className="shadow-2xl">
              <Link to="/register" className="flex items-center">
                Get Started Today
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </AnimatedButton>
          </AnimatedContainer>
        </div>
      </section>
    </div>
  );
};

export default Home;
