const { Pool } = require('pg');
require('dotenv').config();

// ─── Ensure SSL is enabled in the connection string ──────────
let connectionString = process.env.DATABASE_URL;

// If no sslmode parameter, add it
if (connectionString && !connectionString.includes('sslmode=')) {
  const separator = connectionString.includes('?') ? '&' : '?';
  connectionString += `${separator}sslmode=require`;
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false   // ✅ Accept self‑signed certificates
  }
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