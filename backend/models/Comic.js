const { pool } = require('../config/db');

class Comic {
  // Get all comics
  static async findAll() {
    const result = await pool.query(`
      SELECT c.*, u.username as author_name, u.display_name
      FROM comics c
      LEFT JOIN users u ON c.author_id = u.id
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  }

  // Get a single comic
  static async findById(id) {
    const result = await pool.query(`
      SELECT c.*, u.username as author_name, u.display_name
      FROM comics c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.id = $1
    `, [id]);
    return result.rows[0];
  }

  // Create a new comic
  static async create({ title, scene, dialogue, caption, characters, author_id, image_url }) {
    const result = await pool.query(
      `INSERT INTO comics (title, scene, dialogue, caption, characters, author_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        title, 
        scene || '📢', 
        dialogue || '', 
        caption || '', 
        characters || [], 
        author_id || null, 
        image_url || null
      ]
    );
    return result.rows[0];
  }

  // Delete a comic
  static async delete(id) {
    const result = await pool.query('DELETE FROM comics WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Comic;