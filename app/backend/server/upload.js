const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const { APP_SETTINGS, toPositiveInteger } = require('./config');

// ---- Multer: upload to OS temp ----
const UPLOAD_DIR = path.join(os.tmpdir(), String(APP_SETTINGS.upload?.tempFolderName || 'clca_generator_uploads'));
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Sanitize filename (keep extension, prefix with timestamp)
    const safe = file.originalname.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff\u00c0-\u024f]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: toPositiveInteger(APP_SETTINGS.upload?.maxFileSizeMb, 50) * 1024 * 1024 },
});

// ---- Helper: cleanup temp files ----
function cleanupFiles(filePaths) {
  for (const fp of filePaths) {
    try { if (fp && fs.existsSync(fp)) fs.unlinkSync(fp); } catch (_) { /* ignore */ }
  }
}

module.exports = {
  upload,
  cleanupFiles,
  UPLOAD_DIR
};
