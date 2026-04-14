/**
 * Global Error Handler
 * Catches all unhandled errors and returns structured JSON responses.
 */
const logger = require('../utils/logger');
const { cleanupFile } = require('../utils/cleanup');
const config = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Clean up uploaded file on error
  if (req.file && req.file.path) {
    cleanupFile(req.file.path);
  }

  // Multer-specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: `File too large. Maximum size is ${config.maxFileSizeMB}MB.`,
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field. Please use the "file" field name.',
    });
  }

  // Custom status code errors
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && !config.isDev
      ? 'Internal server error. Please try again later.'
      : err.message || 'Something went wrong.';

  logger.error(`[${statusCode}] ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;
