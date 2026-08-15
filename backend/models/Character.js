const { pool } = require('../config/db');

class Character {
  // Get all characters (optionally filter by location)
  static async findAll({ location } = {}) {
    let query = `SELECT * FROM characters`;
    const values = [];
    if (location) {
      query += ` WHERE location = $1`;
      values.push(location);
    }
    query += ` ORDER BY id ASC`;
    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get a single character
  static async findById(id) {
    const result = await pool.query('SELECT * FROM characters WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Create a new character
  static async create({ name, condiment, ethnicity, personality, catchphrase, rivals, location = 'hood' }) {
    const result = await pool.query(
      `INSERT INTO characters (name, condiment, ethnicity, personality, catchphrase, rivals, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, condiment || '🧈', ethnicity || 'Unknown', personality || '', catchphrase || '', rivals || [], location]
    );
    return result.rows[0];
  }

  // Update character (move location, mark used_up, etc.)
  static async update(id, updates) {
    const allowed = ['location', 'used_up', 'personality', 'catchphrase', 'rivals'];
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(updates[key]);
        idx++;
      }
    }
    if (fields.length === 0) return null;
    values.push(id);
    const query = `
      UPDATE characters 
      SET ${fields.join(', ')} 
      WHERE id = $${idx} 
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete a character (use with caution)
  static async delete(id) {
    // First remove from fridge
    await pool.query('DELETE FROM fridge WHERE character_id = $1', [id]);
    const result = await pool.query('DELETE FROM characters WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Character;