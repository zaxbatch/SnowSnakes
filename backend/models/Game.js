const { pool } = require('../config/db');

class Game {
  // ─── Find all with search & sort ─────────────────────────
  //
  // NOTE: this returns the full row including `code`, which holds the pasted
  // game source. One game on this site carries 5.3 MB of it, so calling this
  // to render the gallery shipped ~5.4 MB per page load. Use findAllForList()
  // for lists; keep this for anything that actually needs the code.
  static async findAll({ search, sort } = {}) {
    return this._find({ search, sort, columns: 'g.*' });
  }

  // ─── Find all WITHOUT the game source (for list/gallery views) ───
  // Everything the gallery renders, minus the multi-megabyte `code` column.
  // Note: production's games table has no `files` column (only `file_count`),
  // so the badge count comes from file_count rather than a files array.
  static async findAllForList({ search, sort } = {}) {
    return this._find({
      search,
      sort,
      columns: `g.id, g.title, g.description, g.icon, g.tags, g.author_id, g.type,
                g.votes, g.plays, g.file_count, g.created_at, g.shares, g.likes`,
    });
  }

  static async _find({ search, sort, columns }) {
    let query = `
      SELECT ${columns}, u.username as author_name
      FROM games g
      LEFT JOIN users u ON g.author_id = u.id
    `;
    const values = [];
    const conditions = [];
    if (search) {
      conditions.push(`(g.title ILIKE $${values.length + 1} OR g.description ILIKE $${values.length + 1})`);
      values.push(`%${search}%`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    switch (sort) {
      case 'likes': query += ' ORDER BY g.likes DESC'; break;
      case 'plays': query += ' ORDER BY g.plays DESC'; break;
      case 'votes': query += ' ORDER BY g.votes DESC'; break;
      case 'oldest': query += ' ORDER BY g.created_at ASC'; break;
      default: query += ' ORDER BY g.created_at DESC';
    }
    const result = await pool.query(query, values);
    return result.rows;
  }

  // ─── Find by ID ──────────────────────────────────────────
  static async findById(id) {
    const result = await pool.query(`
      SELECT g.*, u.username as author_name
      FROM games g
      LEFT JOIN users u ON g.author_id = u.id
      WHERE g.id = $1
    `, [id]);
    return result.rows[0];
  }

  // ─── Create ──────────────────────────────────────────────
  static async create({ title, description, icon, tags, author_id, type = 'user', code = '', file_count = 0 }) {
    const result = await pool.query(
      `INSERT INTO games (title, description, icon, tags, author_id, type, code, file_count, votes, plays)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0) RETURNING *`,
      [title, description, icon || '🎮', tags || [], author_id, type, code || '', file_count]
    );
    return result.rows[0];
  }

  // ─── Delete ──────────────────────────────────────────────
  static async delete(id) {
    const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // ─── Vote ─────────────────────────────────────────────────
  static async vote(id) {
    const result = await pool.query('UPDATE games SET votes = votes + 1 WHERE id = $1 RETURNING votes', [id]);
    return result.rows[0];
  }

  // ─── Play count ──────────────────────────────────────────
  static async play(id) {
    const result = await pool.query('UPDATE games SET plays = plays + 1 WHERE id = $1 RETURNING plays', [id]);
    return result.rows[0];
  }
}

module.exports = Game;