const { Pool } = require('pg');
require('dotenv').config();

// Free-tier / remote databases can be slow to accept a connection and can
// silently hang on a query. Without limits, a request waits forever and the
// visitor sees an empty page with no explanation. These bounds guarantee that
// every request either succeeds or fails within a predictable window, so the
// frontend can always show something (content, or an error with a retry).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // How long a caller waits for a free connection from the pool.
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 15000),
  // How long an idle connection is kept before being closed.
  idleTimeoutMillis: 30000,
  // Give up on a query that the database hasn't answered in time, rather
  // than holding the request (and the connection) open indefinitely.
  query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 15000),
  statement_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 15000),
  max: Number(process.env.DB_POOL_MAX || 10),
  keepAlive: true,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// A pool-level error (e.g. the database dropping an idle connection) would
// otherwise crash the whole process and take the site down with it.
pool.on('error', (err) => {
  console.error('⚠️ Idle database client error (recovered):', err.message);
});

module.exports = { pool };
