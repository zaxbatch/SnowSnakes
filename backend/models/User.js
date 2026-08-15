const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class User {
  static async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  static async create({ username, password, displayName, avatar }) {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, display_name, avatar)
       VALUES ($1, $2, $3, $4) RETURNING id, username, display_name, avatar`,
      [username, hashed, displayName || username, avatar || '👤']
    );
    return result.rows[0];
  }

  static async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  static generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username },
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
}

module.exports = User;