import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Calendar, Clock, MapPin, Ticket, ArrowLeft, Sparkles } from 'lucide-react';
import { QRCodeTicket, AnimatedButton, AnimatedContainer, GradientText } from '../components/animated';

const BookingConfirmation = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          className="rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <AnimatedContainer className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking not found</h2>
          <AnimatedButton variant="primary">
            <Link to="/dashboard">Go to Dashboard</Link>
          </AnimatedButton>
        </AnimatedContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link
            to="/dashboard"
            className="flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
        </motion.div>

        {/* Success Header */}
        <AnimatedContainer className="mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-center text-white shadow-xl relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative z-10"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h1 className="text-4xl font-bold mb-2">
                <GradientText gradient="from-white to-green-100">Booking Confirmed!</GradientText>
              </h1>
              <p className="text-green-100 text-lg">
                Your booking has been verified and is pending host approval.
              </p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm"
              >
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Your e-ticket is ready!</span>
              </motion.div>
            </motion.div>
          </div>
        </AnimatedContainer>

        {/* QR Code Ticket */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary-600" />
            Your E-Ticket
          </h2>
          <QRCodeTicket 
            booking={booking}
            event={booking.event}
            user={user}
          />
        </motion.div>

        {/* Booking Details */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary-600" />
                  Event Information
                </h3>
                <div className="flex items-start space-x-4">
                  <img
                    src={booking.event?.image}
                    alt={booking.event?.title}
                    className="w-24 h-24 object-cover rounded-lg shadow-md"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {booking.event?.title}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-primary-500" />
                        <span>{formatDate(booking.event?.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-primary-500" />
                        <span>{booking.event?.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-primary-500" />
                        <span>{booking.event?.venue}, {booking.event?.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary-600" />
                  Ticket Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Booking ID</span>
                    <span className="font-mono text-sm font-medium">{booking._id?.slice(-12).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Number of Tickets</span>
                    <span className="font-semibold">{booking.numberOfTickets}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price per Ticket</span>
                    <span className="font-semibold">₹{booking.event?.price?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-primary-600">₹{booking.totalPrice?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendee Details */}
            {booking.attendeeDetails && booking.attendeeDetails.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.attendeeDetails.map((attendee, index) => (
                    <motion.div 
                      key={index} 
                      className="bg-gray-50 rounded-lg p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <p className="font-medium text-gray-900">{attendee.name}</p>
                      <p className="text-sm text-gray-600">{attendee.email}</p>
                      {attendee.phone && (
                        <p className="text-sm text-gray-600">{attendee.phone}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            What's Next?
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="mr-2 font-bold">1.</span>
              <span>Your booking is pending host approval</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">2.</span>
              <span>You'll receive an email confirmation once approved</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">3.</span>
              <span>Present the QR code at the venue for entry</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">4.</span>
              <span>Check your dashboard for booking status updates</span>
            </li>
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <AnimatedButton variant="primary" size="lg" className="flex-1">
            <Link to="/dashboard" className="flex items-center justify-center">
              View My Bookings
            </Link>
          </AnimatedButton>
          <AnimatedButton variant="outline" size="lg" className="flex-1">
            <Link to="/events" className="flex items-center justify-center">
              Browse More Events
            </Link>
          </AnimatedButton>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
