const { pool } = require('../config/db');

class Game {
  // ─── Find all with search & sort ─────────────────────────
  static async findAll({ search, sort } = {}) {
    let query = `
      SELECT g.*, u.username as author_name
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