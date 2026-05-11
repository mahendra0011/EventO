import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, User, Phone, CalendarDays, Key, Shield, ArrowRight, CheckCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    secretKeyword: '',
    isHost: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, hostRegister } = useAuth();
  const navigate = useNavigate();

  const getErrorMessage = (error) => {
    if (error.code === 'ECONNABORTED') {
      return 'The server is taking too long to respond. Please check backend, MongoDB, and email settings.';
    }

    return error.response?.data?.message || 'Registration failed';
  };

  const goToVerification = (email, res) => {
    navigate('/verify-email', {
      state: {
        from: 'registration',
        email,
        emailSent: res.emailSent !== false,
        canResendNow: res.emailSent === false
      }
    });

    if (res.emailSent === false) {
      toast.error(res.message || 'Account created, but the OTP email could not be sent. Try resend.');
    } else {
      toast.success('Please check your email for verification code');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (formData.isHost) {
        const res = await hostRegister(formData.name, formData.email, formData.password, formData.phone, formData.secretKeyword);
        if (res.requiresVerification || res.requiresOTP) {
          goToVerification(formData.email, res);
        } else {
          toast.success('Host account created!');
          navigate('/host');
        }
      } else {
        const res = await register(formData.name, formData.email, formData.password, formData.phone);
        if (res.requiresVerification || res.requiresOTP) {
          goToVerification(formData.email, res);
        } else {
          toast.success('Registration successful!');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f4]">
      <div className="mx-auto grid min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1fr] lg:px-8">
        <div className="flex items-center justify-center lg:px-10">
          <div className="w-full max-w-xl">
            <div className="surface-panel p-8">
              <div className="mb-8 text-center">
                <Link to="/" className="inline-flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-500 text-white">
                    <CalendarDays className="h-6 w-6" />
                  </span>
                  <span className="text-2xl font-black uppercase text-cocoa-900">Evento</span>
                </Link>
                <h2 className="mt-5 text-3xl font-black tracking-tight text-cocoa-900">Create your account</h2>
                <p className="mt-2 font-semibold text-cocoa-500">Start booking events or register as a host to publish your own.</p>
              </div>

              <label className="mb-6 flex cursor-pointer items-center justify-between rounded-lg border border-cocoa-100 bg-[#fbf8f4] p-4">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm">
                    <Shield className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-cocoa-900">Register as host</span>
                    <span className="text-xs font-semibold text-cocoa-400">Create events and manage attendees</span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  name="isHost"
                  checked={formData.isHost}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-cocoa-200 text-primary-600 focus:ring-primary-500"
                />
              </label>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="label">Full Name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-300" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="input-field pl-10"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="label">Email Address</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-300" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="input-field pl-10"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="label">Phone Number</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-300" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input-field pl-10"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="password" className="label">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-300" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="input-field pl-10 pr-10"
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-cocoa-300 hover:text-cocoa-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-300" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="input-field pl-10"
                        placeholder="Repeat password"
                      />
                    </div>
                  </div>
                </div>

                {formData.isHost && (
                  <div>
                    <label htmlFor="secretKeyword" className="label">
                      <span className="flex items-center text-primary-700">
                        <Key className="mr-2 h-4 w-4" />
                        Host secret keyword
                      </span>
                    </label>
                    <div className="relative">
                      <Shield className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-300" />
                      <input
                        id="secretKeyword"
                        name="secretKeyword"
                        type="password"
                        value={formData.secretKeyword}
                        onChange={handleChange}
                        required={formData.isHost}
                        className="input-field pl-10"
                        placeholder="Enter host keyword"
                      />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Creating account...' : 'Create account'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <p className="mt-6 text-center text-sm font-semibold text-cocoa-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-primary-700 hover:text-primary-800">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="relative hidden overflow-hidden rounded-lg bg-cocoa-900 lg:block">
          <img
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85"
            alt="Live event stage with crowd"
            className="absolute inset-0 h-full w-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa-900 via-cocoa-900/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <h1 className="max-w-xl text-4xl font-black tracking-tight">
              Join the platform built for memorable events.
            </h1>
            <div className="mt-6 grid gap-3 text-sm font-bold text-cocoa-100">
              {['Discover events faster', 'Save favorites and bookings', 'Publish and manage as a host'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary-200" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
