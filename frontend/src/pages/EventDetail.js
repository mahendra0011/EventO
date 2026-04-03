import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, IndianRupee, Users, Ticket, ArrowLeft } from 'lucide-react';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [bookingId, setBookingId] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Event not found');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book tickets');
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await api.post('/bookings', {
        eventId: event._id,
        numberOfTickets,
        attendeeDetails: [{
          name: user.name,
          email: user.email,
          phone: user.phone || ''
        }]
      });

      setBookingId(res.data.bookingId);
      setShowBookingModal(false);
      setShowOtpModal(true);
      toast.success('OTP sent to your email!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setBookingLoading(true);
    try {
      await api.post('/bookings/verify-otp', {
        bookingId,
        otp
      });

      toast.success('Booking verified! Pending admin approval.');
      setShowOtpModal(false);
      navigate(`/booking/${bookingId}/confirmation`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post('/bookings/resend-otp', { bookingId });
      toast.success('OTP resent to your email!');
    } catch (error) {
      toast.error('Failed to resend OTP');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Events
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-96 object-cover"
              />
              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-primary-100 text-primary-600 px-4 py-1 rounded-full text-sm font-semibold">
                    {event.category}
                  </span>
                  {event.availableTickets === 0 && (
                    <span className="bg-red-100 text-red-600 px-4 py-1 rounded-full text-sm font-semibold">
                      Sold Out
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-3 text-primary-600" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-3 text-primary-600" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3 text-primary-600" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-3 text-primary-600" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                  <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
                </div>

                {event.tags && event.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center text-primary-600">
                  <IndianRupee className="h-8 w-8" />
                  <span className="text-4xl font-bold">{event.price.toLocaleString('en-IN')}</span>
                </div>
                <span className="text-gray-500">per ticket</span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Available Tickets</span>
                  <span className="font-semibold text-green-600">
                    {event.availableTickets} / {event.totalTickets}
                  </span>
                </div>

                {event.availableTickets > 0 && (
                  <div>
                    <label className="label">Number of Tickets</label>
                    <select
                      value={numberOfTickets}
                      onChange={(e) => setNumberOfTickets(Number(e.target.value))}
                      className="input-field"
                    >
                      {[...Array(Math.min(10, event.availableTickets))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i === 0 ? 'ticket' : 'tickets'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {event.availableTickets > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-gray-600 mb-2">
                      <span>Subtotal</span>
                      <span>₹{(event.price * numberOfTickets).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 mb-2">
                      <span>Service Fee</span>
                      <span>₹0</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>₹{(event.price * numberOfTickets).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>

              {event.availableTickets > 0 ? (
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <Ticket className="h-5 w-5 mr-2" />
                  Book Now
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                >
                  Sold Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Confirm Booking</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Event</span>
                <span className="font-semibold">{event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tickets</span>
                <span className="font-semibold">{numberOfTickets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-semibold text-primary-600">₹{(event.price * numberOfTickets).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              An OTP will be sent to your email for verification.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className="flex-1 btn-primary"
              >
                {bookingLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Verify OTP</h2>
            <p className="text-gray-600 mb-6">
              Enter the 6-digit OTP sent to your email address.
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              maxLength={6}
              className="input-field text-center text-2xl tracking-widest mb-6"
            />
            <div className="flex gap-4">
              <button
                onClick={handleResendOtp}
                className="flex-1 btn-secondary"
              >
                Resend OTP
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={bookingLoading || otp.length !== 6}
                className="flex-1 btn-primary"
              >
                {bookingLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
