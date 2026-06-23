const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const QUICKLOG_CORE_PATH = path.resolve(__dirname, '..', 'logsn', 'sn_search_core_js.js');
let quickLogCore = null;

function getQuickLogCore() {
  if (quickLogCore) return quickLogCore;
  if (!fs.existsSync(QUICKLOG_CORE_PATH)) throw new Error('QuickLog JS core not found: ' + QUICKLOG_CORE_PATH);
  quickLogCore = require(QUICKLOG_CORE_PATH);
  return quickLogCore;
}

const QUICKLOG_MODELS_CONFIG_PATH = path.resolve(process.cwd(), 'config', 'quicklog.models.json');
const QUICKLOG_LOCAL_STATIONS_CONFIG_CANDIDATES = [
  path.resolve(process.cwd(), 'config', 'quicklog.local-stations.json'),
  path.resolve(process.cwd(), 'quicklog.local-stations.json'),
  path.resolve(process.cwd(), 'ui', 'quicklog.local-stations.json'),
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
  VO0301: { name: 'VO0301', path: process.env.SN_SEARCH_BASE || '\\\\10.24.111.80\\Testlog\\camera\\VO0301\\SYNC LOCAL DATA', project: 'VO0301', fixture: 'J01' },
  EO0302: { name: 'EO0302', path: '\\\\10.24.111.80\\Testlog\\camera\\EO0302\\SYNC LOCAL DATA', project: 'EO0302', fixture: 'J01' },
  EO0303: { name: 'EO0303', path: '\\\\10.24.111.80\\Testlog\\camera\\EO0303\\SYNC LOCAL DATA', project: 'EO0303', fixture: 'J01' },
};

function normalizeQuickLogModel(raw) {
  const name = typeof raw === 'string' ? raw.trim() : String(raw && raw.name || '').trim();
  if (!name) return null;
  return {
    name,
    logPath: typeof raw === 'object' ? String(raw.logPath || '').trim() : '',
    csvPath: typeof raw === 'object' ? String(raw.csvPath || '').trim() : '',
    path: typeof raw === 'object' ? String(raw.path || '').trim() : '',
    project: name,
    fixture: 'J01',
  };
}

let QUICKLOG_GLOBAL_ROOT = '\\\\10.24.111.80\\Testlog\\camera';

function loadQuickLogModelsFromConfig() {
  try {
    if (!fs.existsSync(QUICKLOG_MODELS_CONFIG_PATH)) {
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
    return { ...DEFAULT_QUICKLOG_MODELS };
  }
}

let QUICKLOG_MODELS = loadQuickLogModelsFromConfig();

function reloadQuickLogModelsFromConfig() {
  QUICKLOG_MODELS = loadQuickLogModelsFromConfig();
}

function getQuickLogModel(modelName) {
  return QUICKLOG_MODELS[String(modelName || '').trim()] || null;
}

function getQuickLogModelsDict() {
  return QUICKLOG_MODELS;
}

function resolveQuickLogConfig(input = {}) {
  const body = input && typeof input === 'object' ? input : {};
  const row = body.row && typeof body.row === 'object' ? body.row : body;
  const requestedModel = String(body.model || body.quickLogModel || body._QuickLogModel || row._QuickLogModel || '').trim();
  const model = getQuickLogModel(requestedModel);
  if (model) {
      let base = model.logPath || model.path;
      if (!base) {
          base = require('path').join(QUICKLOG_GLOBAL_ROOT, model.name, 'SYNC LOCAL DATA');
      }
      return { 
          base, 
          csvBase: model.csvPath || '',
          project: model.project || model.name, 
          fixture: model.fixture || 'J01', 
          model: model.name 
      };
  }
  return {
    base: '',
    csvBase: '',
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

function getQuickLogGlobalRoot() {
    return QUICKLOG_GLOBAL_ROOT;
}

module.exports = {
  getQuickLogCore,
  getQuickLogLocalStationsConfig,
  resolveQuickLogLocalStationForServer,
  getQuickLogModelsDict,
  getQuickLogModel,
  reloadQuickLogModelsFromConfig,
  resolveQuickLogConfig,
  openQuickLogFile,
  QUICKLOG_MODELS_CONFIG_PATH,
  getQuickLogGlobalRoot
};
