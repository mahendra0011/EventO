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

// Reviews
export const createReview = async (eventId, rating, comment) => {
  const res = await api.post('/reviews', { eventId, rating, comment });
  return res.data;
};

export const getEventReviews = async (eventId) => {
  const res = await api.get(`/reviews/event/${eventId}`);
  return res.data;
};

export const getEventRating = async (eventId) => {
  const res = await api.get(`/reviews/event/${eventId}/rating`);
  return res.data;
};

export const getUserReviews = async () => {
  const res = await api.get('/reviews/user');
  return res.data;
};

// Wishlist / Saved Events (localStorage based - shown in UI only)
export const getSavedEvents = () => {
  const saved = localStorage.getItem('wishlist');
  return saved ? JSON.parse(saved) : [];
};

export const saveEventToWishlist = (event) => {
  const saved = getSavedEvents();
  if (!saved.find(e => e._id === event._id)) {
    saved.push(event);
    localStorage.setItem('wishlist', JSON.stringify(saved));
  }
};

export const removeEventFromWishlist = (eventId) => {
  const saved = getSavedEvents().filter(e => e._id !== eventId);
  localStorage.setItem('wishlist', JSON.stringify(saved));
};

// Event Categories
export const getCategories = async () => {
  const res = await api.get('/events/categories');
  return res.data;
};

// Host Dashboard Stats
export const getHostDashboardStats = async () => {
  const res = await api.get('/host/dashboard');
  return res.data;
};
