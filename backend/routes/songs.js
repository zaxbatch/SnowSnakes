const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const Song = require('../models/Song');
const Interaction = require('../services/interaction');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const admin = require('../middleware/admin');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploaded files are served by Cloudinary, so deleting a song should delete
// its mp3 and cover too — otherwise orphans accumulate against the account
// quota forever. Returns the public_id Cloudinary needs, e.g.
//   .../upload/v123/snowsnakes/abc123.mp3  ->  snowsnakes/abc123
const publicIdFrom = (url) => {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
  return m ? m[1] : null;
};

const destroyUpload = async (url, resourceType) => {
  const publicId = publicIdFrom(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  } catch (err) {
    // Never fail the delete because storage cleanup did not work; the row is
    // already gone and an orphaned file is harmless compared to a broken UI.
    console.error(`⚠️ Could not remove Cloudinary ${resourceType} ${publicId}:`, err.message);
  }
};

// Only mp3 is accepted. The upload widget restricts the file picker and the
// Cloudinary preset on the account should restrict formats too, but neither is
// enforceable from here — a request can be crafted directly, and the preset
// currently has no format restriction. This check is the gate that actually
// holds, so a WAV/M4A URL cannot be published even if it gets uploaded.
const ALLOWED_AUDIO_FORMATS = (process.env.ALLOWED_AUDIO_FORMATS || 'mp3')
  .split(',')
  .map((f) => f.trim().toLowerCase())
  .filter(Boolean);

const audioFormatOf = (url) => {
  if (!url || typeof url !== 'string') return null;
  const lastSegment = url.split('?')[0].split('#')[0].split('/').pop() || '';
  // No dot at all means there is no extension to trust.
  if (!lastSegment.includes('.')) return null;
  return (lastSegment.split('.').pop() || '').toLowerCase();
};

// GET all songs with search & sort
router.get('/', async (req, res) => {
  try {
    const { search, sort } = req.query;
    const songs = await Song.findAll({ search, sort });
    // One query for all comments and one for like status, instead of
    // two round trips per song.
    const [commentsBySong, likedIds] = await Promise.all([
      Interaction.getCommentsForMany('song', songs.map((s) => s.id)),
      Interaction.getLikedIds(req.user && req.user.id, 'song', songs.map((s) => s.id)),
    ]);
    for (const s of songs) {
      s.comments = commentsBySong.get(Number(s.id)) || [];
      s.isLiked = likedIds.has(Number(s.id));
    }
    res.json(songs);
  } catch (err) {
    console.error('Error fetching songs:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single song
router.get('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: 'Not found' });
    if (req.user) {
      song.isLiked = await Interaction.getLikeStatus(req.user.id, 'song', req.params.id);
    }
    song.comments = await Interaction.getComments('song', req.params.id);
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create song — an mp3 from Cloudinary plus a cover image.
router.post('/', auth, async (req, res) => {
  try {
    const { title, audio_url, cover_url } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!audio_url) return res.status(400).json({ error: 'An audio file is required' });

    const format = audioFormatOf(audio_url);
    if (!format || !ALLOWED_AUDIO_FORMATS.includes(format)) {
      return res.status(400).json({
        error: `Unsupported audio format${format ? ` (${format})` : ''}. ` +
               `Only ${ALLOWED_AUDIO_FORMATS.map((f) => f.toUpperCase()).join(' / ')} is accepted — please convert the file first.`,
      });
    }

    const song = await Song.create({
      title: title.trim(),
      audio_url,
      cover_url: cover_url || null,
      author_id: req.user.id,
    });
    res.status(201).json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE song
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const deleted = await Song.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });

    // Storage cleanup after responding, so a slow Cloudinary call cannot
    // delay the UI.
    destroyUpload(deleted.audio_url, 'video');
    destroyUpload(deleted.cover_url, 'image');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Social actions ──────────────────────────────────────

// Like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const result = await Interaction.toggleLike(req.user.id, 'song', req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    await Interaction.addComment(req.user.id, 'song', req.params.id, text);
    const comments = await Interaction.getComments('song', req.params.id);
    res.status(201).json(comments[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Share
router.post('/:id/share', optionalAuth, async (req, res) => {
  try {
    const updated = await Interaction.incrementShare('song', req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Interaction.getComments('song', req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
