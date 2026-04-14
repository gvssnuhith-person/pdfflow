/**
 * Filename Sanitizer
 * Prevents path traversal, removes special characters, limits length.
 */
const path = require('path');

/**
 * Sanitize a filename for safe storage.
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  // Extract base name to prevent path traversal
  let clean = path.basename(filename);

  // Remove null bytes (common attack vector)
  clean = clean.replace(/\0/g, '');

  // Replace dangerous characters with underscores
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Remove leading dots (hidden files)
  clean = clean.replace(/^\.+/, '');

  // Limit length (preserve extension)
  const ext = path.extname(clean);
  const base = path.basename(clean, ext);
  const maxBaseLength = 100;

  if (base.length > maxBaseLength) {
    clean = base.substring(0, maxBaseLength) + ext;
  }

  return clean || 'unnamed_file';
}

module.exports = { sanitizeFilename };
