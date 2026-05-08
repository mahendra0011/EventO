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
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

   const login = async (email, password) => {
     const res = await api.post('/auth/login', { email, password });
     localStorage.setItem('token', res.data.token);
     setUser(res.data.user);
     return res.data;
   };

   const hostLogin = async (email, password, hostKeyword) => {
     const res = await api.post('/auth/host-keyword-login', { email, password, hostKeyword });
     localStorage.setItem('token', res.data.token);
     setUser(res.data.user);
     return res.data;
   };

   const hostRegister = async (name, email, password, phone, secretKeyword) => {
     const res = await api.post('/auth/host-keyword-register', { name, email, password, phone, secretKeyword });
     localStorage.setItem('token', res.data.token);
     setUser(res.data.user);
     return res.data;
   };

   const register = async (name, email, password, phone) => {
     const res = await api.post('/auth/register', { name, email, password, phone });
     localStorage.setItem('token', res.data.token);
     setUser(res.data.user);
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, hostLogin, hostRegister }}>
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
