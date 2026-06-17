const fs = require('fs');
const path = require('path');

const uiDir = path.join(__dirname, '../ui');
const code = fs.readFileSync(path.join(uiDir, 'app.js'), 'utf8');

// We will use a simple line-by-line parser to extract functions and consts
const lines = code.split('\n');

const groups = {
    state: [],
    i18n: [],
    api: [],
    ui: [],
    utils: [],
    landing: [],
    clca: [],
    mesdaily: [],
    quicklog: [],
    stations: [],
    settings: [],
    main: [],
    globals: []
};

// Heuristic matching based on prefixes/names
function assignToGroup(name) {
    if (name.startsWith('quickLog') || name.startsWith('getQuickLog') || name.startsWith('isQuickLog') || name.startsWith('renderQuickLog') || name.startsWith('updateQuickLog') || name.startsWith('setQuickLog') || name.startsWith('findQuickLog') || name.startsWith('hasQuickLog') || name.startsWith('applyQuickLog') || name.startsWith('bindQuickLog') || name.startsWith('searchQuickLog') || name.startsWith('clearQuickLog') || name.startsWith('generateQuickLog') || name.startsWith('downloadQuickLog') || name.startsWith('openQuickLog') || name.startsWith('formatQuickLog') || name.startsWith('decorateQuickLog') || name.startsWith('closeQuickLog') || name.startsWith('refreshQuickLog')) return 'quicklog';
    
    if (name.startsWith('mes') || name.startsWith('getMes') || name.startsWith('setMes') || name.startsWith('updateMes') || name.startsWith('renderMes') || name.startsWith('syncMes') || name.startsWith('initMes') || name.startsWith('applyMes') || name.startsWith('searchMes') || name.startsWith('openMes') || name.startsWith('exportMes') || name.startsWith('removeMes') || name.startsWith('ensureMes') || name.startsWith('formatMes') || name.startsWith('parseMes') || name.startsWith('normalizeMes') || name.startsWith('buildMes') || name.startsWith('saveMes') || name.startsWith('loadMes') || name.startsWith('readMes') || name.startsWith('hasIncompleteMes') || name.startsWith('collectMes') || name.startsWith('addMes') || name.startsWith('resetMes') || name.startsWith('hideMes') || name.startsWith('bindMes') || name.startsWith('switchMes') || name.startsWith('isMes') || name.startsWith('clearMes')) return 'mesdaily';
    
    if (name.startsWith('clca') || name.startsWith('getClca') || name.startsWith('updateClca') || name.startsWith('renderClca') || name.startsWith('mergeClca') || name.startsWith('ensureClca') || name.startsWith('removeClca') || name.startsWith('summarizeClca') || name.startsWith('precheckClca') || name.startsWith('runClca')) return 'clca';
    
    if (name.startsWith('settings') || name.startsWith('initSettings') || name.startsWith('getAliasRow') || name.startsWith('getModelRow') || name.startsWith('openSettings') || name.startsWith('closeSettings') || name.startsWith('populateSettings') || name.startsWith('saveSettings') || name.startsWith('updateSettings')) return 'settings';
    
    if (name.startsWith('station') || name.startsWith('initInlineStation') || name.startsWith('loadStations') || name.startsWith('renderStation') || name.startsWith('setStation') || name.startsWith('applyPreset')) return 'stations';
    
    if (name.startsWith('landing') || name.startsWith('renderLanding') || name.startsWith('backToLanding') || name.startsWith('enterWorkspace') || name.startsWith('switchModule')) return 'landing';
    
    if (name.startsWith('toast') || name.startsWith('showToast') || name.startsWith('hideToast') || name.startsWith('showImportantToast') || name.startsWith('getImportantToast') || name.startsWith('isFailureToast') || name.startsWith('normalizeToast') || name.startsWith('setImportantStyle') || name.startsWith('applyToast') || name.startsWith('setStatus') || name.startsWith('updateStatus') || name.startsWith('showProgress') || name.startsWith('completeProgress') || name.startsWith('resetProgress')) return 'ui';
    
    if (name.startsWith('fetch') || name.startsWith('checkServer') || name.startsWith('browseSave')) return 'api';
    
    if (name.startsWith('t') || name.startsWith('currentLang') || name.startsWith('applyLanguage') || name.startsWith('setLanguage') || name.startsWith('translations')) return 'i18n';
    
    if (name.startsWith('escapeHtml') || name.startsWith('pad2') || name.startsWith('getOutputExtension') || name.startsWith('withOutputExtension') || name.startsWith('sleep') || name.startsWith('logToConsole') || name.startsWith('appendBackendLogs') || name.startsWith('extractModelName') || name.startsWith('buildAutoOutputName') || name.startsWith('buildGrrFinalOutputName') || name.startsWith('fetchModelName') || name.startsWith('updateOutputName') || name.startsWith('inspectStations') || name.startsWith('autoDetectStations') || name.startsWith('handleFileSelect') || name.startsWith('getFieldDisplayName') || name.startsWith('extractBackendError') || name.startsWith('createBackendError') || name.startsWith('extractBackendTrace') || name.startsWith('isValidUploadFile') || name.startsWith('normalizeUploadFileList')) return 'utils';
    
    if (name.startsWith('MODULES') || name.startsWith('activeModule') || name.startsWith('clcaState') || name.startsWith('mesState') || name.startsWith('allStations') || name.startsWith('selectedStations') || name.startsWith('stationPresets') || name.startsWith('activePreset') || name.startsWith('currentWorkspace') || name.startsWith('sidebarBrand') || name.startsWith('QUICKLOG_MES_TRACE_FILTERS') || name.startsWith('MES_DATEPICKER_LOCALES') || name.startsWith('STATUS_COLORS')) return 'state';
    
    if (name.startsWith('renderSidebar') || name.startsWith('openSidebar') || name.startsWith('closeSidebar') || name.startsWith('isSidebarPinned') || name.startsWith('updateModuleHeader') || name.startsWith('updateModuleUiVisibility') || name.startsWith('initTheme') || name.startsWith('applyThemeToggle') || name.startsWith('getActiveState') || name.startsWith('resetNonPersistentModuleState') || name.startsWith('getBrowseLoadingHtml') || name.startsWith('getBrowseDefaultHtml') || name.startsWith('getGenerateLoadingHtml') || name.startsWith('getGenerateDefaultHtml') || name.startsWith('renderFileCards') || name.startsWith('saveOutputPath') || name.startsWith('restoreOutputPath') || name.startsWith('persistStations') || name.startsWith('restoreStations') || name.startsWith('clearInputs') || name.startsWith('onGenerate') || name.startsWith('hideGrrResult') || name.startsWith('renderGrrResult')) return 'main';
    
    return 'globals';
}

// Regex to capture blocks of code.
// We'll iterate through lines.
let currentBlock = [];
let currentName = null;
let currentGroup = 'globals';

const symbolRegex = /^(?:const|let|var|function|async function)\s+([a-zA-Z0-9_]+)/;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(symbolRegex);
    
    if (match && !line.startsWith(' ') && !line.startsWith('\t')) {
        // flush previous block
        if (currentBlock.length > 0) {
            groups[currentGroup].push(currentBlock.join('\n'));
        }
        currentBlock = [line];
        currentName = match[1];
        currentGroup = assignToGroup(currentName);
    } else if (line.startsWith('// ====================') || line.startsWith('document.addEventListener')) {
        // flush
        if (currentBlock.length > 0) {
            groups[currentGroup].push(currentBlock.join('\n'));
        }
        currentBlock = [line];
        currentGroup = 'main'; // Put event listeners and section headers in main
    } else {
        currentBlock.push(line);
    }
}
if (currentBlock.length > 0) {
    groups[currentGroup].push(currentBlock.join('\n'));
}

// Write to files
const dirs = [
    path.join(uiDir, 'js', 'core'),
    path.join(uiDir, 'js', 'modules')
];
dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, {recursive: true}); });

const fileMap = {
    state: 'core/state.js',
    i18n: 'core/i18n.js',
    api: 'core/api.js',
    ui: 'core/ui.js',
    utils: 'core/utils.js',
    landing: 'modules/landing.js',
    clca: 'modules/clca.js',
    mesdaily: 'modules/mesdaily.js',
    quicklog: 'modules/quicklog.js',
    stations: 'modules/stations.js',
    settings: 'modules/settings.js',
    main: 'main.js',
    globals: 'core/globals.js'
};

for (const key of Object.keys(groups)) {
    const content = groups[key].join('\n\n');
    fs.writeFileSync(path.join(uiDir, 'js', fileMap[key]), content);
    console.log(`Wrote ${fileMap[key]} (${groups[key].length} blocks)`);
}

// Generate the script tags for index.html
let scriptTags = '';
for (const key of Object.keys(fileMap)) {
    scriptTags += `<script src="js/${fileMap[key]}"></script>\n`;
}
fs.writeFileSync(path.join(uiDir, 'js', 'script_tags.txt'), scriptTags);
console.log('Done!');
