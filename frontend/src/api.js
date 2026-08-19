import axios from 'axios';

// Use relative baseURL in production, absolute in development if needed
const baseURL = process.env.NODE_ENV === 'production'
  ? '/api'                    // relative to the current domain
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: baseURL,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;