/* ============================================
   PDFFlow — Upload Handler
   ============================================ */

let _selectedFile = null;

function initUpload(tool) {
  const zone = $('upload-zone');
  const input = $('file-input');
  const mobileBtn = $('mobile-upload-btn');
  if (!zone || !input) return;

  // Set accepted types from tool
  if (tool) input.setAttribute('accept', tool.accept);

  // Drag & Drop
  zone.addEventListener('dragenter', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragover',  e => { e.preventDefault(); });
  zone.addEventListener('dragleave', e => { if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over'); });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f, tool);
  });

  // Click → open picker
  input.addEventListener('change', e => {
    if (e.target.files[0]) handleFile(e.target.files[0], tool);
  });

  // Keyboard
  zone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });

  // Mobile button
  if (mobileBtn) {
    mobileBtn.addEventListener('click', e => { e.preventDefault(); input.click(); });
  }

  // Remove button
  const removeBtn = $('preview-remove');
  if (removeBtn) removeBtn.addEventListener('click', resetUpload);
}

function handleFile(file, tool) {
  const v = validateFile(file, tool);
  if (!v.valid) { showToast(v.error, 'error'); return; }

  _selectedFile = file;

  // Update preview
  const cat = getFileCategory(file);
  const iconEl = $('preview-type-icon');
  if (iconEl) iconEl.textContent = CATEGORY_ICONS[cat] || '📄';

  const nameEl = $('preview-name');
  if (nameEl) nameEl.textContent = file.name;

  const metaEl = $('preview-meta');
  if (metaEl) metaEl.textContent = `${formatFileSize(file.size)} · ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;

  // Image preview
  const imgWrap = $('preview-img-wrap');
  const imgEl   = $('preview-img');
  if (cat === 'image' && imgWrap && imgEl) {
    imgWrap.classList.remove('hidden');
    const reader = new FileReader();
    reader.onload = e => { imgEl.src = e.target.result; };
    reader.readAsDataURL(file);
  } else if (imgWrap) {
    imgWrap.classList.add('hidden');
  }

  // Show preview section, enable button
  showEl('preview-section');
  hideEl('upload-section');
  const btn = $('convert-btn');
  if (btn) btn.disabled = false;

  showToast(`${file.name} — ready to convert`, 'success', 2500);
}

function resetUpload() {
  _selectedFile = null;
  const input = $('file-input');
  if (input) input.value = '';
  showEl('upload-section');
  hideEl('preview-section');
  hideEl('progress-section');
  hideEl('success-section');
  const btn = $('convert-btn');
  if (btn) btn.disabled = true;
  const imgEl = $('preview-img');
  if (imgEl) imgEl.src = '';
  const imgWrap = $('preview-img-wrap');
  if (imgWrap) imgWrap.classList.add('hidden');
}

function getSelectedFile() { return _selectedFile; }
