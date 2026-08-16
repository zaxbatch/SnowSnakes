const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { createHubSpotContact } = require('../services/hubspot');

router.post('/register', async (req, res) => {
  try {
    const { username, password, avatar, email } = req.body;
    const existing = await User.findByUsername(username);
    if (existing) return res.status(400).json({ error: 'Username taken' });
    const user = await User.create({ username, password, avatar });
    if (email) await createHubSpotContact({ email, firstname: username });
    const token = User.generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = await User.findByUsername(username);
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await User.validatePassword(user, password);
    if (!valid) {
      console.log('❌ Invalid password for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = User.generateToken(user);
    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;