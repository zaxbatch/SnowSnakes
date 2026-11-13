#!/usr/bin/env node
// Manual migration entry point:
//     npm run migrate
//
// Reads backend/.env when present; on Netlify, set DATABASE_URL in the site's
// environment instead (builds and servers receive the same variables).

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { runMigrations } = require('../db/migrate');
const { pool } = require('../config/db');

(async () => {
  try {
    const { applied, failed } = await runMigrations();
    console.log(
      `Migrations finished: ${applied.length} applied, ${failed.length} failed` +
        (failed.length ? ` (${failed.join(', ')})` : '')
    );
    process.exitCode = failed.length ? 1 : 0;
  } catch (err) {
    console.error('❌ Migration run failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
})();
