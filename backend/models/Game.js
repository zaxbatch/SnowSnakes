const { pool } = require('../config/db');

class Game {
  static async findAll() {
    const result = await pool.query(`
      SELECT g.*, u.username as author_name
      FROM games g
      LEFT JOIN users u ON g.author_id = u.id
      ORDER BY g.votes DESC, g.created_at DESC
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT g.*, u.username as author_name
      FROM games g
      LEFT JOIN users u ON g.author_id = u.id
      WHERE g.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create({ title, description, icon, tags, author_id, type = 'user', code = '', files = [] }) {
    const result = await pool.query(
      `INSERT INTO games (title, description, icon, tags, author_id, type, code, files, votes, plays)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0) RETURNING *`,
      [title, description, icon || '🎮', tags || [], author_id, type, code, JSON.stringify(files)]
    );
    return result.rows[0];
  }

  // ✅ This method was missing – adds uploaded file metadata to the game
  static async updateFiles(id, files) {
    const result = await pool.query(
      `UPDATE games SET files = $1 WHERE id = $2 RETURNING *`,
      [JSON.stringify(files), id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async vote(id) {
    const result = await pool.query('UPDATE games SET votes = votes + 1 WHERE id = $1 RETURNING votes', [id]);
    return result.rows[0];
  }

  static async play(id) {
    const result = await pool.query('UPDATE games SET plays = plays + 1 WHERE id = $1 RETURNING plays', [id]);
    return result.rows[0];
  }
}

module.exports = Game;