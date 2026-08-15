const express = require('express');
const router = express.Router();
const Fridge = require('../models/Fridge');
const auth = require('../middleware/auth');

// GET the full fridge map
router.get('/', async (req, res) => {
  try {
    const fridge = await Fridge.getGroupedByShelf();
    res.json(fridge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET flat list of fridge items
router.get('/list', async (req, res) => {
  try {
    const items = await Fridge.getFridge();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST – move a character to a specific shelf (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { character_id, shelf } = req.body;
    if (!character_id || shelf === undefined) {
      return res.status(400).json({ error: 'character_id and shelf are required' });
    }
    const entry = await Fridge.addCharacter(character_id, shelf);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE – remove a character from the fridge (back to hood)
router.delete('/:characterId', auth, async (req, res) => {
  try {
    const entry = await Fridge.removeCharacter(req.params.characterId);
    if (!entry) return res.status(404).json({ error: 'Character not in fridge' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST – mark a character as "used up"
router.post('/:characterId/use', auth, async (req, res) => {
  try {
    const character = await Fridge.useUpCharacter(req.params.characterId);
    if (!character) return res.status(404).json({ error: 'Character not found' });
    res.json(character);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;