/**
 * PDF Converter — Backend Entry Point
 * Express server with security, logging, and graceful shutdown.
 */
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const config = require('./config/env');
const logger = require('./utils/logger');
const { sweepTempFiles } = require('./utils/cleanup');
const { helmetMiddleware, rateLimiter, corsMiddleware } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const convertRoutes = require('./routes/convertRoutes');

const app = express();

// ═══════════════════════════════════════
// Middleware Pipeline
// ═══════════════════════════════════════

// 1. Security headers
app.use(helmetMiddleware);

// 2. CORS
app.use(corsMiddleware);

// 3. Rate limiting
app.use('/api/', rateLimiter);

// 4. Request logging (use 'combined' in prod, 'dev' in dev)
app.use(
  morgan(config.isDev ? 'dev' : 'combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// 5. Body parsing (for non-file routes)
app.use(express.json({ limit: '1mb' }));

// ═══════════════════════════════════════
// Routes
// ═══════════════════════════════════════

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'PDF Converter API',
    version: '1.0.0',
    docs: '/api/formats',
    health: '/api/health',
  });
});

// API routes
app.use('/api', convertRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found. Check /api/health for available routes.',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ═══════════════════════════════════════
// Server Startup
// ═══════════════════════════════════════

// Ensure upload directory exists
const uploadDir = path.resolve(config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Created upload directory: ${uploadDir}`);
}

if (!process.env.VERCEL) {
  const server = app.listen(config.port, () => {
    logger.info(`🚀 PDF Converter API running on port ${config.port}`);
    logger.info(`   Environment: ${config.nodeEnv}`);
    logger.info(`   CORS origins: ${config.corsOrigins.join(', ')}`);
    logger.info(`   Max file size: ${config.maxFileSizeMB}MB`);
    logger.info(`   Rate limit: ${config.rateLimitMax} req/${config.rateLimitWindowMs / 1000}s`);
  });

  // Schedule temp file cleanup every 15 minutes
  const cleanupInterval = setInterval(() => sweepTempFiles(), 15 * 60 * 1000);

  // ═══════════════════════════════════════
  // Graceful Shutdown
  // ═══════════════════════════════════════

  function shutdown(signal) {
    logger.info(`${signal} received. Shutting down gracefully...`);
    clearInterval(cleanupInterval);
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
