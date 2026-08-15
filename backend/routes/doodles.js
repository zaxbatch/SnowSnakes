const express = require('express');
const router = express.Router();
const Doodle = require('../models/Doodle');
const auth = require('../middleware/auth');

// GET all doodles
router.get('/', async (req, res) => {
  try {
    const doodles = await Doodle.findAll();
    res.json(doodles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single doodle
router.get('/:id', async (req, res) => {
  try {
    const doodle = await Doodle.findById(req.params.id);
    if (!doodle) return res.status(404).json({ error: 'Not found' });
    res.json(doodle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new doodle (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { title, image_url, joke_id, character_id } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const doodle = await Doodle.create({ title, image_url, joke_id, character_id });
    res.status(201).json(doodle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a doodle (auth required – you may add ownership check)
router.delete('/:id', auth, async (req, res) => {
  try {
    const doodle = await Doodle.delete(req.params.id);
    if (!doodle) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;