require('dotenv').config({ path: __dirname + '/backend/.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ─── CORS ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

// ─── Increase limits ──────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── API Routes (mount from backend) ──────────────────
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/admin', require('./backend/routes/admin'));
app.use('/api/jokes', require('./backend/routes/jokes'));
app.use('/api/doodles', require('./backend/routes/doodles'));
app.use('/api/songs', require('./backend/routes/songs'));
app.use('/api/episodes', require('./backend/routes/episodes'));
app.use('/api/games', require('./backend/routes/games'));
app.use('/api/characters', require('./backend/routes/characters'));
app.use('/api/fridge', require('./backend/routes/fridge'));
app.use('/api/random', require('./backend/routes/random'));
app.use('/api/upload', require('./backend/routes/upload'));
app.use('/api/stats', require('./backend/routes/stats'));

// ─── Schema migrations on boot ────────────────────────
// The files in backend/migrations are the record of how the schema has to
// look. They are written to be idempotent (every change is guarded or purely
// permissive), so running them on startup is safe and keeps a deploy from
// shipping code that expects a shape the database does not have yet.
//
// This exists because the database cannot be reached from a command-line
// script on this host: node aborts as soon as any async socket is opened, so
// `node migrate.js` and a local psql are both unavailable. The long-running
// server process has no such problem, so it applies them here instead.
//
// A failure is logged and never stops the server: a migration problem should
// not take the whole site down, and the next boot will try again.
const runMigrations = async () => {
  const fs = require('fs');
  const dir = path.join(__dirname, 'backend', 'migrations');
  let files = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  } catch (err) {
    console.warn('⚠️ No migrations directory found, skipping:', err.message);
    return;
  }
  const { pool } = require('./backend/config/db');
  for (const file of files) {
    try {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      await pool.query(sql);
      console.log(`✅ Migration applied: ${file}`);
    } catch (err) {
      console.error(`⚠️ Migration failed (${file}): ${err.message}`);
    }
  }
};

// ─── Temporary: Test database connection ──────────────
app.get('/api/test-db', async (req, res) => {
  try {
    const { pool } = require('./backend/config/db');
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      connected: true, 
      time: result.rows[0].now,
      message: 'Database connection successful'
    });
  } catch (err) {
    console.error('Database test failed:', err);
    res.status(500).json({ 
      connected: false, 
      error: err.message,
      stack: err.stack 
    });
  }
});

// ─── Serve Static Frontend (production) ──────────────
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

// ─── Global error handler ────────────────────────────────
// Multer errors (file type/size/field limits) otherwise fall through to
// Express's default HTML error page, which breaks the frontend's
// response.json() with "Unexpected token '<'" / "Unexpected token 'F'".
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || (err.code && err.code.startsWith('LIMIT_') ? 400 : 500);
  const message = err.message || 'Internal Server Error';
  console.error('❌ Error:', err);
  res.status(status).json({ error: message });
});

// ─── Start Server ──────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at /api`);
  console.log(`🌐 ${process.env.NODE_ENV === 'production' ? 'Frontend served from /frontend/build' : 'Dev mode: use npm run dev'}`);
  // Deliberately not awaited: the site starts serving immediately and the
  // schema catches up alongside.
  runMigrations();
});