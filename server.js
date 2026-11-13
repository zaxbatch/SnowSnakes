// Local / Hostinger-style entry point: one process serves both the API and
// the built frontend. Netlify uses netlify/functions/api.js instead.

require('dotenv').config({ path: __dirname + '/backend/.env' });

const path = require('path');
const express = require('express');
const app = require('./backend/app');
const { runMigrations } = require('./backend/db/migrate');

// ─── Serve the built frontend (production) ─────────────
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'frontend', 'build');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('🚀 Snowsnakes API is running. Frontend should be served separately in dev.');
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at /api`);
  console.log(
    `🌐 ${process.env.NODE_ENV === 'production'
      ? 'Frontend served from frontend/build'
      : 'Dev mode: use npm run dev'}`
  );
  // Deliberately not awaited: the site starts serving immediately and the
  // schema catches up alongside.
  runMigrations();
});
