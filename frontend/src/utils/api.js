import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(process.env.REACT_APP_API_TIMEOUT_MS || 20000),
  headers: {
    'Content-Type': 'application/json'
  }
});

// In production, setup a proxy redirect for API calls
// The backend should be deployed at /api or use same domain

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
      // Keep the temporary token so unverified users can complete OTP verification.
      // Signup/login pages decide when to navigate to /verify-email. A global
      // redirect here would hijack public pages like Home when an old unverified
      // token is still in localStorage.
      if (error.response.status === 403 && (error.response.data.requiresVerification || error.response.data.requiresOTP)) {
        return Promise.reject(error);
      }
      // Handle 401 Unauthorized
      else if (error.response.status === 401) {
        localStorage.removeItem('token');
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

export const changePassword = async (currentPassword, newPassword) => {
  const res = await api.put('/auth/password', { currentPassword, newPassword });
  return res.data;
};

export const changeHostKeyword = async (currentPassword, currentKeyword, newKeyword) => {
  const res = await api.put('/auth/host-keyword', { currentPassword, currentKeyword, newKeyword });
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

export const getBroadcastMessages = async () => {
  const res = await api.get('/messages/broadcasts');
  return res.data;
};

export const markMessageAsRead = (messageId) => {
  return api.put(`/messages/${messageId}/read`);
};

// Get users who booked a specific event (for host)
export const getEventBookers = async (eventId) => {
  const res = await api.get(`/host/events/${eventId}/bookers`);
  return res.data;
};

// Community Chat
export const postCommunityMessage = async (eventId, content, replyTo = null) => {
  const payload = replyTo ? { eventId, content, replyTo } : { eventId, content };
  const res = await api.post('/messages/community', payload);
  return res.data;
};

export const getCommunityMessages = async (eventId, page = 1, limit = 50) => {
  const res = await api.get(`/messages/community/${eventId}?page=${page}&limit=${limit}`);
  return res.data;
};

// Pin/Unpin a community message (host only)
export const pinMessage = async (messageId, pinned) => {
  const res = await api.put(`/messages/${messageId}/pin`, { pinned });
  return res.data;
};

export const getEventAttendees = async (eventId) => {
  const res = await api.get(`/messages/attendees/${eventId}`);
  return res.data;
};

export const getAllEventAttendees = async () => {
  const res = await api.get('/messages/attendees');
  return res.data;
};

// Add reaction to a message
export const addReaction = async (messageId, emoji) => {
  const res = await api.post(`/messages/${messageId}/react`, { emoji });
  return res.data;
};

// Edit a message
export const editMessage = async (messageId, content) => {
  const res = await api.put(`/messages/${messageId}`, { content });
  return res.data;
};

// Get reactions for a message
export const getMessageReactions = async (messageId) => {
  const res = await api.get(`/messages/${messageId}/reactions`);
  return res.data;
};

// Booking OTP Verification
export const verifyBookingOTP = async (bookingId, otp) => {
  const res = await api.post('/bookings/verify-otp', { bookingId, otp });
  return res.data;
};

// Resend Booking OTP
export const resendBookingOTP = async (bookingId) => {
  const res = await api.post('/bookings/resend-otp', { bookingId });
  return res.data;
};

