const { pool } = require('../config/db');

class Interaction {
  static async toggleLike(userId, contentType, contentId) {
    const tableName = contentType + 's'; // e.g., 'doodle' -> 'doodles'
    const userIdStr = String(userId);
    console.log(`🔍 toggleLike: userId=${userIdStr}, contentType=${contentType}, contentId=${contentId}, table=${tableName}`);

    try {
      // Check if like exists
      const like = await pool.query(
        'SELECT * FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
        [userIdStr, contentType, contentId]
      );
      console.log(`🔍 Like exists? ${like.rows.length > 0}`);

      if (like.rows.length > 0) {
        // Unlike
        await pool.query(
          'DELETE FROM likes WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
          [userIdStr, contentType, contentId]
        );
        const updateResult = await pool.query(
          `UPDATE ${tableName} SET likes = likes - 1 WHERE id = $1 RETURNING likes`,
          [contentId]
        );
        console.log(`✅ Unlike successful, new likes: ${updateResult.rows[0]?.likes}`);
        return { liked: false };
      } else {
        // Like
        await pool.query(
          'INSERT INTO likes (user_id, content_type, content_id) VALUES ($1, $2, $3)',
          [userIdStr, contentType, contentId]
        );
        const updateResult = await pool.query(
          `UPDATE ${tableName} SET likes = likes + 1 WHERE id = $1 RETURNING likes`,
          [contentId]
        );
        console.log(`✅ Like successful, new likes: ${updateResult.rows[0]?.likes}`);
        return { liked: true };
      }
    } catch (err) {
      console.error(`❌ toggleLike error for ${contentType} ${contentId}:`, err);
      throw err; // rethrow so the route catches it
    }
  }

  // ... other methods (addComment, getComments, incrementShare, getLikeStatus) unchanged ...
}

module.exports = Interaction;