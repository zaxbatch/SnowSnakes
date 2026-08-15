const { pool } = require('../config/db');

class Fridge {
  // Get full fridge map with character details
  static async getFridge() {
    const result = await pool.query(`
      SELECT f.shelf, 
             c.id as character_id, 
             c.name, 
             c.condiment, 
             c.ethnicity,
             c.personality,
             c.catchphrase
      FROM fridge f
      JOIN characters c ON f.character_id = c.id
      WHERE c.used_up = false
      ORDER BY f.shelf DESC, c.name ASC
    `);
    return result.rows;
  }

  // Add a character to a specific shelf
  static async addCharacter(characterId, shelf) {
    // Remove from fridge if already there (to avoid duplicate)
    await pool.query('DELETE FROM fridge WHERE character_id = $1', [characterId]);
    // Insert
    const result = await pool.query(
      `INSERT INTO fridge (character_id, shelf) VALUES ($1, $2) RETURNING *`,
      [characterId, shelf]
    );
    // Update character location
    await pool.query('UPDATE characters SET location = $1 WHERE id = $2', ['fridge', characterId]);
    return result.rows[0];
  }

  // Remove a character from the fridge (moves back to hood)
  static async removeCharacter(characterId) {
    const result = await pool.query(
      'DELETE FROM fridge WHERE character_id = $1 RETURNING *',
      [characterId]
    );
    if (result.rows[0]) {
      await pool.query('UPDATE characters SET location = $1 WHERE id = $2', ['hood', characterId]);
    }
    return result.rows[0];
  }

  // Mark a character as "used up" (removes from fridge)
  static async useUpCharacter(characterId) {
    await pool.query('DELETE FROM fridge WHERE character_id = $1', [characterId]);
    const result = await pool.query(
      `UPDATE characters SET used_up = true, location = 'used' WHERE id = $1 RETURNING *`,
      [characterId]
    );
    return result.rows[0];
  }

  // Get all characters currently in the fridge (grouped by shelf)
  static async getGroupedByShelf() {
    const items = await this.getFridge();
    const grouped = {};
    for (const item of items) {
      if (!grouped[item.shelf]) grouped[item.shelf] = [];
      grouped[item.shelf].push(item);
    }
    return grouped;
  }
}

module.exports = Fridge;