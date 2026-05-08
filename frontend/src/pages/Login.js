import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Calendar, Key, Shield, ShieldCheck, Timer, RefreshCw } from 'lucide-react';

const OTP_EXPIRY_MINUTES = 10;
const OTP_RATE_LIMIT_SECONDS = 60;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hostKeyword, setHostKeyword] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(OTP_EXPIRY_MINUTES * 60);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(OTP_RATE_LIMIT_SECONDS);

  const { login, hostLogin, verifyLoginOTP, resendLoginOTP } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const timerInterval = useRef(null);
  const resendInterval = useRef(null);

  useEffect(() => {
    if (searchParams.get('host') === 'true') {
      setIsHost(true);
    }
  }, [searchParams]);

  // OTP countdown timer
  useEffect(() => {
    if (requiresOTP && otpTimer > 0) {
      timerInterval.current = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [requiresOTP, otpTimer]);

  // Resend countdown
  useEffect(() => {
    if (requiresOTP && resendCountdown > 0) {
      resendInterval.current = setInterval(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (resendInterval.current) clearInterval(resendInterval.current);
    };
   }, [requiresOTP, resendCountdown]);

  // Enable resend when countdown reaches 0
  useEffect(() => {
    if (resendCountdown === 0) {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await verifyLoginOTP(otp);
      toast.success('Login verified successfully!');
      navigate(isHost ? '/host' : '/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await resendLoginOTP();
      setOtpTimer(OTP_EXPIRY_MINUTES * 60);
      setOtpSent(new Date());
      startResendCountdown();
      toast.success('OTP resent to your email!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // OTP Verification View
  if (requiresOTP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center space-x-2">
                <Calendar className="h-10 w-10 text-primary-600" />
                <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Evento
                </span>
              </Link>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Verify Your Email</h2>
              <p className="mt-2 text-gray-600">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>

            {/* OTP Form */}
            <form onSubmit={handleVerifyOTP} className="space-y-5">
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
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            {/* Resend */}
            <div className="mt-6 text-center">
              {canResend ? (
                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-primary-600 hover:text-primary-700 font-semibold flex items-center justify-center mx-auto space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Resend OTP</span>
                </button>
              ) : (
                <p className="text-sm text-gray-600">
                  Resend OTP in <strong>{resendCountdown}s</strong>
                </p>
              )}
            </div>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setRequiresOTP(false);
                  setOtp('');
                  setOtpTimer(OTP_EXPIRY_MINUTES * 60);
                  setCanResend(false);
                  setResendCountdown(OTP_RATE_LIMIT_SECONDS);
                }}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Back to Login
              </button>
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <strong>Tip:</strong> Check your spam folder if you don't see the email.
                <br />
                OTP is valid for {OTP_EXPIRY_MINUTES} minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular Login Form (original JSX)
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <Calendar className="h-10 w-10 text-primary-600" />
              <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Evento
              </span>
            </Link>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              {isHost ? 'Host Access' : 'Welcome back!'}
            </h2>
            <p className="mt-2 text-gray-600">
              {isHost ? 'Enter secret keyword to access host panel' : 'Sign in to your account'}
            </p>
          </div>

          {/* Host Checkbox Toggle */}
          <div className="mb-6">
            <label className="flex items-center justify-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isHost}
                onChange={(e) => setIsHost(e.target.checked)}
                className="w-4 h-4 text-secondary-600 rounded focus:ring-secondary-500"
              />
              <span className="text-sm font-medium text-gray-700">Login as Host</span>
              <Shield className="h-4 w-4 text-secondary-600" />
            </label>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email (always required) */}
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password (always required) */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Host Keyword (only for host login) */}
            {isHost && (
              <div>
                <label htmlFor="hostKeyword" className="label">
                  <span className="flex items-center text-secondary-700">
                    <Key className="h-4 w-4 mr-2" />
                    Host Secret Keyword *
                  </span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="hostKeyword"
                    type="password"
                    value={hostKeyword}
                    onChange={(e) => setHostKeyword(e.target.value)}
                    required={isHost}
                    className="input-field pl-10 border-2 border-secondary-300 focus:border-secondary-500"
                    placeholder="Enter host keyword"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Signing in...' : (isHost ? 'Access Host Panel' : 'Sign In')}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Create Account
              </Link>
            </p>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              <strong className="text-primary-700">Users:</strong> Use email & password to login.
              <br />
              <strong className="text-secondary-700">Hosts:</strong> Check "Login as Host" and enter secret keyword.
              <br />
              <Link to="/register" className="text-secondary-600 hover:text-secondary-700 font-semibold">
                Register as Host
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
