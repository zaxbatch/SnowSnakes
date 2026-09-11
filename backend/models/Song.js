const { pool } = require('../config/db');

class Song {
  // ─── Find all with search & sort ─────────────────────────
  static async findAll({ search, sort } = {}) {
    let query = `
      SELECT s.*, u.username as author_name
      FROM songs s
      LEFT JOIN users u ON s.author_id = u.id
    `;
    const values = [];
    const conditions = [];
    if (search) {
      conditions.push(`(s.title ILIKE $${values.length + 1} OR u.username ILIKE $${values.length + 1})`);
      values.push(`%${search}%`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    switch (sort) {
      case 'likes': query += ' ORDER BY s.likes DESC, s.created_at DESC'; break;
      case 'oldest': query += ' ORDER BY s.created_at ASC'; break;
      case 'title': query += ' ORDER BY s.title ASC'; break;
      default: query += ' ORDER BY s.created_at DESC';
    }
    const result = await pool.query(query, values);
    return result.rows;
  }

  // ─── Find by ID ──────────────────────────────────────────
  static async findById(id) {
    const result = await pool.query(`
      SELECT s.*, u.username as author_name
      FROM songs s
      LEFT JOIN users u ON s.author_id = u.id
      WHERE s.id = $1
    `, [id]);
    return result.rows[0];
  }

  // ─── Create ──────────────────────────────────────────────
  static async create({ title, audio_url, cover_url, author_id }) {
    const result = await pool.query(
      `INSERT INTO songs (title, audio_url, cover_url, author_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, audio_url || null, cover_url || null, author_id]
    );
    return result.rows[0];
  }

  // ─── Delete ──────────────────────────────────────────────
  static async delete(id) {
    const result = await pool.query('DELETE FROM songs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Song;
