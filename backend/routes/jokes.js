const express = require('express');
const router = express.Router();
const Joke = require('../models/Joke');
const auth = require('../middleware/auth');

// ─── Public routes ──────────────────────────────────────

// GET all jokes (with search & sort)
router.get('/', async (req, res) => {
  try {
    const { search, sort } = req.query;
    const jokes = await Joke.findAll({ search, sort });
    // For each joke, get comments
    for (let joke of jokes) {
      joke.comments = await Joke.getComments(joke.id);
    }
    res.json(jokes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single joke with comments
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
    if (!content) return res.status(400).json({ error: 'Content is required' });
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

// DELETE joke (auth required, owner or admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const joke = await Joke.findById(req.params.id);
    if (!joke) return res.status(404).json({ error: 'Not found' });
    // Allow owner or admin (isAdmin flag from JWT)
    if (joke.author_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Joke.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LIKE ────────────────────────────────────────────────
router.post('/:id/like', auth, async (req, res) => {
  try {
    const updated = await Joke.toggleLike(req.params.id, req.user.id);
    if (!updated) return res.status(404).json({ error: 'Joke not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SHARE ───────────────────────────────────────────────
router.post('/:id/share', auth, async (req, res) => {
  try {
    const updated = await Joke.incrementShare(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Joke not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── KILL (Killer Mode) ──────────────────────────────────
router.post('/:id/kill', auth, async (req, res) => {
  try {
    const updated = await Joke.incrementKill(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Joke not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COMMENTS ────────────────────────────────────────────
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    const comment = await Joke.addComment(req.params.id, req.user.id, text.trim());
    // Return the comment with user info
    const [fullComment] = await Joke.getComments(req.params.id);
    res.status(201).json(fullComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET comments for a joke (public)
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Joke.getComments(req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Like ────────────────────────────────────────────────
router.post('/:id/like', auth, async (req, res) => {
  try {
    const result = await Interaction.toggleLike(req.user.id, 'joke', req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Comment ──────────────────────────────────────────────
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    const comment = await Interaction.addComment(req.user.id, 'joke', req.params.id, text);
    const [full] = await Interaction.getComments('joke', req.params.id);
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Share ────────────────────────────────────────────────
router.post('/:id/share', auth, async (req, res) => {
  try {
    const updated = await Interaction.incrementShare('joke', req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET comments (public) ──────────────────────────────
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Interaction.getComments('joke', req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;