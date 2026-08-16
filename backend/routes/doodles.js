const express = require('express');
const router = express.Router();
const Doodle = require('../models/Doodle');
const Interaction = require('../services/interaction');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', async (req, res) => {
  try {
    const doodles = await Doodle.findAll();
    for (const d of doodles) {
      try {
        d.comments = await Interaction.getComments('doodle', d.id);
      } catch (err) {
        console.error(`Error fetching comments for doodle ${d.id}:`, err);
        d.comments = [];
      }
      if (req.user) {
        try {
          d.isLiked = await Interaction.getLikeStatus(req.user.id, 'doodle', d.id);
        } catch (err) {
          console.error(`Error fetching like status for doodle ${d.id}:`, err);
          d.isLiked = false;
        }
      } else {
        d.isLiked = false;
      }
    }
    res.json(doodles);
  } catch (err) {
    console.error('Error in GET /doodles:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doodle = await Doodle.findById(req.params.id);
    if (!doodle) return res.status(404).json({ error: 'Not found' });
    try {
      doodle.comments = await Interaction.getComments('doodle', req.params.id);
    } catch (err) {
      console.error(`Error fetching comments for doodle ${req.params.id}:`, err);
      doodle.comments = [];
    }
    if (req.user) {
      try {
        doodle.isLiked = await Interaction.getLikeStatus(req.user.id, 'doodle', req.params.id);
      } catch (err) {
        console.error(`Error fetching like status for doodle ${req.params.id}:`, err);
        doodle.isLiked = false;
      }
    }
    res.json(doodle);
  } catch (err) {
    console.error('Error in GET /doodles/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, image_url, joke_id, character_id } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const doodle = await Doodle.create({ title, image_url, joke_id, character_id });
    res.status(201).json(doodle);
  } catch (err) {
    console.error('Error in POST /doodles:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const doodle = await Doodle.delete(req.params.id);
    if (!doodle) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /doodles/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Social actions ──────────────────────────────────────

router.post('/:id/like', auth, async (req, res) => {
  try {
    const result = await Interaction.toggleLike(req.user.id, 'doodle', req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error in POST /doodles/:id/like:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    await Interaction.addComment(req.user.id, 'doodle', req.params.id, text);
    const comments = await Interaction.getComments('doodle', req.params.id);
    res.status(201).json(comments[0] || {});
  } catch (err) {
    console.error('Error in POST /doodles/:id/comment:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/share', auth, async (req, res) => {
  try {
    const updated = await Interaction.incrementShare('doodle', req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Error in POST /doodles/:id/share:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Interaction.getComments('doodle', req.params.id);
    res.json(comments);
  } catch (err) {
    console.error('Error in GET /doodles/:id/comments:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;