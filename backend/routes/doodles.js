const express = require('express');
const router = express.Router();
const Doodle = require('../models/Doodle');
const Interaction = require('../services/interaction');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─── GET all doodles with comments and like status ──────
router.get('/', async (req, res) => {
  try {
    const doodles = await Doodle.findAll();
    for (const d of doodles) {
      d.comments = await Interaction.getComments('doodle', d.id);
      if (req.user) {
        d.isLiked = await Interaction.getLikeStatus(req.user.id, 'doodle', d.id);
      } else {
        d.isLiked = false;
      }
    }
    res.json(doodles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET a single doodle ────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doodle = await Doodle.findById(req.params.id);
    if (!doodle) return res.status(404).json({ error: 'Not found' });
    doodle.comments = await Interaction.getComments('doodle', req.params.id);
    if (req.user) {
      doodle.isLiked = await Interaction.getLikeStatus(req.user.id, 'doodle', req.params.id);
    }
    res.json(doodle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST new doodle ─────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { title, image_url, joke_id, character_id } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const doodle = await Doodle.create({ title, image_url, joke_id, character_id });
    res.status(201).json(doodle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE doodle (admin only) ─────────────────────────
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const doodle = await Doodle.delete(req.params.id);
    if (!doodle) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Social actions ──────────────────────────────────────

// Like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const result = await Interaction.toggleLike(req.user.id, 'doodle', req.params.id);
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
    await Interaction.addComment(req.user.id, 'doodle', req.params.id, text);
    const comments = await Interaction.getComments('doodle', req.params.id);
    res.status(201).json(comments[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Share
router.post('/:id/share', auth, async (req, res) => {
  try {
    const updated = await Interaction.incrementShare('doodle', req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET comments (public)
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Interaction.getComments('doodle', req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;