import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, IndianRupee, Users, Ticket, ArrowLeft, Heart, Phone, Mail, User, Star, Share2, Check, ShieldCheck, Timer, RefreshCw, CheckCircle } from 'lucide-react';
import { addToWishlist, removeFromWishlist, checkWishlist } from '../utils/api';
import { verifyBookingOTP, resendBookingOTP } from '../utils/api';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [numberOfTickets, setNumberOfTickets] = useState(1);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [userReview, setUserReview] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [copied, setCopied] = useState(false);
    const [lastBookingId, setLastBookingId] = useState(null);
    const [bookingOtp, setBookingOtp] = useState('');
    const [bookingOtpTimer, setBookingOtpTimer] = useState(10 * 60);
    const [bookingCanResend, setBookingCanResend] = useState(false);
    const [bookingResendCountdown, setBookingResendCountdown] = useState(60);
    const [bookingOtpVerified, setBookingOtpVerified] = useState(false);
    const bookingTimerInterval = useRef(null);
    const bookingResendInterval = useRef(null);

    const openBookingOtpFlow = (bookingId) => {
        setLastBookingId(bookingId);
        setBookingOtp('');
        setBookingOtpTimer(10 * 60);
        setBookingCanResend(false);
        setBookingResendCountdown(60);
        setBookingOtpVerified(false);
        setShowBookingModal(true);
    };

  useEffect(() => {
    fetchEvent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);

      if (user) {
        try {
          const wishlistRes = await checkWishlist(id);
          setInWishlist(wishlistRes.inWishlist);
        } catch (error) {
          console.error('Wishlist check failed:', error);
        }
      }

      try {
        const reviewsRes = await api.get(`/reviews/event/${id}`);
        setReviews(reviewsRes.data.reviews || []);
        setAvgRating(reviewsRes.data.averageRating || 0);
      } catch (error) {
        console.error('Reviews fetch failed:', error);
      }

      if (user) {
        try {
          const myReviewsRes = await api.get('/reviews/my');
          const myReview = myReviewsRes.data.find(r => r.event._id === id);
          setUserReview(myReview);
        } catch (error) {
          console.error('User review check failed:', error);
        }
      }
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

            openBookingOtpFlow(res.data.bookingId);
            if (res.data.emailSent === false) {
                setBookingCanResend(true);
                setBookingResendCountdown(0);
                toast.error(res.data.message || 'Booking created, but OTP email could not be sent. Please try resend.');
            } else {
                toast.success(res.data.message || 'OTP sent to your email!');
            }
        } catch (error) {
            const existingBookingId = error.response?.data?.bookingId;
            if (existingBookingId) {
                openBookingOtpFlow(existingBookingId);
                if (error.response?.data?.emailSent === false) {
                    setBookingCanResend(true);
                    setBookingResendCountdown(0);
                }
                toast.error(error.response?.data?.message || 'You already have a pending booking. Enter the OTP or resend it.');
            } else {
                toast.error(error.response?.data?.message || 'Booking failed');
            }
        } finally {
            setBookingLoading(false);
        }
    };

    const handleShare = async () => {
      const shareUrl = `${window.location.origin}/events/${event._id}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Event link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        toast.success('Event link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    };

    // Booking OTP countdown timer
    useEffect(() => {
      if (showBookingModal && !bookingOtpVerified && bookingOtpTimer > 0) {
        bookingTimerInterval.current = setInterval(() => {
          setBookingOtpTimer(prev => prev - 1);
        }, 1000);
      }
      return () => {
        if (bookingTimerInterval.current) clearInterval(bookingTimerInterval.current);
      };
    }, [showBookingModal, bookingOtpVerified, bookingOtpTimer]);

    // Booking resend countdown
    useEffect(() => {
      if (showBookingModal && !bookingCanResend && bookingResendCountdown > 0) {
        bookingResendInterval.current = setInterval(() => {
          setBookingResendCountdown(prev => prev - 1);
        }, 1000);
      }
      return () => {
        if (bookingResendInterval.current) clearInterval(bookingResendInterval.current);
      };
    }, [showBookingModal, bookingCanResend, bookingResendCountdown]);

    // Enable resend when countdown reaches 0
    useEffect(() => {
      if (bookingResendCountdown === 0) {
        setBookingCanResend(true);
      }
    }, [bookingResendCountdown]);

    const handleVerifyBookingOTP = async (e) => {
      e.preventDefault();
      if (!bookingOtp || bookingOtp.length !== 6) {
        toast.error('Please enter a valid 6-digit OTP');
        return;
      }

      setBookingLoading(true);
      try {
        await verifyBookingOTP(lastBookingId, bookingOtp);
        setBookingOtpVerified(true);
        toast.success('Booking confirmed successfully!');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Verification failed');
      } finally {
        setBookingLoading(false);
      }
    };

    const handleResendBookingOTP = async () => {
      setBookingLoading(true);
      try {
        await resendBookingOTP(lastBookingId);
        setBookingOtpTimer(10 * 60);
        setBookingResendCountdown(60);
        setBookingCanResend(false);
        setBookingOtp('');
        toast.success('OTP resent to your email!');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to resend OTP');
      } finally {
        setBookingLoading(false);
      }
    };

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCloseBookingModal = () => {
      setShowBookingModal(false);
      // Reset states after a delay
      setTimeout(() => {
        setLastBookingId(null);
        setBookingOtp('');
        setBookingOtpTimer(10 * 60);
        setBookingCanResend(false);
        setBookingResendCountdown(60);
        setBookingOtpVerified(false);
      }, 300);
    };

  const handleWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }
    try {
      if (inWishlist) {
        await removeFromWishlist(event._id);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(event._id);
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        eventId: event._id,
        rating,
        comment
      });
      toast.success('Review submitted!');
      setShowReviewForm(false);
      setRating(5);
      setComment('');
      // Refresh reviews
      const reviewsRes = await api.get(`/reviews/event/${id}`);
      setReviews(reviewsRes.data.reviews);
      setAvgRating(reviewsRes.data.averageRating);
      // Update user review flag
      const myReviewsRes = await api.get('/reviews/my');
      const myReview = myReviewsRes.data.find(r => r.event._id === id);
      setUserReview(myReview);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
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

  const detailImage = event.image || 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1400&q=85';
  const availableTickets = Number(event.availableTickets || 0);
  const totalTickets = Math.max(Number(event.totalTickets || 0), availableTickets);
  const bookedTickets = Math.max(0, totalTickets - availableTickets);
  const ticketProgress = totalTickets ? Math.min(100, Math.round((bookedTickets / totalTickets) * 100)) : 0;
  const eventPrice = Number(event.price || 0);

  return (
    <div className="subtle-grid min-h-screen bg-[#fbf8f4] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-extrabold text-cocoa-500 shadow-sm transition-all hover:-translate-x-1 hover:text-primary-600"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Events
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="premium-surface overflow-hidden"
            >
              <div className="group relative h-[360px] overflow-hidden sm:h-[430px]">
                <img
                  src={detailImage}
                  alt={event.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cocoa-900/65 via-cocoa-900/10 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4 text-white">
                  <div>
                    <span className="mb-3 inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-extrabold backdrop-blur">
                      {event.category}
                    </span>
                    <h1 className="max-w-3xl text-3xl font-extrabold sm:text-5xl">{event.title}</h1>
                  </div>
                  <div className="rounded-lg bg-white/15 px-4 py-3 text-sm font-bold backdrop-blur">
                    {ticketProgress}% booked
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-primary-100 text-primary-600 px-4 py-1 rounded-full text-sm font-semibold">
                    {event.category}
                  </span>
                  {availableTickets === 0 && (
                    <span className="bg-red-100 text-red-600 px-4 py-1 rounded-full text-sm font-semibold">
                      Sold Out
                    </span>
                  )}
                  <motion.button
                    onClick={handleWishlist}
                    className={`p-2 rounded-full ${
                      inWishlist 
                        ? 'bg-red-500 text-white' 
                        : 'bg-[#f3eee9] text-cocoa-500 hover:text-red-500 hover:bg-red-50'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className="h-5 w-5" fill={inWishlist ? 'currentColor' : 'none'} />
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center rounded-lg bg-[#fbf8f4] p-4 text-cocoa-600">
                    <Calendar className="h-5 w-5 mr-3 text-primary-600" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center rounded-lg bg-[#fbf8f4] p-4 text-cocoa-600">
                    <Clock className="h-5 w-5 mr-3 text-primary-600" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center rounded-lg bg-[#fbf8f4] p-4 text-cocoa-600">
                    <MapPin className="h-5 w-5 mr-3 text-primary-600" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center rounded-lg bg-[#fbf8f4] p-4 text-cocoa-600">
                    <Users className="h-5 w-5 mr-3 text-primary-600" />
                    <span>{event.location}</span>
                 </div>

                 {/* Host Contact Info */}
                 {event.organizer && (
                   <div className="border-t border-cocoa-100 pt-6">
                     <h2 className="text-xl font-semibold mb-4 flex items-center">
                       Contact Host
                     </h2>
                     <div className="bg-[#fbf8f4] rounded-lg p-4 space-y-2">
                       <div className="flex items-center text-cocoa-500">
                         <User className="h-5 w-5 mr-3 text-primary-600" />
                         <span className="font-medium">{event.organizer.name}</span>
                       </div>
                       {event.organizer.email && (
                         <div className="flex items-center text-cocoa-500">
                           <Mail className="h-5 w-5 mr-3 text-primary-600" />
                           <a href={`mailto:${event.organizer.email}`} className="text-primary-600 hover:underline">
                             {event.organizer.email}
                           </a>
                         </div>
                       )}
                       {event.organizer.phone && (
                         <div className="flex items-center text-cocoa-500">
                           <Phone className="h-5 w-5 mr-3 text-primary-600" />
                           <a href={`tel:${event.organizer.phone}`} className="text-primary-600 hover:underline">
                             {event.organizer.phone}
                           </a>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                 {/* Reviews Section */}
                 <div className="border-t border-cocoa-100 pt-6">
                   <div className="flex items-center justify-between mb-4">
                     <h2 className="text-xl font-semibold flex items-center">
                       Reviews & Ratings
                     </h2>
                     {user && !userReview && (
                       <button onClick={() => setShowReviewForm(!showReviewForm)} className="btn-primary">
                         Write a Review
                       </button>
                     )}
                   </div>

                   {avgRating > 0 && (
                     <div className="flex items-center gap-2 mb-4">
                       <div className="flex items-center">
                         {[1,2,3,4,5].map((star) => (
                           <Star
                             key={star}
                             className={`h-5 w-5 ${star <= Math.round(avgRating) ? 'text-yellow-400 fill-current' : 'text-cocoa-200'}`}
                           />
                         ))}
                       </div>
                       <span className="text-lg font-semibold">{avgRating}</span>
                       <span className="text-cocoa-400">({reviews.length} reviews)</span>
                     </div>
                   )}

                   {/* Review Form */}
                   {showReviewForm && user && !userReview && (
                     <form onSubmit={handleSubmitReview} className="bg-[#fbf8f4] p-4 rounded-lg mb-6">
                       <div className="mb-4">
                         <label className="label">Rating</label>
                         <div className="flex items-center gap-2">
                           {[1,2,3,4,5].map((star) => (
                             <button
                               key={star}
                               type="button"
                               onClick={() => setRating(star)}
                               className="focus:outline-none"
                             >
                               <Star
                                 className={`h-6 w-6 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-cocoa-200'}`}
                               />
                             </button>
                           ))}
                         </div>
                       </div>
                       <div className="mb-4">
                         <label className="label">Comment (optional)</label>
                         <textarea
                           value={comment}
                           onChange={(e) => setComment(e.target.value)}
                           className="input-field"
                           rows="3"
                           placeholder="Share your experience..."
                         />
                       </div>
                       <div className="flex gap-2">
                         <button type="submit" className="btn-primary">
                           Submit Review
                         </button>
                         <button type="button" onClick={() => setShowReviewForm(false)} className="btn-secondary">
                           Cancel
                         </button>
                       </div>
                     </form>
                   )}

                   {/* Reviews List */}
                   {reviews.length > 0 ? (
                     <div className="space-y-4">
                       {reviews.map((review) => (
                         <div key={review._id} className="border border-cocoa-100 rounded-lg p-4 bg-white">
                           <div className="flex items-center justify-between mb-2">
                             <span className="font-semibold">{review.user?.name}</span>
                             <span className="text-sm text-cocoa-400">
                               {new Date(review.createdAt).toLocaleDateString()}
                             </span>
                           </div>
                           <div className="flex items-center gap-1 mb-2">
                             {[1,2,3,4,5].map((star) => (
                               <Star
                                 key={star}
                                 className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-cocoa-200'}`}
                               />
                             ))}
                           </div>
                           {review.comment && <p className="text-cocoa-500">{review.comment}</p>}
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-8 bg-[#fbf8f4] rounded-lg">
                       <Star className="h-12 w-12 text-cocoa-200 mx-auto mb-3" />
                       <p className="text-cocoa-500">No reviews yet. Be the first to review!</p>
                     </div>
                   )}
                 </div>
               </div>

                <div className="border-t border-cocoa-100 pt-6">
                  <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                  <p className="text-cocoa-500 whitespace-pre-line">{event.description}</p>
                </div>

                {event.tags && event.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-[#f3eee9] text-cocoa-700 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="premium-surface sticky top-24 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center text-primary-600">
                  <IndianRupee className="h-8 w-8" />
                  <span className="text-4xl font-bold">{eventPrice.toLocaleString('en-IN')}</span>
                </div>
                <span className="text-cocoa-400">per ticket</span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-cocoa-500">
                  <span>Available Tickets</span>
                  <span className="font-semibold text-green-600">
                    {availableTickets} / {totalTickets}
                  </span>
                </div>

                <div className="rounded-lg bg-[#fbf8f4] p-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-extrabold uppercase text-cocoa-400">
                    <span>{bookedTickets.toLocaleString('en-IN')} booked</span>
                    <span>{ticketProgress}% filled</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: ticketProgress / 100 }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      className="block h-full origin-left rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                    />
                  </div>
                </div>

                {availableTickets > 0 && (
                  <div>
                    <label className="label">Number of Tickets</label>
                    <select
                      value={numberOfTickets}
                      onChange={(e) => setNumberOfTickets(Number(e.target.value))}
                      className="input-field"
                    >
                      {[...Array(Math.min(10, availableTickets))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i === 0 ? 'ticket' : 'tickets'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {availableTickets > 0 && (
                  <div className="border-t border-cocoa-100 pt-4">
                    <div className="flex justify-between text-cocoa-500 mb-2">
                      <span>Subtotal</span>
                      <span>₹{(eventPrice * numberOfTickets).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-cocoa-500 mb-2">
                      <span>Service Fee</span>
                      <span>₹0</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-cocoa-900 pt-2 border-t border-cocoa-100">
                      <span>Total</span>
                      <span>₹{(eventPrice * numberOfTickets).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>

              {availableTickets > 0 ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="flex-1 btn-primary flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Ticket className="h-5 w-5 mr-2" />
                    {bookingLoading ? 'Sending OTP...' : 'Book Now'}
                  </button>
                  <motion.button
                    onClick={handleShare}
                    className="flex-1 btn-secondary flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="h-5 w-5 mr-2" />
                        Share Event
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full rounded-lg bg-cocoa-200 px-6 py-3 font-semibold text-cocoa-400 cursor-not-allowed"
                >
                  Sold Out
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

        {/* Booking OTP Verification Modal */}
        {showBookingModal && lastBookingId && (
          <div className="fixed inset-0 bg-cocoa-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="premium-surface w-full max-w-md p-8"
            >
              {!bookingOtpVerified ? (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                      <ShieldCheck className="h-8 w-8 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-cocoa-900">Verify Your Booking</h2>
                    <p className="mt-2 text-cocoa-500">
                      We sent a 6-digit code to your email<br />
                      <strong>{user?.email}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyBookingOTP} className="space-y-5">
                    {/* OTP Input */}
                    <div>
                      <label className="label text-center block">Enter Verification Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={bookingOtp}
                        onChange={(e) => setBookingOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        className="input-field text-center text-2xl"
                        placeholder="000000"
                        autoFocus
                      />
                    </div>

                    {/* Timer */}
                    <div className="flex items-center justify-center space-x-2 text-cocoa-500">
                      <Timer className="h-4 w-4" />
                      <span className="text-sm">
                        Expires in <strong className={bookingOtpTimer < 60 ? 'text-red-600' : ''}>{formatTime(bookingOtpTimer)}</strong>
                      </span>
                    </div>

                    {/* Verify Button */}
                    <button
                      type="submit"
                      disabled={bookingLoading || bookingOtpTimer === 0}
                      className="w-full btn-primary"
                    >
                      {bookingLoading ? 'Verifying...' : 'Verify & Confirm Booking'}
                    </button>
                  </form>

                  {/* Resend */}
                  <div className="mt-6 text-center">
                    {bookingCanResend ? (
                      <button
                        onClick={handleResendBookingOTP}
                        disabled={bookingLoading}
                        className="text-primary-600 hover:text-primary-700 font-semibold flex items-center justify-center mx-auto space-x-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Resend OTP</span>
                      </button>
                    ) : (
                      <p className="text-sm text-cocoa-500">
                        Resend OTP in <strong>{bookingResendCountdown}s</strong>
                      </p>
                    )}
                  </div>

                  {/* Cancel */}
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleCloseBookingModal}
                      className="text-cocoa-400 hover:text-cocoa-700 text-sm"
                    >
                      Close
                    </button>
                  </div>

                  {/* Booking Summary */}
                  <div className="mt-6 pt-6 border-t border-cocoa-100">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-cocoa-500">Event</span>
                        <span className="font-semibold truncate ml-4">{event.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cocoa-500">Tickets</span>
                        <span className="font-semibold">{numberOfTickets}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cocoa-500">Total</span>
                        <span className="font-semibold text-primary-600">₹{(eventPrice * numberOfTickets).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Success State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-cocoa-900 mb-2">Booking Confirmed!</h2>
                  <p className="text-cocoa-500 mb-6">
                    Your booking is confirmed. A confirmation email has been sent.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate(`/booking/${lastBookingId}/confirmation`)}
                      className="w-full btn-primary"
                    >
                      View E-Ticket
                    </button>
                    <button
                      onClick={handleCloseBookingModal}
                      className="w-full btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    );
  };

export default EventDetail;
