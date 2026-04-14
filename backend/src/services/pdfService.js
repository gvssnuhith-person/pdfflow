const fs = require('fs');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const logger = require('../utils/logger');

/**
 * Extracts text from a PDF and returns a generated DOCX file buffer.
 * Note: Only extracts text content. Formatting, images, and tables are omitted.
 */
async function pdfToDocx(inputPath) {
  try {
    const dataBuffer = fs.readFileSync(inputPath);
    
    // Parse text from PDF
    const data = await pdfParse(dataBuffer);
    const rawText = data.text;

    // Split text by lines to construct paragraphs
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Build Word Document
    const paragraphs = lines.map(line => {
      return new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 24, // 12pt
          }),
        ],
        spacing: {
          after: 200, // Margin between paragraphs
        },
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    logger.error('Error extracting PDF to DOCX:', error);
    throw new Error('Could not convert PDF to DOCX. The file may be encrypted or corrupted.');
  }
}

module.exports = {
  pdfToDocx,
};
