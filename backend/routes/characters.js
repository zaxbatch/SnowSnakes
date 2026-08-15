const express = require('express');
const router = express.Router();
const Character = require('../models/Character');
const auth = require('../middleware/auth');

// GET all characters (optionally filter by location: ?location=hood)
router.get('/', async (req, res) => {
  try {
    const { location } = req.query;
    const characters = await Character.findAll({ location });
    res.json(characters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single character
router.get('/:id', async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    if (!character) return res.status(404).json({ error: 'Not found' });
    res.json(character);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new character (auth required – admin only maybe)
router.post('/', auth, async (req, res) => {
  try {
    const { name, condiment, ethnicity, personality, catchphrase, rivals, location } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const character = await Character.create({
      name,
      condiment,
      ethnicity,
      personality,
      catchphrase,
      rivals,
      location
    });
    res.status(201).json(character);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a character (auth required)
router.put('/:id', auth, async (req, res) => {
  try {
    const { location, used_up, personality, catchphrase, rivals } = req.body;
    const character = await Character.update(req.params.id, {
      location,
      used_up,
      personality,
      catchphrase,
      rivals
    });
    if (!character) return res.status(404).json({ error: 'Not found or no updates' });
    res.json(character);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a character (auth required)
router.delete('/:id', auth, async (req, res) => {
  try {
    const character = await Character.delete(req.params.id);
    if (!character) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;