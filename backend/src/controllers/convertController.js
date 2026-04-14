/**
 * Convert Controller
 * Handles file conversion requests — routes to the correct service based on file type.
 */
const path = require('path');
const logger = require('../utils/logger');
const { cleanupFile } = require('../utils/cleanup');
const { sanitizeFilename } = require('../utils/sanitize');
const { convertImageToPdf } = require('../services/imageService');
const { convertDocxToPdf } = require('../services/docxService');
const { convertTextToPdf } = require('../services/textService');

// File type → service mapping
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.bmp', '.gif']);
const DOCX_EXTENSIONS = new Set(['.docx', '.doc']);
const TEXT_EXTENSIONS = new Set(['.txt', '.csv']);

/**
 * POST /api/convert
 * Accepts a file upload and returns the converted PDF.
 */
async function convertFile(req, res, next) {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select a file to convert.',
      });
    }

    const { path: filePath, originalname, size } = req.file;
    const ext = path.extname(originalname).toLowerCase();

    logger.info(`Conversion request: ${originalname} (${ext}, ${formatBytes(size)})`);

    let pdfBuffer;
    let conversionType;

    // Route to the correct conversion service
    if (req.body.tool === 'pdf2docx' && ext === '.pdf') {
      const { pdfToDocx } = require('../services/pdfService');
      conversionType = 'pdf2docx';
      pdfBuffer = await pdfToDocx(filePath);
    } else if (IMAGE_EXTENSIONS.has(ext)) {
      conversionType = 'image';
      pdfBuffer = await convertImageToPdf(filePath);
    } else if (DOCX_EXTENSIONS.has(ext)) {
      conversionType = 'docx';
      pdfBuffer = await convertDocxToPdf(filePath);
    } else if (TEXT_EXTENSIONS.has(ext)) {
      conversionType = 'text';
      pdfBuffer = await convertTextToPdf(filePath, originalname);
    } else {
      return res.status(400).json({
        success: false,
        error: `Unsupported file type: ${ext} for tool ${req.body.tool || 'convert'}.`,
      });
    }

    // Generate output filename
    const baseName = sanitizeFilename(
      path.basename(originalname, ext)
    );
    const outputFilename = conversionType === 'pdf2docx' ? `${baseName}.docx` : `${baseName}.pdf`;

    const duration = Date.now() - startTime;
    logger.info(
      `Conversion complete: ${conversionType} → PDF, ` +
      `input=${formatBytes(size)}, output=${formatBytes(pdfBuffer.length)}, ` +
      `duration=${duration}ms`
    );

    // Send PDF as downloadable response
    // Send downloadable response
    res.set({
      'Content-Type': conversionType === 'pdf2docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
      'Content-Disposition': `attachment; filename="${outputFilename}"`,
      'Content-Length': pdfBuffer.length,
      'X-Conversion-Type': conversionType,
      'X-Conversion-Duration': `${duration}ms`,
    });

    res.send(pdfBuffer);

    // Clean up the uploaded file after sending the response
    cleanupFile(filePath);
  } catch (err) {
    // Clean up on error
    if (req.file && req.file.path) {
      cleanupFile(req.file.path);
    }
    next(err);
  }
}

/**
 * GET /api/health
 * Health check endpoint.
 */
function healthCheck(_req, res) {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
  });
}

/**
 * GET /api/formats
 * Returns supported file formats.
 */
function getSupportedFormats(_req, res) {
  res.json({
    success: true,
    formats: {
      images: ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.bmp', '.gif'],
      documents: ['.docx'],
      text: ['.txt', '.csv'],
    },
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50,
  });
}

/**
 * Format bytes to human-readable string.
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

module.exports = { convertFile, healthCheck, getSupportedFormats };
