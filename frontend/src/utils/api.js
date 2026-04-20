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
