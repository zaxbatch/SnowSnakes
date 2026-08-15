const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Game = require('../models/Game');

// ─── File filter ───────────────────────────────────────────
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
    cb(new Error('File type not allowed: ' + file.originalname));
  }
};

// ─── Multer – temporary storage ──────────────────────────
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempPath = path.join(__dirname, '../uploads/games/temp');
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    const base = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(base);
    const name = path.basename(base, ext);
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${name}-${suffix}${ext}`);
  }
});

const upload = multer({
  storage: tempStorage,
  fileFilter,
  limits: { 
    fileSize: 500 * 1024 * 1024,
    files: 2000
  }
});

// ─── Helpers ──────────────────────────────────────────────
const moveFilesToGameFolder = (gameId, files) => {
  const tempFolder = path.join(__dirname, '../uploads/games/temp');
  const gameFolder = path.join(__dirname, '../uploads/games', String(gameId));
  if (!fs.existsSync(gameFolder)) {
    fs.mkdirSync(gameFolder, { recursive: true });
  }
  const moved = [];
  for (const file of files) {
    const src = path.join(tempFolder, file.filename);
    const dest = path.join(gameFolder, file.filename);
    if (fs.existsSync(src)) {
      fs.renameSync(src, dest);
      moved.push(file.filename);
    }
  }
  return moved;
};

const cleanupTempFiles = (files) => {
  if (!files) return;
  for (const f of files) {
    const filePath = path.join(__dirname, '../uploads/games/temp', f.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// ─── Routes ──────────────────────────────────────────────

// GET all games
router.get('/', async (req, res) => {
  try {
    const games = await Game.findAll();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single game
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST new game with files ───────────────────────────
router.post('/', upload.array('files', 2000), async (req, res) => {
  console.log(`📦 POST /api/games – files: ${req.files?.length || 0}`);

  try {
    const { title, description, icon, tags, type, code } = req.body;
    const author_id = req.user ? req.user.id : null;

    if (!title || !description) {
      cleanupTempFiles(req.files);
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const game = await Game.create({
      title,
      description,
      icon: icon || '🎮',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      author_id,
      type: type || 'user',
      code: code || '',
      file_count: req.files ? req.files.length : 0,
    });

    console.log(`✅ Game created with ID ${game.id}`);

    let movedFiles = [];
    if (req.files && req.files.length > 0) {
      movedFiles = moveFilesToGameFolder(game.id, req.files);
      console.log(`📁 Moved ${movedFiles.length} files to game ${game.id}`);
    }

    res.status(201).json({
      ...game,
      uploadedFiles: movedFiles,
    });
  } catch (err) {
    console.error('❌ Game creation error:', err);
    cleanupTempFiles(req.files);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Upload error: ' + err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── ✅ LAUNCH route – MUST come before the wildcard ───
router.get('/:id/launch', async (req, res) => {
  console.log(`🚀 Launch requested for game ${req.params.id}`);
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      console.log(`❌ Game ${req.params.id} not found`);
      return res.status(404).send('Game not found');
    }

    const gameFolder = path.join(__dirname, '../uploads/games', String(game.id));
    console.log(`   - file_count: ${game.file_count}`);
    console.log(`   - folder exists: ${fs.existsSync(gameFolder)}`);

    // ── If files exist, try to serve an HTML file ──
    if (game.file_count > 0 && fs.existsSync(gameFolder)) {
      const files = fs.readdirSync(gameFolder);
      console.log(`   - Files in folder: ${files.join(', ')}`);

      let htmlFile = files.find(f => f.toLowerCase() === 'index.html');
      if (!htmlFile) {
        htmlFile = files.find(f => f.endsWith('.html') || f.endsWith('.htm'));
      }
      if (htmlFile) {
        const filePath = path.join(gameFolder, htmlFile);
        console.log(`✅ Serving HTML: ${filePath}`);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.sendFile(filePath);
      } else {
        console.warn(`⚠️ No HTML file found in ${gameFolder}`);
        // Show list of uploaded files
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head><meta charset="UTF-8"><title>${game.title}</title>
            <style>body { font-family: monospace; padding: 2rem; }</style>
            </head>
            <body>
              <h1>${game.icon} ${game.title}</h1>
              <p>No HTML file found. Uploaded files:</p>
              <ul>${files.map(f => `<li>${f}</li>`).join('')}</ul>
            </body>
          </html>
        `);
      }
    }

    // ── Fallback: code-only game ──
    if (game.code) {
      console.log(`📝 Serving code for game ${game.id}`);
      const code = game.code;

      // Check if it looks like full HTML
      const isHtml = /<!DOCTYPE\s+html/i.test(code) || /<html\b/i.test(code);

      if (isHtml) {
        // Serve the code as raw HTML
        console.log(`   ✅ Serving as raw HTML`);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.send(code);
      } else {
        // Wrap in a container and execute as JavaScript function
        const escapedCode = code.replace(/<\/script>/gi, '<\\/script>');
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${game.title}</title>
  <style>
    body { font-family: monospace; padding: 2rem; background: #f0f0f0; }
    #game-container { margin-top: 1rem; }
    .error { color: red; }
  </style>
</head>
<body>
  <h1>${game.icon} ${game.title}</h1>
  <div id="game-container"></div>
  <script>
    try {
      ${escapedCode}
      if (typeof myGame === 'function') {
        myGame();
      } else {
        document.getElementById('game-container').innerHTML = '<p class="error">Error: myGame function not defined.</p>';
      }
    } catch (e) {
      document.getElementById('game-container').innerHTML = '<p class="error">Error: ' + e.message + '</p>';
      console.error(e);
    }
  <\/script>
</body>
</html>
        `;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.send(html);
      }
    }

    // ── Nothing ──
    console.log(`❌ No content for game ${game.id}`);
    res.status(404).send(`
      <html><body style="font-family:monospace;padding:2rem;">
        <h1>${game.icon} ${game.title}</h1>
        <p>No game content available.</p>
      </body></html>
    `);
  } catch (err) {
    console.error('❌ Launch error:', err);
    res.status(500).send('Error launching game');
  }
});

// ─── Serve static assets for a game (wildcard) ─────────
// This MUST come after the specific /launch route
router.get('/:id/*', async (req, res) => {
  try {
    const gameId = req.params.id;
    const filePath = req.params[0];
    const baseDir = path.join(__dirname, '../uploads/games', String(gameId));
    const fullPath = path.join(baseDir, filePath);

    if (!fullPath.startsWith(baseDir)) {
      return res.status(403).send('Forbidden');
    }
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('File not found');
    }
    res.sendFile(fullPath);
  } catch (err) {
    res.status(500).send('Error serving asset');
  }
});

// ─── Vote ────────────────────────────────────────────────
router.post('/:id/vote', async (req, res) => {
  try {
    const updated = await Game.vote(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Play count ───────────────────────────────────────────
router.post('/:id/play', async (req, res) => {
  try {
    const updated = await Game.play(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete ──────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const game = await Game.delete(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    const folder = path.join(__dirname, '../uploads/games', String(req.params.id));
    if (fs.existsSync(folder)) {
      fs.rmSync(folder, { recursive: true, force: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;