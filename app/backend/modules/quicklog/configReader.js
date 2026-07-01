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

const QUICKLOG_MODELS_CONFIG_PATH = path.resolve(__dirname, '../../../../config', 'quicklog.models.json');
const QUICKLOG_LOCAL_STATIONS_CONFIG_CANDIDATES = [
  path.resolve(__dirname, '../../../../config', 'quicklog.local-stations.json'),
  path.resolve(__dirname, '../../../../', 'quicklog.local-stations.json'),
  path.resolve(__dirname, '../../../../ui', 'quicklog.local-stations.json'),
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

let QUICKLOG_GLOBAL_ROOT = '\\\\10.24.111.80\\Testlog\\camera';
let QUICKLOG_PROGRAMS = [];

function loadQuickLogConfig() {
  try {
    if (!fs.existsSync(QUICKLOG_MODELS_CONFIG_PATH)) {
      return;
    }
    const parsed = JSON.parse(fs.readFileSync(QUICKLOG_MODELS_CONFIG_PATH, 'utf8'));
    if (parsed.mesTrace && parsed.mesTrace.logRoot) {
      QUICKLOG_GLOBAL_ROOT = parsed.mesTrace.logRoot;
    }
    if (Array.isArray(parsed.programs)) {
      QUICKLOG_PROGRAMS = parsed.programs;
    }
  } catch (error) {
    // Ignore read errors
  }
}

loadQuickLogConfig();

function reloadQuickLogModelsFromConfig() {
  loadQuickLogConfig();
}

function getQuickLogModelsDict() {
  const models = {};
  if (fs.existsSync(QUICKLOG_GLOBAL_ROOT)) {
    try {
      const entries = fs.readdirSync(QUICKLOG_GLOBAL_ROOT, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const name = entry.name;
          models[name] = {
            name,
            path: require('path').join(QUICKLOG_GLOBAL_ROOT, name, 'SYNC LOCAL DATA'),
            project: name,
            fixture: 'J01'
          };
        }
      }
    } catch (e) {}
  }
  return Object.keys(models).length > 0 ? models : { VO0301: { name: 'VO0301', path: require('path').join(QUICKLOG_GLOBAL_ROOT, 'VO0301', 'SYNC LOCAL DATA') } };
}

function getQuickLogModel(modelName) {
  const name = String(modelName || '').trim();
  if (!name) return null;
  return {
    name,
    path: require('path').join(QUICKLOG_GLOBAL_ROOT, name, 'SYNC LOCAL DATA'),
    project: name,
    fixture: 'J01'
  };
}

function getQuickLogPrograms() {
  return QUICKLOG_PROGRAMS;
}

function getQuickLogProgram(name) {
  return QUICKLOG_PROGRAMS.find((p) => p.name === name) || QUICKLOG_PROGRAMS[0];
}

function resolveQuickLogConfig(input = {}) {
  const body = input && typeof input === 'object' ? input : {};
  const row = body.row && typeof body.row === 'object' ? body.row : body;
  const requestedModel = String(body.model || body.quickLogModel || body._QuickLogModel || row._QuickLogModel || '').trim();
  const requestedProgram = String(body.program || body.quickLogProgram || body._QuickLogProgram || row._QuickLogProgram || '').trim();
  const model = getQuickLogModel(requestedModel);
  const program = getQuickLogProgram(requestedProgram);
  
  if (model) {
      return { 
          base: model.path, 
          csvBase: '',
          project: model.project, 
          fixture: model.fixture, 
          model: model.name,
          program: program
      };
  }
  return {
    base: '',
    csvBase: '',
    project: String(body.project || body._QuickLogProject || row._QuickLogProject || requestedModel || 'VO0301').trim(),
    fixture: String(body.fixture || body._QuickLogFixture || row._QuickLogFixture || 'J01').trim(),
    model: requestedModel,
    program: program
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
  getQuickLogGlobalRoot,
  getQuickLogPrograms
};
