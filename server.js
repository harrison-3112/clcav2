#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * CloudMetrics – Node.js Server (v1.4.0)
 * -----------------------------------------
 * Node/Express backend that calls the JavaScript report engine directly.
 *
 * API:
 *   POST /api/generate    – accept 3 Excel files + output_path, run buildReport
 *   POST /api/browse-save – open native Windows "Save As" dialog
 *
 * Usage:
 *   npm install
 *   node server.js
 *   → http://localhost:5000
 */

'use strict';

const fs            = require('fs');
const os            = require('os');
const path          = require('path');
const http          = require('http');
const { spawnSync, spawn, execFile } = require('child_process');

const express = require('express');
const multer  = require('multer');
const cors    = require('cors');

// ---- Global crash guards – keep server alive no matter what ----
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION – server stays alive]', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION – server stays alive]', reason && reason.stack ? reason.stack : reason);
});

// Module route bootstrap: active routes are registered from routes/*.routes.js.
const createClcaRoutes = require('./routes/clca.routes');
const createMesDailyRoutes = require('./routes/mesdaily.routes');
const createQuickLogRoutes = require('./routes/quicklog.routes');

// ---- Station configuration ----
const STATIONS_JSON_PATH = path.resolve(__dirname, 'config', 'stations.json');
const STATIONS_TXT_CANDIDATES = [
  path.resolve(__dirname, 'Station.txt'),
  path.resolve(__dirname, 'station.txt'),
  path.resolve(__dirname, 'config', 'Station.txt'),
  path.resolve(__dirname, 'config', 'station.txt'),
];

function uniqueKeepOrder(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function readStationsFromTxt() {
  const txtPath = STATIONS_TXT_CANDIDATES.find((p) => fs.existsSync(p));
  if (!txtPath) return [];

  const txt = fs.readFileSync(txtPath, 'utf8');
  const stations = txt
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return uniqueKeepOrder(stations);
}

function readPresetsFromJson() {
  if (!fs.existsSync(STATIONS_JSON_PATH)) return {};
  try {
    const cfg = JSON.parse(fs.readFileSync(STATIONS_JSON_PATH, 'utf8'));
    if (!cfg || typeof cfg !== 'object' || typeof cfg.presets !== 'object' || !cfg.presets) {
      return {};
    }
    return cfg.presets;
  } catch (error) {
    console.warn(`[Stations] Failed to parse stations.json presets: ${error.message || error}`);
    return {};
  }
}

let _stationConfigCache = null;
let _stationConfigMtime = 0;

function getStationConfig() {
  const jsonMtime = fs.existsSync(STATIONS_JSON_PATH) ? fs.statSync(STATIONS_JSON_PATH).mtimeMs : 0;
  const txtPath = STATIONS_TXT_CANDIDATES.find((p) => fs.existsSync(p));
  const txtMtime = txtPath ? fs.statSync(txtPath).mtimeMs : 0;
  const combinedMtime = jsonMtime + txtMtime;
  if (_stationConfigCache && combinedMtime === _stationConfigMtime) return _stationConfigCache;
  _stationConfigMtime = combinedMtime;

  const txtStations = readStationsFromTxt();
  let stations = txtStations;

  if (!stations.length) {
    try {
      const cfg = JSON.parse(fs.readFileSync(STATIONS_JSON_PATH, 'utf8'));
      stations = Array.isArray(cfg.stations)
        ? uniqueKeepOrder(cfg.stations.map((s) => String(s || '').trim()).filter(Boolean))
        : [];
      if (stations.length) {
        console.warn('[Stations] Station.txt is empty or missing, fallback to config/stations.json');
      }
    } catch (error) {
      console.warn(`[Stations] No valid station source found: ${error.message || error}`);
      stations = [];
    }
  }

  const presetsRaw = readPresetsFromJson();
  const stationSet = new Set(stations);
  const presets = {};
  for (const [presetName, presetStations] of Object.entries(presetsRaw)) {
    if (!Array.isArray(presetStations)) continue;
    presets[presetName] = uniqueKeepOrder(
      presetStations.map((s) => String(s || '').trim()).filter((s) => stationSet.has(s))
    );
  }

  _stationConfigCache = { stations, presets };
  return _stationConfigCache;
}

// ---- Fixed template (no more user upload) ----
const FIXED_TEMPLATE = path.resolve(__dirname, 'config', 'sample.xlsx');

// ---- Report engine (lazy-loaded for faster server startup) ----
// Prefer config/ folder, fallback to root
// Prefer the root engine file that is shipped with this app package.
// Fallback to config/ only if the root engine is missing. This prevents an older config engine
// from shadowing the patched merge engine and causing merge-on runtime errors.
const ROOT_ENGINE = path.resolve(__dirname, 'app', 'backend', 'modules', 'clca','clca_vo0301_report_v13v2.js');
const CONFIG_ENGINE = path.resolve(__dirname, 'config', 'clca_vo0301_report_v13v2.js');
const enginePath = fs.existsSync(ROOT_ENGINE) ? ROOT_ENGINE : CONFIG_ENGINE;

let buildReportCached = null;
let buildMergedReportCached = null;
let mesLogicCached = null;
const GRR_PREP_SCRIPT = path.resolve(__dirname, 'GRR prep module', 'grr-prepare.js');

// ---- QuickLog JS core (Node-only, no Python) ----
const QUICKLOG_CORE_PATH = path.resolve(__dirname, 'app', 'backend', 'modules', 'logsn','sn_search_core_js.js');
let quickLogCore = null;
function getQuickLogCore() {
  if (quickLogCore) return quickLogCore;
  if (!fs.existsSync(QUICKLOG_CORE_PATH)) throw new Error('QuickLog JS core not found: ' + QUICKLOG_CORE_PATH);
  quickLogCore = require(QUICKLOG_CORE_PATH);
  return quickLogCore;
}
const QUICKLOG_MODELS_CONFIG_PATH = path.resolve(__dirname, 'config', 'quicklog.models.json');
const QUICKLOG_LOCAL_STATIONS_CONFIG_CANDIDATES = [
  path.resolve(__dirname, 'config', 'quicklog.local-stations.json'),
  path.resolve(__dirname, 'quicklog.local-stations.json'),
  path.resolve(__dirname, 'ui', 'quicklog.local-stations.json'),
];
let quickLogLocalStationsConfigCache = null;
let quickLogLocalStationsConfigMtime = 0;
function getQuickLogLocalStationsConfig() {
  let selectedPath = '';
  let selectedMtime = 0;
  for (const filePath of QUICKLOG_LOCAL_STATIONS_CONFIG_CANDIDATES) {
    try {
      if (fs.existsSync(filePath)) {
        selectedPath = filePath;
        selectedMtime = fs.statSync(filePath).mtimeMs;
        break;
      }
    } catch (_) {}
  }
  if (quickLogLocalStationsConfigCache && selectedMtime === quickLogLocalStationsConfigMtime) return quickLogLocalStationsConfigCache;
  quickLogLocalStationsConfigMtime = selectedMtime;
  if (!selectedPath) {
    quickLogLocalStationsConfigCache = { enabled: false, models: {}, message: {} };
    return quickLogLocalStationsConfigCache;
  }
  quickLogLocalStationsConfigCache = JSON.parse(fs.readFileSync(selectedPath, 'utf8'));
  quickLogLocalStationsConfigCache._sourcePath = selectedPath;
  return quickLogLocalStationsConfigCache;
}
function quickLogNormalizeStationName(value) { return String(value || '').trim().replace(/[\t ]+/g, ' ').toUpperCase(); }
function quickLogCompactStationName(value) { return quickLogNormalizeStationName(value).replace(/[\s_-]+/g, ''); }
function quickLogStationMatches(a, b) { return quickLogNormalizeStationName(a) === quickLogNormalizeStationName(b) || quickLogCompactStationName(a) === quickLogCompactStationName(b); }
function quickLogModelRootName(value) { const raw = String(value || '').trim(); return raw.includes('_') ? raw.split('_')[0] : raw; }
function getQuickLogLocalStationModelConfig(modelName) {
  const cfg = getQuickLogLocalStationsConfig();
  const models = cfg.models || {};
  const key = quickLogModelRootName(modelName || 'VO0301') || 'VO0301';
  let modelCfg = models[key] || models.VO0301 || null;
  if (modelCfg && modelCfg.inheritFrom && models[modelCfg.inheritFrom]) modelCfg = models[modelCfg.inheritFrom];
  return modelCfg || null;
}
function quickLogAliasTargets(value, raw) {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  const single = String(value || raw || '').trim();
  return single ? [single] : [];
}
function resolveQuickLogLocalStationForServer(modelName, stationName) {
  const cfg = getQuickLogLocalStationsConfig();
  const raw = String(stationName || '').trim();
  if (cfg.enabled === false) return { allowed: true, localStation: raw, localStations: [raw], configured: false };
  const modelCfg = getQuickLogLocalStationModelConfig(modelName);
  if (!modelCfg) return { allowed: true, localStation: raw, localStations: [raw], configured: false };
  const rawUpper = quickLogNormalizeStationName(raw);
  const rawCompact = quickLogCompactStationName(raw);
  if (!raw) return { allowed: false, localStation: raw, localStations: [], configured: true, reason: 'missing-station' };
  if (rawUpper.includes('REPAIR') || rawCompact.includes('REPAIR')) return { allowed: false, localStation: raw, localStations: [], configured: true, reason: 'repair-has-no-local-log' };
  let mapped;
  for (const [key, value] of Object.entries(modelCfg.aliases || {})) {
    if (quickLogNormalizeStationName(key) === rawUpper || quickLogCompactStationName(key) === rawCompact) { mapped = value; break; }
  }
  if (mapped === null) return { allowed: false, localStation: raw, localStations: [], configured: true, reason: 'alias-disabled' };
  const candidates = quickLogAliasTargets(mapped, raw);
  const allowedStations = Array.isArray(modelCfg.allowedStations) ? modelCfg.allowedStations : [];
  if (!allowedStations.length) {
    const localStations = candidates.length ? candidates : [raw];
    return { allowed: true, localStation: localStations[0] || raw, localStations, configured: true };
  }
  const localStations = (candidates.length ? candidates : [raw]).filter((candidate) => allowedStations.some((station) => quickLogStationMatches(station, candidate)));
  const rawIsAllowed = allowedStations.some((station) => quickLogStationMatches(station, raw));
  const allowed = rawIsAllowed || localStations.length > 0;
  const finalStations = localStations.length ? localStations : (rawIsAllowed ? [raw] : []);
  return { allowed, localStation: finalStations[0] || raw, localStations: finalStations, configured: true, reason: allowed ? '' : 'station-not-in-local-config' };
}
const DEFAULT_QUICKLOG_MODELS = {
  VO0301: { name: 'VO0301', path: process.env.SN_SEARCH_BASE || '\\10.24.111.80\Testlog\camera\VO0301\SYNC LOCAL DATA', project: 'VO0301', fixture: 'J01' },
  EO0302: { name: 'EO0302', path: '\\10.24.111.80\Testlog\camera\EO0302\SYNC LOCAL DATA', project: 'EO0302', fixture: 'J01' },
  EO0303: { name: 'EO0303', path: '\\10.24.111.80\Testlog\camera\EO0303\SYNC LOCAL DATA', project: 'EO0303', fixture: 'J01' },
};
function normalizeQuickLogModel(raw) {
  const name = typeof raw === 'string' ? raw.trim() : String(raw && raw.name || '').trim();
  if (!name) return null;
  return {
    name,
    path: typeof raw === 'object' ? String(raw.path || '').trim() : '',
    project: name, // We just use the model name for everything now
    fixture: 'J01',
  };
}
let QUICKLOG_GLOBAL_ROOT = '\\\\10.24.111.80\\Testlog\\camera';
let QUICKLOG_MODELS = {};

function loadQuickLogModelsFromConfig() {
  try {
    if (!fs.existsSync(QUICKLOG_MODELS_CONFIG_PATH)) {
      console.warn('[QuickLog] Config not found, using built-in defaults: ' + QUICKLOG_MODELS_CONFIG_PATH);
      return { ...DEFAULT_QUICKLOG_MODELS };
    }
    const parsed = JSON.parse(fs.readFileSync(QUICKLOG_MODELS_CONFIG_PATH, 'utf8'));
    if (parsed.mesTrace && parsed.mesTrace.logRoot) {
      QUICKLOG_GLOBAL_ROOT = parsed.mesTrace.logRoot;
    }
    const rawModels = Array.isArray(parsed) ? parsed : parsed.models;
    if (!Array.isArray(rawModels)) throw new Error('quicklog.models.json must contain a models array.');
    const models = {};
    rawModels.map(normalizeQuickLogModel).filter(Boolean).forEach((model) => {
      models[model.name] = model;
    });
    if (!Object.keys(models).length) throw new Error('No valid QuickLog models in config.');
    return models;
  } catch (error) {
    console.warn('[QuickLog] Failed to load config, using built-in defaults: ' + (error.message || error));
    return { ...DEFAULT_QUICKLOG_MODELS };
  }
}
QUICKLOG_MODELS = loadQuickLogModelsFromConfig();
function getQuickLogModel(modelName) {
  return QUICKLOG_MODELS[String(modelName || '').trim()] || null;
}
function resolveQuickLogConfig(input = {}) {
  const body = input && typeof input === 'object' ? input : {};
  const row = body.row && typeof body.row === 'object' ? body.row : body;
  const requestedModel = String(body.model || body.quickLogModel || body._QuickLogModel || row._QuickLogModel || '').trim();
  const model = getQuickLogModel(requestedModel);
  if (model) {
      let base = model.path;
      if (!base) {
          base = require('path').join(QUICKLOG_GLOBAL_ROOT, model.name, 'SYNC LOCAL DATA');
      }
      return { 
          base, 
          project: model.project || model.name, 
          fixture: model.fixture || 'J01', 
          model: model.name 
      };
  }
  return {
    base: '',
    project: String(body.project || body._QuickLogProject || row._QuickLogProject || requestedModel || 'VO0301').trim(),
    fixture: String(body.fixture || body._QuickLogFixture || row._QuickLogFixture || 'J01').trim(),
    model: requestedModel,
  };
}
function openQuickLogFile(filePath) {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      execFile('cmd', ['/c', 'start', '', filePath], { windowsHide: true }, (err) => err ? reject(err) : resolve(true));
    } else {
      execFile(process.platform === 'darwin' ? 'open' : 'xdg-open', [filePath], (err) => err ? reject(err) : resolve(true));
    }
  });
}


function getBuildReport() {
  if (buildReportCached) return buildReportCached;
  const engineModule = require(enginePath);
  buildReportCached = engineModule.buildReport;
  return buildReportCached;
}

function getBuildMergedReport() {
  if (buildMergedReportCached) return buildMergedReportCached;
  const engineModule = require(enginePath);
  if (typeof engineModule.buildMergedReport !== 'function') {
    throw new Error('CLCA engine does not support merged WO export (missing buildMergedReport). Loaded engine: ' + enginePath);
  }
  buildMergedReportCached = engineModule.buildMergedReport;
  return buildMergedReportCached;
}


function getMesLogic() {
  if (mesLogicCached) return mesLogicCached;
  const logicPath = path.resolve(__dirname, 'MES API', 'logic.js');
  if (!fs.existsSync(logicPath)) {
    throw new Error('MES logic module not found.');
  }
  const loaded = require(logicPath);
  if (!loaded || typeof loaded.run !== 'function') {
    throw new Error('MES logic module is invalid (missing run function).');
  }
  mesLogicCached = loaded;
  return mesLogicCached;
}




// ---- App/config loaders ----
const APP_SETTINGS_CONFIG_PATH = path.resolve(__dirname, 'config', 'app.settings.json');
const LOGGING_CONFIG_PATH = path.resolve(__dirname, 'config', 'logging.json');
const MODULES_CONFIG_PATH = path.resolve(__dirname, 'config', 'modules.json');
const CLCA_SETTINGS_CONFIG_PATH = path.resolve(__dirname, 'config', 'clca.settings.json');
const MESDAILY_SETTINGS_CONFIG_PATH = path.resolve(__dirname, 'config', 'mesdaily.settings.json');
const DEFAULT_APP_SETTINGS = {
  server: { host: '0.0.0.0', port: 5000 },
  upload: { maxFileSizeMb: 50, tempFolderName: 'clca_generator_uploads' },
  ui: { defaultLanguage: 'en', defaultTheme: 'system' },
  quicklog: { openLogCacheMax: 500, logTimeToleranceSeconds: 5, returnCheckedPathsOnFail: true, deriveLogPathFromSourceFile: true },
  browseSave: { timeoutMs: 12000 },
};
const DEFAULT_LOGGING_CONFIG = {
  level: 'info', writeFile: true, folder: 'logs', includeRequestTiming: true,
  includeQuickLogCheckedPaths: true, includeConfigLoadWarnings: true, maxFileSizeMb: 10, maxFiles: 10,
};
const DEFAULT_MODULES_CONFIG = {
  modules: {
    clca: { enabled: true, title: { en: 'CLCA Gen', cn: 'CLCA Gen' }, menuTitle: { en: 'CLCA Generator', cn: 'CLCA 生成器' }, endpoint: '/api/generate' },
    mesdaily: { enabled: true, title: { en: 'MES Daily', cn: 'MES 每日' }, menuTitle: { en: 'MES Daily Report', cn: 'MES 每日报表' }, endpoint: '/api/generate/mesdaily' },
    quicklog: { enabled: true, title: { en: 'QuickLog', cn: 'QuickLog' }, menuTitle: { en: 'QuickLog', cn: 'QuickLog' }, endpoint: '/api/quicklog/search' },
  }
};
const DEFAULT_CLCA_SETTINGS = {
  defaultOutputName: 'CLCA_Report.xlsx',
  merge: { requireMergeForMultipleFiles: true, defaultMergeEnabled: false },
  csnMapping: { defaultEnabled: false },
  stationRules: {
    'Leak Test01': { leaveSnCodeBlank: true, leaveDescriptionBlank: true, disableCustomerSnMapping: true },
  },
};
const DEFAULT_MESDAILY_SETTINGS = {
  defaultHour: 15,
  defaultOutputPrefix: 'MES Data',
  resetStateOnOpen: true,
  autoOutputNameFromToDate: true,
  dateTagFormat: 'MM.DD',
};
function isPlainObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function deepMergeConfig(base, override) {
  const out = { ...base };
  if (!isPlainObject(override)) return out;
  for (const [key, value] of Object.entries(override)) {
    out[key] = isPlainObject(value) && isPlainObject(out[key]) ? deepMergeConfig(out[key], value) : value;
  }
  return out;
}
function loadJsonConfig(filePath, defaults, label) {
  try {
    if (!fs.existsSync(filePath)) return defaults;
    return deepMergeConfig(defaults, JSON.parse(fs.readFileSync(filePath, 'utf8')));
  } catch (error) {
    console.warn(`[Config] Failed to load ${label}, using defaults: ` + (error.message || error));
    return defaults;
  }
}
const APP_SETTINGS = loadJsonConfig(APP_SETTINGS_CONFIG_PATH, DEFAULT_APP_SETTINGS, 'app.settings.json');
const LOGGING_CONFIG = loadJsonConfig(LOGGING_CONFIG_PATH, DEFAULT_LOGGING_CONFIG, 'logging.json');
const MODULES_CONFIG = loadJsonConfig(MODULES_CONFIG_PATH, DEFAULT_MODULES_CONFIG, 'modules.json');
const CLCA_SETTINGS = loadJsonConfig(CLCA_SETTINGS_CONFIG_PATH, DEFAULT_CLCA_SETTINGS, 'clca.settings.json');
const MESDAILY_SETTINGS = loadJsonConfig(MESDAILY_SETTINGS_CONFIG_PATH, DEFAULT_MESDAILY_SETTINGS, 'mesdaily.settings.json');
function toPositiveInteger(value, fallback) {
  const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
function getPublicAppSettings() {
  return { ui: APP_SETTINGS.ui, quicklog: APP_SETTINGS.quicklog, browseSave: APP_SETTINGS.browseSave };
}
function getPublicModuleConfig() { return MODULES_CONFIG; }
function getPublicClcaSettings() { return CLCA_SETTINGS; }
function getPublicMesDailySettings() { return MESDAILY_SETTINGS; }
const LOG_LEVEL_RANK = { debug: 10, info: 20, warning: 30, error: 40 };
function normalizeLogLevel(level) {
  const value = String(level || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LOG_LEVEL_RANK, value) ? value : 'info';
}
function shouldLog(level) {
  return LOG_LEVEL_RANK[normalizeLogLevel(level)] >= LOG_LEVEL_RANK[normalizeLogLevel(LOGGING_CONFIG.level)];
}
function getLogDir() { return path.resolve(__dirname, String(LOGGING_CONFIG.folder || 'logs')); }
function getLogFilePath() { return path.join(getLogDir(), 'cloudmetrics.log'); }
function rotateLogIfNeeded() {
  try {
    const filePath = getLogFilePath();
    if (!fs.existsSync(filePath)) return;
    const maxBytes = toPositiveInteger(LOGGING_CONFIG.maxFileSizeMb, 10) * 1024 * 1024;
    if (fs.statSync(filePath).size < maxBytes) return;
    const maxFiles = toPositiveInteger(LOGGING_CONFIG.maxFiles, 10);
    for (let i = maxFiles - 1; i >= 1; i--) {
      const src = `${filePath}.${i}`; const dst = `${filePath}.${i + 1}`;
      if (fs.existsSync(src)) { if (i + 1 > maxFiles) fs.unlinkSync(src); else fs.renameSync(src, dst); }
    }
    fs.renameSync(filePath, `${filePath}.1`);
  } catch (error) { console.warn('[Logging] Rotate failed: ' + (error.message || error)); }
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
  try { fs.mkdirSync(getLogDir(), { recursive: true }); rotateLogIfNeeded(); fs.appendFileSync(getLogFilePath(), line, 'utf8'); }
  catch (error) { console.warn('[Logging] Write failed: ' + (error.message || error)); }
}
logBackend('info', 'Phase 4 remaining config initialized', {
  modules: Object.keys(MODULES_CONFIG.modules || {}),
  clcaSettings: !!CLCA_SETTINGS,
  mesDailySettings: !!MESDAILY_SETTINGS,
});

// ---- App setup ----
const app  = express();
const PORT = toPositiveInteger(process.env.PORT || APP_SETTINGS.server?.port, 5000);
const HOST = String(process.env.HOST || APP_SETTINGS.server?.host || '0.0.0.0');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request timing logger (Phase 2 logging)
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    if (!LOGGING_CONFIG.includeRequestTiming) return;
    const elapsedMs = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warning' : 'info';
    logBackend(level, 'HTTP request completed', { method: req.method, url: req.originalUrl || req.url, statusCode: res.statusCode, elapsedMs });
  });
  next();
});


// Serve static UI files from ui directory (index.html, app.js, styles.css)
app.use(express.static(path.join(__dirname, 'ui')));

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

function parseMesDateTime(dtStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(dtStr || '').trim());
  if (!m) return null;
  return {
    date: m[1] + m[2] + m[3],
    hour: parseInt(m[4], 10),
    minute: parseInt(m[5], 10),
  };
}

function buildGrrFinalOutputPath(rawOutputPath, originalInputName) {
  const inputBase = path.basename(String(originalInputName || '').trim() || 'input.csv');
  const inputNameNoExt = path.parse(inputBase).name || 'input';
  const safeInputName = inputNameNoExt.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'input';
  const finalFileName = `${safeInputName} Final.csv`;

  const requested = String(rawOutputPath || '').trim();
  if (!requested) {
    return path.join(UPLOAD_DIR, finalFileName);
  }

  const outputHasExt = Boolean(path.parse(requested).ext);
  const outputDir = outputHasExt ? path.dirname(requested) : requested;
  return path.join(outputDir || UPLOAD_DIR, finalFileName);
}

function moveFileOverwrite(sourcePath, targetPath) {
  if (path.resolve(sourcePath) === path.resolve(targetPath)) return;
  if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
  try {
    fs.renameSync(sourcePath, targetPath);
  } catch (error) {
    if (error && error.code === 'EXDEV') {
      fs.copyFileSync(sourcePath, targetPath);
      fs.unlinkSync(sourcePath);
      return;
    }
    throw error;
  }
}


// ---- Modular routes ----
const routeContext = {
  rootDir: __dirname,
  upload,
  cleanupFiles,
  getStationConfig,
  getBuildReport,
  getBuildMergedReport,
  getMesLogic,
  parseMesDateTime,
  getQuickLogCore,
  resolveQuickLogConfig,
  openQuickLogFile,
  QUICKLOG_MODELS,
  FIXED_TEMPLATE,
  UPLOAD_DIR,
  enginePath,
};

app.get('/api/app/settings', (_req, res) => { res.json({ success: true, settings: getPublicAppSettings() }); });

app.get('/api/stations', (_req, res) => {
  try {
    const cfg = getStationConfig();
    res.json({ success: true, stations: cfg.stations, presets: cfg.presets });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/stations', (req, res) => {
  try {
    const { stations } = req.body;
    if (!Array.isArray(stations)) return res.status(400).json({ success: false, error: 'stations must be an array' });
    const cleanStations = stations.map(s => String(s || '').trim()).filter(Boolean);
    // Read existing presets, filter to only keep stations that still exist
    let existingPresets = {};
    try {
      if (fs.existsSync(STATIONS_JSON_PATH)) {
        const existing = JSON.parse(fs.readFileSync(STATIONS_JSON_PATH, 'utf8'));
        existingPresets = existing.presets || {};
      }
    } catch (_) {}
    const stationSet = new Set(cleanStations);
    const filteredPresets = {};
    for (const [k, v] of Object.entries(existingPresets)) {
      if (Array.isArray(v)) filteredPresets[k] = v.filter(s => stationSet.has(s));
    }
    const newConfig = { stations: cleanStations, presets: filteredPresets };
    fs.writeFileSync(STATIONS_JSON_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
    _stationConfigCache = null; // invalidate cache
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


app.get('/api/app/modules', (_req, res) => { res.json({ success: true, ...getPublicModuleConfig() }); });

app.get('/api/app/clca-settings', (_req, res) => { res.json({ success: true, settings: getPublicClcaSettings() }); });

app.get('/api/app/mesdaily-settings', (_req, res) => { res.json({ success: true, settings: getPublicMesDailySettings() }); });
app.get('/api/quicklog/local-stations', (_req, res) => {
try {
const config = getQuickLogLocalStationsConfig();
res.json(config);
} catch (error) {
res.status(500).json({ success: false, error: String(error.message || error) });
}
});

// ---- QuickLog Config API ----
app.get('/api/config/quicklog', (_req, res) => {
  try {
    const configPath = path.resolve(process.cwd(), 'config', 'quicklog.models.json');
    let data = {};
    if (fs.existsSync(configPath)) {
      data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error.message || error) });
  }
});

app.post('/api/config/quicklog', (req, res) => {
  try {
    const configPath = path.resolve(process.cwd(), 'config', 'quicklog.models.json');
    const newData = req.body || {};
    
    // Validate folder existence for models
    const globalRoot = (newData.mesTrace && newData.mesTrace.logRoot) ? String(newData.mesTrace.logRoot).trim() : QUICKLOG_GLOBAL_ROOT;
    const models = Array.isArray(newData.models) ? newData.models : [];
    for (const m of models) {
        const modelName = typeof m === 'string' ? m.trim() : String(m.name || '').trim();
        if (modelName) {
            const expectedPath = path.join(globalRoot, modelName, 'SYNC LOCAL DATA');
            if (!fs.existsSync(expectedPath)) {
                return res.status(400).json({ success: false, error: `Folder does not exist on network for model ${modelName}:\n${expectedPath}` });
            }
        }
    }
    
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(newData, null, 2), 'utf8');
    
    // Dynamically reload the config in memory so the new paths take effect immediately
    QUICKLOG_MODELS = loadQuickLogModelsFromConfig();
    
    res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error.message || error) });
  }
});

// ---- QuickLog direct routes override ----
// Keep these before modular routes so model config/search/open-log are not blocked by stale route files.
const quickLogOpenCache = new Map();
const QUICKLOG_OPEN_CACHE_MAX = toPositiveInteger(APP_SETTINGS.quicklog?.openLogCacheMax, 500);
function quickLogCacheGet(key) {
  const cached = quickLogOpenCache.get(key);
  // Speed optimization: avoid fs.existsSync() on UNC/network path for every cache hit.
  return cached && cached.path ? cached.path : '';
}
function quickLogCacheSet(key, filePath) {
  if (!key || !filePath) return;
  if (quickLogOpenCache.size >= QUICKLOG_OPEN_CACHE_MAX) {
    const firstKey = quickLogOpenCache.keys().next().value;
    if (firstKey) quickLogOpenCache.delete(firstKey);
  }
  quickLogOpenCache.set(key, { path: filePath, ts: Date.now() });
}
function quickLogYmd(dt) {
  return `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
}
function quickLogExistingDir(dirPath) {
  try { return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(); } catch (_) { return false; }
}
function quickLogParseSourceFile(row, cfg) {
  const sourceFile = String(row && row.SourceFile || '').trim();
  if (!sourceFile) return null;
  const parts = sourceFile.split(/[\\/]+/).filter(Boolean);
  const csvIdx = parts.findIndex((p) => p.toLowerCase() === 'csv');
  if (csvIdx < 1 || parts.length < csvIdx + 5) return null;
  const stationFolder = parts[csvIdx - 1];
  return {
    stationFolder,
    project: parts[csvIdx + 1] || cfg.project,
    mode: parts[csvIdx + 2] || String(row.Mode || 'PROD').trim(),
    station: parts[csvIdx + 3] || String(row.Station || stationFolder).trim(),
    fixture: parts[csvIdx + 4] || cfg.fixture,
  };
}
function quickLogBuildFolderPriority(dateDir, result) {
  const normalized = String(result || '').trim().toUpperCase();
  if (normalized === 'FAIL') return [path.join(dateDir, 'FAIL'), path.join(dateDir, 'PASS')];
  if (normalized === 'PASS') return [path.join(dateDir, 'PASS'), path.join(dateDir, 'FAIL')];
  return [path.join(dateDir, 'FAIL'), path.join(dateDir, 'PASS')];
}
function quickLogDateFromParts(year, month, day, hour, minute, second) {
  const dt = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
function quickLogExtractTimestampFromName(filePath) {
  const name = path.basename(String(filePath || ''));
  const compact = name.replace(/\D/g, '');
  for (const m of compact.matchAll(/(20\d{12})/g)) {
    const v = m[1];
    const dt = quickLogDateFromParts(v.slice(0, 4), v.slice(4, 6), v.slice(6, 8), v.slice(8, 10), v.slice(10, 12), v.slice(12, 14));
    if (dt) return dt;
  }
  const separated = name.match(/(20\d{2})\D?(\d{2})\D?(\d{2}).*?(\d{2})\D?(\d{2})\D?(\d{2})/);
  if (separated) return quickLogDateFromParts(separated[1], separated[2], separated[3], separated[4], separated[5], separated[6]);
  return null;
}
function quickLogPickCandidateStandard(candidates, dt) {
  if (!candidates.length) return null;
  if (candidates.length === 1) return { filePath: candidates[0], fastSingleMatch: true, selectedBy: 'single' };

  let bestByName = null;
  for (const filePath of candidates) {
    const nameDt = quickLogExtractTimestampFromName(filePath);
    if (!nameDt) continue;
    const diff = Math.abs(nameDt.getTime() - dt.getTime()) / 1000;
    if (!bestByName || diff < bestByName.diff) bestByName = { filePath, diff, selectedBy: 'filenameTime' };
  }
  if (bestByName) return bestByName;

  let bestByStat = null;
  for (const filePath of candidates) {
    try {
      const st = fs.statSync(filePath);
      const diff = Math.min(Math.abs(st.mtimeMs - dt.getTime()), Math.abs(st.ctimeMs - dt.getTime())) / 1000;
      if (!bestByStat || diff < bestByStat.diff) bestByStat = { filePath, diff, selectedBy: 'fileStatTime' };
    } catch (_) {}
  }
  return bestByStat || { filePath: candidates[0], selectedBy: 'firstFallback' };
}
function quickLogFindLogFast(cfg, row) {
const core = getQuickLogCore();
const startedAt = Date.now();
const sn = String(row && row.SN || '').trim();
const result = String(row && row.Result || '').trim().toUpperCase();
const dt = core.parseEndTime(row && row.EndTime || '');
if (!sn) return { success: false, error: 'Missing SN.' };
if (!dt) return { success: false, error: `Invalid EndTime for SN ${sn}.` };
const derived = quickLogParseSourceFile(row, cfg) || {};
const project = String(derived.project || cfg.project || cfg.model || '').trim();
const mode = String(derived.mode || row.Mode || 'PROD').trim();
const sourceStation = String(derived.station || row.Station || '').trim();
const fixture = String(derived.fixture || cfg.fixture || 'J01').trim();
if (!cfg.base || !sourceStation || !project || !mode || !fixture) return { success: false, error: 'Missing QuickLog base/project/mode/station/fixture.' };
const resolved = resolveQuickLogLocalStationForServer(cfg.model || project, sourceStation);
if (!resolved.allowed) return { success: false, code: 'LOCAL_LOG_STATION_NOT_CONFIGURED', error: 'Log file dont exist on local folder', resolved: { model: cfg.model, station: sourceStation, reason: resolved.reason } };
const stationCandidates = (Array.isArray(row && row._QuickLogLocalStationCandidates) && row._QuickLogLocalStationCandidates.length)
  ? row._QuickLogLocalStationCandidates.map((x) => String(x || '').trim()).filter(Boolean)
  : (Array.isArray(resolved.localStations) && resolved.localStations.length ? resolved.localStations : [resolved.localStation || sourceStation]);
const cacheKey = `${cfg.model}|${cfg.base}|${project}|${mode}|${stationCandidates.join(',')}|${fixture}|${sn}|${row.EndTime}|${result}`;
const cachedPath = quickLogCacheGet(cacheKey);
if (cachedPath) return { success: true, path: cachedPath, cached: true, elapsedMs: Date.now() - startedAt };
const checkedPaths = [];
const prefix = `${sn}_`;
for (const station of stationCandidates) {
const dateDir = path.join(path.resolve(cfg.base), station, 'Log', project, mode, station, fixture, quickLogYmd(dt));
const folders = quickLogBuildFolderPriority(dateDir, result);
for (const folder of folders) {
checkedPaths.push(folder);
if (!quickLogExistingDir(folder)) continue;
let entries;
try { entries = fs.readdirSync(folder, { withFileTypes: true }); } catch (_) { continue; }
const candidates = entries.filter((d) => d.isFile() && d.name.startsWith(prefix) && d.name.toLowerCase().endsWith('.txt')).map((d) => path.join(folder, d.name));
if (!candidates.length) continue;
const picked = quickLogPickCandidateStandard(candidates, dt);
if (picked && picked.filePath) {
quickLogCacheSet(cacheKey, picked.filePath);
return { success: true, path: picked.filePath, selectedBy: picked.selectedBy, fastSingleMatch: !!picked.fastSingleMatch, diffSeconds: picked.diff != null ? Math.round(picked.diff * 1000) / 1000 : undefined, checkedPaths, resolved: { model: cfg.model, station: sourceStation, localStation: station, localStationCandidates: stationCandidates }, elapsedMs: Date.now() - startedAt };
}
}
}
return { success: false, error: 'Log file not found.', checkedPaths, pattern: `${sn}_*.txt`, resolved: { model: cfg.model, base: cfg.base, project, mode, station: sourceStation, localStationCandidates: stationCandidates, fixture, resultPriority: result || 'FAIL_FIRST' }, elapsedMs: Date.now() - startedAt };
}


app.get('/api/quicklog/models', (_req, res) => {
  const models = Object.values(QUICKLOG_MODELS).map(m => {
      let resolvedPath = m.path;
      if (!resolvedPath) {
          resolvedPath = require('path').join(QUICKLOG_GLOBAL_ROOT, m.name, 'SYNC LOCAL DATA');
      }
      return { ...m, resolvedPath }; // pass resolvedPath to frontend
  });
  res.json({ success: true, models });
});

app.get('/api/quicklog/modes', (req, res) => {
  try {
    const cfg = resolveQuickLogConfig({ model: req.query.model, base: req.query.base, project: req.query.project, fixture: req.query.fixture });
    if (!cfg.base) return res.status(400).json({ success: false, error: 'Model path not configured.' });
    const modes = getQuickLogCore().getModes(cfg.base, cfg.project || cfg.model);
    res.json({ success: true, modes, model: cfg.model });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error.message || error) });
  }
});

app.post('/api/quicklog/search', (req, res) => {
  try {
    const body = req.body || {};
    const cfg = resolveQuickLogConfig(body);
    if (!cfg.base) return res.status(400).json({ success: false, error: 'Model path not configured.' });
    const result = getQuickLogCore().searchSn(cfg.base, body.snText || body.sn || '', body.mode || 'PROD', cfg.project || cfg.model, cfg.fixture || 'J01');
    if (Array.isArray(result.rows)) {
      result.rows = result.rows.map((row) => ({
        ...row,
        _QuickLogModel: cfg.model,
        _QuickLogBase: cfg.base,
        _QuickLogProject: cfg.project || cfg.model,
        _QuickLogFixture: cfg.fixture || 'J01',
      }));
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: String(error.message || error), rows: [], summary: {} });
  }
});

app.post('/api/quicklog/open-log', async (req, res) => {
try {
const body = req.body || {};
const cfg = resolveQuickLogConfig(body);
if (!cfg.base) return res.status(400).json({ success: false, error: 'Model path not configured.' });
const data = getQuickLogCore().findLogFileForRow(cfg.base, body.row || {}, cfg.project || cfg.model, cfg.fixture || 'J01');
if (!data.success) return res.status(404).json(data);
await openQuickLogFile(data.path);
res.json({ ...data, opened: true });
} catch (error) {
res.status(500).json({ success: false, error: String(error.message || error) });
}
});
app.post('/api/quicklog/open-log-folder', async (req, res) => {
  try {
    const { modelName } = req.body || {};
    if (!modelName) return res.status(400).json({ success: false, error: 'Missing modelName' });
    const configPath = path.resolve(process.cwd(), 'config', 'quicklog.models.json');
    let globalRoot = QUICKLOG_GLOBAL_ROOT;
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.mesTrace && config.mesTrace.logRoot) {
            globalRoot = String(config.mesTrace.logRoot).trim();
        }
    }
    const folderPath = path.join(globalRoot, modelName, 'SYNC LOCAL DATA');
    if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ success: false, error: 'Folder does not exist on network:\n' + folderPath });
    }
    await openQuickLogFile(folderPath);
    res.json({ success: true, opened: true, path: folderPath });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error.message || error) });
  }
});

app.use(createClcaRoutes(routeContext));
app.use(createMesDailyRoutes(routeContext));
app.use(createQuickLogRoutes(routeContext));

app.post('/api/generate/grrprep', upload.fields([
  { name: 'data', maxCount: 1 },
]), async (req, res) => {
  const tempPaths = [];
  let generatedTempPath = '';

  try {
    if (!req.files || !req.files.data || !req.files.data[0]) {
      return res.status(400).json({ success: false, error: 'Missing Data file.' });
    }
    if (!fs.existsSync(GRR_PREP_SCRIPT)) {
      return res.status(500).json({ success: false, error: 'GRR prep script not found on server.' });
    }

    const uploadFile = req.files.data[0];
    const dataPath = uploadFile.path;
    tempPaths.push(dataPath);

    const finalOutputPath = buildGrrFinalOutputPath(req.body.output_path, uploadFile.originalname);
    fs.mkdirSync(path.dirname(finalOutputPath), { recursive: true });

    console.log(`[GRR PREP] input=${dataPath}`);
    console.log(`[GRR PREP] requestedOutput=${String(req.body.output_path || '').trim() || '(auto)'}`);
    console.log(`[GRR PREP] finalOutput=${finalOutputPath}`);

    // Async spawn so the server event loop stays free during GRR processing
    const { stdout: stdoutStr, stderr: stderrStr } = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [GRR_PREP_SCRIPT, dataPath], {
        windowsHide: true,
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
      child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('GRR prep timed out after 180 seconds.'));
      }, 180_000);
      child.on('error', (err) => { clearTimeout(timer); reject(new Error(`Failed to run GRR prep script: ${err.message || err}`)); });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new Error(stderr.trim() || stdout.trim() || `GRR prep exited with code ${code}`));
        } else {
          resolve({ stdout, stderr });
        }
      });
    });

    const parsedInput = path.parse(dataPath);
    generatedTempPath = path.join(parsedInput.dir, `${parsedInput.name} Final${parsedInput.ext || '.csv'}`);

    if (!fs.existsSync(generatedTempPath)) {
      throw new Error('GRR prep completed but output file was not found.');
    }

    moveFileOverwrite(generatedTempPath, finalOutputPath);
    cleanupFiles(tempPaths);

    // Parse stats emitted by grr-prepare.js
    let stats = null;
    const statsLine = stdoutStr.split(/\r?\n/).find((l) => l.startsWith('GRR_STATS:'));
    if (statsLine) {
      try { stats = JSON.parse(statsLine.slice('GRR_STATS:'.length)); } catch (_) {}
    }

    return res.json({
      success: true,
      output_path: finalOutputPath,
      message: 'GRR prep generated successfully!',
      stats,
    });
  } catch (err) {
    cleanupFiles(tempPaths);
    if (generatedTempPath && fs.existsSync(generatedTempPath)) {
      try { fs.unlinkSync(generatedTempPath); } catch (_) { /* ignore */ }
    }
    console.error('[GRR PREP ERROR]', err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, error: String(err.message || err) });
  }
});

// ---- POST /api/browse-save ----
// Opens a native Windows "Save As" dialog via PowerShell
app.post('/api/browse-save', (req, res) => {
  try {
    const body = req.body || {};
    const defaultNameRaw = String(body.defaultFileName || '').trim();
    const defaultFileName = defaultNameRaw || 'CLCA_Report.xlsx';

    // Strategy:
    // 1) Show SaveFileDialog only
    // 2) Return selected path or null when cancelled
    const psScript = [
      'Add-Type -AssemblyName System.Windows.Forms;',
      'Add-Type -AssemblyName System.Drawing;',
      '$owner = New-Object System.Windows.Forms.Form;',
      '$owner.TopMost = $true;',
      '$owner.ShowInTaskbar = $false;',
      '$owner.Opacity = 0;',
      '$owner.Size = New-Object System.Drawing.Size(1,1);',
      '$owner.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual;',
      '$owner.Location = New-Object System.Drawing.Point(-32000,-32000);',
      '$owner.Show();',
      '$owner.BringToFront() | Out-Null;',
      `$defaultName = '${defaultFileName.replace(/'/g, "''")}';`,
      '$selectedPath = "";',
      '$dlg = New-Object System.Windows.Forms.SaveFileDialog;',
      '$dlg.Title = "Save CLCA Report As...";',
      '$dlg.DefaultExt = "xlsx";',
      '$dlg.Filter = "Excel Workbook (*.xlsx)|*.xlsx|All Files (*.*)|*.*";',
      '$dlg.AddExtension = $true;',
      '$dlg.OverwritePrompt = $true;',
      '$dlg.RestoreDirectory = $true;',
      '$dlg.FileName = $defaultName;',
      '$result = $dlg.ShowDialog($owner);',
      'if ($result -eq [System.Windows.Forms.DialogResult]::OK) { $selectedPath = $dlg.FileName }',
      '$owner.Close();',
      '$owner.Dispose();',
      'if ($selectedPath) { Write-Output $selectedPath } else { Write-Output "" }',
    ].join(' ');

    const proc = spawn('powershell', ['-NoProfile', '-STA', '-Command', psScript], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (statusCode, payload) => {
      if (settled) return;
      settled = true;
      res.status(statusCode).json(payload);
    };

    const timeoutId = setTimeout(() => {
      try { proc.kill(); } catch (_) { /* ignore */ }
      finish(504, { error: 'Browse dialog timeout', path: null });
    }, 20000);

    proc.stdout.on('data', (chunk) => {
      stdout += String(chunk || '');
    });

    proc.stderr.on('data', (chunk) => {
      stderr += String(chunk || '');
    });

    proc.on('error', (error) => {
      clearTimeout(timeoutId);
      finish(500, { error: String(error.message || error), path: null });
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      if (settled) return;

      if (code !== 0) {
        return finish(500, {
          error: `PowerShell exited with code ${code}${stderr.trim() ? `: ${stderr.trim()}` : ''}`,
          path: null,
        });
      }

      const lines = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const filePath = lines.length ? lines[lines.length - 1] : '';

      if (filePath) {
        return finish(200, { path: filePath });
      }

      return finish(200, { path: null, message: 'Dialog cancelled' });
    });

  } catch (err) {
    console.error(`[BrowseSave ERROR] ${err}`);
    return res.status(500).json({ error: String(err.message || err), path: null });
  }
});


// ---- Express error middleware (catches Multer & other middleware errors) ----
app.use((err, _req, res, _next) => {
  console.error('[EXPRESS ERROR]', err && err.stack ? err.stack : err);
  const code = err.status || err.statusCode || 500;
  const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 50 MB).'
            : err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Unexpected file field.'
            : String(err.message || err);
  if (!res.headersSent) res.status(code).json({ success: false, error: msg });
});

// (CORS preflight handled by app.use(cors()) above)

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

// ---- Start server ----
const server = http.createServer(app);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // Check if existing process on this port is our server
    http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
      if (res.statusCode === 200) {
        console.log(`Port ${PORT} already in use by another CLCA server instance. Exiting gracefully.`);
        process.exit(0);
      } else {
        console.error(`Port ${PORT} is in use by another application. Close it and try again.`);
        process.exit(1);
      }
    }).on('error', () => {
      console.error(`Port ${PORT} is in use by another application. Close it and try again.`);
      process.exit(1);
    });
  } else {
    throw err;
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log('==================================================');
  console.log('  CloudMetrics Server (Node.js)');
  console.log(`  ${url}`);
  console.log('==================================================');

  // Pre-warm report engines after a delay so the event loop stays free
  // during the startup health-check polling window (cold require() blocks ~5-8s).
  setTimeout(() => {
    try { getBuildReport(); } catch (_) {}
    try { getBuildYieldReport(); } catch (_) {}
  }, 8000);
});
