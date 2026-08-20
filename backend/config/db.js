const { Pool } = require('pg');
require('dotenv').config();

// ─── Force SSL off by using a non-SSL URL ──────────────
let connectionString = process.env.DATABASE_URL;

// Remove any sslmode or ssl parameters from the URL
connectionString = connectionString.replace(/\?.*$/, '');

const pool = new Pool({
  connectionString: connectionString,
  // Do NOT include any SSL options – this disables SSL entirely
});

// ─── Test connection on startup ──────────────────────────
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

module.exports = { pool };