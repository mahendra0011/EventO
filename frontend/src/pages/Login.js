import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Calendar, Key, Shield } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminKeyword, setAdminKeyword] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for admin query param
    if (searchParams.get('admin') === 'true') {
      setIsAdminLogin(true);
    }
  }, [searchParams]);

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: adminKeyword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw { response: { data } };
      }

      // Store token and user data (same as regular login)
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Reload page to update auth context
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const switchToAdminLogin = () => {
    setIsAdminLogin(true);
    setEmail('');
    setPassword('');
  };

  const switchToUserLogin = () => {
    setIsAdminLogin(false);
    setAdminKeyword('');
  };

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
              {isAdminLogin ? 'Admin Access' : 'Welcome back!'}
            </h2>
            <p className="mt-2 text-gray-600">
              {isAdminLogin ? 'Enter admin secret keyword' : 'Sign in to your account'}
            </p>
          </div>

          {/* User Login Form */}
          {!isAdminLogin && (
            <form onSubmit={handleUserLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
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

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Admin Keyword Login Form */}
          {isAdminLogin && (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label htmlFor="adminKeyword" className="label">
                  <span className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Secret Keyword
                  </span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="adminKeyword"
                    type="password"
                    value={adminKeyword}
                    onChange={(e) => setAdminKeyword(e.target.value)}
                    required
                    className="input-field pl-10"
                    placeholder="Enter admin keyword"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Use secret keyword for instant admin access
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-secondary-600 to-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-secondary-700 hover:to-primary-700 transition-all shadow-lg"
              >
                {loading ? 'Authenticating...' : 'Access Admin Panel'}
              </button>
            </form>
          )}

          {/* Toggle between User and Admin login */}
          <div className="mt-6">
            <button
              type="button"
              onClick={isAdminLogin ? switchToUserLogin : switchToAdminLogin}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {isAdminLogin ? 'Sign in with user account' : 'Admin? Use secret keyword'}
            </button>
          </div>

          {/* Divider */}
          {!isAdminLogin && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
            </div>
          )}

          {/* Register Link (only for user login) */}
          {!isAdminLogin && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Sign up
                </Link>
              </p>
            </div>
          )}

          {/* Credentials Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-2">Available Credentials:</p>
            <p className="text-xs text-gray-600">Admin 1: admin@evento.com / admin123</p>
            <p className="text-xs text-gray-600">Admin 2: mahendrapra0077@gmail.com / admin@123</p>
            <p className="text-xs text-gray-600 mt-1">Secret Keyword: <span className="font-mono font-bold text-secondary-600">evento2580</span></p>
            <p className="text-xs text-gray-600">User: john@example.com / user123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
