import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircle, Calendar, Clock, MapPin, Ticket, ArrowLeft, Sparkles, XCircle, RefreshCw } from 'lucide-react';
import { QRCodeTicket, AnimatedButton, AnimatedContainer, GradientText } from '../components/animated';

const BookingConfirmation = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

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

  const canCancelBooking = ['pending', 'confirmed'].includes(booking?.status);
  const willStartRefund = booking?.status === 'confirmed' && booking?.paymentStatus === 'completed' && Number(booking?.totalPrice || 0) > 0;
  const refundStarted = booking?.refundStatus && booking.refundStatus !== 'none';
  const ticketCategoryName = booking?.ticketCategoryName || 'General';
  const ticketPrice = Number(booking?.ticketPrice || booking?.event?.price || 0);

  const handleCancelBooking = async () => {
    const refundCopy = willStartRefund
      ? ' This will also start the refund process automatically.'
      : '';

    if (!window.confirm(`Are you sure you want to cancel this booking?${refundCopy}`)) {
      return;
    }

    setCancelling(true);
    try {
      const res = await api.put(`/bookings/${booking._id}/cancel`, {
        reason: 'Cancelled by attendee from booking confirmation'
      });
      setBooking(res.data?.booking || booking);
      toast.success(res.data?.refundStatus === 'requested'
        ? 'Booking cancelled. Refund process started.'
        : 'Booking cancelled successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f4]">
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
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f4]">
        <AnimatedContainer className="text-center">
          <h2 className="text-2xl font-bold text-cocoa-900 mb-4">Booking not found</h2>
          <AnimatedButton variant="primary">
            <Link to="/dashboard">Go to Dashboard</Link>
          </AnimatedButton>
        </AnimatedContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf8f4] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link
            to="/dashboard"
            className="flex items-center text-cocoa-500 hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
        </motion.div>

        {/* Success Header */}
        <AnimatedContainer className="mb-8">
          <div className={`bg-gradient-to-r ${booking.status === 'cancelled' ? 'from-red-500 to-rose-600' : 'from-green-500 to-emerald-600'} rounded-lg p-8 text-center text-white shadow-xl relative overflow-hidden`}>
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
                {booking.status === 'cancelled' ? <XCircle className="h-12 w-12" /> : <CheckCircle className="h-12 w-12" />}
              </div>
               <h1 className="text-4xl font-bold mb-2">
                 <GradientText gradient="from-white to-green-100">{booking.status === 'cancelled' ? 'Booking Cancelled' : 'Booking Confirmed!'}</GradientText>
               </h1>
               <p className="text-white/85 text-lg">
                 {booking.status === 'cancelled'
                   ? (refundStarted ? 'Your refund request has started automatically.' : 'Your booking has been cancelled.')
                   : 'Your booking is confirmed. A confirmation has been sent to your email.'}
                </p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm"
              >
                {booking.status === 'cancelled' ? <RefreshCw className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                <span className="font-semibold">{booking.status === 'cancelled' ? 'Refund status is now visible in payments' : 'Your e-ticket is ready!'}</span>
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
          <h2 className="text-2xl font-bold text-cocoa-900 mb-4 flex items-center gap-2">
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
          className="bg-white rounded-lg shadow-lg overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-cocoa-100">
            <h2 className="text-xl font-semibold text-cocoa-900">Booking Details</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Info */}
              <div>
                <h3 className="text-lg font-semibold text-cocoa-900 mb-4 flex items-center gap-2">
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
                    <h4 className="font-semibold text-cocoa-900 mb-2">
                      {booking.event?.title}
                    </h4>
                    <div className="space-y-1 text-sm text-cocoa-500">
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
                <h3 className="text-lg font-semibold text-cocoa-900 mb-4 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary-600" />
                  Ticket Details
                </h3>
                <div className="bg-[#fbf8f4] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-cocoa-500">Booking ID</span>
                    <span className="font-mono text-sm font-medium">{booking._id?.slice(-12).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-cocoa-500">Number of Tickets</span>
                    <span className="font-semibold">{booking.numberOfTickets}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-cocoa-500">Ticket Category</span>
                    <span className="font-semibold">{ticketCategoryName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-cocoa-500">Price per Ticket</span>
                    <span className="font-semibold">Rs. {ticketPrice.toLocaleString('en-IN')}</span>
                  </div>
                  {refundStarted && (
                    <div className="border-t border-cocoa-100 pt-3 mt-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-cocoa-500">Refund Status</span>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-bold capitalize text-amber-800">
                          <RefreshCw className="mr-1 h-4 w-4" />
                          {booking.refundStatus}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-cocoa-100 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-cocoa-900">Total Amount</span>
                      <span className="text-2xl font-bold text-primary-600">₹{booking.totalPrice?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendee Details */}
            {booking.attendeeDetails && booking.attendeeDetails.length > 0 && (
              <div className="mt-6 pt-6 border-t border-cocoa-100">
                <h3 className="text-lg font-semibold text-cocoa-900 mb-4">Attendee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.attendeeDetails.map((attendee, index) => (
                    <motion.div 
                      key={index} 
                      className="bg-[#fbf8f4] rounded-lg p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <p className="font-medium text-cocoa-900">{attendee.name}</p>
                      <p className="text-sm text-cocoa-500">{attendee.email}</p>
                      {attendee.phone && (
                        <p className="text-sm text-cocoa-500">{attendee.phone}</p>
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
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            What's Next?
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="mr-2 font-bold">1.</span>
              <span>{booking.status === 'cancelled' ? 'Your booking has been cancelled.' : 'Your booking is confirmed!'}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">2.</span>
              <span>{booking.status === 'cancelled' ? 'Any paid refund has been moved into the refund queue.' : 'A confirmation has been sent to your email'}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">3.</span>
              <span>{booking.status === 'cancelled' ? 'Track refund progress from your dashboard payments tab.' : 'Present the QR code at the venue for entry'}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">4.</span>
              <span>Check your dashboard for booking details</span>
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
          {canCancelBooking && (
            <AnimatedButton
              type="button"
              variant="danger"
              size="lg"
              className="flex-1"
              onClick={handleCancelBooking}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : (willStartRefund ? 'Cancel & Start Refund' : 'Cancel Booking')}
            </AnimatedButton>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
