const { pool } = require('../config/db');

class Doodle {
  static async findAll() {
    const result = await pool.query('SELECT * FROM doodles ORDER BY id DESC');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM doodles WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ title, image_url, joke_id, character_id }) {
    const result = await pool.query(
      `INSERT INTO doodles (title, image_url, joke_id, character_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, image_url || '🎨', joke_id || null, character_id || null]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM doodles WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Doodle;