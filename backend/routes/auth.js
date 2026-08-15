const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName, avatar } = req.body;
    const existing = await User.findByUsername(username);
    if (existing) return res.status(400).json({ error: 'Username taken' });
    const user = await User.create({ username, password, displayName, avatar });
    const token = User.generateToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await User.validatePassword(user, password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = User.generateToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;