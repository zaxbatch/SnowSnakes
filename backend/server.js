// Increase Node's default timeout and thread pool size
require('http').globalAgent.maxSockets = Infinity;
process.env.UV_THREADPOOL_SIZE = 128;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// ─── CORS ───────────────────────────────────────────────
app.use(cors());

// ─── Aggressive timeouts ──────────────────────────────
app.use((req, res, next) => {
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000);
  req.socket.setTimeout(600000);
  next();
});

// ─── Increase limits for large JSON/form data ─────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Logging middleware ──────────────────────────────
app.use((req, res, next) => {
  const contentLength = req.headers['content-length'] || '0';
  console.log(`${req.method} ${req.url} - Content-Length: ${contentLength} bytes`);
  if (req.method === 'POST' && req.url.startsWith('/api/games')) {
    console.log('⚠️ Large upload detected – waiting for files...');
  }
  next();
});

// ─── Serve uploaded files statically ──────────────────
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ──────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/jokes', require('./routes/jokes'));
app.use('/api/doodles', require('./routes/doodles'));
app.use('/api/comics', require('./routes/comics'));
app.use('/api/episodes', require('./routes/episodes'));
app.use('/api/games', require('./routes/games'));
app.use('/api/characters', require('./routes/characters'));
app.use('/api/fridge', require('./routes/fridge'));
app.use('/api/random', require('./routes/random'));
app.use('/api/upload', require('./routes/upload'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🕐 Timeouts set to 10 minutes`);
  console.log(`🧵 Thread pool size: ${process.env.UV_THREADPOOL_SIZE}`);
});