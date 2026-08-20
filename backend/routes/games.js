const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Game = require('../models/Game');
const Interaction = require('../services/interaction');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─── File upload config ──────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/games/temp');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'game-' + unique + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = [
    '.html', '.htm', '.js', '.css', '.json', '.txt',
    '.png', '.jpg', '.jpeg', '.gif', '.webp',
    '.mp3', '.wav', '.mp4', '.webm', '.wasm', '.zip'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
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
    fileSize: 50 * 1024 * 1024, // per-file
    files: 100,                 // max number of files
    fieldSize: 50 * 1024 * 1024 // pasted code can be a full HTML game (>1MB default!)
  }
});

// ─── Helpers ──────────────────────────────────────────────
const moveFilesToGameFolder = (gameId, files) => {
  const tempFolder = path.join(__dirname, '../uploads/games/temp');
  const gameFolder = path.join(__dirname, '../uploads/games', String(gameId));
  if (!fs.existsSync(gameFolder)) fs.mkdirSync(gameFolder, { recursive: true });
  const moved = [];
  for (const file of files) {
    const src = path.join(tempFolder, file.filename);
    const dest = path.join(gameFolder, file.filename);
    if (fs.existsSync(src)) { fs.renameSync(src, dest); moved.push(file.filename); }
  }
  return moved;
};

const cleanupTempFiles = (files) => {
  if (!files) return;
  for (const f of files) {
    const filePath = path.join(__dirname, '../uploads/games/temp', f.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
};

// ─── Routes ──────────────────────────────────────────────

// GET all games with search & sort
router.get('/', async (req, res) => {
  try {
    const { search, sort } = req.query;
    const games = await Game.findAll({ search, sort });
    for (const g of games) {
      try {
        g.comments = await Interaction.getComments('game', g.id);
      } catch (err) {
        console.error(`Error fetching comments for game ${g.id}:`, err);
        g.comments = [];
      }
      if (req.user) {
        try {
          g.isLiked = await Interaction.getLikeStatus(req.user.id, 'game', g.id);
        } catch (err) {
          console.error(`Error fetching like status for game ${g.id}:`, err);
          g.isLiked = false;
        }
      } else {
        g.isLiked = false;
      }
    }
    res.json(games);
  } catch (err) {
    console.error('Error in GET /games:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// GET a single game
router.get('/:id', async (req, res) => {
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

// POST a new game (with file upload)
router.post('/', upload.array('files', 100), async (req, res) => {
  try {
    const { title, description, icon, tags, type, code, code_encoding } = req.body;
    const author_id = req.user ? req.user.id : null;

    if (!title || !description) {
      cleanupTempFiles(req.files);
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Decode base64-transported code (frontend encodes pasted HTML/JS so
    // Hostinger's edge WAF doesn't 403 the multipart body).
    let finalCode = code || '';
    if (code_encoding === 'base64' && finalCode) {
      try {
        finalCode = Buffer.from(finalCode, 'base64').toString('utf8');
      } catch (err) {
        console.error('Base64 decode failed, storing raw:', err.message);
      }
    }

    const game = await Game.create({
      title,
      description,
      icon: icon || '🎮',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      author_id,
      type: type || 'user',
      code: finalCode,
      file_count: req.files ? req.files.length : 0,
    });

    let movedFiles = [];
    if (req.files && req.files.length > 0) {
      movedFiles = moveFilesToGameFolder(game.id, req.files);
    }

    res.status(201).json({ ...game, uploadedFiles: movedFiles });
  } catch (err) {
    console.error('Game creation error:', err);
    cleanupTempFiles(req.files);
    res.status(500).json({ error: err.message });
  }
});

// ─── Launch game ──────────────────────────────────────────
router.get('/:id/launch', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).send('Game not found');

    // 1️⃣ If there are uploaded local files, serve index.html
    const gameFolder = path.join(__dirname, '../uploads/games', String(game.id));
    if (game.file_count > 0 && fs.existsSync(gameFolder)) {
      const files = fs.readdirSync(gameFolder);
      let htmlFile = files.find(f => f.toLowerCase() === 'index.html') ||
                     files.find(f => f.endsWith('.html') || f.endsWith('.htm'));
      if (htmlFile) {
        return res.sendFile(path.join(gameFolder, htmlFile));
      }
    }

    // 2️⃣ If there's pasted code, serve it with improved handling
    if (game.code && game.code.trim()) {
      const trimmed = game.code.trim();
      let html;

      // 2a. If it looks like HTML (starts with '<'), inject it directly
      if (trimmed.startsWith('<')) {
        html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${game.title}</title>
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
        // 2b. Otherwise treat as JavaScript with auto‑execution
        html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${game.title}</title>
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

      // ✅ Explicitly set content type to HTML
      res.set('Content-Type', 'text/html');
      return res.send(html);
    }

    // 3️⃣ No content at all
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
    const game = await Game.delete(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    const folder = path.join(__dirname, '../uploads/games', String(req.params.id));
    if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true });
    res.json({ success: true });
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
router.post('/:id/share', auth, async (req, res) => {
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