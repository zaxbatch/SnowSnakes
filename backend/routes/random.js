const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// The randomizer only ever shows one item from each table, but it used to
// load every row of all six tables (including every joke's full text and
// every game's pasted HTML code) and then pick one at random in Node.
// Asking the database for a single random row per table keeps the payload
// tiny and lets the queries run concurrently in one round trip.
const RANDOM_TABLES = [
  ['joke', 'jokes'],
  ['doodle', 'doodles'],
  ['comic', 'comics'],
  ['episode', 'episodes'],
  ['game', 'games'],
  ['character', 'characters'],
];

router.get('/', async (req, res) => {
  try {
    const results = await Promise.all(
      RANDOM_TABLES.map(([, table]) =>
        pool.query(`SELECT * FROM ${table} ORDER BY RANDOM() LIMIT 1`).then((r) => r.rows[0] || null)
      )
    );

    const payload = {};
    RANDOM_TABLES.forEach(([key], i) => { payload[key] = results[i]; });
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
