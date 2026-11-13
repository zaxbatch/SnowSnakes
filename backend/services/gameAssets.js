// Game assets live in Cloudinary, not on the web server's disk.
//
// Netlify instances only have ephemeral /tmp storage, so the old
// backend/uploads/games/<id> folders would disappear on every restart.
// Each uploaded file is stored as a Cloudinary "raw" asset under
//
//     <CLOUDINARY_GAME_FOLDER>/<game id>/<original relative path>
//
// The launch page is still served by our API (Cloudinary sends raw HTML with
// Content-Disposition: attachment, so it cannot be iframed directly). The
// saved entry HTML gets a <base href> pointing at the game's Cloudinary
// folder, which keeps relative <script src>, <img src>, CSS url(), and
// fetch("asset.json") calls working.

const fs = require('fs');
const path = require('path');
const { cloudinary, cloudName, isConfigured } = require('../config/cloudinary');

const GAME_FOLDER_ROOT = String(process.env.CLOUDINARY_GAME_FOLDER || 'snowsnakes/games')
  .replace(/^\/+|\/+$/g, '');

const MAX_FILE_BYTES = Number(process.env.GAME_MAX_FILE_BYTES || 4 * 1000 * 1000);
const MAX_TOTAL_BYTES = Number(process.env.GAME_MAX_TOTAL_BYTES || 4 * 1000 * 1000);
const UPLOAD_TIMEOUT_MS = Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || 120000);

const ALLOWED_EXTENSIONS = [
  '.html', '.htm', '.js', '.mjs', '.css', '.json', '.txt', '.md', '.xml', '.csv',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp',
  '.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.webm',
  '.wasm', '.zip', '.data', '.bin',
  '.woff', '.woff2', '.ttf', '.otf',
  '.glb', '.gltf', '.obj', '.mtl', '.map',
];

const gameFolder = (gameId) => `${GAME_FOLDER_ROOT}/${gameId}`;

const sanitizeSegment = (segment) => {
  const cleaned = String(segment || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    // Keep spaces: HTML references like <script src="my game.js"> resolve to
    // the same name, and Cloudinary accepts spaces in a raw public_id.
    .replace(/[^A-Za-z0-9._ -]+/g, '_')
    .replace(/_+/g, '_')
    .trim()
    .replace(/^[._]+/, '_')
    .slice(0, 120);
  return cleaned || 'file';
};

// `webkitRelativePath` is sent for folder uploads, e.g. "My Game/js/main.js".
// Keep the directory shape so relative references inside the game still
// resolve; strip anything that could escape the Cloudinary folder.
const sanitizeRelativePath = (value, fallbackName) => {
  const raw = String(value || fallbackName || 'file').replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = raw.split('/').filter(Boolean).map(sanitizeSegment);
  return parts.length ? parts.join('/') : sanitizeSegment(fallbackName);
};

const uniquePath = (candidate, used) => {
  if (!used.has(candidate)) {
    used.add(candidate);
    return candidate;
  }
  const dir = path.posix.dirname(candidate);
  const ext = path.posix.extname(candidate);
  const base = path.posix.basename(candidate, ext);
  let n = 1;
  let next;
  do {
    next = `${dir === '.' ? '' : `${dir}/`}${base}-${n}${ext}`;
    n += 1;
  } while (used.has(next));
  used.add(next);
  return next;
};

const findEntryIndex = (files) => {
  const lower = files.map((file) => String(file.path || '').toLowerCase());
  let index = lower.findIndex((p) => p === 'index.html' || p.endsWith('/index.html'));
  if (index !== -1) return index;
  index = lower.findIndex((p) => p.endsWith('.html') || p.endsWith('.htm'));
  return index;
};

const deleteGameAssets = async (files) => {
  const publicIds = (files || [])
    .map((file) => (typeof file === 'string' ? file : file && file.public_id))
    .filter(Boolean);
  if (publicIds.length === 0) return;

  // The Admin API accepts up to 100 ids per call.
  for (let i = 0; i < publicIds.length; i += 100) {
    await cloudinary.api.delete_resources(publicIds.slice(i, i + 100), {
      resource_type: 'raw',
      type: 'upload',
      invalidate: true,
    });
  }
};

const uploadGameFiles = async (gameId, files, relativePaths = []) => {
  if (!isConfigured()) {
    const err = new Error('Cloudinary is not configured, so game files cannot be stored.');
    err.status = 500;
    throw err;
  }
  if (!files || files.length === 0) return { files: [], entryHtml: null };

  const totalBytes = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    const err = new Error(
      `This game is too large (${(totalBytes / (1024 * 1024)).toFixed(1)} MB). ` +
      `The limit is ${Math.round(MAX_TOTAL_BYTES / (1024 * 1024))} MB per game.`
    );
    err.status = 413;
    throw err;
  }

  const folder = gameFolder(gameId);
  const used = new Set();
  const uploaded = [];

  try {
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const relativePath = uniquePath(
        sanitizeRelativePath(relativePaths[i], file.originalname),
        used
      );

      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: 'raw',
        type: 'upload',
        public_id: `${folder}/${relativePath}`,
        overwrite: true,
        invalidate: true,
        timeout: UPLOAD_TIMEOUT_MS,
      });

      uploaded.push({
        name: file.originalname,
        path: relativePath,
        url: result.secure_url,
        public_id: result.public_id,
        bytes: result.bytes || file.size || 0,
        type: path.extname(relativePath).slice(1).toLowerCase(),
      });
    }

    const entryIndex = findEntryIndex(uploaded);
    let entryHtml = null;
    if (entryIndex !== -1) {
      uploaded[entryIndex].entry = true;
      entryHtml = fs
        .readFileSync(files[entryIndex].path, 'utf8')
        .replace(/^\uFEFF/, '');
    }

    return { folder, files: uploaded, entryHtml };
  } catch (err) {
    // Do not leave half a game in Cloudinary when one file fails.
    await deleteGameAssets(uploaded).catch((cleanupErr) => {
      console.error('⚠️ Could not clean up partially uploaded game assets:', cleanupErr.message);
    });
    throw err;
  }
};

const cloudinaryFolderUrl = (folder) =>
  `https://res.cloudinary.com/${cloudName}/raw/upload/${folder}/`;

const buildLaunchHtml = (entryHtml, files, gameId) => {
  const folder = gameFolder(gameId);
  const entry =
    (files || []).find((file) => file.entry) ||
    (files || []).find((file) => /\.html?$/i.test(file.path || ''));
  const entryDir = entry && entry.path ? path.posix.dirname(entry.path) : '.';
  const dirPrefix = entryDir && entryDir !== '.' ? `${entryDir.replace(/^\.\/?/, '')}/` : '';
  const baseHref = `${cloudinaryFolderUrl(folder)}${dirPrefix}`;
  const baseTag = `<base href="${baseHref.replace(/"/g, '&quot;')}">`;

  if (/<head[^>]*>/i.test(entryHtml)) {
    return entryHtml.replace(/<head[^>]*>/i, (head) => `${head}\n  ${baseTag}`);
  }
  if (/<html[^>]*>/i.test(entryHtml)) {
    return entryHtml.replace(/<html[^>]*>/i, (html) => `${html}\n<head>${baseTag}</head>`);
  }
  // A fragment rather than a full document.
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${baseTag}</head><body>${entryHtml}</body></html>`;
};

module.exports = {
  ALLOWED_EXTENSIONS,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
  GAME_FOLDER_ROOT,
  gameFolder,
  uploadGameFiles,
  deleteGameAssets,
  buildLaunchHtml,
  cloudinaryFolderUrl,
};
