import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (error) {
        if (!(error.response?.status === 403 && (error.response?.data?.requiresVerification || error.response?.data?.requiresOTP))) {
          localStorage.removeItem('token');
        }
      }
    }
    setLoading(false);
  };

    const login = async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.token) localStorage.setItem('token', res.data.token);
      if (res.data.verified && !res.data.requiresVerification && !res.data.requiresOTP) {
        setUser(res.data.user);
      }
      return res.data;
    };

    const verifyLoginOTP = async (email, otp) => {
      const res = await api.post('/auth/verify-login-otp', { email, otp });
      if (res.data.token) localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res.data;
    };

    const googleLogin = async (credential) => {
      const payload = typeof credential === 'string' ? { credential } : credential;
      const res = await api.post('/auth/google', payload);
      if (res.data.token) localStorage.setItem('token', res.data.token);
      if (res.data.verified && !res.data.requiresVerification && !res.data.requiresOTP) {
        setUser(res.data.user);
      }
      return res.data;
    };

    const resendLoginOTP = async (email) => {
      const res = await api.post('/auth/resend-login-otp', { email });
      return res.data;
    };

    const hostLogin = async (email, password) => {
      const res = await api.post('/auth/host-login', { email, password });
      if (res.data.token) localStorage.setItem('token', res.data.token);
      if (res.data.verified && !res.data.requiresVerification && !res.data.requiresOTP) {
        setUser(res.data.user);
      }
      return res.data;
    };

    const verifyBookingOTP = async (bookingId, otp) => {
      const res = await api.post('/bookings/verify-otp', { bookingId, otp });
      return res.data;
    };

    const resendBookingOTP = async (bookingId) => {
      const res = await api.post('/bookings/resend-otp', { bookingId });
      return res.data;
    };

    const hostRegister = async (name, email, password, phone, organizerProfile = {}) => {
      const res = await api.post('/auth/host-register', { name, email, password, phone, organizerProfile });
      if (res.data.token) localStorage.setItem('token', res.data.token);
      if (!res.data.requiresVerification && !res.data.requiresOTP) {
        setUser(res.data.user);
      }
      return res.data;
    };

    const register = async (name, email, password, phone) => {
      const res = await api.post('/auth/register', { name, email, password, phone });
      if (res.data.token) localStorage.setItem('token', res.data.token);
      if (!res.data.requiresVerification && !res.data.requiresOTP) {
        setUser(res.data.user);
      }
      return res.data;
    };

    const verifyEmail = async (email, otp) => {
      const res = await api.post('/auth/verify-email', { email, otp });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      setUser(res.data.user);
      return res.data;
    };

    const resendVerification = async (email) => {
      const res = await api.post('/auth/resend-verification', { email });
      return res.data;
    };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data.user);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      googleLogin,
      logout,
      updateProfile,
      hostLogin,
      hostRegister,
      verifyLoginOTP,
      resendLoginOTP,
      verifyBookingOTP,
      resendBookingOTP,
      verifyEmail,
      resendVerification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
