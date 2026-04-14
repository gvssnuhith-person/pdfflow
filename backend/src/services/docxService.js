/**
 * DOCX → PDF Service
 * Converts Word documents to PDF using mammoth (DOCX → HTML) + pdf-lib.
 * Extracts text content and renders it into a well-formatted PDF.
 */
const mammoth = require('mammoth');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const logger = require('../utils/logger');

// PDF layout constants
const PAGE_WIDTH = 595.28;  // A4 width in points
const PAGE_HEIGHT = 841.89; // A4 height in points
const MARGIN = 50;
const LINE_HEIGHT = 16;
const FONT_SIZE = 11;
const HEADING_SIZE = 18;
const SUBHEADING_SIZE = 14;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const CHARS_PER_LINE = Math.floor(CONTENT_WIDTH / (FONT_SIZE * 0.5));

/**
 * Sanitize text to only contain characters encodable by WinAnsi (pdf-lib standard fonts).
 * Strips icon fonts, private use area chars, and other unsupported Unicode.
 */
function sanitizeForPdf(text) {
  if (!text) return '';
  // Keep only printable ASCII + common Latin-1 supplement characters
  // Replace unsupported chars with empty string or a placeholder
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')  // Control chars
    .replace(/[\uE000-\uF8FF]/g, '')                             // Private Use Area (icon fonts)
    .replace(/[\uD800-\uDFFF]/g, '')                             // Surrogates
    .replace(/[\uFFF0-\uFFFF]/g, '')                             // Specials
    .replace(/[^\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u00A9\u00AE\u2122]/g, '') // Keep ASCII + common typographic chars
    .replace(/\u2013/g, '-')   // en-dash → hyphen
    .replace(/\u2014/g, '--')  // em-dash → double hyphen
    .replace(/\u2018/g, "'")   // left single quote
    .replace(/\u2019/g, "'")   // right single quote
    .replace(/\u201C/g, '"')   // left double quote
    .replace(/\u201D/g, '"')   // right double quote
    .replace(/\u2022/g, '*')   // bullet → asterisk
    .replace(/\u2026/g, '...') // ellipsis
    .replace(/\u2122/g, '(TM)') // trademark
    .replace(/\u00A9/g, '(C)')  // copyright
    .replace(/\u00AE/g, '(R)'); // registered
}

/**
 * Convert a DOCX file to a PDF buffer.
 * @param {string} filePath - Path to the uploaded DOCX file
 * @returns {Promise<Buffer>} PDF file as a Buffer
 */
async function convertDocxToPdf(filePath) {
  logger.info(`Converting DOCX to PDF: ${filePath}`);

  // Step 1: Extract text from DOCX using mammoth
  const docxBuffer = await fs.promises.readFile(filePath);

  // Extract raw text (preserves paragraph structure)
  const textResult = await mammoth.extractRawText({ buffer: docxBuffer });
  const rawText = textResult.value;

  if (!rawText || rawText.trim().length === 0) {
    throw Object.assign(
      new Error('The DOCX file appears to be empty or contains no readable text.'),
      { statusCode: 400 }
    );
  }

  // Also extract HTML for structural hints (headings, bold, etc.)
  const htmlResult = await mammoth.convertToHtml({ buffer: docxBuffer });

  // Parse structural elements from HTML
  const elements = parseHtmlStructure(htmlResult.value);

  logger.debug(`Extracted ${elements.length} elements from DOCX`);

  // Step 2: Create PDF
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPos = PAGE_HEIGHT - MARGIN;

  /**
   * Add a new page and reset Y position
   */
  function addNewPage() {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    yPos = PAGE_HEIGHT - MARGIN;
  }

  /**
   * Draw text with word wrapping, handling page breaks.
   */
  function drawText(text, fontSize, currentFont, color = rgb(0.13, 0.13, 0.13), spacing = LINE_HEIGHT) {
    const safeText = sanitizeForPdf(text);
    if (!safeText.trim()) return;
    const words = safeText.split(/\s+/);
    let line = '';

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const testWidth = currentFont.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > CONTENT_WIDTH && line) {
        // Draw current line
        if (yPos < MARGIN + spacing) addNewPage();
        page.drawText(line, { x: MARGIN, y: yPos, size: fontSize, font: currentFont, color });
        yPos -= spacing;
        line = word;
      } else {
        line = testLine;
      }
    }

    // Draw remaining text
    if (line) {
      if (yPos < MARGIN + spacing) addNewPage();
      page.drawText(line, { x: MARGIN, y: yPos, size: fontSize, font: currentFont, color });
      yPos -= spacing;
    }
  }

  // Step 3: Render elements to PDF
  for (const el of elements) {
    if (yPos < MARGIN + LINE_HEIGHT * 2) addNewPage();

    switch (el.type) {
      case 'h1':
        yPos -= 10; // Extra space before heading
        drawText(el.text, HEADING_SIZE, boldFont, rgb(0.1, 0.1, 0.1), HEADING_SIZE + 6);
        yPos -= 4;
        break;

      case 'h2':
      case 'h3':
        yPos -= 8;
        drawText(el.text, SUBHEADING_SIZE, boldFont, rgb(0.15, 0.15, 0.15), SUBHEADING_SIZE + 4);
        yPos -= 2;
        break;

      case 'li':
        drawText(`*  ${el.text}`, FONT_SIZE, font, rgb(0.2, 0.2, 0.2));
        break;

      case 'p':
      default:
        if (el.text.trim()) {
          drawText(el.text, FONT_SIZE, font, rgb(0.2, 0.2, 0.2));
          yPos -= 4; // Paragraph spacing
        } else {
          yPos -= LINE_HEIGHT / 2; // Empty line
        }
        break;
    }
  }

  // Step 4: Save PDF
  const pdfBytes = await pdfDoc.save();
  logger.info(`DOCX → PDF complete: ${pdfBytes.length} bytes, ${pdfDoc.getPageCount()} page(s)`);

  return Buffer.from(pdfBytes);
}

/**
 * Parse mammoth HTML output into structured elements.
 * @param {string} html - HTML string from mammoth
 * @returns {Array<{type: string, text: string}>}
 */
function parseHtmlStructure(html) {
  const elements = [];

  // Simple regex-based HTML parser (sufficient for mammoth's clean HTML output)
  const tagRegex = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const type = match[1].toLowerCase();
    // Strip all HTML tags from inner content
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (text) {
      elements.push({ type, text });
    }
  }

  // Fallback: if no elements found, split raw HTML into paragraphs
  if (elements.length === 0) {
    const stripped = html.replace(/<[^>]+>/g, '\n');
    const lines = stripped.split('\n').filter((l) => l.trim());
    for (const line of lines) {
      elements.push({ type: 'p', text: line.trim() });
    }
  }

  return elements;
}

module.exports = { convertDocxToPdf };
