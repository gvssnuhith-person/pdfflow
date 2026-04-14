/**
 * Text → PDF Service
 * Converts plain text and CSV files to well-formatted PDF using pdf-lib.
 */
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const logger = require('../utils/logger');

// PDF layout constants
const PAGE_WIDTH = 595.28;   // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const LINE_HEIGHT = 16;
const FONT_SIZE = 11;
const TITLE_SIZE = 16;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

/**
 * Convert a text/CSV file to a PDF buffer.
 * @param {string} filePath - Path to the uploaded text file
 * @param {string} originalName - Original filename (for the PDF title)
 * @returns {Promise<Buffer>} PDF file as a Buffer
 */
async function convertTextToPdf(filePath, originalName = 'document') {
  logger.info(`Converting text to PDF: ${filePath}`);

  // Step 1: Read the text file
  const content = await fs.promises.readFile(filePath, 'utf-8');

  if (!content || content.trim().length === 0) {
    throw Object.assign(
      new Error('The file is empty. Please upload a file with content.'),
      { statusCode: 400 }
    );
  }

  // Step 2: Create PDF
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Courier); // Monospace for text files
  const boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Calculate max characters per line for the monospace font
  const charWidth = font.widthOfTextAtSize('M', FONT_SIZE);
  const maxCharsPerLine = Math.floor(CONTENT_WIDTH / charWidth);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPos = PAGE_HEIGHT - MARGIN;

  function addNewPage() {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    yPos = PAGE_HEIGHT - MARGIN;
  }

  // Draw title
  const title = originalName.replace(/\.[^.]+$/, ''); // Remove extension
  page.drawText(title, {
    x: MARGIN,
    y: yPos,
    size: TITLE_SIZE,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  yPos -= TITLE_SIZE + 12;

  // Draw a separator line
  page.drawLine({
    start: { x: MARGIN, y: yPos + 4 },
    end: { x: PAGE_WIDTH - MARGIN, y: yPos + 4 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  yPos -= 12;

  // Step 3: Render text content line by line
  const lines = content.split('\n');

  for (const rawLine of lines) {
    // Handle long lines by wrapping
    const wrappedLines = wrapText(rawLine, maxCharsPerLine);

    for (const line of wrappedLines) {
      if (yPos < MARGIN + LINE_HEIGHT) {
        addNewPage();
      }

      // Draw the line (handle empty lines as spacing)
      if (line.trim()) {
        // Sanitize: replace tabs with spaces, remove control chars
        const cleanLine = line
          .replace(/\t/g, '    ')
          .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');

        try {
          page.drawText(cleanLine, {
            x: MARGIN,
            y: yPos,
            size: FONT_SIZE,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
        } catch {
          // If text contains unsupported characters, draw a placeholder
          page.drawText('[unsupported characters]', {
            x: MARGIN,
            y: yPos,
            size: FONT_SIZE,
            font,
            color: rgb(0.6, 0.2, 0.2),
          });
        }
      }

      yPos -= LINE_HEIGHT;
    }
  }

  // Step 4: Save PDF
  const pdfBytes = await pdfDoc.save();
  logger.info(`Text → PDF complete: ${pdfBytes.length} bytes, ${pdfDoc.getPageCount()} page(s)`);

  return Buffer.from(pdfBytes);
}

/**
 * Wrap a text line to fit within maxChars width.
 * @param {string} text - The text line
 * @param {number} maxChars - Maximum characters per line
 * @returns {string[]} Array of wrapped lines
 */
function wrapText(text, maxChars) {
  if (!text || text.length <= maxChars) {
    return [text || ''];
  }

  const lines = [];
  let remaining = text;

  while (remaining.length > maxChars) {
    // Try to break at a space
    let breakPoint = remaining.lastIndexOf(' ', maxChars);
    if (breakPoint <= 0) {
      breakPoint = maxChars; // Force break if no space found
    }
    lines.push(remaining.substring(0, breakPoint));
    remaining = remaining.substring(breakPoint).trimStart();
  }

  if (remaining) {
    lines.push(remaining);
  }

  return lines;
}

module.exports = { convertTextToPdf };
