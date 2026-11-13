// One place to configure the Cloudinary SDK.
//
// The API key/secret are only available to the server. Browser uploads use
// the signed /api/upload/signature endpoint or an unsigned preset, never the
// secret.

const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

const isConfigured = () => Boolean(cloudName && apiKey && apiSecret);

module.exports = { cloudinary, cloudName, isConfigured };
