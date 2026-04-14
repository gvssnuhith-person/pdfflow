const fs = require('fs');
const PDFParser = require('pdf2json');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const logger = require('../utils/logger');

/**
 * Extracts text from a PDF and returns a generated DOCX file buffer.
 * Note: Only extracts text content. Formatting, images, and tables are omitted.
 */
function pdfToDocx(inputPath) {
  return new Promise((resolve, reject) => {
    // 1 specifies text only mode
    const pdfParser = new PDFParser(this, 1);
    
    pdfParser.on('pdfParser_dataError', errData => {
      logger.error('Error extracting PDF to DOCX:', errData.parserError);
      reject(new Error('Could not convert PDF to DOCX. The file may be encrypted or corrupted.'));
    });
    
    pdfParser.on('pdfParser_dataReady', () => {
      try {
        const rawText = pdfParser.getRawTextContent();
        
        // Split text by lines to construct paragraphs
        const lines = rawText.split('\n')
          .map(line => line.trim().replace(/\r/g, ''))
          .filter(line => line.length > 0 && !line.includes('----------------Page'));

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

        Packer.toBuffer(doc).then(resolve).catch(reject);
      } catch (err) {
        reject(err);
      }
    });
    
    pdfParser.loadPDF(inputPath);
  });
}

module.exports = {
  pdfToDocx,
};
