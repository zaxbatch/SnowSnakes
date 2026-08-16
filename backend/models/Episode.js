const { pool } = require('../config/db');

class Episode {
  // ─── Public methods ────────────────────────────────────
  static async findAll() {
    const result = await pool.query('SELECT * FROM episodes ORDER BY id DESC');
    return result.rows;
  }

  static async findFeatured() {
    const result = await pool.query('SELECT * FROM episodes WHERE featured = true ORDER BY id DESC');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM episodes WHERE id = $1', [id]);
    return result.rows[0];
  }

  // ─── Admin methods ─────────────────────────────────────
  static async create({ title, youtube_id, description, thumbnail_url, episode_number, air_date, featured }) {
    const result = await pool.query(
      `INSERT INTO episodes (title, youtube_id, description, thumbnail_url, episode_number, air_date, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, youtube_id, description || '', thumbnail_url || '', episode_number || '', air_date || '', featured || false]
    );
    return result.rows[0];
  }

  static async update(id, { title, youtube_id, description, thumbnail_url, episode_number, air_date, featured }) {
    const result = await pool.query(
      `UPDATE episodes 
       SET title = $1, youtube_id = $2, description = $3, thumbnail_url = $4, 
           episode_number = $5, air_date = $6, featured = $7
       WHERE id = $8 RETURNING *`,
      [title, youtube_id, description || '', thumbnail_url || '', episode_number || '', air_date || '', featured || false, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM episodes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Episode;