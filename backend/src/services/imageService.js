/**
 * Image → PDF Service
 * Converts image files (JPG, PNG, WebP, TIFF, BMP, GIF) to PDF using sharp + pdf-lib.
 */
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const logger = require('../utils/logger');

// Maximum image dimension (prevents memory issues with huge images)
const MAX_DIMENSION = 4000;
const JPEG_QUALITY = 85;

/**
 * Convert an image file to a PDF buffer.
 * @param {string} filePath - Path to the uploaded image file
 * @returns {Promise<Buffer>} PDF file as a Buffer
 */
async function convertImageToPdf(filePath) {
  logger.info(`Converting image to PDF: ${filePath}`);

  // Step 1: Read and process the image with sharp
  const imageBuffer = await fs.promises.readFile(filePath);
  const metadata = await sharp(imageBuffer).metadata();

  logger.debug(`Image metadata: ${metadata.width}x${metadata.height}, format=${metadata.format}`);

  // Step 2: Resize if too large (preserving aspect ratio)
  let processedBuffer;
  const needsResize = metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION;

  const pipeline = sharp(imageBuffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize({
      width: needsResize ? MAX_DIMENSION : undefined,
      height: needsResize ? MAX_DIMENSION : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    });

  // Convert to JPEG for smaller file size (unless it's PNG with transparency)
  if (metadata.format === 'png' && metadata.channels === 4) {
    // PNG with alpha — keep as PNG for transparency
    processedBuffer = await pipeline.png({ quality: JPEG_QUALITY }).toBuffer();
  } else {
    // Everything else — convert to JPEG for compression
    processedBuffer = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  }

  // Get final dimensions after processing
  const finalMetadata = await sharp(processedBuffer).metadata();
  const imgWidth = finalMetadata.width;
  const imgHeight = finalMetadata.height;

  logger.debug(`Processed image: ${imgWidth}x${imgHeight}, size=${processedBuffer.length} bytes`);

  // Step 3: Create PDF with pdf-lib
  const pdfDoc = await PDFDocument.create();

  // Embed the image
  let embeddedImage;
  if (metadata.format === 'png' && metadata.channels === 4) {
    embeddedImage = await pdfDoc.embedPng(processedBuffer);
  } else {
    embeddedImage = await pdfDoc.embedJpg(processedBuffer);
  }

  // Add a page matching the image dimensions
  const page = pdfDoc.addPage([imgWidth, imgHeight]);

  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: imgWidth,
    height: imgHeight,
  });

  // Step 4: Save PDF
  const pdfBytes = await pdfDoc.save();
  logger.info(`Image → PDF complete: ${pdfBytes.length} bytes`);

  return Buffer.from(pdfBytes);
}

module.exports = { convertImageToPdf };
