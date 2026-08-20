const { pool } = require('../config/db');

// YouTube URLs accepted in the YouTube ID field; reduce to the bare 11-char ID
// so it fits varchar(20) and works in embeds.
function normalizeYoutubeId(input) {
  if (!input) return '';
  const s = String(input).trim();
  const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : s;
}

class Episode {
  // ─── Find all with search & sort ─────────────────────────
  static async findAll({ search, sort } = {}) {
    let query = 'SELECT * FROM episodes';
    const values = [];
    const conditions = [];
    if (search) {
      conditions.push(`(title ILIKE $${values.length + 1} OR description ILIKE $${values.length + 1})`);
      values.push(`%${search}%`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    switch (sort) {
      case 'likes': query += ' ORDER BY likes DESC'; break;
      case 'oldest': query += ' ORDER BY air_date ASC NULLS LAST, created_at ASC'; break;
      case 'title': query += ' ORDER BY title ASC'; break;
      default: query += ' ORDER BY air_date DESC NULLS LAST, created_at DESC';
    }
    const result = await pool.query(query, values);
    return result.rows;
  }

  // ─── Find by ID ──────────────────────────────────────────
  static async findById(id) {
    const result = await pool.query('SELECT * FROM episodes WHERE id = $1', [id]);
    return result.rows[0];
  }

  // ─── Create ──────────────────────────────────────────────
  static async create({ title, youtube_id, description, thumbnail_url, episode_number, air_date, featured }) {
    const result = await pool.query(
      `INSERT INTO episodes (title, youtube_id, description, thumbnail_url, episode_number, air_date, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, normalizeYoutubeId(youtube_id), description || '', thumbnail_url || '', episode_number || null, air_date || null, featured || false]
    );
    return result.rows[0];
  }

  // ─── Update ──────────────────────────────────────────────
  static async update(id, { title, youtube_id, description, thumbnail_url, episode_number, air_date, featured }) {
    const result = await pool.query(
      `UPDATE episodes 
       SET title = $1, youtube_id = $2, description = $3, thumbnail_url = $4, 
           episode_number = $5, air_date = $6, featured = $7
       WHERE id = $8 RETURNING *`,
      [title, normalizeYoutubeId(youtube_id), description || '', thumbnail_url || '', episode_number || null, air_date || null, featured || false, id]
    );
    return result.rows[0];
  }

  // ─── Delete ──────────────────────────────────────────────
  static async delete(id) {
    const result = await pool.query('DELETE FROM episodes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Episode;