import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminLogin, adminQuickLogin } from '../utils/api';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Calendar, Key, Shield } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminKeyword, setAdminKeyword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('admin') === 'true') {
      setIsAdmin(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isAdmin) {
        // Admin login with keyword
        const data = await adminQuickLogin(adminKeyword);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Admin access granted!');
      } else {
        // Regular user login
        await login(email, password);
        toast.success('Login successful!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
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
            <Link to="/" className="inline-flex items-center space-x-2">
              <Calendar className="h-10 w-10 text-primary-600" />
              <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Evento
              </span>
            </Link>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              {isAdmin ? 'Admin Access' : 'Welcome back!'}
            </h2>
            <p className="mt-2 text-gray-600">
              {isAdmin ? 'Enter secret keyword to access admin panel' : 'Sign in to your account'}
            </p>
          </div>

          {/* Admin Checkbox Toggle */}
          <div className="mb-6">
            <label className="flex items-center justify-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4 text-secondary-600 rounded focus:ring-secondary-500"
              />
              <span className="text-sm font-medium text-gray-700">Login as Admin</span>
              <Shield className="h-4 w-4 text-secondary-600" />
            </label>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isAdmin ? (
              <>
                {/* Admin Keyword Only */}
                <div>
                  <label htmlFor="adminKeyword" className="label">
                    <span className="flex items-center text-secondary-700">
                      <Key className="h-4 w-4 mr-2" />
                      Admin Secret Keyword
                    </span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="adminKeyword"
                      type="password"
                      value={adminKeyword}
                      onChange={(e) => setAdminKeyword(e.target.value)}
                      required={isAdmin}
                      className="input-field pl-10 border-2 border-secondary-300 focus:border-secondary-500"
                      placeholder="Enter admin keyword"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Regular User Login */}
                <div>
                  <label htmlFor="email" className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required={!isAdmin}
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
                      required={!isAdmin}
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
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${isAdmin ? 'bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800' : 'btn-primary'} text-white py-3 px-4 rounded-lg font-semibold shadow-lg transition-all`}
            >
              {loading ? 'Signing in...' : (isAdmin ? 'Access Admin Panel' : 'Sign In')}
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
              <strong className="text-secondary-700">Admins:</strong> Check "Login as Admin" and enter secret keyword.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
