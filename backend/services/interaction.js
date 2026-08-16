const { pool } = require('../config/db');
const Joke = require('../models/Joke');
const Doodle = require('../models/Doodle');

class Interaction {
  // ─── Like ──────────────────────────────────────────────────
  static async toggleLike(userId, contentType, contentId) {
    const tableName = contentType + 's'; // 'joke' -> 'jokes', 'doodle' -> 'doodles'
    const userIdStr = String(userId);

    try {
      // Check if like exists
      const like = await pool.query(
        'SELECT * FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
        [userIdStr, contentType, contentId]
      );

      if (like.rows.length > 0) {
        // Unlike
        await pool.query(
          'DELETE FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
          [userIdStr, contentType, contentId]
        );
        await pool.query(
          `UPDATE ${tableName} SET likes = likes - 1 WHERE id = $1`,
          [contentId]
        );
        return { liked: false };
      } else {
        // Like
        await pool.query(
          'INSERT INTO likes (user_id, content_type, content_id) VALUES ($1, $2, $3)',
          [userIdStr, contentType, contentId]
        );
        await pool.query(
          `UPDATE ${tableName} SET likes = likes + 1 WHERE id = $1`,
          [contentId]
        );
        return { liked: true };
      }
    } catch (err) {
      console.error(`❌ toggleLike error for ${contentType} ${contentId}:`, err);
      throw err;
    }
  }

  // ─── Comment ──────────────────────────────────────────────
  static async addComment(userId, contentType, contentId, text) {
    // Determine which foreign key column to use
    const fkColumn = contentType === 'joke' ? 'joke_id' : 'doodle_id';
    const result = await pool.query(
      `INSERT INTO comments (user_id, ${fkColumn}, text, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [userId, contentId, text]
    );
    return result.rows[0];
  }

  // ─── Get Comments ─────────────────────────────────────────
  static async getComments(contentType, contentId) {
    const fkColumn = contentType === 'joke' ? 'joke_id' : 'doodle_id';
    const result = await pool.query(
      `SELECT c.*, u.username, u.display_name, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.${fkColumn} = $1
       ORDER BY c.created_at DESC`,
      [contentId]
    );
    return result.rows;
  }

  // ─── Share ──────────────────────────────────────────────────
  static async incrementShare(contentType, contentId) {
    if (contentType === 'joke') {
      return Joke.incrementShare(contentId);
    } else if (contentType === 'doodle') {
      return Doodle.incrementShare(contentId);
    } else {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
  }

  // ─── Get Like Status (for a single item) ──────────────────
  static async getLikeStatus(userId, contentType, contentId) {
    const result = await pool.query(
      'SELECT 1 FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
      [String(userId), contentType, contentId]
    );
    return result.rows.length > 0;
  }
}

module.exports = Interaction;