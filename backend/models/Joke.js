const { pool } = require('../config/db');

class Joke {
  static async findAll({ search, sort } = {}) {
    let query = 'SELECT * FROM jokes';
    const values = [];
    const conditions = [];
    if (search) {
      conditions.push(`(content ILIKE $${values.length + 1} OR tags::text ILIKE $${values.length + 1})`);
      values.push(`%${search}%`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    switch (sort) {
      case 'likes': query += ' ORDER BY likes DESC'; break;
      case 'oldest': query += ' ORDER BY created_at ASC'; break;
      default: query += ' ORDER BY created_at DESC';
    }
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM jokes WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const { content, punchline, tags, series, author_id } = data;
    const result = await pool.query(
      `INSERT INTO jokes (content, punchline, tags, series, author_id, created_at, kill_count, likes, shares)
       VALUES ($1, $2, $3, $4, $5, NOW(), 0, 0, 0) RETURNING *`,
      [content, punchline || '', tags || [], series || '', author_id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM jokes WHERE id = $1', [id]);
  }

  static async incrementLike(jokeId, userId) {
    const result = await pool.query(
      `UPDATE jokes SET likes = likes + 1 WHERE id = $1 RETURNING likes`,
      [jokeId]
    );
    return result.rows[0];
  }

  static async incrementShare(jokeId) {
    const result = await pool.query(
      `UPDATE jokes SET shares = shares + 1 WHERE id = $1 RETURNING shares`,
      [jokeId]
    );
    return result.rows[0];
  }

  static async incrementKill(jokeId) {
    const result = await pool.query(
      `UPDATE jokes SET kill_count = kill_count + 1 WHERE id = $1 RETURNING kill_count`,
      [jokeId]
    );
    return result.rows[0];
  }

  static async addComment(jokeId, userId, text) {
    const result = await pool.query(
      `INSERT INTO comments (joke_id, user_id, text, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [jokeId, userId, text]
    );
    return result.rows[0];
  }

  static async getComments(jokeId) {
    const result = await pool.query(
      `SELECT c.*, u.username, u.display_name, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.joke_id = $1
       ORDER BY c.created_at DESC`,
      [jokeId]
    );
    return result.rows;
  }
}

module.exports = Joke;