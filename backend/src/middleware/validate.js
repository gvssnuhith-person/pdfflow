/**
 * File Validation Middleware
 * Deep validation of uploaded files — checks magic bytes, size, and emptiness.
 */
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Magic byte signatures for supported file types
const MAGIC_BYTES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46],
  bmp: [0x42, 0x4d],
  tiff_le: [0x49, 0x49, 0x2a, 0x00],
  tiff_be: [0x4d, 0x4d, 0x00, 0x2a],
  webp: null, // RIFF....WEBP — checked separately
  docx: [0x50, 0x4b, 0x03, 0x04], // ZIP archive (DOCX is a ZIP)
};

/**
 * Check if a buffer starts with the given magic bytes.
 */
function matchesMagic(buffer, magic) {
  if (!magic || buffer.length < magic.length) return false;
  return magic.every((byte, i) => buffer[i] === byte);
}

/**
 * Detect if a buffer is a WebP file (RIFF container with WEBP signature).
 */
function isWebP(buffer) {
  if (buffer.length < 12) return false;
  return (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && // RIFF
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50   // WEBP
  );
}

/**
 * Validate that the uploaded file's content matches its claimed type.
 */
async function validateFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select a file to convert.',
      });
    }

    const { path: filePath, size, mimetype, originalname } = req.file;

    // Check for empty files
    if (size === 0) {
      return res.status(400).json({
        success: false,
        error: 'The uploaded file is empty. Please select a valid file.',
      });
    }

    // For text files, we trust the extension (no magic bytes)
    const ext = path.extname(originalname).toLowerCase();
    if (['.txt', '.csv'].includes(ext)) {
      logger.debug(`Text file validated: ${originalname} (${size} bytes)`);
      return next();
    }

    // Read first 12 bytes for magic byte validation
    const fd = await fs.promises.open(filePath, 'r');
    const headerBuffer = Buffer.alloc(12);
    await fd.read(headerBuffer, 0, 12, 0);
    await fd.close();

    // Check magic bytes
    const isValidBinary =
      matchesMagic(headerBuffer, MAGIC_BYTES.jpeg) ||
      matchesMagic(headerBuffer, MAGIC_BYTES.png) ||
      matchesMagic(headerBuffer, MAGIC_BYTES.gif) ||
      matchesMagic(headerBuffer, MAGIC_BYTES.bmp) ||
      matchesMagic(headerBuffer, MAGIC_BYTES.tiff_le) ||
      matchesMagic(headerBuffer, MAGIC_BYTES.tiff_be) ||
      matchesMagic(headerBuffer, MAGIC_BYTES.docx) ||
      isWebP(headerBuffer);

    if (!isValidBinary) {
      logger.warn(`File rejected — magic bytes mismatch: ${originalname} (${mimetype})`);
      return res.status(400).json({
        success: false,
        error: 'File content does not match its type. The file may be corrupted or malicious.',
      });
    }

    logger.debug(`File validated: ${originalname} (${mimetype}, ${size} bytes)`);
    next();
  } catch (err) {
    logger.error(`Validation error: ${err.message}`);
    next(err);
  }
}

module.exports = { validateFile };
