const express = require('express');
const router = express.Router();
const Episode = require('../models/Episode');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─── Public routes ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const episodes = await Episode.findAll();
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const episodes = await Episode.findFeatured();
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id);
    if (!episode) return res.status(404).json({ error: 'Not found' });
    res.json(episode);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin-only routes ──────────────────────────────────
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

router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const episode = await Episode.delete(req.params.id);
    if (!episode) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;