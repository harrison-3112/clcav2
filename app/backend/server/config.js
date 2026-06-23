const fs = require('fs');
const path = require('path');

const APP_SETTINGS_CONFIG_PATH = path.resolve(__dirname, '../../../config', 'app.settings.json');
const LOGGING_CONFIG_PATH = path.resolve(__dirname, '../../../config', 'logging.json');
const MODULES_CONFIG_PATH = path.resolve(__dirname, '../../../config', 'modules.json');
const CLCA_SETTINGS_CONFIG_PATH = path.resolve(__dirname, '../../../config', 'clca.settings.json');
const MESDAILY_SETTINGS_CONFIG_PATH = path.resolve(__dirname, '../../../config', 'mesdaily.settings.json');

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

function saveJsonConfig(filePath, data, currentObj) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    Object.assign(currentObj, data); // update in memory
    return true;
  } catch (error) {
    console.error(`[Config] Failed to save config to ${filePath}:`, error);
    return false;
  }
}

function saveAppSettings(newSettings) {
  const merged = deepMergeConfig(APP_SETTINGS, newSettings);
  return saveJsonConfig(APP_SETTINGS_CONFIG_PATH, merged, APP_SETTINGS);
}
function saveClcaSettings(newSettings) {
  const merged = deepMergeConfig(CLCA_SETTINGS, newSettings);
  return saveJsonConfig(CLCA_SETTINGS_CONFIG_PATH, merged, CLCA_SETTINGS);
}
function saveMesDailySettings(newSettings) {
  const merged = deepMergeConfig(MESDAILY_SETTINGS, newSettings);
  return saveJsonConfig(MESDAILY_SETTINGS_CONFIG_PATH, merged, MESDAILY_SETTINGS);
}
function saveModulesConfig(newConfig) {
  const merged = deepMergeConfig(MODULES_CONFIG, newConfig);
  return saveJsonConfig(MODULES_CONFIG_PATH, merged, MODULES_CONFIG);
}

module.exports = {
  APP_SETTINGS,
  LOGGING_CONFIG,
  MODULES_CONFIG,
  CLCA_SETTINGS,
  MESDAILY_SETTINGS,
  toPositiveInteger,
  getPublicAppSettings,
  getPublicModuleConfig,
  getPublicClcaSettings,
  getPublicMesDailySettings,
  saveAppSettings,
  saveClcaSettings,
  saveMesDailySettings,
  saveModulesConfig
};
