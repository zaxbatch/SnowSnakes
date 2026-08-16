const express = require('express');
const router = express.Router();
const Episode = require('../models/Episode');
const Interaction = require('../services/interaction');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─── GET all episodes with comments and like status ──────
router.get('/', async (req, res) => {
  try {
    const episodes = await Episode.findAll();
    for (const ep of episodes) {
      ep.comments = await Interaction.getComments('episode', ep.id);
      if (req.user) {
        ep.isLiked = await Interaction.getLikeStatus(req.user.id, 'episode', ep.id);
      } else {
        ep.isLiked = false;
      }
    }
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET a single episode ────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id);
    if (!episode) return res.status(404).json({ error: 'Not found' });
    episode.comments = await Interaction.getComments('episode', req.params.id);
    if (req.user) {
      episode.isLiked = await Interaction.getLikeStatus(req.user.id, 'episode', req.params.id);
    }
    res.json(episode);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST new episode (admin only) ──────────────────────
router.post('/', auth, admin, async (req, res) => {
  try {
    const { title, youtube_id, description, thumbnail_url, episode_number, air_date, featured } = req.body;
    if (!title || !youtube_id) {
      return res.status(400).json({ error: 'Title and YouTube ID are required' });
    }
    const episode = await Episode.create({
      title,
      youtube_id,
      description,
      thumbnail_url,
      episode_number,
      air_date,
      featured
    });
    res.status(201).json(episode);
  } catch (err) {
    console.error('Episode creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT / update episode (admin only) ──────────────────
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { title, youtube_id, description, thumbnail_url, episode_number, air_date, featured } = req.body;
    const episode = await Episode.update(req.params.id, {
      title,
      youtube_id,
      description,
      thumbnail_url,
      episode_number,
      air_date,
      featured
    });
    if (!episode) return res.status(404).json({ error: 'Not found' });
    res.json(episode);
  } catch (err) {
    console.error('Episode update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE episode (admin only) ────────────────────────
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const episode = await Episode.delete(req.params.id);
    if (!episode) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Social actions ──────────────────────────────────────

// Like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const result = await Interaction.toggleLike(req.user.id, 'episode', req.params.id);
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
    await Interaction.addComment(req.user.id, 'episode', req.params.id, text);
    const comments = await Interaction.getComments('episode', req.params.id);
    res.status(201).json(comments[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Share
router.post('/:id/share', auth, async (req, res) => {
  try {
    const updated = await Interaction.incrementShare('episode', req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET comments (public)
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Interaction.getComments('episode', req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;