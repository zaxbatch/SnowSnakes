import axios from 'axios';

// In production, use '/api' (same domain). In development, use localhost.
const baseURL = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: baseURL,
  // A cold free-tier backend can take a while, but it should never leave the
  // UI spinning forever. Past this point the request fails and the page shows
  // a retry instead of an endless skeleton.
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
