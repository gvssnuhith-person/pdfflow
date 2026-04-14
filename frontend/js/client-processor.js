/* ============================================
   PDFFlow — Client-Side PDF Processor
   Bypasses server payload limits using pdf-lib
   ============================================ */

/**
 * Main router for client-side processing
 */
async function processClientSide(toolKey, files) {
  if (toolKey === 'img2pdf') return await convertImagesToPdf(files);
  if (toolKey === 'split')     return await splitPdf(files[0]);
  if (toolKey === 'merge')     return await mergePdfs(files);
  
  throw new Error(`Client-side tool ${toolKey} not implemented.`);
}

/**
 * Convert Images to PDF
 */
async function convertImagesToPdf(files) {
  const { PDFDocument } = window.PDFLib;
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const fileData = await file.arrayBuffer();
    let image;
    
    // Embed based on format
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(fileData);
    } else if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(fileData);
    } else {
      throw new Error(`Standard browser PDF conversion only supports JPG/PNG. Provided: ${file.name}`);
    }

    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    filename: `converted_${Date.now()}.pdf`
  };
}

/**
 * Merge Multiple PDFs
 */
async function mergePdfs(files) {
  const { PDFDocument } = window.PDFLib;
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const fileData = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileData);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
    });
  }

  const pdfBytes = await mergedPdf.save();
  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    filename: `merged_${Date.now()}.pdf`
  };
}

/**
 * Split a PDF into a ZIP folder containing individual pages
 */
async function splitPdf(file) {
  const { PDFDocument } = window.PDFLib;
  
  if (!window.JSZip) {
    throw new Error('JSZip library failed to load.');
  }

  const fileData = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileData);
  const pageCount = pdfDoc.getPageCount();

  if (pageCount === 1) {
    throw new Error('This PDF only has 1 page. Cannot split.');
  }

  const zip = new window.JSZip();

  for (let i = 0; i < pageCount; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
    newPdf.addPage(copiedPage);

    const pdfBytes = await newPdf.save();
    zip.file(`page_${i + 1}.pdf`, pdfBytes);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  return {
    blob: zipBlob,
    filename: `split_${file.name.replace('.pdf', '')}.zip`
  };
}
