const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const Game = require('../models/Game');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 2000 },
});

const uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId,
        use_filename: false,
        unique_filename: false,
        resource_type: 'auto',
        overwrite: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
};

router.get('/', async (req, res) => {
  try {
    const games = await Game.findAll();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', upload.array('files', 2000), async (req, res) => {
  try {
    const { title, description, icon, tags, type, code } = req.body;
    const author_id = req.user ? req.user.id : null;

    if (!title || !description) {
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
      files: [],
    });

    const gameId = game.id;
    const cloudinaryFolder = `games/${gameId}`;
    const uploadedFiles = [];

    // ── CASE 1: Files uploaded ──────────────────────────
    if (req.files && req.files.length > 0) {
      let paths = req.body.paths;
      if (!Array.isArray(paths)) paths = paths ? [paths] : [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const relativePath = paths[i] || file.originalname;
        let publicId = relativePath.replace(/^\.?\/+/, '').replace(/\.\.\//g, '');

        try {
          const result = await uploadToCloudinary(file.buffer, cloudinaryFolder, publicId);
          uploadedFiles.push({
            name: file.originalname,
            path: publicId,
            url: result.secure_url,
            public_id: result.public_id,
            size: file.size,
            mimetype: file.mimetype,
          });
        } catch (err) {
          console.error(`Failed to upload ${file.originalname}:`, err.message);
        }
      }
    }

    // ── CASE 2: No files, but code provided ──────────────
    else if (code && code.trim() !== '') {
      const trimmed = code.trim();
      const isHtml = /<!DOCTYPE\s+html/i.test(trimmed) || /<html\b/i.test(trimmed);

      let contentToUpload;
      if (isHtml) {
        // Raw HTML – upload directly
        contentToUpload = Buffer.from(trimmed, 'utf-8');
        console.log(`📄 Uploading raw HTML for game ${gameId}`);
      } else {
        // JavaScript – wrap in our template
        const escapedCode = JSON.stringify(trimmed).replace(/<\/script>/gi, '<\\/script>');
        const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  body { font-family: monospace; padding: 2rem; background: #f5f5f5; }
  #game-container { margin-top: 1rem; }
  .error { color: red; }
</style>
</head>
<body>
  <h1>${icon || '🎮'} ${title}</h1>
  <div id="game-container"></div>
  <script>
    (function() {
      const container = document.getElementById('game-container');
      try {
        const userCode = ${escapedCode};
        const func = new Function(userCode + '\\n if (typeof myGame === "function") myGame();');
        func();
      } catch (e) {
        container.innerHTML = '<p class="error">Error: ' + e.message + '</p>';
        console.error(e);
      }
    })();
  <\/script>
</body>
</html>
        `;
        contentToUpload = Buffer.from(htmlContent, 'utf-8');
        console.log(`📦 Wrapped JavaScript for game ${gameId}`);
      }

      try {
        const result = await uploadToCloudinary(contentToUpload, cloudinaryFolder, 'index.html');
        uploadedFiles.push({
          name: 'index.html',
          path: 'index.html',
          url: result.secure_url,
          public_id: result.public_id,
          size: contentToUpload.length,
          mimetype: 'text/html',
        });
      } catch (err) {
        console.error('Failed to upload code‑based game:', err.message);
      }
    }

    const updatedGame = await Game.updateFiles(gameId, uploadedFiles);
    res.status(201).json(updatedGame);
  } catch (err) {
    console.error('Game creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Launch game – proxy Cloudinary HTML ────────────────
router.get('/:id/launch', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).send('Game not found');

    if (game.files && game.files.length > 0) {
      const indexFile = game.files.find(f => f.path === 'index.html') ||
                        game.files.find(f => f.path.endsWith('.html') || f.path.endsWith('.htm'));
      if (indexFile) {
        try {
          const response = await fetch(indexFile.url);
          if (!response.ok) throw new Error(`Cloudinary returned ${response.status}`);
          let html = await response.text();
          const baseUrl = indexFile.url.replace(/\/[^/]+$/, '/');
          html = html.replace(/<head>/i, `<head><base href="${baseUrl}">`);
          res.setHeader('Content-Type', 'text/html');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
          return res.send(html);
        } catch (fetchErr) {
          console.error('Error fetching HTML from Cloudinary:', fetchErr);
          return res.redirect(indexFile.url);
        }
      } else {
        const fileList = game.files.map(f => `<li><a href="${f.url}" target="_blank">${f.path}</a></li>`).join('');
        return res.send(`
          <html><body style="font-family:monospace;padding:2rem;">
            <h1>${game.icon} ${game.title}</h1>
            <p>No HTML file found. Uploaded files:</p>
            <ul>${fileList}</ul>
          </body></html>
        `);
      }
    }

    res.status(404).send(`
      <html><body style="font-family:monospace;padding:2rem;">
        <h1>${game.icon} ${game.title}</h1>
        <p>No game content available.</p>
      </body></html>
    `);
  } catch (err) {
    console.error('Launch error:', err);
    res.status(500).send('Error launching game');
  }
});

router.post('/:id/vote', async (req, res) => {
  try {
    const updated = await Game.vote(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/play', async (req, res) => {
  try {
    const updated = await Game.play(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const game = await Game.delete(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;