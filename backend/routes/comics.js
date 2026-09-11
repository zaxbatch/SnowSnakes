const express = require('express');
const router = express.Router();
const Comic = require('../models/Comic');
const Interaction = require('../services/interaction');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// GET all comics with search & sort
router.get('/', async (req, res) => {
  try {
    const { search, sort } = req.query;
    const comics = await Comic.findAll({ search, sort });
    // One query for all comments and one for like status, instead of
    // two round trips per comic.
    const [commentsByComic, likedIds] = await Promise.all([
      Interaction.getCommentsForMany('comic', comics.map((c) => c.id)),
      Interaction.getLikedIds(req.user && req.user.id, 'comic', comics.map((c) => c.id)),
    ]);
    for (const c of comics) {
      c.comments = commentsByComic.get(Number(c.id)) || [];
      c.isLiked = likedIds.has(Number(c.id));
    }
    res.json(comics);
  } catch (err) {
    console.error('Error fetching comics:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single comic
router.get('/:id', async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ error: 'Not found' });
    if (req.user) {
      comic.isLiked = await Interaction.getLikeStatus(req.user.id, 'comic', req.params.id);
    }
    comic.comments = await Interaction.getComments('comic', req.params.id);
    res.json(comic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create comic
router.post('/', auth, async (req, res) => {
  try {
    const { title, scene, dialogue, caption, characters, image_url } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
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

// DELETE comic
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const deleted = await Comic.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Social actions ──────────────────────────────────────

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

// GET comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Interaction.getComments('comic', req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;