const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const caCert = fs.readFileSync(path.join(__dirname, 'ca.pem')).toString();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: caCert
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

module.exports = { pool };