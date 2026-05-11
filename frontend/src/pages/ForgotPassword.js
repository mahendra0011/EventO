import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, Eye, EyeOff, KeyRound, Lock, Mail, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import api from '../utils/api';

const RESEND_WAIT_SECONDS = 60;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;

    const timer = setTimeout(() => {
      setResendCountdown((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const normalizedEmail = email.trim().toLowerCase();

  const sendResetOtp = async (e) => {
    e?.preventDefault();

    if (!normalizedEmail) {
      toast.error('Email is required');
      return;
    }

    setSending(true);
    try {
      await api.post('/auth/forgot-password', { email: normalizedEmail });
      setOtpSent(true);
      setResendCountdown(RESEND_WAIT_SECONDS);
      toast.success('Password reset OTP sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send password reset OTP');
    } finally {
      setSending(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      toast.error('Enter the 6-digit OTP');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setResetting(true);
    try {
      await api.post('/auth/reset-password', {
        email: normalizedEmail,
        otp,
        password
      });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed');
    } finally {
      setResetting(false);
    }
  };

  const changeEmail = () => {
    setOtpSent(false);
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setResendCountdown(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-[#fff8f2] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <Calendar className="h-10 w-10 text-primary-600" />
              <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Evento
              </span>
            </Link>
            <h2 className="mt-4 text-2xl font-bold text-cocoa-900">Forgot password</h2>
            <p className="mt-2 text-cocoa-500">
              {otpSent ? 'Enter the OTP from your email and choose a new password.' : 'Enter your account email to receive a reset OTP.'}
            </p>
          </div>

          {!otpSent ? (
            <form onSubmit={sendResetOtp} className="space-y-5">
              <div>
                <label htmlFor="email" className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cocoa-300" />
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

              <button type="submit" disabled={sending} className="w-full btn-primary flex items-center justify-center gap-2">
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-5">
              <div className="rounded-lg border border-primary-100 bg-primary-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">OTP sent to</p>
                    <p className="truncate text-sm font-semibold text-cocoa-900">{normalizedEmail}</p>
                  </div>
                  <button type="button" onClick={changeEmail} className="text-sm font-semibold text-primary-700 hover:text-primary-800">
                    Change
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="otp" className="label">Email OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cocoa-300" />
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    className="input-field pl-10 tracking-widest"
                    placeholder="000000"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cocoa-300" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input-field pl-10 pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cocoa-300 hover:text-cocoa-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cocoa-300" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input-field pl-10"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button type="submit" disabled={resetting} className="w-full btn-primary">
                {resetting ? 'Resetting...' : 'Reset password'}
              </button>

              <button
                type="button"
                onClick={sendResetOtp}
                disabled={sending || resendCountdown > 0}
                className="w-full btn-secondary flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
                {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : sending ? 'Sending...' : 'Resend OTP'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center justify-center gap-2 font-semibold text-primary-600 hover:text-primary-700">
              <ArrowLeft className="h-4 w-4" />
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
