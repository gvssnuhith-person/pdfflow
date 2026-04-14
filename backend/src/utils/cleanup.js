/**
 * Temp File Cleanup
 * Removes temporary files after conversion to prevent disk bloat.
 */
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const config = require('../config/env');

/**
 * Delete a single temp file safely.
 * @param {string} filePath - Absolute path to the file
 */
async function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.debug(`Cleaned up temp file: ${path.basename(filePath)}`);
    }
  } catch (err) {
    logger.warn(`Failed to cleanup file ${filePath}: ${err.message}`);
  }
}

/**
 * Sweep the upload directory for stale files older than maxAgeMs.
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 30 minutes)
 */
async function sweepTempFiles(maxAgeMs = 30 * 60 * 1000) {
  const uploadDir = path.resolve(config.uploadDir);
  try {
    if (!fs.existsSync(uploadDir)) return;

    const files = await fs.promises.readdir(uploadDir);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      try {
        const stat = await fs.promises.stat(filePath);
        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.promises.unlink(filePath);
          cleaned++;
        }
      } catch {
        // File may have been deleted already — skip
      }
    }

    if (cleaned > 0) {
      logger.info(`Temp sweep: cleaned ${cleaned} stale file(s)`);
    }
  } catch (err) {
    logger.warn(`Temp sweep failed: ${err.message}`);
  }
}

module.exports = { cleanupFile, sweepTempFiles };
