const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const Game = require('../models/Game');
const Interaction = require('../services/interaction');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const optionalAuth = require('../middleware/optionalAuth');
const {
  ALLOWED_EXTENSIONS,
  MAX_FILE_BYTES,
  uploadGameFiles,
  deleteGameAssets,
  buildLaunchHtml,
} = require('../services/gameAssets');

// ─── File upload config ──────────────────────────────────
// /tmp is writable on both a normal Node process and a Netlify Function
// instance. Files only stay here while they are uploaded to Cloudinary.
const TEMP_DIR = path.join(os.tmpdir(), 'snowsnakes-games');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'game-' + unique + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    const err = new Error('File type not allowed: ' + file.originalname);
    err.status = 400;
    cb(err);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: 100, // max number of files
    fieldSize: 50 * 1024 * 1024, // pasted code can be a full HTML game (>1MB default!)
  },
});

// ─── Helpers ──────────────────────────────────────────────
const cleanupTempFiles = (files) => {
  if (!files) return;
  for (const f of files) {
    if (!f || !f.path) continue;
    try {
      if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    } catch (err) {
      console.error('⚠️ Could not remove temporary upload:', err.message);
    }
  }
};

const parseStoredFiles = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const escapeHtml = (value) =>
  String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

// ─── Routes ──────────────────────────────────────────────

// GET all games with search & sort
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, sort } = req.query;
    // findAllForList omits `code` and `entry_html`: one game here carries
    // 5.3 MB of pasted source, and the gallery never renders it, so including
    // it made every visit to /games download ~5.4 MB. The full row is still
    // used by the single-game and launch endpoints.
    const games = await Game.findAllForList({ search, sort });
    // One query for all comments and one for like status, instead of
    // two round trips per game.
    const [commentsByGame, likedIds] = await Promise.all([
      Interaction.getCommentsForMany('game', games.map((g) => g.id)),
      Interaction.getLikedIds(req.user && req.user.id, 'game', games.map((g) => g.id)),
    ]);
    for (const g of games) {
      g.comments = commentsByGame.get(Number(g.id)) || [];
      g.isLiked = likedIds.has(Number(g.id));
    }
    res.json(games);
  } catch (err) {
    console.error('Error in GET /games:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// GET a single game
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    try {
      game.comments = await Interaction.getComments('game', req.params.id);
    } catch (err) {
      console.error(`Error fetching comments for game ${req.params.id}:`, err);
      game.comments = [];
    }
    if (req.user) {
      try {
        game.isLiked = await Interaction.getLikeStatus(req.user.id, 'game', req.params.id);
      } catch (err) {
        console.error(`Error fetching like status for game ${req.params.id}:`, err);
        game.isLiked = false;
      }
    }
    res.json(game);
  } catch (err) {
    console.error('Error in GET /games/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST a new game (with optional file upload)
router.post('/', optionalAuth, upload.array('files', 100), async (req, res) => {
  const files = req.files || [];
  let game = null;
  let uploadedAssets = null;
  try {
    const { title, description, icon, tags, type, code, code_encoding } = req.body;
    const author_id = req.user ? req.user.id : null;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Decode base64-transported code. The frontend still encodes pasted
    // HTML/JS so intermediary firewalls don't reject the multipart body.
    let finalCode = code || '';
    if (code_encoding === 'base64' && finalCode) {
      try {
        finalCode = Buffer.from(finalCode, 'base64').toString('utf8');
      } catch (err) {
        console.error('Base64 decode failed, storing raw:', err.message);
      }
    }

    game = await Game.create({
      title,
      description,
      icon: icon || '🎮',
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      author_id,
      type: type || 'user',
      code: finalCode,
      file_count: 0,
    });

    if (files.length > 0) {
      const paths = Array.isArray(req.body.paths)
        ? req.body.paths
        : req.body.paths
          ? [req.body.paths]
          : [];
      uploadedAssets = await uploadGameFiles(game.id, files, paths);
      game = await Game.setFiles(game.id, uploadedAssets.files, uploadedAssets.entryHtml) || game;
    }

    res.status(201).json({
      ...game,
      files: uploadedAssets ? uploadedAssets.files : [],
      file_count: uploadedAssets ? uploadedAssets.files.length : 0,
      uploadedFiles: uploadedAssets ? uploadedAssets.files.map((f) => f.path) : [],
    });
  } catch (err) {
    console.error('Game creation error:', err);
    if (uploadedAssets) {
      await deleteGameAssets(uploadedAssets.files).catch((cleanupErr) => {
        console.error('⚠️ Could not clean up Cloudinary game assets:', cleanupErr.message);
      });
    }
    if (game) {
      await Game.delete(game.id).catch((cleanupErr) => {
        console.error('⚠️ Could not remove the incomplete game row:', cleanupErr.message);
      });
    }
    if (!res.headersSent) {
      res.status(err.status || 500).json({ error: err.message });
    }
  } finally {
    cleanupTempFiles(files);
  }
});

// ─── Launch game ──────────────────────────────────────────
router.get('/:id/launch', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).send('Game not found');

    // 1️⃣ Uploaded files now live in Cloudinary. The entry HTML is stored in
    // Postgres so it can be served with the right Content-Type and a <base>
    // tag; Cloudinary delivers raw HTML as an attachment.
    const storedFiles = parseStoredFiles(game.files);
    if (storedFiles.length > 0) {
      if (!game.entry_html) {
        return res.status(404).send('This game has files but no HTML entry file to launch.');
      }
      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.send(buildLaunchHtml(game.entry_html, storedFiles, game.id));
    }

    // 2️⃣ A game from the old host whose files were on the Hostinger disk.
    if (Number(game.file_count) > 0) {
      return res.status(410).send(
        'This game’s files were stored on the previous host and need to be re-uploaded to Cloudinary.'
      );
    }

    // 3️⃣ If there's pasted code, serve it.
    if (game.code && game.code.trim()) {
      const trimmed = game.code.trim();
      const safeTitle = escapeHtml(game.title);
      let html;

      // 3a. If it looks like HTML (starts with '<'), inject it directly
      if (trimmed.startsWith('<')) {
        html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a2a3a; font-family: sans-serif; }
    #game-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
  </style>
</head>
<body>
  <div id="game-container">
    ${trimmed}
  </div>
</body>
</html>
        `;
      } else {
        // 3b. Otherwise treat as JavaScript with auto‑execution
        html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a2a3a; color: #fff; font-family: sans-serif; }
    #game-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
    .error-msg { color: #ff6b6b; background: #2d2d2d; padding: 20px; border-radius: 8px; max-width: 80%; }
    .info-msg { color: #ffcc00; background: #2d2d2d; padding: 20px; border-radius: 8px; max-width: 80%; }
  </style>
</head>
<body>
  <div id="game-container"></div>

  <script>
    // --- USER PASTED CODE STARTS ---
    ${trimmed}
    // --- USER PASTED CODE ENDS ---

    // --- AUTO‑EXECUTION WRAPPER ---
    (function() {
      const entryFunctions = ['myGame', 'start', 'init', 'main'];
      let called = false;
      for (const fnName of entryFunctions) {
        if (typeof window[fnName] === 'function') {
          try {
            window[fnName]();
            called = true;
            break;
          } catch (e) {
            console.error('Error calling ' + fnName + ':', e);
            const container = document.getElementById('game-container');
            if (container) {
              container.innerHTML = '<div class="error-msg">⚠️ Error in game code: ' + e.message + '</div>';
            }
            called = true;
            break;
          }
        }
      }
      if (!called) {
        setTimeout(() => {
          const container = document.getElementById('game-container');
          if (container && container.children.length === 0) {
            container.innerHTML = '<div class="info-msg">✅ Game loaded. If nothing appears, your code may not create UI. Use <code>myGame()</code> or append to <code>#game-container</code>.</div>';
          }
        }, 500);
      }
    })();
  </script>
</body>
</html>
        `;
      }

      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // 4️⃣ No content at all
    res.status(404).send('No game content found (no files and no code).');
  } catch (err) {
    console.error('Launch error:', err);
    res.status(500).send('Error launching game: ' + err.message);
  }
});

// ─── Vote ────────────────────────────────────────────────
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const updated = await Game.vote(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Play count ──────────────────────────────────────────
router.post('/:id/play', async (req, res) => {
  try {
    const updated = await Game.play(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete game ──────────────────────────────────────────
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    await Game.delete(req.params.id);
    res.json({ success: true });

    // Storage cleanup after responding, so a slow Cloudinary call cannot
    // delay the UI.
    deleteGameAssets(parseStoredFiles(game.files)).catch((err) => {
      console.error('⚠️ Could not remove Cloudinary game assets:', err.message);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Social actions ──────────────────────────────────────

// Like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const result = await Interaction.toggleLike(req.user.id, 'game', req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error in POST /games/:id/like:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Comment (fixed: ensure text is a non-empty string)
router.post('/:id/comment', auth, async (req, res) => {
  try {
    let { text } = req.body;
    // Validate and sanitize
    if (text === undefined || text === null || typeof text !== 'string') {
      return res.status(400).json({ error: 'Comment text must be a non-empty string' });
    }
    text = text.trim();
    if (!text) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }
    await Interaction.addComment(req.user.id, 'game', req.params.id, text);
    const comments = await Interaction.getComments('game', req.params.id);
    res.status(201).json(comments[0] || {});
  } catch (err) {
    console.error('Error in POST /games/:id/comment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Share
router.post('/:id/share', optionalAuth, async (req, res) => {
  try {
    const updated = await Interaction.incrementShare('game', req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Error in POST /games/:id/share:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET comments (public)
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Interaction.getComments('game', req.params.id);
    res.json(comments);
  } catch (err) {
    console.error('Error in GET /games/:id/comments:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
