const express = require('express');
const router = express.Router();
const Joke = require('../models/Joke');
const Doodle = require('../models/Doodle');
const Comic = require('../models/Comic');
const Episode = require('../models/Episode');
const Game = require('../models/Game');
const Character = require('../models/Character');

router.get('/', async (req, res) => {
  try {
    const [jokes, doodles, comics, episodes, games, characters] = await Promise.all([
      Joke.findAll({}),
      Doodle.findAll(),
      Comic.findAll(),
      Episode.findAll(),
      Game.findAll(),
      Character.findAll({}),
    ]);

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    res.json({
      joke: pick(jokes) || null,
      doodle: pick(doodles) || null,
      comic: pick(comics) || null,
      episode: pick(episodes) || null,
      game: pick(games) || null,
      character: pick(characters) || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;