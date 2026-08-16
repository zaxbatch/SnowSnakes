const express = require('express');
const router = express.Router();
const Episode = require('../models/Episode');
const Interaction = require('../services/interaction');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─── Public routes ──────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const episodes = await Episode.findAll();
    for (let ep of episodes) {
      ep.comments = await Interaction.getComments('episode', ep.id);
      if (req.user) {
        ep.isLiked = await Interaction.getLikeStatus(req.user.id, 'episode', ep.id);
      } else {
        ep.isLiked = false;
      }
    }
    res.json(episodes);
  } catch (err) {
    console.error('Error in GET /episodes:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id);
    if (!episode) return res.status(404).json({ error: 'Not found' });
    episode.comments = await Interaction.getComments('episode', req.params.id);
    if (req.user) {
      episode.isLiked = await Interaction.getLikeStatus(req.user.id, 'episode', req.params.id);
    } else {
      episode.isLiked = false;
    }
    res.json(episode);
  } catch (err) {
    console.error('Error in GET /episodes/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin-only create/update/delete
router.post('/', auth, admin, async (req, res) => {
  try {
    const { title, youtube_id, description, thumbnail_url, episode_number, air_date, featured } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
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
    console.error('Error in POST /episodes:', err);
    res.status(500).json({ error: err.message });
  }
});

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
    console.error('Error in PUT /episodes/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const episode = await Episode.delete(req.params.id);
    if (!episode) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /episodes/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── SOCIAL ACTIONS ──────────────────────────────────────

router.post('/:id/like', auth, async (req, res) => {
  try {
    const result = await Interaction.toggleLike(req.user.id, 'episode', req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

router.post('/:id/share', auth, async (req, res) => {
  try {
    const updated = await Interaction.incrementShare('episode', req.params.id);
    if (!updated) return res.status(404).json({ error: 'Episode not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Interaction.getComments('episode', req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;