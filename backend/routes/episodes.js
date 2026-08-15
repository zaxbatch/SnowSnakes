const express = require('express');
const router = express.Router();
const Episode = require('../models/Episode');

// GET all episodes (public)
router.get('/', async (req, res) => {
  try {
    const episodes = await Episode.findAll();
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET featured episodes
router.get('/featured', async (req, res) => {
  try {
    const episodes = await Episode.findFeatured();
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single episode
router.get('/:id', async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id);
    if (!episode) return res.status(404).json({ error: 'Not found' });
    res.json(episode);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;