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

// ─── Serve Static Frontend (production) ──────────────
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'frontend', 'build');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  // In development, just show a message (you'll use dev script)
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