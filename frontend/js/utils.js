/* ============================================
   PDFFlow — Utility Functions & Config
   ============================================ */

// ─── Tool Definitions ───────────────────────
const TOOLS = {
  img2pdf: {
    title: 'Image to PDF',
    sub: 'Convert JPG, PNG, WebP, TIFF, BMP, GIF images to PDF',
    icon: '🖼️',
    badge: 'Image Converter',
    accept: '.jpg,.jpeg,.png,.webp,.tiff,.tif,.bmp,.gif',
    formats: ['JPG', 'PNG', 'WebP', 'TIFF', 'BMP', 'GIF'],
    mimes: ['image/jpeg','image/png','image/webp','image/tiff','image/bmp','image/gif'],
    exts: ['.jpg','.jpeg','.png','.webp','.tiff','.tif','.bmp','.gif'],
    hint: 'All major image formats supported',
  },
  docx2pdf: {
    title: 'Word to PDF',
    sub: 'Convert Word DOCX documents to PDF while preserving content',
    icon: '📝',
    badge: 'Word Converter',
    accept: '.docx,.doc',
    formats: ['DOCX', 'DOC'],
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword'],
    exts: ['.docx','.doc'],
    hint: 'Microsoft Word documents (.docx, .doc)',
  },
  txt2pdf: {
    title: 'Text to PDF',
    sub: 'Convert plain text and CSV files to a clean PDF document',
    icon: '📄',
    badge: 'Text Converter',
    accept: '.txt,.csv',
    formats: ['TXT', 'CSV'],
    mimes: ['text/plain','text/csv'],
    exts: ['.txt','.csv'],
    hint: 'Plain text and CSV files',
  },
  any2pdf: {
    title: 'Any File to PDF',
    sub: 'Drop any supported file — images, documents, or text',
    icon: '⚡',
    badge: 'Universal Converter',
    accept: '.jpg,.jpeg,.png,.webp,.tiff,.tif,.bmp,.gif,.docx,.doc,.txt,.csv',
    formats: ['JPG','PNG','WebP','DOCX','TXT','CSV'],
    mimes: ['image/jpeg','image/png','image/webp','image/tiff','image/bmp','image/gif',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword','text/plain','text/csv'],
    exts: ['.jpg','.jpeg','.png','.webp','.tiff','.tif','.bmp','.gif','.docx','.doc','.txt','.csv'],
    hint: 'Images, Word documents, and text files',
  },
};

// ─── Config ─────────────────────────────────
const CONFIG = {
  API_URL: 'http://localhost:5000/api',
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  currentTool: null,
};

// ─── File Utilities ──────────────────────────
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getExtension(filename) {
  const idx = filename.lastIndexOf('.');
  return idx > 0 ? filename.substring(idx).toLowerCase() : '';
}

function getFileCategory(file) {
  const ext = getExtension(file.name);
  if (['.jpg','.jpeg','.png','.webp','.tiff','.tif','.bmp','.gif'].includes(ext)) return 'image';
  if (['.docx','.doc'].includes(ext)) return 'document';
  if (['.txt','.csv'].includes(ext)) return 'text';
  if (file.type.startsWith('image/')) return 'image';
  return 'unknown';
}

const CATEGORY_ICONS = { image:'🖼️', document:'📝', text:'📄', unknown:'📎' };

function validateFile(file, tool) {
  if (!file) return { valid:false, error:'No file selected.' };
  if (file.size === 0) return { valid:false, error:'File is empty. Please select a valid file.' };
  if (file.size > CONFIG.MAX_FILE_SIZE_BYTES) {
    return { valid:false, error:`File too large (${formatFileSize(file.size)}). Max is ${CONFIG.MAX_FILE_SIZE_MB}MB.` };
  }
  const ext = getExtension(file.name);
  const allowedExts = tool ? tool.exts : ['.jpg','.jpeg','.png','.webp','.tiff','.tif','.bmp','.gif','.docx','.doc','.txt','.csv'];
  if (!allowedExts.includes(ext)) {
    return { valid:false, error:`"${ext}" is not supported. Allowed: ${allowedExts.join(', ')}` };
  }
  return { valid:true };
}

// ─── Toast ──────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// ─── DOM Helpers ─────────────────────────────
function $(id) { return document.getElementById(id); }
function showEl(id) { const e=$(id); if(e) e.classList.remove('hidden'); }
function hideEl(id) { const e=$(id); if(e) e.classList.add('hidden'); }
