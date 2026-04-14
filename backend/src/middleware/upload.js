/**
 * Multer Upload Middleware
 * Configures file upload with size limits and storage strategy.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const { sanitizeFilename } = require('../utils/sanitize');

// Ensure upload directory exists
const uploadDir = path.resolve(config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types for conversion
const ALLOWED_MIMES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'image/bmp',
  'image/gif',
  // Documents
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc (legacy)
  // Text
  'text/plain',
  'text/csv',
]);

// Allowed file extensions (fallback check)
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.bmp', '.gif',
  '.docx', '.doc',
  '.txt', '.csv',
]);

// Disk storage for uploaded files
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeName = sanitizeFilename(file.originalname);
    cb(null, `${timestamp}_${random}_${safeName}`);
  },
});

// File filter — validates MIME type and extension
const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIMES.has(file.mimetype) && !ALLOWED_EXTENSIONS.has(ext)) {
    const error = new Error(
      `Unsupported file type: ${file.mimetype} (${ext}). Allowed: images (JPG, PNG, WebP, TIFF, BMP, GIF), documents (DOCX), text (TXT, CSV).`
    );
    error.statusCode = 400;
    return cb(error, false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: 1, // Single file upload only
  },
});

module.exports = upload;
module.exports.ALLOWED_MIMES = ALLOWED_MIMES;
module.exports.ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS;
