// Verifies the list query works against the real database and measures the
// payload reduction, by comparing the two column lists on the same rows.
const { pool } = require('./config/db');

// Mirrors Game.findAllForList. Note: no `files` column exists in production,
// only `file_count`.
const LIST_COLUMNS = `g.id, g.title, g.description, g.icon, g.tags, g.author_id, g.type,
                      g.votes, g.plays, g.file_count, g.created_at, g.shares, g.likes`;

const run = async (columns) => pool.query(`
  SELECT ${columns}, u.username as author_name
  FROM games g LEFT JOIN users u ON g.author_id = u.id
  ORDER BY g.created_at DESC`);

(async () => {
  const full = await run('g.*');
  const list = await run(LIST_COLUMNS);

  const size = (rows) => Buffer.byteLength(JSON.stringify(rows));
  const fullSize = size(full.rows);
  const listSize = size(list.rows);

  console.log('rows: full =', full.rows.length, '| list =', list.rows.length);
  if (full.rows.length !== list.rows.length) throw new Error('ROW COUNT CHANGED — list query is wrong');

  const fullKeys = Object.keys(full.rows[0] || {}).sort();
  const listKeys = Object.keys(list.rows[0] || {}).sort();
  console.log('\ncolumns removed from the list payload:', fullKeys.filter((k) => !listKeys.includes(k)).join(', ') || '(none)');
  console.log('columns kept:', listKeys.join(', '));

  // every field the gallery reads must survive
  const needed = ['id', 'title', 'description', 'icon', 'tags', 'type', 'votes', 'plays', 'file_count', 'likes', 'shares', 'author_id', 'author_name'];
  const missing = needed.filter((k) => !listKeys.includes(k));
  console.log('\ngallery-required fields missing:', missing.length ? missing.join(', ') : 'NONE');

  // the rows must be identical on every shared field
  let mismatches = 0;
  for (let i = 0; i < full.rows.length; i++) {
    for (const k of listKeys) {
      if (JSON.stringify(full.rows[i][k]) !== JSON.stringify(list.rows[i][k])) {
        mismatches++;
        if (mismatches < 4) console.log(`  MISMATCH id=${full.rows[i].id} field=${k}: ${full.rows[i][k]} vs ${list.rows[i][k]}`);
      }
    }
  }
  console.log('field mismatches across all rows:', mismatches);

  console.log(`\npayload: ${(fullSize / 1048576).toFixed(2)} MB -> ${(listSize / 1024).toFixed(1)} KB  (${(100 - (listSize / fullSize) * 100).toFixed(1)}% smaller)`);

  // sorting/search still behave
  for (const sort of ['likes', 'plays', 'votes', 'oldest', 'newest']) {
    const clause = { likes: 'g.likes DESC', plays: 'g.plays DESC', votes: 'g.votes DESC', oldest: 'g.created_at ASC', newest: 'g.created_at DESC' }[sort];
    const r = await pool.query(`SELECT ${LIST_COLUMNS} FROM games g LEFT JOIN users u ON g.author_id = u.id ORDER BY ${clause}`);
    console.log(`  sort=${sort.padEnd(7)} -> ${r.rows.length} rows, first: ${String(r.rows[0] && r.rows[0].title).slice(0, 26)}`);
  }
  const s = await pool.query(`SELECT ${LIST_COLUMNS} FROM games g LEFT JOIN users u ON g.author_id = u.id WHERE (g.title ILIKE $1 OR g.description ILIKE $1)`, ['%snow%']);
  console.log(`  search "snow" -> ${s.rows.length} rows`);

  const ok = missing.length === 0 && mismatches === 0 && full.rows.length === list.rows.length;
  console.log('\nRESULT:', ok ? 'PASS' : 'FAIL');
  await pool.end();
  process.exit(ok ? 0 : 1);
})().catch(async (e) => { console.error('FAILED:', e.message); await pool.end(); process.exit(1); });
