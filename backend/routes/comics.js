const express = require('express');
const router = express.Router();
const Comic = require('../models/Comic');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const comics = await Comic.findAll();
    res.json(comics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ error: 'Not found' });
    res.json(comic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, scene, dialogue, caption, characters, image_url } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    
    const comic = await Comic.create({
      title,
      scene,
      dialogue,
      caption,
      characters,
      author_id: req.user?.id || null,
      image_url: image_url || null,  // ← Make sure this is passed
    });
    res.status(201).json(comic);
  } catch (err) {
    console.error('Comic creation error:', err);  // ← Log the error
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const comic = await Comic.delete(req.params.id);
    if (!comic) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;