const { pool } = require('../config/db');

class Interaction {
  static async toggleLike(userId, contentType, contentId) {
    const userIdStr = String(userId);
    const like = await pool.query(
      'SELECT * FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
      [userIdStr, contentType, contentId]
    );
    if (like.rows.length > 0) {
      await pool.query(
        'DELETE FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
        [userIdStr, contentType, contentId]
      );
      await pool.query(`UPDATE ${contentType}s SET likes = likes - 1 WHERE id = $1`, [contentId]);
      return { liked: false };
    } else {
      await pool.query(
        'INSERT INTO likes (user_id, content_type, content_id) VALUES ($1, $2, $3)',
        [userIdStr, contentType, contentId]
      );
      await pool.query(`UPDATE ${contentType}s SET likes = likes + 1 WHERE id = $1`, [contentId]);
      return { liked: true };
    }
  }

  static async addComment(userId, contentType, contentId, text) {
    const result = await pool.query(
      `INSERT INTO comments (user_id, content_type, content_id, text, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [userId, contentType, contentId, text]
    );
    return result.rows[0];
  }

  static async getComments(contentType, contentId) {
    const result = await pool.query(
      `SELECT c.*, u.username, u.display_name, u.avatar
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.content_type = $1 AND c.content_id = $2
       ORDER BY c.created_at DESC`,
      [contentType, contentId]
    );
    return result.rows;
  }

  static async incrementShare(contentType, contentId) {
    const result = await pool.query(
      `UPDATE ${contentType}s SET shares = shares + 1 WHERE id = $1 RETURNING shares`,
      [contentId]
    );
    return result.rows[0];
  }

  static async getLikeStatus(userId, contentType, contentId) {
    if (!userId) return false;
    const result = await pool.query(
      'SELECT 1 FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
      [String(userId), contentType, contentId]
    );
    return result.rows.length > 0;
  }
}

module.exports = Interaction;