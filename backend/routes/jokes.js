const express = require('express');
const router = express.Router();
const Joke = require('../models/Joke');
const auth = require('../middleware/auth');

// GET all jokes (with search & sort)
router.get('/', async (req, res) => {
  try {
    const { search, sort } = req.query;
    const jokes = await Joke.findAll({ search, sort });
    res.json(jokes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single joke with comments
router.get('/:id', async (req, res) => {
  try {
    const joke = await Joke.findById(req.params.id);
    if (!joke) return res.status(404).json({ error: 'Not found' });
    const comments = await Joke.getComments(req.params.id);
    res.json({ ...joke, comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new joke (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { content, punchline, tags, series } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const joke = await Joke.create({
      content,
      punchline,
      tags: tags || [],
      series: series || '',
      author_id: req.user.id,
    });
    res.status(201).json(joke);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE joke (auth required, only owner or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const joke = await Joke.findById(req.params.id);
    if (!joke) return res.status(404).json({ error: 'Not found' });
    // Optionally check if req.user.id === joke.author_id
    await Joke.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIKE joke
router.post('/:id/like', auth, async (req, res) => {
  try {
    const updated = await Joke.incrementLike(req.params.id, req.user.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SHARE joke
router.post('/:id/share', auth, async (req, res) => {
  try {
    const updated = await Joke.incrementShare(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// KILL joke (killer mode)
router.post('/:id/kill', auth, async (req, res) => {
  try {
    const updated = await Joke.incrementKill(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// COMMENT on joke
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    const comment = await Joke.addComment(req.params.id, req.user.id, text);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;