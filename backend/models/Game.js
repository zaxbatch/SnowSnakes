const { pool } = require('../config/db');

class Game {
  // Get all games
  static async findAll() {
    const result = await pool.query(`
      SELECT g.*, u.username as author_name
      FROM games g
      LEFT JOIN users u ON g.author_id = u.id
      ORDER BY g.votes DESC, g.created_at DESC
    `);
    return result.rows;
  }

  // Get a single game
  static async findById(id) {
    const result = await pool.query(`
      SELECT g.*, u.username as author_name
      FROM games g
      LEFT JOIN users u ON g.author_id = u.id
      WHERE g.id = $1
    `, [id]);
    return result.rows[0];
  }

  // Create a new game
  static async create({ title, description, icon, code, tags, author_id, type = 'user', file_count = 0 }) {
    const result = await pool.query(
      `INSERT INTO games (title, description, icon, code, tags, author_id, type, file_count, votes, plays)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0) RETURNING *`,
      [title, description, icon || '🎮', code || '', tags || [], author_id, type, file_count]
    );
    return result.rows[0];
  }

  // Vote for a game
  static async vote(id) {
    const result = await pool.query(
      `UPDATE games SET votes = votes + 1 WHERE id = $1 RETURNING votes`,
      [id]
    );
    return result.rows[0];
  }

  // Increment play count
  static async play(id) {
    const result = await pool.query(
      `UPDATE games SET plays = plays + 1 WHERE id = $1 RETURNING plays`,
      [id]
    );
    return result.rows[0];
  }

  // Delete a game
  static async delete(id) {
    const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Game;