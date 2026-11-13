// Applies every SQL file in backend/migrations, in filename order.
//
// The migrations are written to be idempotent, so this is safe to run on
// every boot. A Postgres advisory lock serializes the work when more than one
// instance starts at the same time (Netlify can start several).
//
// A failure is logged and the remaining files still run: a schema problem
// should not take the site down, and the next boot will try again.

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const LOCK_KEY = 727274; // arbitrary, stable for this app

const readMigrationFiles = () => {
  try {
    return fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
};

const runMigrations = async ({ log = console } = {}) => {
  const files = readMigrationFiles();
  if (files.length === 0) {
    log.warn('⚠️ No migrations found, skipping');
    return { applied: [], failed: [] };
  }

  const client = await pool.connect();
  const applied = [];
  const failed = [];

  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

    for (const file of files) {
      try {
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        await client.query(sql);
        applied.push(file);
        log.log(`✅ Migration applied: ${file}`);
      } catch (err) {
        failed.push(file);
        log.error(`⚠️ Migration failed (${file}): ${err.message}`);
        // A failed statement inside BEGIN leaves the connection in an aborted
        // transaction. Without this rollback every later migration would fail
        // with "current transaction is aborted" instead of its own error.
        try {
          await client.query('ROLLBACK');
        } catch (rollbackErr) {
          log.error(`⚠️ Could not roll back after ${file}: ${rollbackErr.message}`);
        }
      }
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]);
    } catch (err) {
      // The connection is going away; Postgres releases the lock with it.
    }
    client.release();
  }

  return { applied, failed };
};

module.exports = { runMigrations, MIGRATIONS_DIR };
