/* ============================================
   PDFFlow — App Controller
   ============================================ */

(function () {
  'use strict';

  // ─── API URL auto-detect ─────────────────
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') {
    CONFIG.API_URL = 'http://localhost:5000/api';
  } else {
    // ✅ UPDATE THIS after deploying to Render:
    CONFIG.API_URL = 'https://pdfflow-api.onrender.com/api';
  }

  // ─── Detect which page we're on ──────────
  const isToolPage   = document.body.classList.contains('tool-page');
  const isHomePage   = document.body.classList.contains('home-page');

  document.addEventListener('DOMContentLoaded', () => {
    if (isHomePage) initHomePage();
    if (isToolPage) initToolPage();
  });

  // ─── Home Page ───────────────────────────
  function initHomePage() {
    // Nothing dynamic needed — pure HTML/CSS links
    console.log('%c📄 PDFFlow', 'color:#6c63ff;font-weight:bold;font-size:14px;');
  }

  // ─── Tool Page ───────────────────────────
  function initToolPage() {
    // Get tool type from URL param: ?tool=img2pdf
    const params = new URLSearchParams(window.location.search);
    const toolKey = params.get('tool') || 'any2pdf';
    const tool    = TOOLS[toolKey] || TOOLS['any2pdf'];

    CONFIG.currentTool = tool;

    // Update page title & meta
    document.title = `${tool.title} — PDFFlow`;

    // Update hero
    const iconEl  = $('tool-icon');
    const titleEl = $('tool-title');
    const subEl   = $('tool-sub');
    const badgeEl = $('tool-badge');

    if (iconEl)  iconEl.textContent  = tool.icon;
    if (titleEl) titleEl.textContent = tool.title;
    if (subEl)   subEl.textContent   = tool.sub;
    if (badgeEl) badgeEl.textContent = tool.badge;

    // Populate format tags
    const fmtContainer = $('upload-formats');
    if (fmtContainer) {
      fmtContainer.innerHTML = tool.formats
        .map(f => `<span class="fmt-tag">${f}</span>`)
        .join('');
    }

    // Update hint text
    const hintEl = $('upload-hint');
    if (hintEl) hintEl.textContent = tool.hint;

    // Init upload
    initUpload(tool);

    // Wire buttons
    const convertBtn = $('convert-btn');
    if (convertBtn) {
      convertBtn.disabled = true;
      convertBtn.addEventListener('click', handleConvert);
    }

    const downloadBtn = $('download-btn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadPdf);

    const anotherBtn = $('convert-another-btn');
    if (anotherBtn) anotherBtn.addEventListener('click', handleAnother);

    // Prevent browser default drop
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop',     e => e.preventDefault());

    console.log(`%c📄 PDFFlow — ${tool.title}`, 'color:#6c63ff;font-weight:bold;');
  }

  // ─── Handlers ────────────────────────────
  async function handleConvert() {
    const btn = $('convert-btn');
    if (btn) btn.disabled = true;
    try {
      await convertToPdf();
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function handleAnother() {
    _pdfBlob = null;
    _pdfFilename = null;
    hideEl('success-section');
    resetUpload();
  }

})();
