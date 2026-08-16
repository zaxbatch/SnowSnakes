const express = require('express');
const router = express.Router();
const Comic = require('../models/Comic');
const Interaction = require('../services/interaction');
const auth = require('../middleware/auth');

// ─── Public routes ──────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const comics = await Comic.findAll();
    for (let comic of comics) {
      comic.comments = await Interaction.getComments('comic', comic.id);
      if (req.user) {
        comic.isLiked = await Interaction.getLikeStatus(req.user.id, 'comic', comic.id);
      } else {
        comic.isLiked = false;
      }
    }
    res.json(comics);
  } catch (err) {
    console.error('Error in GET /comics:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ error: 'Not found' });
    comic.comments = await Interaction.getComments('comic', req.params.id);
    if (req.user) {
      comic.isLiked = await Interaction.getLikeStatus(req.user.id, 'comic', req.params.id);
    } else {
      comic.isLiked = false;
    }
    res.json(comic);
  } catch (err) {
    console.error('Error in GET /comics/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

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
      author_id: req.user.id
    });
    res.status(201).json(comic);
  } catch (err) {
    console.error('Error in POST /comics:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ error: 'Not found' });
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Comic.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /comics/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── SOCIAL ACTIONS ──────────────────────────────────────

router.post('/:id/like', auth, async (req, res) => {
  try {
    const result = await Interaction.toggleLike(req.user.id, 'comic', req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

router.post('/:id/share', auth, async (req, res) => {
  try {
    const updated = await Interaction.incrementShare('comic', req.params.id);
    if (!updated) return res.status(404).json({ error: 'Comic not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Interaction.getComments('comic', req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;