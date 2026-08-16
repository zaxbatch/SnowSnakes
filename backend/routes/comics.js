const express = require('express');
const router = express.Router();
const Comic = require('../models/Comic');
const Interaction = require('../services/interaction');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─── Public routes ──────────────────────────────────────

// GET all comics with comments and like status
router.get('/', async (req, res) => {
  try {
    const comics = await Comic.findAll();
    for (const c of comics) {
      try {
        c.comments = await Interaction.getComments('comic', c.id);
      } catch (err) {
        console.warn('Could not fetch comments for comic', c.id, err.message);
        c.comments = [];
      }
      if (req.user) {
        try {
          c.isLiked = await Interaction.getLikeStatus(req.user.id, 'comic', c.id);
        } catch (err) {
          c.isLiked = false;
        }
      } else {
        c.isLiked = false;
      }
    }
    res.json(comics);
  } catch (err) {
    console.error('Error in GET /comics:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET a single comic
router.get('/:id', async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ error: 'Not found' });
    comic.comments = await Interaction.getComments('comic', req.params.id);
    if (req.user) {
      comic.isLiked = await Interaction.getLikeStatus(req.user.id, 'comic', req.params.id);
    }
    res.json(comic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new comic (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { title, scene, dialogue, caption, characters, image_url } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const comic = await Comic.create({
      title,
      scene,
      dialogue,
      caption,
      characters,
      image_url,
      author_id: req.user.id,
    });
    res.status(201).json(comic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE comic (admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const comic = await Comic.delete(req.params.id);
    if (!comic) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Social actions ─────────────────────────────────────

// Like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const result = await Interaction.toggleLike(req.user.id, 'comic', req.params.id);
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
    await Interaction.addComment(req.user.id, 'comic', req.params.id, text);
    const comments = await Interaction.getComments('comic', req.params.id);
    res.status(201).json(comments[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Share
router.post('/:id/share', auth, async (req, res) => {
  try {
    const updated = await Interaction.incrementShare('comic', req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET comments (public)
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Interaction.getComments('comic', req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;