const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generate upload signature (no auth for now)
router.post('/signature', (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    // MUST include upload_preset in the signed parameters
    const params = {
      timestamp,
      upload_preset: 'snowsnakes', // make sure this matches the preset name
    };
    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );
    res.json({
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      upload_preset: params.upload_preset,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
// console.log('API Key:', process.env.CLOUDINARY_API_KEY);

module.exports = router;