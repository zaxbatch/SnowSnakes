// Shared Cloudinary upload helper.
//
// Wraps the upload widget in a promise so callers that already have a File or
// Blob (for example a canvas export) can upload it without building another
// widget wrapper by hand.

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'r6natkse';
const IMAGE_PRESET = process.env.REACT_APP_CLOUDINARY_IMAGE_PRESET || 'snowsnakes_unsigned';

export const hasUploadWidget = () =>
  typeof window !== 'undefined' && !!(window.cloudinary && window.cloudinary.createUploadWidget);

// Uploads an image File/Blob via the preset and resolves with its secure URL.
// Rejects with an Error whose message is safe to show the user.
export const uploadImageBlob = (blob, { folder = 'snowsnakes', filename } = {}) =>
  new Promise((resolve, reject) => {
    if (!hasUploadWidget()) {
      reject(new Error('The upload tool has not loaded yet. Check your connection and try again.'));
      return;
    }
    if (!blob) {
      reject(new Error('Nothing to upload.'));
      return;
    }

    // The widget wants a named File, not a bare Blob.
    const name = filename || `snowsnakes-doodle-${Date.now()}.png`;
    const file = typeof File !== 'undefined' && blob instanceof File
      ? blob
      : new File([blob], name, { type: blob.type || 'image/png' });

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: IMAGE_PRESET,
        folder,
        sources: ['local'],
        multiple: false,
        maxFiles: 1,
        resourceType: 'image',
        // Keep the picker honest even though the file comes from the canvas.
        clientAllowedFormats: ['png', 'jpg', 'jpeg'],
      },
      (error, result) => {
        if (error) {
          reject(new Error((error && (error.message || error.statusText)) || 'Upload failed.'));
          return;
        }
        if (result && result.event === 'success' && result.info) {
          resolve(result.info.secure_url);
        }
        // A 'close' event with no success means the visitor cancelled; leave
        // the promise pending rather than showing an alarming error.
      }
    );

    // Hand the file straight to the widget so no picker is shown.
    widget.open('', { file });
  });
