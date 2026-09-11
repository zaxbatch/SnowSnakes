// Measure the two things that decide page-load time on the deployed site:
//   1. the latency of a single round trip to the remote database
//   2. how many round trips each endpoint makes
// Run with: node backend/bench.js   (from the repo root: node backend/bench.js)
// Useful for spotting a query pattern that costs one round trip per row —
// on a remote/free-tier database that latency, not CPU, is what visitors feel.
require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

const timeIt = async (label, fn, runs = 7) => {
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const t = process.hrtime.bigint();
    await fn();
    samples.push(Number(process.hrtime.bigint() - t) / 1e6);
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length / 2)];
  const min = samples[0];
  console.log(`${label.padEnd(46)} median ${median.toFixed(1).padStart(7)} ms   min ${min.toFixed(1).padStart(7)} ms`);
  return median;
};

(async () => {
  console.log('── Remote database round-trip cost ──');
  const rtt = await timeIt('SELECT 1 (one round trip)', () => pool.query('SELECT 1'));
  const rttWithJoin = await timeIt('comments JOIN users (id = $1)', () =>
    pool.query(`SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.content_type = $1 AND c.content_id = $2 ORDER BY c.created_at DESC`, ['joke', 1]));

  console.log('\n── Row counts (drive the N+1 cost) ──');
  const counts = await pool.query(`
    SELECT (SELECT COUNT(*) FROM jokes) jokes, (SELECT COUNT(*) FROM doodles) doodles,
           (SELECT COUNT(*) FROM comics) comics, (SELECT COUNT(*) FROM episodes) episodes,
           (SELECT COUNT(*) FROM games) games`);
  const c = counts.rows[0];
  Object.entries(c).forEach(([k, v]) => console.log(`   ${k.padEnd(10)} ${v}`));

  console.log('\n── Round trips per request: BEFORE -> AFTER ──');
  const n = (k) => Number(c[k]) || 0;
  // With a logged-in visitor each row also needed a like-status lookup, hence
  // the *2 on the galleries.
  const rows = [
    ['GET /api/jokes', n('jokes') + 1, 2],
    ['GET /api/doodles', n('doodles') * 2 + 1, 3],
    ['GET /api/comics', n('comics') * 2 + 1, 3],
    ['GET /api/episodes', n('episodes') * 2 + 1, 3],
    ['GET /api/games', n('games') * 2 + 1, 3],
    ['GET /api/random', 6, 6],
  ];
  let beforeTotal = 0, afterTotal = 0;
  for (const [name, before, after] of rows) {
    beforeTotal += before; afterTotal += after;
    console.log(`   ${name.padEnd(20)} ${String(before).padStart(3)} -> ${String(after).padStart(3)}   (this box: ${(before * rtt).toFixed(0)} ms -> ${(after * rtt).toFixed(0)} ms)`);
  }

  console.log('\n── Home page ──');
  console.log('   GET /api/stats          replaces 5 full-table downloads with 1 COUNT query');

  // The N+1 cost is what grows with content. Express it for realistic sizes.
  console.log('\n── How the jokes page scales with content ──');
  console.log('   (database time only, at a 60 ms round trip typical of a visitor');
  console.log('    far from a free-tier database in another region)');
  const visitorRtt = 60;
  console.log('   jokes   BEFORE (n+1 queries)   AFTER (1 batched query)');
  for (const count of [9, 25, 50, 100, 250]) {
    const before = (count + 1) * visitorRtt;
    const after = 2 * visitorRtt;
    console.log(`   ${String(count).padStart(5)}   ${(before / 1000).toFixed(2).padStart(10)} s   ${(after / 1000).toFixed(2).padStart(20)} s`);
  }
  console.log('   The old cost grew linearly with the number of jokes; the new one is constant.');

  console.log('\n── What a visitor waits for on /jokes right now ──');
  console.log(`   round trips    ${n('jokes') + 1} -> 2`);
  console.log(`   database time  ${((n('jokes') + 1) * rtt).toFixed(0)} ms -> ${(2 * rtt).toFixed(0)} ms (at ${rtt.toFixed(1)} ms measured from this machine)`);

  await pool.end();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
