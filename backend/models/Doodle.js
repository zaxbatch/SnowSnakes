const { pool } = require('../config/db');

class Doodle {
  // ─── Find all with search & sort ─────────────────────────
  static async findAll({ search, sort } = {}) {
    let query = 'SELECT * FROM doodles';
    const values = [];
    const conditions = [];
    if (search) {
      conditions.push(`title ILIKE $${values.length + 1}`);
      values.push(`%${search}%`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    switch (sort) {
      case 'likes': query += ' ORDER BY likes DESC'; break;
      case 'oldest': query += ' ORDER BY created_at ASC'; break;
      default: query += ' ORDER BY created_at DESC';
    }
    const result = await pool.query(query, values);
    return result.rows;
  }

  // ─── Find by ID ──────────────────────────────────────────
  static async findById(id) {
    const result = await pool.query('SELECT * FROM doodles WHERE id = $1', [id]);
    return result.rows[0];
  }

  // ─── Create ──────────────────────────────────────────────
  static async create({ title, image_url, joke_id, character_id }) {
    const result = await pool.query(
      `INSERT INTO doodles (title, image_url, joke_id, character_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, image_url || '🎨', joke_id || null, character_id || null]
    );
    return result.rows[0];
  }

  // ─── Delete ──────────────────────────────────────────────
  static async delete(id) {
    const result = await pool.query('DELETE FROM doodles WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // ─── Increment share ─────────────────────────────────────
  static async incrementShare(id) {
    const result = await pool.query(
      'UPDATE doodles SET shares = shares + 1 WHERE id = $1 RETURNING shares',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Doodle;