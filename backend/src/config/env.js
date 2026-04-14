/**
 * Environment Configuration
 * Loads and validates environment variables with sensible defaults.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim()),

  // File upload
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50,
  get maxFileSizeBytes() {
    return this.maxFileSizeMB * 1024 * 1024;
  },
  uploadDir: process.env.UPLOAD_DIR || (process.env.VERCEL ? require('os').tmpdir() : './tmp/uploads'),

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 30,

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
