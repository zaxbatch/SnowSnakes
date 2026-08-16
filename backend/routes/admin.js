const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get all users (admin only)
router.get('/users', auth, admin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Promote user to admin
router.post('/users/:id/promote', auth, admin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Prevent self-demotion? We can allow, but let's protect the primary admin.
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot promote yourself' });
    }
    const updated = await User.promoteToAdmin(id);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demote user from admin
router.post('/users/:id/demote', auth, admin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot demote yourself' });
    }
    const updated = await User.demoteFromAdmin(id);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;