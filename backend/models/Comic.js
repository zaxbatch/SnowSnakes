const { pool } = require('../config/db');

class Comic {
  static async findAll() {
    const result = await pool.query(`
      SELECT c.*, u.username as author_name
      FROM comics c
      LEFT JOIN users u ON c.author_id = u.id
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT c.*, u.username as author_name
      FROM comics c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create({ title, scene, dialogue, caption, characters, image_url, author_id }) {
    const result = await pool.query(
      `INSERT INTO comics (title, scene, dialogue, caption, characters, image_url, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, scene || '📢', dialogue || '', caption || '', characters || [], image_url || null, author_id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM comics WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Comic;