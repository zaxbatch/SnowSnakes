// Shared image upload helper.
//
// Posts to Cloudinary's upload endpoint directly rather than going through the
// upload widget. The widget is a UI component: its open() method only shows the
// picker and accepts no file argument, so a canvas export (which we already
// hold as a Blob) cannot be pushed through it. Uploading directly also lets the
// request itself carry validation, independent of the account's preset.

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'r6natkse';
const IMAGE_PRESET = process.env.REACT_APP_CLOUDINARY_IMAGE_PRESET || 'snowsnakes_unsigned';

// Formats accepted for images uploaded programmatically (doodle maker output).
export const ALLOWED_IMAGE_FORMATS = ['png', 'jpg', 'jpeg'];

const extensionFor = (name, type) => {
  const fromType = (type || '').split('/').pop();
  if (fromType === 'jpeg') return 'jpg';
  if (fromType && ALLOWED_IMAGE_FORMATS.includes(fromType)) return fromType;
  const fromName = (name || '').split('.').pop().toLowerCase();
  return ALLOWED_IMAGE_FORMATS.includes(fromName) ? fromName : 'png';
};

// Uploads an image File/Blob and resolves with its secure URL.
// Rejects with an Error whose message is safe to show the user.
export const uploadImageBlob = async (blob, { folder = 'snowsnakes', filename } = {}) => {
  if (!blob) throw new Error('Nothing to upload.');

  const extension = extensionFor(filename, blob.type);
  const file = blob instanceof File
    ? blob
    : new File([blob], filename || `snowsnakes-doodle-${Date.now()}.${extension}`, {
        type: blob.type || 'image/png',
      });

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', IMAGE_PRESET);
  form.append('folder', folder);
  // NOTE: `allowed_formats` cannot be sent with an unsigned upload — Cloudinary
  // rejects the request and requires the restriction to live on the preset
  // itself. So the format guarantee for these uploads comes from the preset
  // (Settings -> Upload -> the image preset -> Allowed formats), and the
  // response is checked below as a backstop.

  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch (err) {
    throw new Error('Could not reach the upload service. Check your connection and try again.');
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch (err) {
    // Non-JSON response; handled by the failure branch below.
  }

  if (!response.ok) {
    const message = (payload.error && payload.error.message) || `Upload failed (${response.status}).`;
    if (/format|not allowed|invalid image/i.test(message)) {
      throw new Error(
        `That file type isn't supported. Images must be ${ALLOWED_IMAGE_FORMATS.join(', ').toUpperCase()}.`
      );
    }
    throw new Error(message);
  }

  if (!payload.secure_url) throw new Error('Upload finished but returned no image URL.');

  // Backstop: for an unsigned upload the preset is the only place the format
  // can be constrained, so check what Cloudinary says it stored. Use the
  // `format` field, not the URL — Cloudinary is a CDN, so a returned URL is
  // typically an extensionless path such as .../snowsnakes/abc123.
  const storedFormat = (payload.format || '').toLowerCase();
  if (storedFormat === 'jpeg') {
    // 'jpeg' and 'jpg' are the same thing; treat it as allowed.
  } else if (storedFormat && !ALLOWED_IMAGE_FORMATS.includes(storedFormat)) {
    throw new Error(
      `That file type isn't supported. Images must be ${ALLOWED_IMAGE_FORMATS.join(', ').toUpperCase()}.`
    );
  }

  return payload.secure_url;
};

export default uploadImageBlob;
