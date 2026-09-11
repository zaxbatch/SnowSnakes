const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// ─── Site-wide counts ────────────────────────────────────
// The home page only needs how many of each thing exist, but it used to
// download every joke, doodle, comic, episode and game just to read
// .length off each array. That was five full-table transfers on every
// visit — on a free-tier database, with remote latency, it was the
// slowest request the site made. COUNT(*) in one round trip is enough.
//
// The counts are cached briefly so repeated home-page visits (and the
// inevitable refresh-happy visitor) don't re-hit the database at all.
const CACHE_TTL_MS = 60 * 1000;
let cache = { at: 0, data: null };

router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && now - cache.at < CACHE_TTL_MS) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(cache.data);
    }

    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM jokes)     AS jokes,
        (SELECT COUNT(*) FROM doodles)   AS doodles,
        (SELECT COUNT(*) FROM songs)     AS songs,
        (SELECT COUNT(*) FROM episodes)  AS episodes,
        (SELECT COUNT(*) FROM games)     AS games
    `);

    const row = rows[0] || {};
    const data = {
      jokes: Number(row.jokes) || 0,
      doodles: Number(row.doodles) || 0,
      songs: Number(row.songs) || 0,
      episodes: Number(row.episodes) || 0,
      games: Number(row.games) || 0,
    };

    cache = { at: now, data };
    res.set('Cache-Control', 'public, max-age=60');
    res.json(data);
  } catch (err) {
    // A stats failure must never break the home page — let the client show
    // dashes instead of an error.
    console.error('Error fetching stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
