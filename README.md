# ⚡ ConvertFlow — PDF Converter

A production-ready, full-stack PDF converter SaaS tool. Convert **images** (JPG, PNG, WebP, TIFF, BMP, GIF), **Word documents** (DOCX), and **text files** (TXT, CSV) to PDF instantly.

![ConvertFlow](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-18%2B-green) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **🖼️ Image → PDF** — JPG, PNG, WebP, TIFF, BMP, GIF with auto-compression
- **📄 DOCX → PDF** — Word documents with formatting preservation
- **📝 Text → PDF** — TXT and CSV files with clean layout
- **🔒 Secure** — File validation, MIME checking, rate limiting, auto-cleanup
- **📱 Mobile Ready** — Responsive design with touch-optimized controls
- **⚡ Fast** — Optimized conversion engine, sub-2s for most files
- **🎨 Premium UI** — Dark glassmorphism design with micro-animations

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm v9+

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/pdf-converter.git
cd pdf-converter

# Install backend dependencies
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
```

### 3. Start Backend

```bash
npm run dev
# Server runs at http://localhost:5000
```

### 4. Open Frontend

Open `frontend/index.html` in your browser, or serve with any static server:
```bash
# Using Python
cd ../frontend
python -m http.server 3000

# Or use VS Code Live Server extension
```

### 5. Test It!

1. Open http://localhost:3000
2. Drag & drop a file (or click to browse)
3. Click "Convert to PDF"
4. Download your PDF!

## 📂 Project Structure

```
pdf-converter/
├── frontend/                    # Static frontend (deploy to Vercel)
│   ├── index.html               # Main page — semantic HTML5, SEO
│   ├── css/
│   │   └── styles.css           # Premium dark glassmorphism design
│   ├── js/
│   │   ├── utils.js             # Config, validation, toast system
│   │   ├── upload.js            # Drag-drop, file picker, preview
│   │   ├── converter.js         # API communication, progress, download
│   │   └── app.js               # Main controller
│   └── vercel.json              # Vercel deployment config
│
├── backend/                     # Express API (deploy to Render)
│   ├── src/
│   │   ├── index.js             # Entry point
│   │   ├── config/
│   │   │   └── env.js           # Environment config
│   │   ├── controllers/
│   │   │   └── convertController.js
│   │   ├── routes/
│   │   │   └── convertRoutes.js
│   │   ├── services/
│   │   │   ├── imageService.js  # Image → PDF (sharp + pdf-lib)
│   │   │   ├── docxService.js   # DOCX → PDF (mammoth + pdf-lib)
│   │   │   └── textService.js   # Text → PDF (pdf-lib)
│   │   ├── middleware/
│   │   │   ├── upload.js        # Multer config
│   │   │   ├── validate.js      # MIME validation (magic bytes)
│   │   │   ├── security.js      # Helmet, rate limit, CORS
│   │   │   └── errorHandler.js  # Global error handler
│   │   └── utils/
│   │       ├── logger.js        # Winston logging
│   │       ├── sanitize.js      # Filename sanitizer
│   │       └── cleanup.js       # Temp file cleanup
│   ├── .env.example
│   ├── package.json
│   └── render.yaml
│
├── .gitignore
└── README.md
```

## 🌐 Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Set **Root Directory** to `frontend`
5. Set **Framework Preset** to "Other"
6. Deploy!
7. Set the API URL in `frontend/js/app.js` → `CONFIG.API_URL`

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `node src/index.js`
6. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `CORS_ORIGINS` = `https://your-vercel-app.vercel.app`
   - `MAX_FILE_SIZE_MB` = `50`
7. Deploy!

### Post-Deployment

Update `frontend/js/app.js` with your Render backend URL:
```javascript
CONFIG.API_URL = 'https://your-app.onrender.com/api';
```

## 🔑 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed origins (comma-separated) |
| `MAX_FILE_SIZE_MB` | `50` | Max upload size in MB |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `30` | Max requests per window |
| `LOG_LEVEL` | `info` | Logging level |

## 🔐 Security

- ✅ MIME type validation (magic bytes)
- ✅ File size limits (50MB default)
- ✅ Filename sanitization (path traversal prevention)
- ✅ Rate limiting (30 req/min per IP)
- ✅ Helmet security headers
- ✅ CORS whitelist
- ✅ Auto temp file cleanup
- ✅ No file persistence

## 🧪 API Reference

### `GET /api/health`
Health check. Returns server status and uptime.

### `GET /api/formats`
Returns supported file formats and max file size.

### `POST /api/convert`
Convert a file to PDF.
- **Body**: `multipart/form-data` with field `file`
- **Response**: PDF binary (`application/pdf`)
- **Headers**: `Content-Disposition`, `X-Conversion-Type`, `X-Conversion-Duration`

## 📄 License

MIT — free for personal and commercial use.

---

**Built with ❤️ by GVS**
