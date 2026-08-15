const { pool } = require('../config/db');

class Episode {
  // Get all episodes (read-only)
  static async findAll() {
    const result = await pool.query(`
      SELECT * FROM episodes ORDER BY id ASC
    `);
    return result.rows;
  }

  // Get a single episode
  static async findById(id) {
    const result = await pool.query('SELECT * FROM episodes WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Get only featured episodes
  static async findFeatured() {
    const result = await pool.query(`
      SELECT * FROM episodes WHERE featured = true ORDER BY id ASC
    `);
    return result.rows;
  }
}

module.exports = Episode;