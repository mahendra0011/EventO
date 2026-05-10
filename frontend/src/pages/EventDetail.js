import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Heart,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Share2,
  ShieldCheck,
  Star,
  Ticket,
  Timer,
  User,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, {
  addToWishlist,
  checkWishlist,
  removeFromWishlist,
  reportEvent,
  resendBookingOTP,
  verifyBookingOTP
} from '../utils/api';

const reportReasons = [
  { value: 'fake_event', label: 'Fake event' },
  { value: 'suspicious_activity', label: 'Suspicious activity' },
  { value: 'misleading', label: 'Misleading details' },
  { value: 'payment_fraud', label: 'Payment fraud' },
  { value: 'unsafe', label: 'Unsafe event' },
  { value: 'other', label: 'Other' }
];

const getHostBadge = (organizer) => organizer?.hostTrust?.badge || 'new';

const HostBadge = ({ organizer }) => {
  const badge = getHostBadge(organizer);
  const Icon = badge === 'verified' ? ShieldCheck : badge === 'suspended' ? Ban : AlertTriangle;
  const classes = badge === 'verified'
    ? 'border-green-200 bg-green-50 text-green-700'
    : badge === 'suspended'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${classes}`}>
      <Icon className="h-4 w-4" />
      {badge === 'verified' ? 'Verified Host' : badge === 'suspended' ? 'Suspended Host' : 'New Host'}
    </span>
  );
};

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [lastBookingId, setLastBookingId] = useState(null);
  const [bookingOtp, setBookingOtp] = useState('');
  const [bookingOtpTimer, setBookingOtpTimer] = useState(10 * 60);
  const [bookingCanResend, setBookingCanResend] = useState(false);
  const [bookingResendCountdown, setBookingResendCountdown] = useState(60);
  const [bookingOtpVerified, setBookingOtpVerified] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('fake_event');
  const [reportMessage, setReportMessage] = useState('');
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

  const fetchEvent = async () => {
    try {
      const [eventRes, reviewsRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/reviews/event/${id}`)
      ]);
      setEvent(eventRes.data);
      setReviews(reviewsRes.data.reviews || []);
      setAvgRating(Number(reviewsRes.data.averageRating || 0));

      if (user) {
        const [wishlistRes, myReviewsRes] = await Promise.all([
          checkWishlist(id),
          api.get('/reviews/my')
        ]);
        setInWishlist(Boolean(wishlistRes.inWishlist));
        setUserReview((myReviewsRes.data || []).find((review) => review.event?._id === id));
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Event not found');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useEffect(() => {
    if (showBookingModal && !bookingOtpVerified && bookingOtpTimer > 0) {
      bookingTimerInterval.current = setInterval(() => {
        setBookingOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (bookingTimerInterval.current) clearInterval(bookingTimerInterval.current);
    };
  }, [showBookingModal, bookingOtpVerified, bookingOtpTimer]);

  useEffect(() => {
    if (showBookingModal && !bookingCanResend && bookingResendCountdown > 0) {
      bookingResendInterval.current = setInterval(() => {
        setBookingResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (bookingResendInterval.current) clearInterval(bookingResendInterval.current);
    };
  }, [showBookingModal, bookingCanResend, bookingResendCountdown]);

  useEffect(() => {
    if (bookingResendCountdown === 0) setBookingCanResend(true);
  }, [bookingResendCountdown]);

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
        toast.error(res.data.message || 'Booking created, but OTP email could not be sent.');
      } else {
        toast.success(res.data.message || 'OTP sent to your email');
      }
    } catch (error) {
      const existingBookingId = error.response?.data?.bookingId;
      if (existingBookingId) {
        openBookingOtpFlow(existingBookingId);
        toast.error(error.response?.data?.message || 'Enter the OTP for your pending booking.');
      } else {
        toast.error(error.response?.data?.message || 'Booking failed');
      }
    } finally {
      setBookingLoading(false);
    }
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
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/events/${event._id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Event link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Could not copy link');
    }
  };

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
      toast.success('Booking confirmed successfully');
      fetchEvent();
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
      toast.success('OTP resent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setTimeout(() => {
      setLastBookingId(null);
      setBookingOtp('');
      setBookingOtpTimer(10 * 60);
      setBookingCanResend(false);
      setBookingResendCountdown(60);
      setBookingOtpVerified(false);
    }, 300);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', { eventId: event._id, rating, comment });
      toast.success('Review submitted');
      setShowReviewForm(false);
      setRating(5);
      setComment('');
      fetchEvent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to report an event');
      navigate('/login');
      return;
    }

    try {
      const res = await reportEvent(event._id, reportReason, reportMessage);
      toast.success(res.message || 'Report submitted');
      setShowReportModal(false);
      setReportReason('fake_event');
      setReportMessage('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to report event');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!event) return null;

  const isSoldOut = event.availableTickets === 0;
  const subtotal = event.price * numberOfTickets;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-gray-600 hover:text-primary-600">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Events
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-xl bg-white shadow-lg">
              <img src={event.image} alt={event.title} className="h-96 w-full object-cover" />
              <div className="space-y-8 p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-primary-100 px-4 py-1 text-sm font-semibold text-primary-600">{event.category}</span>
                  {isSoldOut && <span className="rounded-full bg-red-100 px-4 py-1 text-sm font-semibold text-red-600">Sold Out</span>}
                  {event.organizer && <HostBadge organizer={event.organizer} />}
                  <motion.button
                    onClick={handleWishlist}
                    className={`rounded-full p-2 ${inWishlist ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'}`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className="h-5 w-5" fill={inWishlist ? 'currentColor' : 'none'} />
                  </motion.button>
                  <button onClick={() => setShowReportModal(true)} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 hover:bg-amber-100">
                    <AlertTriangle className="h-4 w-4" />
                    Report
                  </button>
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                  <div className="mt-5 grid grid-cols-1 gap-4 text-gray-600 sm:grid-cols-2">
                    <div className="flex items-center"><Calendar className="mr-3 h-5 w-5 text-primary-600" />{formatDate(event.date)}</div>
                    <div className="flex items-center"><Clock className="mr-3 h-5 w-5 text-primary-600" />{event.time}</div>
                    <div className="flex items-center"><MapPin className="mr-3 h-5 w-5 text-primary-600" />{event.venue}</div>
                    <div className="flex items-center"><Users className="mr-3 h-5 w-5 text-primary-600" />{event.location}</div>
                  </div>
                </div>

                {event.organizer && (
                  <section className="border-t border-gray-200 pt-6">
                    <h2 className="mb-4 text-xl font-semibold">Contact Host</h2>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <User className="h-5 w-5 text-primary-600" />
                        <span className="font-medium">{event.organizer.name}</span>
                        <HostBadge organizer={event.organizer} />
                        {event.organizer?.hostTrust?.ratingCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <Star className="h-4 w-4 fill-current text-yellow-400" />
                            {event.organizer.hostTrust.ratingAverage} ({event.organizer.hostTrust.ratingCount})
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-gray-600">
                        {event.organizer.email && (
                          <a href={`mailto:${event.organizer.email}`} className="flex items-center text-primary-600 hover:underline">
                            <Mail className="mr-3 h-5 w-5" />
                            {event.organizer.email}
                          </a>
                        )}
                        {event.organizer.phone && (
                          <a href={`tel:${event.organizer.phone}`} className="flex items-center text-primary-600 hover:underline">
                            <Phone className="mr-3 h-5 w-5" />
                            {event.organizer.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                <section className="border-t border-gray-200 pt-6">
                  <h2 className="mb-4 text-xl font-semibold">About This Event</h2>
                  <p className="whitespace-pre-line text-gray-600">{event.description}</p>
                  {event.tags?.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{tag}</span>
                      ))}
                    </div>
                  )}
                </section>

                <section className="border-t border-gray-200 pt-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold">Reviews & Ratings</h2>
                    {user && !userReview && (
                      <button onClick={() => setShowReviewForm((value) => !value)} className="btn-primary">
                        Write a Review
                      </button>
                    )}
                  </div>

                  {avgRating > 0 && (
                    <div className="mb-4 flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-5 w-5 ${star <= Math.round(avgRating) ? 'fill-current text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-lg font-semibold">{avgRating}</span>
                      <span className="text-gray-500">({reviews.length} reviews)</span>
                    </div>
                  )}

                  {showReviewForm && user && !userReview && (
                    <form onSubmit={handleSubmitReview} className="mb-6 rounded-lg bg-gray-50 p-4">
                      <label className="label">Rating</label>
                      <div className="mb-4 flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setRating(star)}>
                            <Star className={`h-6 w-6 ${star <= rating ? 'fill-current text-yellow-400' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                      <label className="label">Comment</label>
                      <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="input-field mb-4" rows={3} placeholder="Share your experience..." />
                      <div className="flex gap-2">
                        <button type="submit" className="btn-primary">Submit Review</button>
                        <button type="button" onClick={() => setShowReviewForm(false)} className="btn-secondary">Cancel</button>
                      </div>
                    </form>
                  )}

                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review._id} className="rounded-lg border border-gray-200 bg-white p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-semibold">{review.user?.name}</span>
                            <span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="mb-2 flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-current text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          {review.comment && <p className="text-gray-600">{review.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-gray-50 py-8 text-center">
                      <Star className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                      <p className="text-gray-600">No reviews yet.</p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>

          <aside>
            <div className="sticky top-24 rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center text-primary-600">
                  <IndianRupee className="h-8 w-8" />
                  <span className="text-4xl font-bold">{event.price.toLocaleString('en-IN')}</span>
                </div>
                <span className="text-gray-500">per ticket</span>
              </div>

              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Available Tickets</span>
                  <span className="font-semibold text-green-600">{event.availableTickets} / {event.totalTickets}</span>
                </div>

                {!isSoldOut && (
                  <div>
                    <label className="label">Number of Tickets</label>
                    <select value={numberOfTickets} onChange={(e) => setNumberOfTickets(Number(e.target.value))} className="input-field">
                      {[...Array(Math.min(10, event.availableTickets))].map((_, index) => (
                        <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? 'ticket' : 'tickets'}</option>
                      ))}
                    </select>
                  </div>
                )}

                {!isSoldOut && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="mb-2 flex justify-between text-gray-600"><span>Subtotal</span><span>INR {subtotal.toLocaleString('en-IN')}</span></div>
                    <div className="mb-2 flex justify-between text-gray-600"><span>Escrow hold</span><span>24-48 hrs</span></div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>INR {subtotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>

              {!isSoldOut ? (
                <div className="flex gap-2">
                  <button onClick={handleBooking} disabled={bookingLoading} className="btn-primary flex flex-1 items-center justify-center disabled:cursor-not-allowed disabled:opacity-60">
                    <Ticket className="mr-2 h-5 w-5" />
                    {bookingLoading ? 'Sending OTP...' : 'Book Now'}
                  </button>
                  <button onClick={handleShare} className="btn-secondary flex flex-1 items-center justify-center">
                    {copied ? <Check className="mr-2 h-5 w-5 text-green-600" /> : <Share2 className="mr-2 h-5 w-5" />}
                    {copied ? 'Copied' : 'Share'}
                  </button>
                </div>
              ) : (
                <button disabled className="w-full cursor-not-allowed rounded-lg bg-gray-300 px-6 py-3 font-semibold text-gray-500">Sold Out</button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onSubmit={handleReport} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Report This Event</h2>
            <label className="label">Reason</label>
            <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="input-field mb-4">
              {reportReasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
            </select>
            <label className="label">Details</label>
            <textarea value={reportMessage} onChange={(e) => setReportMessage(e.target.value)} className="input-field mb-5" rows={4} placeholder="What looks suspicious?" />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">Submit Report</button>
              <button type="button" onClick={() => setShowReportModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </motion.form>
        </div>
      )}

      {showBookingModal && lastBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
            {!bookingOtpVerified ? (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                    <ShieldCheck className="h-8 w-8 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Verify Your Booking</h2>
                  <p className="mt-2 text-gray-600">We sent a 6-digit code to <strong>{user?.email}</strong></p>
                </div>
                <form onSubmit={handleVerifyBookingOTP} className="space-y-5">
                  <div>
                    <label className="label text-center">Enter Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={bookingOtp}
                      onChange={(e) => setBookingOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      className="input-field text-center text-2xl tracking-widest"
                      placeholder="000000"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Timer className="h-4 w-4" />
                    <span className="text-sm">Expires in <strong className={bookingOtpTimer < 60 ? 'text-red-600' : ''}>{formatTime(bookingOtpTimer)}</strong></span>
                  </div>
                  <button type="submit" disabled={bookingLoading || bookingOtpTimer === 0} className="btn-primary w-full">
                    {bookingLoading ? 'Verifying...' : 'Verify & Confirm Booking'}
                  </button>
                </form>
                <div className="mt-6 text-center">
                  {bookingCanResend ? (
                    <button onClick={handleResendBookingOTP} disabled={bookingLoading} className="mx-auto flex items-center gap-2 font-semibold text-primary-600 hover:text-primary-700">
                      <RefreshCw className="h-4 w-4" />
                      Resend OTP
                    </button>
                  ) : (
                    <p className="text-sm text-gray-600">Resend OTP in <strong>{bookingResendCountdown}s</strong></p>
                  )}
                  <button onClick={handleCloseBookingModal} className="mt-4 text-sm text-gray-500 hover:text-gray-700">Close</button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Booking Confirmed</h2>
                <p className="mb-6 text-gray-600">Your payment is held safely in escrow until the event is completed.</p>
                <div className="space-y-3">
                  <button onClick={() => navigate(`/booking/${lastBookingId}/confirmation`)} className="btn-primary w-full">View E-Ticket</button>
                  <button onClick={handleCloseBookingModal} className="btn-secondary w-full">Close</button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
