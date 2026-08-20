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
app.use('/api/comics', require('./backend/routes/comics'));
app.use('/api/episodes', require('./backend/routes/episodes'));
app.use('/api/games', require('./backend/routes/games'));
app.use('/api/characters', require('./backend/routes/characters'));
app.use('/api/fridge', require('./backend/routes/fridge'));
app.use('/api/random', require('./backend/routes/random'));
app.use('/api/upload', require('./backend/routes/upload'));

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

// ─── Start Server ──────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at /api`);
  console.log(`🌐 ${process.env.NODE_ENV === 'production' ? 'Frontend served from /frontend/build' : 'Dev mode: use npm run dev'}`);
});