const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class User {
  // ─── Public methods ────────────────────────────────────
  static async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, username, display_name, avatar, is_admin FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async create({ username, password, avatar }) {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, display_name, avatar, is_admin)
       VALUES ($1, $2, $3, $4, false) RETURNING id, username, display_name, avatar, is_admin`,
      [username, hashed, username, avatar || '👤']   // display_name = username
    );
    return result.rows[0];
  }

  static async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  static generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return null;
    }
  }

  // ─── Admin methods ─────────────────────────────────────
  static async findAll() {
    const result = await pool.query(
      'SELECT id, username, display_name, avatar, is_admin FROM users ORDER BY id'
    );
    return result.rows;
  }

  static async promoteToAdmin(id) {
    const result = await pool.query(
      'UPDATE users SET is_admin = true WHERE id = $1 RETURNING id, username, display_name, avatar, is_admin',
      [id]
    );
    return result.rows[0];
  }

  static async demoteFromAdmin(id) {
    const result = await pool.query(
      'UPDATE users SET is_admin = false WHERE id = $1 RETURNING id, username, display_name, avatar, is_admin',
      [id]
    );
    return result.rows[0];
  }

  // ─── Delete a user (admin only) ──────────────────────
  static async delete(id) {
    // The ON DELETE SET NULL in the jokes table will set author_id to NULL
    // For other tables, we'll handle it similarly.
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = User;