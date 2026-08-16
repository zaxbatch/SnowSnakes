const { pool } = require('../config/db');

class Doodle {
  static async findAll() {
    const result = await pool.query(`
      SELECT d.*, 
             u.username as author_name,
             j.content as joke_content,
             c.name as character_name
      FROM doodles d
      LEFT JOIN jokes j ON d.joke_id = j.id
      LEFT JOIN characters c ON d.character_id = c.id
      LEFT JOIN users u ON j.author_id = u.id
      ORDER BY d.created_at DESC
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT d.*, 
             u.username as author_name,
             j.content as joke_content,
             c.name as character_name
      FROM doodles d
      LEFT JOIN jokes j ON d.joke_id = j.id
      LEFT JOIN characters c ON d.character_id = c.id
      LEFT JOIN users u ON j.author_id = u.id
      WHERE d.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create({ title, image_url, joke_id, character_id }) {
    const result = await pool.query(
      `INSERT INTO doodles (title, image_url, joke_id, character_id, likes, shares)
       VALUES ($1, $2, $3, $4, 0, 0) RETURNING *`,
      [title, image_url, joke_id || null, character_id || null]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM doodles WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Doodle;