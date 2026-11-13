#!/usr/bin/env node
// One-off importer for games whose files still live on the old host.
//
//     # copy the folders from Hostinger first, e.g.
//     rsync -av host:~/snowsnakes/backend/uploads/games/ backend/uploads/games/
//
//     npm run import:game-assets -- --dry-run
//     npm run import:game-assets
//     npm run import:game-assets -- --delete   # remove local copies after upload
//
// Only games that have no Cloudinary manifest yet are touched. Pasted-code
// games (no files) are ignored.

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { pool } = require('../config/db');
const Game = require('../models/Game');
const { uploadGameFiles } = require('../services/gameAssets');

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
};
const dryRun = args.includes('--dry-run');
const deleteLocal = args.includes('--delete');
const rootDir = path.resolve(valueAfter('--dir') || path.join(__dirname, '..', 'uploads', 'games'));

const walk = (dir, base = dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, base));
    } else if (entry.isFile()) {
      const stat = fs.statSync(full);
      out.push({
        path: full,
        originalname: entry.name,
        size: stat.size,
        relativePath: path.relative(base, full).split(path.sep).join('/'),
      });
    }
  }
  return out.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
};

(async () => {
  if (!fs.existsSync(rootDir)) {
    console.error(`❌ Game upload directory not found: ${rootDir}`);
    process.exitCode = 1;
    return;
  }

  const folders = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => Number(a) - Number(b));

  console.log(`Scanning ${folders.length} game folder(s) in ${rootDir}${dryRun ? ' (dry run)' : ''}`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const folder of folders) {
    const gameId = Number(folder);
    const game = await Game.findById(gameId);
    if (!game) {
      console.log(`- ${folder}: no game row, skipped`);
      skipped += 1;
      continue;
    }
    if (Array.isArray(game.files) && game.files.length > 0) {
      console.log(`- ${folder}: already has Cloudinary files, skipped`);
      skipped += 1;
      continue;
    }

    const files = walk(path.join(rootDir, folder));
    if (files.length === 0) {
      console.log(`- ${folder}: folder is empty, skipped`);
      skipped += 1;
      continue;
    }

    const totalMb = (files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(1);
    console.log(`- ${folder}: ${files.length} file(s), ${totalMb} MB — ${game.title}`);
    if (dryRun) continue;

    try {
      const uploaded = await uploadGameFiles(
        gameId,
        files,
        files.map((file) => file.relativePath)
      );
      await Game.setFiles(gameId, uploaded.files, uploaded.entryHtml);
      imported += 1;
      console.log(`  ✅ uploaded ${uploaded.files.length} file(s)`);
      if (deleteLocal) {
        fs.rmSync(path.join(rootDir, folder), { recursive: true, force: true });
        console.log('  🧹 removed the local copy');
      }
    } catch (err) {
      failed += 1;
      console.error(`  ❌ ${err.message}`);
    }
  }

  console.log(`\nDone: ${imported} imported, ${skipped} skipped, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
})()
  .catch((err) => {
    console.error('❌ Import failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
