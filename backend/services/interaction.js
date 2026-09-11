const { pool } = require('../config/db');

class Interaction {
  // ─── Like ──────────────────────────────────────────────────
  static async toggleLike(userId, contentType, contentId) {
    const tableName = contentType + 's'; // e.g. 'game' -> 'games'
    const userIdStr = String(userId);

    try {
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
    const result = await pool.query(
      `INSERT INTO comments (user_id, content_type, content_id, text, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [userId, contentType, contentId, text]
    );
    return result.rows[0];
  }

  // ─── Get Comments ─────────────────────────────────────────
  static async getComments(contentType, contentId) {
    const result = await pool.query(
      `SELECT c.*, u.username, u.display_name, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.content_type = $1 AND c.content_id = $2
       ORDER BY c.created_at DESC`,
      [contentType, contentId]
    );
    return result.rows;
  }

  // ─── Share ──────────────────────────────────────────────────
  static async incrementShare(contentType, contentId) {
    const tableName = contentType + 's';
    const result = await pool.query(
      `UPDATE ${tableName} SET shares = shares + 1 WHERE id = $1 RETURNING shares`,
      [contentId]
    );
    return result.rows[0] || null; // returns { shares: newCount }
  }

  // ─── Get Like Status ──────────────────────────────────────
  static async getLikeStatus(userId, contentType, contentId) {
    const result = await pool.query(
      'SELECT 1 FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
      [String(userId), contentType, contentId]
    );
    return result.rows.length > 0;
  }

  // ─── Batch helpers (N+1 fix) ────────────────────────────────
  // List endpoints used to call getComments()/getLikeStatus() inside a loop,
  // i.e. one database round trip per row. Against a remote or free-tier
  // database that latency dominates the page load: 20 jokes meant 20
  // sequential round trips before the list could render. These two helpers
  // fetch everything for a whole page in a single query each.

  // Returns Map<contentId, comment[]>; every requested id is present.
  static async getCommentsForMany(contentType, contentIds) {
    const ids = [...new Set((contentIds || []).map(Number).filter(Number.isInteger))];
    const grouped = new Map(ids.map((id) => [id, []]));
    if (ids.length === 0) return grouped;

    const result = await pool.query(
      `SELECT c.*, u.username, u.display_name, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.content_type = $1 AND c.content_id = ANY($2::int[])
       ORDER BY c.created_at DESC`,
      [contentType, ids]
    );

    for (const row of result.rows) {
      const bucket = grouped.get(Number(row.content_id));
      if (bucket) bucket.push(row);
    }
    return grouped;
  }

  // Returns a Set of the content ids this user has liked.
  static async getLikedIds(userId, contentType, contentIds) {
    const ids = [...new Set((contentIds || []).map(Number).filter(Number.isInteger))];
    if (!userId || ids.length === 0) return new Set();

    const result = await pool.query(
      'SELECT content_id FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = ANY($3::int[])',
      [String(userId), contentType, ids]
    );
    return new Set(result.rows.map((r) => Number(r.content_id)));
  }
}

module.exports = Interaction;