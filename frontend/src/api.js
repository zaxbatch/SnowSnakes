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
// A stored token stops working when it expires (7 days), when the server's JWT
// secret changes, or when it is missing entirely. Previously the app kept
// using that dead session and every write failed with a bare 401, with no way
// out short of clearing browser storage by hand. Now the first rejected write
// clears the dead session and asks the user to sign in again.
//
// ANY 401 is treated as a dead session, not just the ones the server labels
// "Invalid token". A missing token comes back as "No token provided" and an
// expired one as "Invalid token" — matching only the latter left the app
// showing an unexplained "Request failed with status code 401" with the UI
// still believing the user was signed in.
let sessionExpiredHandled = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
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
