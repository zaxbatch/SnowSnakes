import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/App.css'; // we'll put your CSS here later

// Warm up the API connection while React is still booting.
//
// The first data request (e.g. /api/jokes) otherwise pays for DNS lookup,
// TCP handshake and TLS negotiation on top of its own time — which on a
// free-tier host in another region is easily a few hundred milliseconds.
// Opening the connection here overlaps that with the initial render.
(function preconnectApi() {
  const base =
    process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:5000';
  try {
    const { origin } = new URL(base, window.location.href);
    if (!origin || origin === window.location.origin) return;
    for (const rel of ['preconnect', 'dns-prefetch']) {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  } catch (err) {
    // A bad origin must never stop the app from rendering.
  }
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
