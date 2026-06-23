const fs = require('fs');
const path = require('path');
const { LOGGING_CONFIG, toPositiveInteger } = require('./config');

const LOG_LEVEL_RANK = { debug: 10, info: 20, warning: 30, error: 40 };

function normalizeLogLevel(level) {
  const value = String(level || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LOG_LEVEL_RANK, value) ? value : 'info';
}

function shouldLog(level) {
  return LOG_LEVEL_RANK[normalizeLogLevel(level)] >= LOG_LEVEL_RANK[normalizeLogLevel(LOGGING_CONFIG.level)];
}

function getLogDir() {
  return path.resolve(__dirname, '../../../', String(LOGGING_CONFIG.folder || 'logs'));
}

function getLogFilePath() {
  return path.join(getLogDir(), 'cloudmetrics.log');
}

function rotateLogIfNeeded() {
  try {
    const filePath = getLogFilePath();
    if (!fs.existsSync(filePath)) return;
    const maxBytes = toPositiveInteger(LOGGING_CONFIG.maxFileSizeMb, 10) * 1024 * 1024;
    if (fs.statSync(filePath).size < maxBytes) return;
    const maxFiles = toPositiveInteger(LOGGING_CONFIG.maxFiles, 10);
    for (let i = maxFiles - 1; i >= 1; i--) {
      const src = `${filePath}.${i}`;
      const dst = `${filePath}.${i + 1}`;
      if (fs.existsSync(src)) {
        if (i + 1 > maxFiles) fs.unlinkSync(src);
        else fs.renameSync(src, dst);
      }
    }
    fs.renameSync(filePath, `${filePath}.1`);
  } catch (error) {
    console.warn('[Logging] Rotate failed: ' + (error.message || error));
  }
}

function serializeLogMeta(meta) {
  if (meta === undefined || meta === null) return '';
  try { return ' ' + JSON.stringify(meta); } catch (_) { return ' ' + String(meta); }
}

function logBackend(level, message, meta) {
  const normalized = normalizeLogLevel(level);
  if (!shouldLog(normalized)) return;
  const line = `[${new Date().toISOString()}] [${normalized.toUpperCase()}] ${message}${serializeLogMeta(meta)}\n`;
  if (normalized === 'error') console.error(line.trim());
  else if (normalized === 'warning') console.warn(line.trim());
  else console.log(line.trim());
  
  if (!LOGGING_CONFIG.writeFile) return;
  try {
    fs.mkdirSync(getLogDir(), { recursive: true });
    rotateLogIfNeeded();
    fs.appendFileSync(getLogFilePath(), line, 'utf8');
  } catch (error) {
    console.warn('[Logging] Write failed: ' + (error.message || error));
  }
}

module.exports = {
  logBackend,
  normalizeLogLevel,
  shouldLog,
  getLogDir,
  getLogFilePath,
  rotateLogIfNeeded
};
