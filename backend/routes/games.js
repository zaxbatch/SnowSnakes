const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Interaction = require('../services/interaction');
const auth = require('../middleware/auth');

// ─── Public routes ──────────────────────────────────────

// GET all games
router.get('/', async (req, res) => {
  try {
    const games = await Game.findAll();
    for (let game of games) {
      game.comments = await Interaction.getComments('game', game.id);
      if (req.user) {
        game.isLiked = await Interaction.getLikeStatus(req.user.id, 'game', game.id);
      } else {
        game.isLiked = false;
      }
    }
    res.json(games);
  } catch (err) {
    console.error('Error in GET /games:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET a single game
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    game.comments = await Interaction.getComments('game', req.params.id);
    if (req.user) {
      game.isLiked = await Interaction.getLikeStatus(req.user.id, 'game', req.params.id);
    } else {
      game.isLiked = false;
    }
    res.json(game);
  } catch (err) {
    console.error('Error in GET /games/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST new game (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, icon, tags, type, code, file_count } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const game = await Game.create({
      title,
      description,
      icon,
      tags,
      author_id: req.user.id,
      type,
      code,
      file_count
    });
    res.status(201).json(game);
  } catch (err) {
    console.error('Error in POST /games:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE game (auth required – admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Game.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /games/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Special game actions ──────────────────────────────

// Vote
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const updated = await Game.vote(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error in POST /games/:id/vote:', err);
    res.status(500).json({ error: err.message });
  }
});

// Play
router.post('/:id/play', auth, async (req, res) => {
  try {
    const updated = await Game.play(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error in POST /games/:id/play:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── SOCIAL ACTIONS (unified) ──────────────────────────

// Like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const result = await Interaction.toggleLike(req.user.id, 'game', req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    await Interaction.addComment(req.user.id, 'game', req.params.id, text);
    const comments = await Interaction.getComments('game', req.params.id);
    res.status(201).json(comments[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Share
router.post('/:id/share', auth, async (req, res) => {
  try {
    const updated = await Interaction.incrementShare('game', req.params.id);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get comments (public)
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Interaction.getComments('game', req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;