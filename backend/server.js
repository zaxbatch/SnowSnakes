require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jokes', require('./routes/jokes'));
app.use('/api/doodles', require('./routes/doodles'));
app.use('/api/comics', require('./routes/comics'));
app.use('/api/episodes', require('./routes/episodes'));
app.use('/api/games', require('./routes/games'));
app.use('/api/characters', require('./routes/characters'));
app.use('/api/fridge', require('./routes/fridge'));
app.use('/api/random', require('./routes/random'));
app.use('/api/upload', require('./routes/upload'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));