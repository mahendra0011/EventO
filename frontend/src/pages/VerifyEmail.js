import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheck, Timer, RefreshCw, Calendar } from 'lucide-react';

const OTP_EXPIRY_MINUTES = 10;
const OTP_RATE_LIMIT_SECONDS = 60;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, verifyEmail, verifyLoginOTP, resendVerification, resendLoginOTP, verifyBookingOTP, resendBookingOTP } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(OTP_EXPIRY_MINUTES * 60);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(OTP_RATE_LIMIT_SECONDS);
  const [from, setFrom] = useState(''); // 'registration', 'login', or 'booking'
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSent, setEmailSent] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const timerInterval = useRef(null);
  const resendInterval = useRef(null);

  useEffect(() => {
    if (location.state) {
      setFrom(location.state.from || '');
      setRecipientEmail(location.state.email || '');
      setBookingId(location.state.bookingId || null);
      setEmailSent(location.state.emailSent !== false);
      if (location.state.canResendNow) {
        setCanResend(true);
        setResendCountdown(0);
      }
    }
  }, [location.state]);

  const verificationTitle = from === 'booking'
    ? 'Verify Your Booking'
    : from === 'login'
      ? 'Verify Login'
      : 'Verify Your Email';

  const verificationDescription = from === 'booking'
    ? 'We sent a 6-digit booking code to your email'
    : from === 'login'
      ? 'We sent a 6-digit login code to your email'
      : 'We sent a 6-digit code to your email';

  const verifyButtonText = from === 'booking'
    ? 'Verify & Confirm Booking'
    : from === 'login'
      ? 'Verify Login'
      : 'Verify Email';

  const displayEmail = recipientEmail || user?.email;

  const navigateAfterAuthVerification = (res) => {
    if (res?.user?.role === 'host') {
      navigate('/host');
    } else {
      navigate('/dashboard');
    }
  };

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      timerInterval.current = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [otpTimer]);

  // Resend countdown
  useEffect(() => {
    if (resendCountdown > 0) {
      resendInterval.current = setInterval(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (resendInterval.current) clearInterval(resendInterval.current);
    };
  }, [resendCountdown]);

  // Enable resend when countdown reaches 0
  useEffect(() => {
    if (resendCountdown === 0) {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      if (from === 'registration') {
        const res = await verifyEmail(otp);
        navigateAfterAuthVerification(res);
      } else if (from === 'login') {
        const res = await verifyLoginOTP(otp);
        navigateAfterAuthVerification(res);
      } else if (from === 'booking') {
        await verifyBookingOTP(bookingId, otp);
        // After booking OTP verification, navigate to booking confirmation
        navigate(`/booking/${bookingId}/confirmation`);
      } else {
        // Default to email verification (registration)
        const res = await verifyEmail(otp);
        navigateAfterAuthVerification(res);
      }
      toast.success('Verification successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      if (from === 'registration') {
        await resendVerification();
      } else if (from === 'login') {
        await resendLoginOTP();
      } else if (from === 'booking') {
        await resendBookingOTP(bookingId);
      } else {
        await resendVerification();
      }
      setOtpTimer(OTP_EXPIRY_MINUTES * 60);
      setResendCountdown(OTP_RATE_LIMIT_SECONDS);
      setCanResend(false);
      setOtp('');
      toast.success('Verification code resent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center space-x-2">
              <Calendar className="h-10 w-10 text-primary-600" />
              <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Evento
              </span>
            </a>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">{verificationTitle}</h2>
            <p className="mt-2 text-gray-600">
              {verificationDescription}
              {displayEmail && (
                <>
                  <br />
                  <strong>{displayEmail}</strong>
                </>
              )}
            </p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP Input */}
            <div>
              <label htmlFor="otp" className="label">Enter Verification Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="input-field pl-10 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  autoFocus
                />
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Timer className="h-4 w-4" />
              <span className="text-sm">
                Expires in <strong>{formatTime(otpTimer)}</strong>
              </span>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otpTimer === 0}
              className="w-full btn-primary"
            >
              {loading ? 'Verifying...' : verifyButtonText}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-primary-600 hover:text-primary-700 font-semibold flex items-center justify-center mx-auto space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Resend Code</span>
              </button>
            ) : (
              <p className="text-sm text-gray-600">
                Resend OTP in <strong>{resendCountdown}s</strong>
              </p>
            )}
          </div>

          {/* Info */}
          <div className={`mt-6 p-4 rounded-lg border ${emailSent ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`text-xs ${emailSent ? 'text-blue-800' : 'text-amber-800'}`}>
              <strong>{emailSent ? 'Tip:' : 'Email not sent:'}</strong>{' '}
              {emailSent ? "Check your spam folder if you don't see the email." : 'Use Resend Code after checking your SMTP settings.'}
              <br />
              OTP is valid for {OTP_EXPIRY_MINUTES} minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
