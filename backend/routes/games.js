const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const auth = require('../middleware/auth');

// GET all games
router.get('/', async (req, res) => {
  try {
    const games = await Game.findAll();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single game
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new game (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, icon, code, tags, type, file_count } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    const game = await Game.create({
      title,
      description,
      icon,
      code,
      tags,
      author_id: req.user.id,
      type: type || 'user',
      file_count: file_count || 0,
    });
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote for a game
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const updated = await Game.vote(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Play a game (increment play count)
router.post('/:id/play', async (req, res) => {
  try {
    const updated = await Game.play(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a game (auth required)
router.delete('/:id', auth, async (req, res) => {
  try {
    const game = await Game.delete(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;