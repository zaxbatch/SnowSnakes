// Netlify Function entry point for the Express API.
//
// Netlify Server (a long-lived Express process) requires a credit-based plan,
// so the same backend/app.js is wrapped with serverless-http instead. The
// function is available on every plan.
//
// Netlify's rewrite sends /api/* here as /.netlify/functions/api/*. Express
// expects the /api prefix, so normalize the incoming path before handing the
// event to serverless-http.

const serverless = require('serverless-http');
const app = require('../../backend/app');

const handler = serverless(app, {
  // Let serverless-http decode binary bodies before multer sees them.
  binary: ['multipart/form-data', 'application/octet-stream'],
});

const normalizeEventPath = (event) => {
  const prefixes = ['/.netlify/functions/api'];
  for (const prefix of prefixes) {
    if (typeof event.path === 'string' && event.path.startsWith(prefix)) {
      event.path = '/api' + event.path.slice(prefix.length);
    }
    if (typeof event.rawPath === 'string' && event.rawPath.startsWith(prefix)) {
      event.rawPath = '/api' + event.rawPath.slice(prefix.length);
    }
    if (typeof event.rawUrl === 'string' && event.rawUrl.includes(prefix)) {
      event.rawUrl = event.rawUrl.replace(prefix, '/api');
    }
  }
  return event;
};

exports.handler = async (event, context) => {
  normalizeEventPath(event);
  return handler(event, context);
};
