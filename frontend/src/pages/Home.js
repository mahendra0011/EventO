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
                Discover Amazing Events & Host Your Own
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
              className="text-xl md:text-2xl mb-4 text-primary-100 max-w-3xl mx-auto"
            >
              Book tickets for concerts, conferences, sports, and more. 
              Or host your own events and manage attendees with ease.
            </motion.p>

            <motion.p 
              variants={itemVariants}
              className="text-lg mb-8 text-primary-200 max-w-2xl mx-auto"
            >
              <span className="bg-white/20 px-3 py-1 rounded-full">✨ Create your event</span> <span className="mx-2">•</span> 
              <span className="bg-white/20 px-3 py-1 rounded-full">🎫 Sell tickets</span> <span className="mx-2">•</span> 
              <span className="bg-white/20 px-3 py-1 rounded-full">📊 Track analytics</span>
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
                <Link to="/register?host=true" className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Become a Host
                </Link>
              </AnimatedButton>

              <AnimatedButton 
                variant="ghost" 
                size="lg"
                className="border-white/50 text-white hover:bg-white/10"
              >
                <Link to="/login?host=true" className="flex items-center">
                  Host Login
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </AnimatedButton>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={itemVariants}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
            >
              {[
                { number: '10K+', label: 'Events' },
                { number: '500K+', label: 'Tickets Sold' },
                { number: '50K+', label: 'Happy Users' },
                { number: '1K+', label: 'Event Hosts' },
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
