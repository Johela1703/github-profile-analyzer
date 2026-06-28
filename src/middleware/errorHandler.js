/**
 * errorHandler.js
 *
 * Centralised Express error-handling middleware.
 * Catches errors thrown anywhere in the app and returns a
 * consistent JSON error response.
 */

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  // Log full stack in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err.stack || err.message);
  } else {
    console.error('❌ Error:', err.message);
  }

  // statusCode may be set by service layer (e.g., 404 for unknown GitHub user)
  const statusCode = err.statusCode || 500;

  // MySQL duplicate / constraint errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error:   'Duplicate entry conflict.',
      message: err.message,
    });
  }

  // GitHub rate-limit surfaced as 429
  if (statusCode === 429) {
    return res.status(429).json({
      success: false,
      error:   'Rate Limit Exceeded',
      message: err.message,
    });
  }

  return res.status(statusCode).json({
    success: false,
    error:   statusCode === 500 ? 'Internal Server Error' : err.message,
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message,
  });
};
