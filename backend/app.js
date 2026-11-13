// The Express application, without a listening socket.
//
// This is shared by every way the API is started:
//   * `server.js` (repo root) — local production-style server / Hostinger
//   * `backend/server.js`     — local backend-only dev server
//   * `netlify/functions/api.js` — Netlify Function entry file
//
// Keeping the routes here means those three runtimes cannot drift apart.

const express = require('express');
const cors = require('cors');

const app = express();

app.disable('x-powered-by');
// Netlify (and any reverse proxy) terminates TLS in front of us, so trust its
// forwarding headers when Express needs the visitor's address.
app.set('trust proxy', 1);

// ─── CORS ───────────────────────────────────────────────
// The site normally calls the API on its own origin, where CORS is not
// involved. These rules matter for Netlify Deploy Previews, custom domains,
// and local development. FRONTEND_URL may hold a comma-separated list.
const allowedOrigins = String(process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // same-origin requests, curl, server-to-server
  if (allowedOrigins.length === 0) return true; // no allowlist configured
  const normalized = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(normalized)) return true;
  // Branch and Deploy Preview URLs of the site itself.
  return /^https:\/\/[a-z0-9-]+(--[a-z0-9-]+)?\.netlify\.app$/i.test(normalized);
};

app.use(cors({
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
}));

// Large game uploads can take longer than Node's default request timeout.
// This keeps a normal Node process from dropping a long multipart upload;
// serverless-http requests have a socket stub, so they are skipped.
app.use((req, res, next) => {
  // serverless-http supplies a request/socket stub without setTimeout();
  // only a real Node server needs the longer socket timeout.
  if (req.socket && typeof req.socket.setTimeout === 'function') {
    req.setTimeout(600000);
    res.setTimeout(600000);
    req.socket.setTimeout(600000);
  }
  next();
});

// ─── Request body limits ───────────────────────────────
// Pasted game source can legitimately be several megabytes. Netlify Functions
// buffer the whole request (6 MB) before this code runs, but a normal Node
// host can accept more; multer handles the game uploads separately.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Request logging ───────────────────────────────────
// Netlify captures stdout, so this is the log for both local and deployed
// runs. Set HTTP_LOG=false to silence it.
if (process.env.HTTP_LOG !== 'false') {
  app.use((req, res, next) => {
    const length = req.headers['content-length'] || '0';
    console.log(`${req.method} ${req.originalUrl} - ${length} bytes`);
    next();
  });
}

// ─── Routes ────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/jokes', require('./routes/jokes'));
app.use('/api/doodles', require('./routes/doodles'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/episodes', require('./routes/episodes'));
app.use('/api/games', require('./routes/games'));
app.use('/api/characters', require('./routes/characters'));
app.use('/api/fridge', require('./routes/fridge'));
app.use('/api/random', require('./routes/random'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/stats', require('./routes/stats'));

// ─── Health checks ─────────────────────────────────────
// Useful after switching the database host: /api/health/db says whether the
// running instance can actually reach Postgres.
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'snowsnakes-api', uptime: process.uptime() });
});

app.get('/api/health/db', async (req, res) => {
  const started = Date.now();
  try {
    const { pool } = require('./config/db');
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'reachable', latencyMs: Date.now() - started });
  } catch (err) {
    res.status(503).json({
      ok: false,
      database: 'unreachable',
      latencyMs: Date.now() - started,
      error: err.message,
    });
  }
});

// ─── Global error handler ──────────────────────────────
// Multer errors (file type/size/field limits) otherwise fall through to
// Express's default HTML error page, which breaks the frontend's
// response.json() with "Unexpected token '<'" / "Unexpected token 'F'".
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.status || (err.code && String(err.code).startsWith('LIMIT_') ? 400 : 500);
  let message = err.message || 'Internal Server Error';

  if (err.code === 'LIMIT_FILE_SIZE') {
    const mb = Math.round(Number(process.env.GAME_MAX_FILE_BYTES || 4 * 1000 * 1000) / (1024 * 1024));
    status = 400;
    message = `That file is too large. Game assets are limited to ${mb} MB per file.`;
  } else if (err.code === 'LIMIT_FILE_COUNT') {
    status = 400;
    message = 'Too many files. Games are limited to 100 files.';
  }

  console.error('❌ Error:', err);
  res.status(status).json({ error: message });
});

module.exports = app;
