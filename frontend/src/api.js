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

// ─── Expired / invalid session recovery ──────────────────────
// A stored token stops being accepted whenever it expires (7 days) or the
// server's JWT secret changes. Previously the app kept sending that dead
// token and every write failed with "Invalid token", with no way out short
// of clearing browser storage by hand. Now the first rejected request clears
// the dead session and tells the user to sign in again.
let sessionExpiredHandled = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response && error.response.status;
    const body = (error.response && error.response.data) || {};
    const message = typeof body === 'string' ? body : body.error || '';
    const tokenRejected = status === 401 && /invalid token/i.test(message);

    if (tokenRejected) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only interrupt once per page load, so several failing requests in
      // flight at the same time don't stack up alerts.
      if (!sessionExpiredHandled) {
        sessionExpiredHandled = true;
        alert('Your session has expired. Please log in again.\n\nThe page will reload now.');
        window.location.reload();
      }

      return new Promise(() => {}); // page is reloading; swallow the rejection
    }

    return Promise.reject(error);
  }
);

export default api;
