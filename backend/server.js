// Backend-only dev / legacy entry point.
//
// `npm run backend` uses this. The app and its routes live in ./app.js so the
// Netlify Function entry can share them.

require('dotenv').config({ path: __dirname + '/.env' });

const app = require('./app');
const { runMigrations } = require('./db/migrate');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📡 API available at /api`);
  runMigrations();
});
