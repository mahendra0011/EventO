import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminLogin, adminQuickLogin } from '../utils/api';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Calendar, Key, Shield, User, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [secretKeyword, setSecretKeyword] = useState('');
  const [loginType, setLoginType] = useState('user'); // 'user' | 'admin-credentials' | 'admin-keyword'
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const adminParam = searchParams.get('admin');
    if (adminParam === 'true') {
      setLoginType('admin-keyword');
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

  const handleAdminCredentialsLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await adminLogin(email, password, secretKeyword);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Admin login successful!');
      window.location.href = '/admin';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminKeywordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await adminQuickLogin(secretKeyword);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Admin access granted!');
      window.location.href = '/admin';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const switchToUserLogin = () => {
    setLoginType('user');
    setEmail('');
    setPassword('');
    setSecretKeyword('');
  };

  const switchToAdminCredentials = () => {
    setLoginType('admin-credentials');
    setEmail('');
    setPassword('');
    setSecretKeyword('');
  };

  const switchToAdminKeyword = () => {
    setLoginType('admin-keyword');
    setEmail('');
    setPassword('');
    setSecretKeyword('');
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
              {loginType === 'user' ? 'User Login' : 'Admin Access'}
            </h2>
            <p className="mt-2 text-gray-600">
              {loginType === 'user'
                ? 'Sign in to your user account'
                : loginType === 'admin-credentials'
                ? 'Login with admin credentials'
                : 'Quick access with secret keyword'
              }
            </p>
          </div>

          {/* Login Type Tabs */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={switchToUserLogin}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginType === 'user'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4" />
              <span>User</span>
            </button>
            <button
              type="button"
              onClick={switchToAdminCredentials}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginType === 'admin-credentials'
                  ? 'bg-white text-secondary-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={switchToAdminKeyword}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginType === 'admin-keyword'
                  ? 'bg-white text-secondary-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Key className="h-4 w-4" />
              <span>Keyword</span>
            </button>
          </div>

          {/* User Login Form */}
          <AnimatePresence mode="wait">
            {loginType === 'user' && (
              <motion.form
                key="user"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleUserLogin}
                className="space-y-6"
              >
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

                <button type="submit" disabled={loading} className="w-full btn-primary">
                  {loading ? 'Signing in...' : 'Sign In as User'}
                </button>
              </motion.form>
            )}

            {/* Admin Credentials Login Form */}
            {loginType === 'admin-credentials' && (
              <motion.form
                key="admin-credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleAdminCredentialsLogin}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="adminEmail" className="label">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="adminEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-field pl-10 border-secondary-300 focus:border-secondary-500"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="adminPassword" className="label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="adminPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input-field pl-10 pr-10 border-secondary-300 focus:border-secondary-500"
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

                <div>
                  <label htmlFor="secretKeyword" className="label">
                    <span className="flex items-center text-secondary-700">
                      <Key className="h-4 w-4 mr-2" />
                      Admin Secret Keyword *
                    </span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="secretKeyword"
                      type="password"
                      value={secretKeyword}
                      onChange={(e) => setSecretKeyword(e.target.value)}
                      required
                      className="input-field pl-10 border-2 border-secondary-300 focus:border-secondary-500"
                      placeholder="Enter admin keyword"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-secondary-600 to-secondary-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-secondary-700 hover:to-secondary-800 transition-all shadow-lg">
                  {loading ? 'Authenticating...' : 'Login as Admin'}
                </button>
              </motion.form>
            )}

            {/* Admin Keyword-Only Login Form */}
            {loginType === 'admin-keyword' && (
              <motion.form
                key="admin-keyword"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleAdminKeywordLogin}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="keywordOnly" className="label">
                    <span className="flex items-center text-secondary-700">
                      <Key className="h-4 w-4 mr-2" />
                      Admin Secret Keyword *
                    </span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="keywordOnly"
                      type="password"
                      value={secretKeyword}
                      onChange={(e) => setSecretKeyword(e.target.value)}
                      required
                      className="input-field pl-10 border-2 border-secondary-300 focus:border-secondary-500 text-lg tracking-widest"
                      placeholder="••••••••"
                      autoComplete="off"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Enter secret keyword for instant admin access
                  </p>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-secondary-600 to-secondary-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-secondary-700 hover:to-secondary-800 transition-all shadow-lg">
                  {loading ? 'Verifying...' : 'Access Admin Panel'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Switch Login Type */}
          <div className="mt-6 text-center">
            {loginType === 'user' && (
              <button
                type="button"
                onClick={switchToAdminKeyword}
                className="text-sm text-secondary-600 hover:text-secondary-700 font-medium"
              >
                Admin? Use secret keyword →
              </button>
            )}
            {loginType === 'admin-credentials' && (
              <button
                type="button"
                onClick={switchToAdminKeyword}
                className="text-sm text-secondary-600 hover:text-secondary-700 font-medium"
              >
                Quick keyword access →
              </button>
            )}
            {loginType === 'admin-keyword' && (
              <button
                type="button"
                onClick={switchToUserLogin}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                Sign in with user account
              </button>
            )}
          </div>

          {/* Register Link (only for user view) */}
          {loginType === 'user' && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Create Account
                </Link>
              </p>
            </div>
          )}

          {/* Credentials Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Available Credentials:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong className="text-primary-700">User:</strong> john@example.com / user123</p>
              <p><strong className="text-secondary-700">Admin 1 (Email/Pass):</strong> admin@evento.com / admin123</p>
              <p><strong className="text-secondary-700">Admin 2 (Email/Pass):</strong> mahendrapra0077@gmail.com / admin@123</p>
              <p><strong className="text-secondary-700">Secret Keyword:</strong> <code className="bg-secondary-100 px-1 rounded font-mono">evento2580</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
