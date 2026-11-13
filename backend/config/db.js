const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Free-tier / remote databases can be slow to accept a connection and can
// silently hang on a query. Without limits, a request waits forever and the
// visitor sees an empty page with no explanation. These bounds guarantee that
// every request either succeeds or fails within a predictable window, so the
// frontend can always show something (content, or an error with a retry).
let connectionString = process.env.DATABASE_URL;

// pg 8.23+ treats sslmode=require as verify-full, which rejects Aiven's
// self-signed chain even though we configure TLS explicitly below. The
// compatibility flag restores libpq's "encrypt, do not verify" behavior for
// require/prefer/verify-ca. An explicit verify-full is left alone.
if (
  connectionString &&
  !/[?&]uselibpqcompat=/i.test(connectionString) &&
  /[?&]sslmode=(require|prefer|verify-ca)(?:&|$)/i.test(connectionString)
) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

// Aiven (and most managed Postgres providers) require TLS. For a local
// database during development set DB_SSL=false, or put sslmode=disable in the
// URL. If DB_CA_CERT points at the provider's CA bundle, certificates are
// verified instead of merely encrypted.
const sslDisabled =
  String(process.env.DB_SSL || '').toLowerCase() === 'false' ||
  /[?&]sslmode=disable(?:&|$)/i.test(connectionString || '');

let ssl = false;
if (!sslDisabled) {
  ssl = { rejectUnauthorized: false };
  const caPath = process.env.DB_CA_CERT;
  if (caPath && fs.existsSync(caPath)) {
    ssl = { ca: fs.readFileSync(caPath), rejectUnauthorized: true };
  }
}

const pool = new Pool({
  connectionString,
  ssl,
  // How long a caller waits for a free connection from the pool.
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 15000),
  // How long an idle connection is kept before being closed. Aiven and
  // Netlify both close quiet connections; keep this below their timeouts.
  idleTimeoutMillis: 30000,
  // Give up on a query that the database hasn't answered in time, rather
  // than holding the request (and the connection) open indefinitely.
  query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 15000),
  statement_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 15000),
  max: Number(process.env.DB_POOL_MAX || 5),
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
