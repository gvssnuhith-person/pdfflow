/* ============================================
   PDFFlow — Upload Handler
   ============================================ */

let _selectedFiles = [];

function initUpload(tool) {
  const zone = $('upload-zone');
  const input = $('file-input');
  const mobileBtn = $('mobile-upload-btn');
  if (!zone || !input) return;

  // Set accepted types from tool
  if (tool) input.setAttribute('accept', tool.accept);
  if (tool && tool.multi) input.setAttribute('multiple', 'true');

  // Drag & Drop
  zone.addEventListener('dragenter', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragover',  e => { e.preventDefault(); });
  zone.addEventListener('dragleave', e => { if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over'); });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files, tool);
  });

  // Click → open picker
  input.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    if (files.length > 0) handleFiles(files, tool);
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

function handleFiles(files, tool) {
  _selectedFiles = [];

  // Enforce single vs multi
  let filesToProcess = files;
  if (!tool || !tool.multi) {
    if (files.length > 1) showToast('Only one file allowed for this tool. First file selected.', 'info');
    filesToProcess = [files[0]];
  }

  // Validate all
  for (const f of filesToProcess) {
    const v = validateFile(f, tool);
    if (!v.valid) {
      showToast(`${f.name}: ${v.error}`, 'error');
      continue;
    }
    _selectedFiles.push(f);
  }

  if (_selectedFiles.length === 0) return;

  // Clear previous previews
  const previewSection = $('preview-section');
  const existingCards = previewSection.querySelectorAll('.preview-card');
  existingCards.forEach((c, idx) => { if (idx > 0) c.remove(); }); // Keep template

  const templateCard = existingCards[0];
  
  _selectedFiles.forEach((file, index) => {
    let card = templateCard;
    if (index > 0) {
      card = templateCard.cloneNode(true);
      previewSection.insertBefore(card, $('convert-btn'));
    }
    
    card.classList.remove('hidden');

    const cat = getFileCategory(file);
    const iconEl = card.querySelector('#preview-type-icon') || card.querySelector('.preview-type-icon');
    if (iconEl) iconEl.textContent = CATEGORY_ICONS[cat] || '📄';

    const nameEl = card.querySelector('#preview-name') || card.querySelector('.preview-name');
    if (nameEl) nameEl.textContent = file.name;

    const metaEl = card.querySelector('#preview-meta') || card.querySelector('.preview-meta');
    if (metaEl) metaEl.textContent = `${formatFileSize(file.size)} · ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;

    const imgWrap = card.querySelector('#preview-img-wrap') || card.querySelector('.preview-img-wrap');
    const imgEl   = card.querySelector('#preview-img') || card.querySelector('.preview-img');
    
    if (cat === 'image' && imgWrap && imgEl) {
      imgWrap.classList.remove('hidden');
      const reader = new FileReader();
      reader.onload = e => { imgEl.src = e.target.result; };
      reader.readAsDataURL(file);
    } else if (imgWrap) {
      imgWrap.classList.add('hidden');
    }
  });

  // Show preview section, enable button
  showEl('preview-section');
  hideEl('upload-section');
  const btn = $('convert-btn');
  if (btn) btn.disabled = false;

  showToast(`${_selectedFiles.length} file(s) ready`, 'success', 2500);
}

function resetUpload() {
  _selectedFiles = [];
  const input = $('file-input');
  if (input) input.value = '';
  showEl('upload-section');
  hideEl('preview-section');
  hideEl('progress-section');
  hideEl('success-section');
  const btn = $('convert-btn');
  if (btn) btn.disabled = true;
  
  // Clean up extra cards
  const previewSection = $('preview-section');
  if (previewSection) {
    const existingCards = previewSection.querySelectorAll('.preview-card');
    existingCards.forEach((c, idx) => { if (idx > 0) c.remove(); });
  }
}

function getSelectedFiles() { return _selectedFiles; }
