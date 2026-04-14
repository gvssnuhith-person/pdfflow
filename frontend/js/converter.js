/* ============================================
   PDFFlow — Converter (API + Download)
   ============================================ */

let _pdfBlob = null;
let _pdfFilename = null;

async function convertToPdf() {
  const file = getSelectedFile();
  if (!file) { showToast('No file selected.', 'error'); return; }

  const t0 = Date.now();
  hideEl('preview-section');
  showEl('progress-section');
  setProgress(0, 'Uploading...');

  try {
    const fd = new FormData();
    fd.append('file', file);
    const result = await xhrUpload(fd);
    _pdfBlob = result.blob;
    _pdfFilename = result.filename;

    const took = ((Date.now() - t0) / 1000).toFixed(1);
    hideEl('progress-section');
    showEl('success-section');

    const metaEl = $('success-meta');
    if (metaEl) metaEl.textContent = `Converted in ${took}s · ${formatFileSize(_pdfBlob.size)}`;

    showToast('Your PDF is ready!', 'success');
  } catch (err) {
    hideEl('progress-section');
    showEl('preview-section');
    showToast(err.message || 'Conversion failed. Please try again.', 'error', 6000);
    console.error('[ConvertFlow]', err);
  }
}

function xhrUpload(formData) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${CONFIG.API_URL}/convert`, true);
    xhr.responseType = 'blob';

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 60); // Upload = 0→60%
        setProgress(pct, 'Uploading...');
      }
    });

    xhr.upload.addEventListener('load', () => setProgress(65, 'Converting to PDF...'));

    xhr.addEventListener('load', () => {
      setProgress(100, 'Done!');

      if (xhr.status >= 200 && xhr.status < 300) {
        // ── Extract filename ──
        const disp = xhr.getResponseHeader('Content-Disposition') || '';
        let filename = 'converted.pdf';
        const m = disp.match(/filename="?([^";\n]+)"?/);
        if (m) filename = m[1].trim();

        // ── Force PDF MIME type ──
        const blob = new Blob([xhr.response], { type: 'application/pdf' });

        // ── Validate: first 4 bytes must be %PDF ──
        const fr = new FileReader();
        fr.onload = ev => {
          const h = new Uint8Array(ev.target.result);
          if (h[0]===0x25 && h[1]===0x50 && h[2]===0x44 && h[3]===0x46) {
            resolve({ blob, filename });
          } else {
            reject(new Error('Conversion failed — the server returned invalid data. Please try again.'));
          }
        };
        fr.readAsArrayBuffer(blob.slice(0, 4));

      } else {
        // ── Read error message from response ──
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const err = JSON.parse(reader.result);
            reject(new Error(err.error || `Server error (${xhr.status})`));
          } catch {
            reject(new Error(`Request failed (${xhr.status}). Please try again.`));
          }
        };
        reader.onerror = () => reject(new Error(`Request failed (${xhr.status}).`));
        reader.readAsText(xhr.response);
      }
    });

    xhr.addEventListener('error', () =>
      reject(new Error('Network error. Check your connection and try again.')));

    xhr.timeout = 120000;
    xhr.addEventListener('timeout', () =>
      reject(new Error('Request timed out. The file may be too large.')));

    xhr.send(formData);
  });
}

function setProgress(pct, label) {
  const bar  = $('progress-bar');
  const pctEl = $('progress-pct');
  const lblEl = $('progress-label');
  if (bar)   { bar.style.width = `${pct}%`; bar.setAttribute('aria-valuenow', pct); }
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (lblEl) lblEl.textContent = label;
}

function downloadPdf() {
  if (!_pdfBlob) { showToast('No PDF ready.', 'error'); return; }

  const safeBlob = new Blob([_pdfBlob], { type: 'application/pdf' });
  const url = URL.createObjectURL(safeBlob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = (_pdfFilename || 'converted.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  showToast('Download started!', 'success', 2000);
}
