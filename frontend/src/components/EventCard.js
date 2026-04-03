import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, IndianRupee, Ticket, Sparkles } from 'lucide-react';

const EventCard = ({ event, index = 0 }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isSoldOut = event.availableTickets === 0;
  const isLowStock = event.availableTickets > 0 && event.availableTickets <= 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <Link to={`/events/${event._id}`} className="block group">
        <motion.div
          className="bg-white rounded-xl shadow-lg overflow-hidden h-full"
          whileHover={{ 
            y: -10, 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            transition: { duration: 0.3 }
          }}
        >
          {/* Image Container */}
          <div className="relative overflow-hidden">
            <motion.img
              src={event.image}
              alt={event.title}
              className="w-full h-48 object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.5 }}
            />
            
            {/* Category Badge */}
            <motion.div 
              className="absolute top-4 right-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg"
              whileHover={{ scale: 1.1 }}
            >
              {event.category}
            </motion.div>

            {/* Sold Out Overlay */}
            {isSoldOut && (
              <motion.div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="text-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Ticket className="h-12 w-12 text-white mx-auto mb-2" />
                  <span className="text-white text-xl font-bold">Sold Out</span>
                </motion.div>
              </motion.div>
            )}

            {/* Low Stock Badge */}
            {isLowStock && !isSoldOut && (
              <motion.div 
                className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1"
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: ['0 4px 6px rgba(0, 0, 0, 0.1)', '0 10px 15px rgba(0, 0, 0, 0.2)', '0 4px 6px rgba(0, 0, 0, 0.1)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-3 w-3" />
                Only {event.availableTickets} left!
              </motion.div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-5">
            <motion.h3 
              className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              {event.title}
            </motion.h3>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {event.description}
            </p>
            
            {/* Event Details */}
            <div className="space-y-2 mb-4">
              <motion.div 
                className="flex items-center text-gray-500 text-sm"
                whileHover={{ x: 5, color: '#0284c7' }}
                transition={{ duration: 0.2 }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span>{formatDate(event.date)}</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center text-gray-500 text-sm"
                whileHover={{ x: 5, color: '#0284c7' }}
                transition={{ duration: 0.2 }}
              >
                <Clock className="h-4 w-4 mr-2" />
                <span>{event.time}</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center text-gray-500 text-sm"
                whileHover={{ x: 5, color: '#0284c7' }}
                transition={{ duration: 0.2 }}
              >
                <MapPin className="h-4 w-4 mr-2" />
                <span>{event.venue}, {event.location}</span>
              </motion.div>
            </div>
            
            {/* Price and Tickets */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <motion.div 
                className="flex items-center text-primary-600 font-bold"
                whileHover={{ scale: 1.05 }}
              >
                <IndianRupee className="h-5 w-5" />
                <span className="text-xl">{event.price.toLocaleString('en-IN')}</span>
              </motion.div>
              
              <div className="text-sm">
                {event.availableTickets > 0 ? (
                  <motion.span 
                    className="text-green-600 font-medium flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Ticket className="h-4 w-4" />
                    {event.availableTickets} tickets left
                  </motion.span>
                ) : (
                  <span className="text-red-600 font-medium">Sold Out</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default EventCard;
