import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://evento-j034.onrender.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Host Login with credentials (email + password + secret keyword)
export const hostLogin = async (email, password, secretKeyword) => {
  const res = await api.post('/auth/host-login', { email, password, secretKeyword });
  return res.data;
};

// Host Register with secret keyword
export const hostRegister = async (userData) => {
  const res = await api.post('/auth/host-register', userData);
  return res.data;
};

// Host Keyword Login
export const hostKeywordLogin = async (email, password, hostKeyword) => {
  const res = await api.post('/auth/host-keyword-login', { email, password, hostKeyword });
  return res.data;
};

// Host Keyword Register
export const hostKeywordRegister = async (userData) => {
  const res = await api.post('/auth/host-keyword-register', userData);
  return res.data;
};

// Wishlist / Saved Events - Now backed by server
export const getWishlist = async () => {
  const res = await api.get('/wishlist');
  return res.data;
};

export const addToWishlist = async (eventId) => {
  const res = await api.post('/wishlist', { eventId });
  return res.data;
};

export const removeFromWishlist = async (eventId) => {
  const res = await api.delete(`/wishlist/${eventId}`);
  return res.data;
};

export const checkWishlist = async (eventId) => {
  const res = await api.get(`/wishlist/check/${eventId}`);
  return res.data;
};

// Event Categories
export const getCategories = async () => {
  const res = await api.get('/events/categories');
  return res.data;
};

// Notifications
export const getNotifications = async () => {
  const res = await api.get('/notifications');
  return res.data;
};

export const markNotificationAsRead = (notificationId) => {
  return api.put(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = () => {
  return api.put('/notifications/read-all');
};

// Messaging
export const sendMessage = (data) => {
  return api.post('/messages', data);
};

export const getInbox = async (page = 1, limit = 20) => {
  const res = await api.get(`/messages/inbox?page=${page}&limit=${limit}`);
  return res.data;
};

export const getConversation = async (userId, page = 1, limit = 50) => {
  const res = await api.get(`/messages/conversation/${userId}?page=${page}&limit=${limit}`);
  return res.data;
};

export const getSentMessages = async (page = 1, limit = 20) => {
  const res = await api.get(`/messages/sent?page=${page}&limit=${limit}`);
  return res.data;
};

export const markConversationAsRead = (userId) => {
  return api.put(`/messages/read/${userId}`);
};

export const deleteMessage = (messageId) => {
  return api.delete(`/messages/${messageId}`);
};

// Host Dashboard Stats
export const getHostDashboardStats = async () => {
  const res = await api.get('/host/dashboard');
  return res.data;
};

// Broadcast message to all users who booked an event
export const broadcastToEventBookers = async (eventId, subject, content) => {
  const res = await api.post('/messages/broadcast', { eventId, subject, content });
  return res.data;
};

// Get users who booked a specific event (for host)
export const getEventBookers = async (eventId) => {
  const res = await api.get(`/host/events/${eventId}/bookers`);
  return res.data;
};

// Community Chat
export const postCommunityMessage = async (eventId, content) => {
  const res = await api.post('/messages/community', { eventId, content });
  return res.data;
};

export const getCommunityMessages = async (eventId, page = 1, limit = 50) => {
  const res = await api.get(`/messages/community/${eventId}?page=${page}&limit=${limit}`);
  return res.data;
};

