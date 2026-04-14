/**
 * Conversion API Routes
 * Defines all API endpoints with middleware chains.
 */
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { validateFile } = require('../middleware/validate');
const {
  convertFile,
  healthCheck,
  getSupportedFormats,
} = require('../controllers/convertController');

// Health check
router.get('/health', healthCheck);

// Supported formats
router.get('/formats', getSupportedFormats);

// File conversion — upload → validate → convert
router.post('/convert', upload.single('file'), validateFile, convertFile);

module.exports = router;
