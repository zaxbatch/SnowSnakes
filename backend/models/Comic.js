const { pool } = require('../config/db');

class Comic {
  // ─── Find all with search & sort ─────────────────────────
  static async findAll({ search, sort } = {}) {
    let query = `
      SELECT c.*, u.username as author_name
      FROM comics c
      LEFT JOIN users u ON c.author_id = u.id
    `;
    const values = [];
    const conditions = [];
    if (search) {
      conditions.push(`(c.title ILIKE $${values.length + 1} OR c.dialogue ILIKE $${values.length + 1})`);
      values.push(`%${search}%`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    switch (sort) {
      case 'likes': query += ' ORDER BY c.likes DESC'; break;
      case 'oldest': query += ' ORDER BY c.created_at ASC'; break;
      default: query += ' ORDER BY c.created_at DESC';
    }
    const result = await pool.query(query, values);
    return result.rows;
  }

  // ─── Find by ID ──────────────────────────────────────────
  static async findById(id) {
    const result = await pool.query(`
      SELECT c.*, u.username as author_name
      FROM comics c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.id = $1
    `, [id]);
    return result.rows[0];
  }

  // ─── Create ──────────────────────────────────────────────
  static async create({ title, scene, dialogue, caption, characters, image_url, author_id }) {
    const result = await pool.query(
      `INSERT INTO comics (title, scene, dialogue, caption, characters, image_url, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, scene || '📢', dialogue || '', caption || '', characters || [], image_url || null, author_id]
    );
    return result.rows[0];
  }

  // ─── Delete ──────────────────────────────────────────────
  static async delete(id) {
    const result = await pool.query('DELETE FROM comics WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Comic;