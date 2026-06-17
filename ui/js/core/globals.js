lucide.createIcons();

// Scoped icon refresh – call after DOM mutations that add new data-lucide elements

function _refreshIcons(root) {
    lucide.createIcons(root ? { root } : undefined);
}


function dismissLoadingScreen() {
    try {
        if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
            window.chrome.webview.postMessage('clca-ui-ready');
        }
    } catch (e) {}
}


const LANG = {
    en: {
        appBrand: 'Module',
        langEnglish: 'English',
        langChinese: '中文',
        accessModule: 'Access Module',
        comingSoon: 'Coming Soon',
        comingSoonSub: 'New modules in development',
        landingTitle: 'Choose language and module',
        landingLanguage: 'Language',
        landingModule: 'Select Module',
        continueBtn: 'Continue',
        shellSubtitle: 'Workspace',
        stations: 'Stations',
        all: 'All',
        clear: 'Clear',
        saveOutput: 'Save Output As',
        browse: 'Browse',
        generate: 'Generate',
        generating: 'Generating...',
        clearAll: 'Clear',
        consoleLog: 'Console Log',
        clearLog: 'Clear Log',
        selectFile: 'Select File',
        noFile: 'No file selected',
        statusWaiting: 'Waiting for files...',
        statusReady: 'Ready to generate',
        statusGenerating: 'Generating...',
        statusSuccess: 'Completed successfully',
        statusNeed: 'Need:',
        needStations: 'Station selection',
        needStation: 'Station',
        missingInputs: 'Missing required inputs',
        missingOutput: 'Missing output path',
        noStations: 'No stations selected.',
        noStationsProceedAny: 'No stations selected for MES Daily. Proceed with all stations.',
        missingOutputPath: 'Missing output path.',
        startGen: 'Starting report generation...',
        uploading: 'Uploading files to server...',
        genFailed: 'Generation failed',
        reqFailed: 'Request failed',
        serverOffline: 'Server offline',
        reportSaved: 'Report saved to:',
        outputFile: 'Output file name:',
        genSuccess: 'Report generated successfully!',
        serverRunning: 'Server is running but request failed. Try again.',
        serverRestart: 'Server offline. Restart CloudMetrics.',
        allCleared: 'All inputs, stations, and output path cleared.',
        browseCanceled: 'Browse canceled.',
        browseError: 'Browse error:',
        browseTimeout: 'Browse timed out.',
        browseRetry: 'Unable to open Save dialog right now. Please try again.',
        consoleClear: 'Console cleared.',
        moduleChanged: 'Switched module to',
        missingData: 'Missing Data file.',
        missingTemplate: 'Missing Template file.',
        outputPlaceholder: 'e.g. C:\\Reports\\Report.xlsx',
        outputPlaceholderCsv: 'e.g. C:\\Reports\\Output.csv',
        toastTitle: 'Report generated successfully!',
        toastMsg: 'Operation completed successfully.',
        mesInputs: 'Input',
        fromLabel: 'From',
        toLabel: 'To',
        station: 'Station',
        openCalendar: 'Open calendar',
        requirementsLabel: 'WO Requirements',
        requirementsHint: 'Export one file per WO row when merged export is off. All files go to the same folder. ',
        fileNameLabel: 'File name',
        mergeAllLabel: 'Export one merged Excel',
        clcaMergeAllLabel: 'Export merged file (all WOs combined)',
        clcaCsnMappingLabel: 'Use CSN mapping',
        clcaDropHint: 'Click to select or drag files here',
        clcaDropSub: 'Supports xlsx, xls · Multiple files allowed',
        clcaDragActive: 'Release to upload files',
        clcaSheetPrefixLabel: 'Merged sheet prefix',
        clcaSheetPrefixHint: 'Optional. Prefix will be added before each generated sheet name.',
        clcaRemoveFile: 'Remove file',
        clcaPrecheckTitle: 'CLCA input pre-check & file list',
        clcaPrecheckSubtitle: 'file name · detected model/WO · station match · merge possible · sheet prefix',
        clcaFileCount: '{count} file(s)',
        clcaFileNameHeader: 'File name',
        clcaStatusHeader: 'Status',
        clcaModelWoHeader: 'Model / WO',
        clcaStationMatchedHeader: 'Station matched',
        clcaMergePossibleHeader: 'Merge possible',
        clcaSheetPrefixHeader: 'Sheet prefix',
        multipleFilesRequireMerge: 'Multiple files require \"Export merged file\"',
        addRequirementRow: 'Add row',
        removeRow: 'Remove row',
        needRequirement: 'WO',
        uiOnlyModuleNotice: 'UI-only module: backend generation is not connected yet.',
        feat1Title: 'Fast', feat1Sub: 'Excel in seconds',
        feat2Title: 'Modular', feat2Sub: 'Multiple report types',
        feat3Title: 'Reliable', feat3Sub: 'Validated output',
        quickLogNetworkBase: 'Model',
    mesDailyTabRtyDaily: 'RTY Daily',
    mesDailyTabDefectDaily: 'Defect Daily',
    mesR001ResultTitle: 'Search Result',
    mesTimeTitle: 'TIME',
    mesR001Title: 'Defect Query',
    mesR001Subtitle: 'Search MES defects by WO and the MES Daily time range',
    mesR001WoInput: 'WO Input',
    mesR001WoPlaceholder: 'Paste WO list here...',
    mesR001Search: 'Search',
    mesR001Clear: 'Clear',
    mesR001OpenLog: 'Open Log',
    mesR001ExportCsv: 'Export CSV',
    mesR001SelectedRowLabel: 'No row selected',
    mesR001SelectedRowFormat: 'Selected: {sn} | {station} | {result}',
    mesR001Ready: 'Ready to search R001',
    mesR001NeedWo: 'WO Input is required.',
    mesR001NoRows: 'No R001 records found.',
    mesR001Found: 'Found {count} R001 record(s).',
    quickLogMode: 'Mode',
    quickLogInput: 'SN / CSN Input',
    quickLogInputHint: 'Support comma, space, newline, or Excel column paste',
    quickLogSearch: 'Search',
    quickLogOpenLog: 'Open Log',
    quickLogClear: 'Clear',
    quickLogResult: 'Search Result',
    quickLogStatusReady: 'Ready to search',
    quickLogPlaceholder: 'Paste SN list here...',
    quickLogNoRowSelected: 'Select one row first.',
    quickLogUiOnlyNotice: 'QuickLog UI ready. Backend connection will be added next.',
    quickLogSelectedRowLabel: 'No row selected',
    quickLogSelectedRowFormat: 'Selected: {sn} | {station} | {result}',
    quickLogResultSearch: 'Search in result',
    quickLogExportCsv: 'Export CSV',
    quickLogExportedCount: 'Exported {count} rows to CSV',
    backToHome: 'Home',
    mesApiUnreachable: 'Cannot connect to MES server. Please check the MES URL.',
    settingsTitle: 'Configuration Settings',
    settingsTabGeneral: 'General',
    settingsTabModels: 'Models',
    settingsTabAliases: 'Station Aliases',
    settingsTabStations: 'Stations',
    settingsMesApiUrl: 'MES API URL',
    settingsLogRoot: 'Global Log Root Path',
    settingsModelsTitle: 'Models Configuration',
    settingsAddModel: 'Add Model',
    settingsModelName: 'Model Name',
    settingsAliasTitle: 'Station Aliases (MES to Network mapping)',
    settingsAddAlias: 'Add Alias',
    settingsMesStation: 'MES Station Name',
    settingsNetFolders: 'Network Folder Names (comma separated)',
    settingsAction: 'Action',
    settingsSave: 'Save Settings',
    settingsCancel: 'Cancel',
    settingsSaved: 'Settings Saved',
    settingsSavedMsg: 'Configuration has been updated successfully.',
    settingsStationsTitle: 'Stations List',
    settingsAddStation: 'Add Station',
    settingsStationName: 'Station Name',
    settingsStationsSaved: 'Stations Saved',
    settingsStationsSavedMsg: 'Stations list has been updated. Please refresh the page.',
    success: 'Success'
    },
    cn: {
        appBrand: '模块',
        langEnglish: '英文',
        langChinese: '中文',
        accessModule: '进入模块',
        comingSoon: '即将推出',
        comingSoonSub: '新模块开发中',
        landingTitle: '选择语言和模块',
        landingLanguage: '语言',
        landingModule: '选择模块',
        continueBtn: '继续',
        shellSubtitle: '工作区',
        stations: '站点选择',
        all: '全选',
        clear: '清除',
        saveOutput: '保存输出文件为',
        browse: '浏览',
        generate: '生成',
        generating: '正在生成...',
        clearAll: '清除',
        consoleLog: '控制台日志',
        clearLog: '清除日志',
        selectFile: '选择文件',
        noFile: '未选择文件',
        statusWaiting: '等待文件中...',
        statusReady: '准备生成',
        statusGenerating: '正在生成...',
        statusSuccess: '生成成功',
        statusNeed: '需要：',
        needStations: '站点选择',
        needStation: '站点',
        missingInputs: '缺少必要输入',
        missingOutput: '缺少输出路径',
        noStations: '未选择站点。',
        noStationsProceedAny: 'MES 每日报表未选择站点，将继续使用所有站点。',
        missingOutputPath: '缺少输出路径。',
        startGen: '正在开始生成报告...',
        uploading: '正在上传文件到服务器...',
        genFailed: '生成失败',
        reqFailed: '请求失败',
        serverOffline: '服务器离线',
        reportSaved: '报告已保存到：',
        outputFile: '输出文件名：',
        genSuccess: '报告生成成功！',
        serverRunning: '服务器运行中但请求失败，请重试。',
        serverRestart: '服务器离线，请重启 CloudMetrics。',
        allCleared: '所有输入、站点和输出路径已清除。',
        browseCanceled: '浏览已取消。',
        browseError: '浏览错误：',
        browseTimeout: '浏览超时。',
        browseRetry: '暂时无法打开保存对话框，请重试。',
        consoleClear: '控制台已清除。',
        moduleChanged: '已切换模块：',
        missingData: '缺少数据文件。',
        missingTemplate: '缺少模板文件。',
        outputPlaceholder: '例如 C:\\Reports\\Report.xlsx',
        outputPlaceholderCsv: '例如 C:\\Reports\\Output.csv',
        toastTitle: '报表生成成功！',
        toastMsg: '操作已完成。',
        mesInputs: '输入',
        fromLabel: '从',
        toLabel: '到',
        station: '站点',
        openCalendar: '打开日历',
        requirementsLabel: 'WO 要求',
        requirementsHint: '未启用合并导出时，每个 WO 行导出一个文件。所有文件保存到相同文件夹。',
        fileNameLabel: '文件名',
        mergeAllLabel: '导出一个合并 Excel',
        clcaMergeAllLabel: '导出合并文件（所有工单合并）',
        clcaCsnMappingLabel: '使用 CSN 映射',
        clcaDropHint: '点击选择或拖拽文件到此处',
        clcaDropSub: '支持 xlsx、xls · 可选择多个文件',
        clcaDragActive: '松开以上传文件',
        clcaSheetPrefixLabel: '合并页签前缀',
        clcaSheetPrefixHint: '可选。前缀会加在每个生成页签名称前。',
        clcaRemoveFile: '移除文件',
        clcaPrecheckTitle: 'CLCA 输入预检查与文件列表',
        clcaPrecheckSubtitle: '文件名 · 检测到的机种/工单 · 站点匹配 · 可否合并 · 页签前缀',
        clcaFileCount: '{count} 个文件',
        clcaFileNameHeader: '文件名',
        clcaStatusHeader: '状态',
        clcaModelWoHeader: '机种 / 工单',
        clcaStationMatchedHeader: '站点匹配',
        clcaMergePossibleHeader: '可否合并',
        clcaSheetPrefixHeader: '页签前缀',
        multipleFilesRequireMerge: '多个文件需要勾选 \"导出合并文件\"',
        addRequirementRow: '添加行',
        removeRow: '删除行',
        needRequirement: '工单',
        uiOnlyModuleNotice: '仅 UI 模块：后端生成功能尚未接入。',
        feat1Title: '快速', feat1Sub: '秒级生成Excel',
        feat2Title: '模块化', feat2Sub: '多种报表类型',
        feat3Title: '可靠', feat3Sub: '经过验证的输出',
        quickLogNetworkBase: '机种',
    mesDailyTabRtyDaily: 'RTY Daily',
    mesDailyTabDefectDaily: 'Defect Daily',
    mesR001ResultTitle: 'Search Result',
    mesTimeTitle: 'TIME',
    mesR001Title: 'Defect Query',
    mesR001Subtitle: '按工单和 MES Daily 时间范围查询 MES 不良',
    mesR001WoInput: '工单输入',
    mesR001WoPlaceholder: '请粘贴工单列表...',
    mesR001Search: '查询',
    mesR001Clear: '清除',
    mesR001OpenLog: '打开日志',
    mesR001ExportCsv: '导出 CSV',
    mesR001SelectedRowLabel: '未选择行',
    mesR001SelectedRowFormat: '已选择：{sn} | {station} | {result}',
    mesR001Ready: '准备查询 R001',
    mesR001NeedWo: '必须输入工单。',
    mesR001NoRows: '未找到 R001 记录。',
    mesR001Found: '找到 {count} 条 R001 记录。',
    quickLogMode: '模式',
    quickLogInput: 'SN / CSN 输入',
    quickLogInputHint: '支持逗号、空格、换行或 Excel 列粘贴',
    quickLogSearch: '查询',
    quickLogOpenLog: '打开日志',
    quickLogClear: '清除',
    quickLogResult: '查询结果',
    quickLogStatusReady: '准备查询',
    quickLogPlaceholder: '请粘贴 SN 列表...',
    quickLogNoRowSelected: '请先选择一行。',
    quickLogUiOnlyNotice: 'QuickLog UI 已准备，后端连接下一步添加。',
    quickLogSelectedRowLabel: '未选择行',
    quickLogSelectedRowFormat: '已选择：{sn} | {station} | {result}',
    quickLogResultSearch: '在结果中搜索',
    quickLogExportCsv: '导出 CSV',
    quickLogExportedCount: '已导出 {count} 行到 CSV',
    backToHome: '主页',
    mesApiUnreachable: '无法连接到 MES 服务器... 请检查 MES 网址...',
    settingsTitle: '配置设置',
    settingsTabGeneral: '常规',
    settingsTabModels: '机种',
    settingsTabAliases: '站点别名',
    settingsTabStations: '站点管理',
    settingsMesApiUrl: 'MES API 地址',
    settingsLogRoot: '全局日志根路径',
    settingsModelsTitle: '机种配置',
    settingsAddModel: '添加机种',
    settingsModelName: '机种名称',
    settingsAliasTitle: '站点别名（MES 到网络文件夹映射）',
    settingsAddAlias: '添加别名',
    settingsMesStation: 'MES 站点名称',
    settingsNetFolders: '网络文件夹名（逗号分隔）',
    settingsAction: '操作',
    settingsSave: '保存设置',
    settingsCancel: '取消',
    settingsSaved: '设置已保存',
    settingsSavedMsg: '配置已成功更新。',
    settingsStationsTitle: '站点列表',
    settingsAddStation: '添加站点',
    settingsStationName: '站点名称',
    settingsStationsSaved: '站点已保存',
    settingsStationsSavedMsg: '站点列表已更新，请刷新页面。',
    success: '成功'
    }
};


let APP_SETTINGS = {
    ui: { defaultLanguage: 'en', defaultTheme: 'system' },
    quicklog: { openLogCacheMax: 500, logTimeToleranceSeconds: 5, returnCheckedPathsOnFail: true, deriveLogPathFromSourceFile: true },
    browseSave: { timeoutMs: 12000 }
};

let CLCA_SETTINGS = {
    defaultOutputName: 'CLCA_Report.xlsx',
    merge: { requireMergeForMultipleFiles: true, defaultMergeEnabled: false },
    csnMapping: { defaultEnabled: false },
    stationRules: { 'Leak Test01': { leaveSnCodeBlank: true, leaveDescriptionBlank: true, disableCustomerSnMapping: true } }
};

let MESDAILY_SETTINGS = {
    defaultHour: 15,
    defaultOutputPrefix: 'MES Data',
    resetStateOnOpen: true,
    autoOutputNameFromToDate: true,
    dateTagFormat: 'MM.DD'
};

function getDefaultUiLanguage() { return (APP_SETTINGS.ui && LANG[APP_SETTINGS.ui.defaultLanguage]) ? APP_SETTINGS.ui.defaultLanguage : 'en'; }

function getBrowseSaveTimeoutMs() {
    const value = Number(APP_SETTINGS.browseSave && APP_SETTINGS.browseSave.timeoutMs);
    return Number.isFinite(value) && value > 0 ? value : 12000;
}

function mergeConfigObject(base = {}, override = {}) {
    const out = { ...base };
    if (!override || typeof override !== 'object') return out;
    Object.entries(override).forEach(([key, value]) => {
        out[key] = value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object'
            ? mergeConfigObject(out[key], value)
            : value;
    });
    return out;
}

function applyAppSettings(settings = {}) {
    APP_SETTINGS = mergeConfigObject(APP_SETTINGS, settings);
    if (!localStorage.getItem('clca_lang') && LANG[APP_SETTINGS.ui.defaultLanguage]) currentLang = APP_SETTINGS.ui.defaultLanguage;
    if (!localStorage.theme && APP_SETTINGS.ui.defaultTheme && APP_SETTINGS.ui.defaultTheme !== 'system') localStorage.theme = APP_SETTINGS.ui.defaultTheme;
}

async function loadAppSettings() {
    try {
        const response = await fetch('/api/app/settings', { method: 'GET', cache: 'no-store' });
        const data = await response.json();
        if (response.ok && data.success && data.settings) applyAppSettings(data.settings);
    } catch (_) {}
}

function mergeLocalizedConfig(target = {}, source = {}) { return (!source || typeof source !== 'object') ? target : { ...target, ...source }; }

function applyModuleConfig(config = {}) {
    const moduleCfg = config.modules || config;
    if (!moduleCfg || typeof moduleCfg !== 'object') return;
    Object.entries(moduleCfg).forEach(([moduleId, cfg]) => {
        if (!MODULES[moduleId] || !cfg || typeof cfg !== 'object') return;
        if (typeof cfg.enabled === 'boolean') MODULES[moduleId].enabled = cfg.enabled;
        if (cfg.endpoint) MODULES[moduleId].endpoint = String(cfg.endpoint);
        if (cfg.title) MODULES[moduleId].title = mergeLocalizedConfig(MODULES[moduleId].title, cfg.title);
        if (cfg.menuTitle) MODULES[moduleId].menuTitle = mergeLocalizedConfig(MODULES[moduleId].menuTitle, cfg.menuTitle);
        if (cfg.summary) MODULES[moduleId].summary = mergeLocalizedConfig(MODULES[moduleId].summary, cfg.summary);
    });
    if (!getEnabledModules().some((mod) => mod.id === activeModule)) activeModule = getEnabledModules()[0]?.id || 'clca';
    if (selectedLandingModule && !getEnabledModules().some((mod) => mod.id === selectedLandingModule)) selectedLandingModule = null;
}

async function loadAppModules() {
    try {
        const response = await fetch('/api/app/modules', { method: 'GET', cache: 'no-store' });
        const data = await response.json();
        if (response.ok && data.success) applyModuleConfig(data);
    } catch (_) {}
}

function getEnabledModules() { return Object.values(MODULES).filter((mod) => mod && mod.enabled !== false); }

function isModuleEnabled(moduleId) { return !!MODULES[moduleId] && MODULES[moduleId].enabled !== false; }

function applyClcaSettings(settings = {}) {
    CLCA_SETTINGS = mergeConfigObject(CLCA_SETTINGS, settings);
    if (MODULES.clca && CLCA_SETTINGS.defaultOutputName) MODULES.clca.defaultOutputName = CLCA_SETTINGS.defaultOutputName;
    if (stateByModule.clca) {
        stateByModule.clca.mergeAll = !!(CLCA_SETTINGS.merge && CLCA_SETTINGS.merge.defaultMergeEnabled);
        stateByModule.clca.useCsnMapping = !!(CLCA_SETTINGS.csnMapping && CLCA_SETTINGS.csnMapping.defaultEnabled);
    }
}

async function loadReportSettings() {
    try {
        const [clcaRes, mesRes] = await Promise.all([
            fetch('/api/app/clca-settings', { method: 'GET', cache: 'no-store' }),
            fetch('/api/app/mesdaily-settings', { method: 'GET', cache: 'no-store' }),
        ]);
        const clcaData = await clcaRes.json();
        const mesData = await mesRes.json();
        if (clcaRes.ok && clcaData.success && clcaData.settings) applyClcaSettings(clcaData.settings);
        if (mesRes.ok && mesData.success && mesData.settings) applyMesDailySettings(mesData.settings);
    } catch (_) {}
}

function isClcaMultiFileMergeRequired() {
    return !(CLCA_SETTINGS.merge && CLCA_SETTINGS.merge.requireMergeForMultipleFiles === false);
}

let selectedLandingModule = null;

let serverOnline = false;

let isBrowsingOutput = false;

const stateByModule = Object.fromEntries(Object.keys(MODULES).map((key) => [key, { files: {}, output: '', mergeAll: false, useCsnMapping: false, mergeSheetPrefixes: {} }]));

const MAX_RETRIES = 3;

const RETRY_DELAY = 2000;

let MES_DEFAULT_HOUR = 15;

const MES_STATE_STORAGE_KEY = 'mesdaily_state_v1';

const htmlElement = document.documentElement;

const workspaceView = document.getElementById('workspace-view');

const statusFooter = document.getElementById('status-footer');

const sidebar = document.getElementById('module-sidebar');

const workspaceSidebar = document.getElementById('workspace-sidebar');

const sidebarBackdrop = document.getElementById('sidebar-backdrop');

const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');

const btnSidebarToggleLg = document.getElementById('btn-sidebar-toggle-lg');

const btnSidebarClose = document.getElementById('btn-sidebar-close');

const moduleTitle = document.getElementById('module-title');

const langToggle = document.getElementById('langToggle');

const langToggleEn = document.getElementById('langToggle-en');

const langToggleCn = document.getElementById('langToggle-cn');

const fileCards = document.getElementById('file-cards');

const inputOutput = document.getElementById('input-output');

const btnBrowseOutput = document.getElementById('btn-browse-output');

const btnGenerate = document.getElementById('btn-generate');

const btnClear = document.getElementById('btn-clear');

const consoleOutput = document.getElementById('console-output');

const btnClearLog = document.getElementById('btn-clear-log');

const statusText = document.getElementById('status-text');

const statusDot = document.getElementById('status-dot');

const statusPing = document.getElementById('status-ping');

const btnSelectAll = document.getElementById('btn-select-all');

const btnSelectNone = document.getElementById('btn-select-none');

const btnPresetSmt = document.getElementById('btn-preset-smt');

const btnPresetDip = document.getElementById('btn-preset-dip');

const btnPresetFatp = document.getElementById('btn-preset-fatp');

const progressContainer = document.getElementById('progress-container');

const progressBar = document.getElementById('progress-bar');

const consolePanel = document.getElementById('console-panel');

const grrResultPanel = document.getElementById('grr-result-panel');


let QUICKLOG_MODELS = [
    { name: 'VO0301', path: '\\10.24.111.80\Testlog\camera\VO0301\SYNC LOCAL DATA', project: 'VO0301', fixture: 'J01' },
    { name: 'EO0302', path: '\\10.24.111.80\Testlog\camera\EO0302\SYNC LOCAL DATA', project: 'EO0302', fixture: 'J01' },
    { name: 'EO0303', path: '\\10.24.111.80\Testlog\camera\EO0303\SYNC LOCAL DATA', project: 'EO0303', fixture: 'J01' },
];

const QUICKLOG_DEFAULT_MODEL = 'VO0301';

let QUICKLOG_MODE_OPTIONS = ['PROD']; // Future: load all MODE values from selected model path.


let QUICKLOG_LOCAL_STATIONS_CONFIG = {
  "enabled": true,
  "message": {
    "en": "Log file dont exist on local folder",
    "cn": "本地文件夹中不存在该日志文件"
  },
  "models": {
    "VO0301": {
      "allowedStations": [
        "PCB_INPUT01",
        "SMT_TOP_MOUNT",
        "SMT_TOP_AOI_BF",
        "SMT_TOP_AOI_AF",
        "SMT_BOT_MOUNT",
        "SMT_BOT_AOI_BF",
        "SMT_BOT_AOI_AF",
        "DIP_TU01",
        "DIP_INPUT",
        "DIP_PCBA_TEST01",
        "DIP_PCBA_TEST02",
        "DIP_PCBA_TEST03",
        "PCBA01",
        "PCBA02",
        "PCBA03",
        "FPC01",
        "FPC02",
        "FPC03",
        "FATP_FT_01",
        "FATP_FT_02",
        "FATP_FT_03",
        "FATP_FT_04",
        "FATP_FT_05",
        "FATP_FT_06",
        "FT01",
        "FT02",
        "FT03",
        "FT04",
        "FT05",
        "FT06",
        "FT_Check"
      ],
      "aliases": {
        "PCB_INPUT": "PCB_INPUT01",
        "PCB_INPUT01": "PCB_INPUT01",
        "SMT BOT MOUNT": "SMT_BOT_MOUNT",
        "SMT_BOT_MOUNT": "SMT_BOT_MOUNT",
        "SMT_BOT_AOI_BF REFLOW": "SMT_BOT_AOI_BF",
        "SMT_BOT_AOI_BF REFLOW01": "SMT_BOT_AOI_BF",
        "SMT_BOT_AOI_BF": "SMT_BOT_AOI_BF",
        "SMT_TOP_MOUNT": "SMT_TOP_MOUNT",
        "SMT_TOP_AOI_BF": "SMT_TOP_AOI_BF",
        "DIP_INPUT": "DIP_INPUT",
        "DIP_TU01": "DIP_TU01",
        "DIP_PCBA TEST01": "DIP_PCBA_TEST01",
        "DIP_PCBA TEST02": "DIP_PCBA_TEST02",
        "DIP_PCBA TEST03": "DIP_PCBA_TEST03",
        "DIP_PCBA_01": "PCBA01",
        "DIP_PCBA_02": "PCBA02",
        "DIP_PCBA_03": "PCBA03",
        "PCBA01": "PCBA01",
        "PCBA02": "PCBA02",
        "PCBA03": "PCBA03",
        "FPC01": "FPC01",
        "FPC02": "FPC02",
        "FPC03": "FPC03",
        "FATP FT 01": "FATP_FT_01",
        "FATP FT 02": "FATP_FT_02",
        "FATP FT 03": "FATP_FT_03",
        "FATP FT 04": "FATP_FT_04",
        "FATP FT 05": "FATP_FT_05",
        "FATP FT 06": "FATP_FT_06",
        "FATP_FT_01": "FATP_FT_01",
        "FATP_FT_02": "FATP_FT_02",
        "FATP_FT_03": "FATP_FT_03",
        "FATP_FT_04": "FATP_FT_04",
        "FATP_FT_05": "FATP_FT_05",
        "FATP_FT_06": "FATP_FT_06",
        "FT01": "FATP_FT_01",
        "FT02": "FATP_FT_02",
        "FT03": "FATP_FT_03",
        "FT04": "FATP_FT_04",
        "FT05": "FATP_FT_05",
        "FT06": "FATP_FT_06",
        "FATP_CHECK": "FT_Check",
        "FT_CHECK": "FT_Check",
        "REPAIR": null,
        "REPAIR01": null
      }
    },
    "EO0302": {
      "inheritFrom": "VO0301"
    },
    "EO0303": {
      "inheritFrom": "VO0301"
    }
  }
};

function resolveQuickLogLocalStation(modelName, stationName) {
    const cfg = QUICKLOG_LOCAL_STATIONS_CONFIG || {};
    const raw = String(stationName || '').trim();
    if (cfg.enabled === false) return { allowed: true, localStation: raw, localStations: [raw], configured: false };
    const modelCfg = getQuickLogLocalStationModelConfig(modelName);
    if (!modelCfg) return { allowed: true, localStation: raw, localStations: [raw], configured: false };
    const rawUpper = quickLogNormalizeStationName(raw);
    const rawCompact = quickLogCompactStationName(raw);
    if (!raw) return { allowed: false, localStation: raw, localStations: [], configured: true, reason: 'missing-station' };
    if (rawUpper.includes('REPAIR') || rawCompact.includes('REPAIR')) return { allowed: false, localStation: raw, localStations: [], configured: true, reason: 'repair-has-no-local-log' };
    let mapped;
    const aliases = modelCfg.aliases || {};
    for (const [key, value] of Object.entries(aliases)) {
        if (quickLogNormalizeStationName(key) === rawUpper || quickLogCompactStationName(key) === rawCompact) {
            mapped = value;
            break;
        }
    }
    if (mapped === null) return { allowed: false, localStation: raw, localStations: [], configured: true, reason: 'alias-disabled' };
    const candidates = quickLogAliasTargets(mapped, raw);
    const allowedStations = Array.isArray(modelCfg.allowedStations) ? modelCfg.allowedStations : [];
    if (!allowedStations.length) {
        const localStations = candidates.length ? candidates : [raw];
        return { allowed: true, localStation: localStations[0] || raw, localStations, configured: true };
    }
    const localStations = (candidates.length ? candidates : [raw]).filter((candidate) =>
        allowedStations.some((station) => quickLogStationMatches(station, candidate))
    );
    const rawIsAllowed = allowedStations.some((station) => quickLogStationMatches(station, raw));
    const allowed = rawIsAllowed || localStations.length > 0;
    const finalStations = localStations.length ? localStations : (rawIsAllowed ? [raw] : []);
    return { allowed, localStation: finalStations[0] || raw, localStations: finalStations, configured: true, reason: allowed ? '' : 'station-not-in-local-config' };
}

async function loadQuickLogLocalStationsConfig() {
    if (quickLogLocalStationsConfigLoaded) return QUICKLOG_LOCAL_STATIONS_CONFIG;
    quickLogLocalStationsConfigLoaded = true;
    const candidates = ['/api/quicklog/local-stations', '/quicklog.local-stations.json', '/config/quicklog.local-stations.json'];
    for (const url of candidates) {
        try {
            const response = await fetch(url, { method: 'GET', cache: 'no-store' });
            if (!response.ok) continue;
            const data = await response.json();
            if (data && typeof data === 'object' && data.success !== false) {
                QUICKLOG_LOCAL_STATIONS_CONFIG = data;
                break;
            }
        } catch (_) {}
    }
    return QUICKLOG_LOCAL_STATIONS_CONFIG;
}

async function shouldQuickLogSkipOpenByLocalStationConfig(row, fallbackModel) {
    await loadQuickLogLocalStationsConfig();
    const model = getQuickLogRowModelForOpen(row, fallbackModel);
    const station = getQuickLogRowStationForOpen(row);
    const resolved = resolveQuickLogLocalStation(model, station);
    if (resolved.allowed) {
        row._QuickLogLocalStation = resolved.localStation || station;
        row._QuickLogLocalStationCandidates = Array.isArray(resolved.localStations) && resolved.localStations.length ? resolved.localStations : [resolved.localStation || station];
        return false;
    }
    // Station not in allowedStations config — log warning but do NOT show error popup.
    // Backend will try to find the file anyway and show its own error if not found.
    const message = getQuickLogLocalStationMissingMessage();
    logToConsole(message, 'warning');
    return true;
}

function composeMesDateTime(dateValue, timeValue) {
    const date = parseMesDate(dateValue);
    if (!date) return '';
    const { hour, minute } = normalizeMesTime(timeValue);
    return `${formatMesDate(date)}T${pad2(hour)}:${pad2(minute)}`;
}


function getDefaultMesTimeRange(anchor = new Date()) {
    const toDate = new Date(anchor);
    toDate.setHours(MES_DEFAULT_HOUR, 0, 0, 0);
    const fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - 1);
    return { fromDate, toDate };
}


function removeDuplicatedMesRequirementHeaders(list) {
    if (!list || !list.parentElement) return;
    Array.from(list.parentElement.children).forEach((child) => {
        if (child.id === 'mes-requirement-header-aligned' || child.id === 'mes-requirement-list') return;
        const compact = String(child.textContent || '').replace(/\s+/g, '').toUpperCase();
        const looksLikeHeader = compact.includes('WO') && compact.includes('PDLINE') && compact.includes('FILENAME');
        const noInputs = !child.querySelector('input,textarea,button');
        if (looksLikeHeader && noInputs) child.remove();
    });
}

function moduleLabel(moduleId) {
    const m = MODULES[moduleId];
    return m ? m.title[currentLang] : moduleId;
}


function getSelectedStations() {
    return selectedStationsByModule[activeModule];
}


async function loadQuickLogModels() {
    try {
        const response = await fetchRetry('/api/quicklog/models', { method: 'GET', cache: 'no-store' }, 1);
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.models)) throw createBackendError(data, 'Cannot load QuickLog models.');
        const current = getQuickLogSelectedModelName();
        QUICKLOG_MODELS = data.models.map((m) => ({
            name: String(m.name || '').trim(),
            path: String(m.path || '').trim(),
            resolvedPath: String(m.resolvedPath || '').trim(),
            project: String(m.project || m.name || '').trim(),
            fixture: String(m.fixture || 'J01').trim(),
        })).filter((m) => m.name);
        if (!QUICKLOG_MODELS.length) throw new Error('No QuickLog model configured.');
        const selected = QUICKLOG_MODELS.some((m) => m.name === current) ? current : QUICKLOG_MODELS[0].name;
        refreshQuickLogModelDropdown(selected);
        setQuickLogModelValue(selected);
        await loadQuickLogModes(false);
    } catch (err) {
        logToConsole(`QuickLog model load failed: ${err.message || err}`, 'warning');
        await loadQuickLogModes(false);
    }
}


async function loadQuickLogModes(showLog = true) {
    const model = getQuickLogSelectedModel();
    const modeInput = document.getElementById('quicklog-mode');
    if (!modeInput) return;
    if (!model || (!model.path && !model.resolvedPath)) {
        QUICKLOG_MODE_OPTIONS = ['PROD'];
        refreshQuickLogModeDropdown('PROD');
        if (showLog) logToConsole('Model path not configured. Mode fallback: PROD.', 'warning');
        return;
    }
    const previousMode = modeInput.value || 'PROD';
    const selectedLabel = document.getElementById('quicklog-mode-selected');
    if (selectedLabel) selectedLabel.textContent = 'Loading...';
    try {
        const url = `/api/quicklog/modes?model=${encodeURIComponent(model.name)}`;
        const response = await fetchRetry(url, { method: 'GET', cache: 'no-store' }, 1);
        const data = await response.json();
        if (!response.ok || !data.success) throw createBackendError(data, 'Cannot load modes.');
        QUICKLOG_MODE_OPTIONS = Array.isArray(data.modes) && data.modes.length ? data.modes : ['PROD'];
        const selectedMode = QUICKLOG_MODE_OPTIONS.includes(previousMode) ? previousMode : QUICKLOG_MODE_OPTIONS[0];
        refreshQuickLogModeDropdown(selectedMode);
        if (showLog) logToConsole(`QuickLog modes loaded: <b>${QUICKLOG_MODE_OPTIONS.join(', ')}</b>`, 'system');
    } catch (err) {
        QUICKLOG_MODE_OPTIONS = ['PROD'];
        refreshQuickLogModeDropdown('PROD');
        if (showLog) logToConsole(`Load QuickLog modes failed, fallback PROD: ${err.message || err}`, 'warning');
    }
}

function formatCountText(key, count) {
    return String(t(key)).replace('{count}', String(count));
}

function normalizeQuickLogMesDisplayRows(rows = []) {
    const seenRepairKeys = new Set();
    return rows.filter((row) => {
        if (row?._QuickLogHideRow) return false;
        if (row?.hideDuplicateRepair) return false;
        if (isQuickLogA004OnlyRow(row)) return false;
        if (!isQuickLogRepairDisplayRow(row)) return true;
        const key = getQuickLogRepairDedupKey(row);
        if (seenRepairKeys.has(key)) return false;
        seenRepairKeys.add(key);
        return true;
    });
}


function markQuickLogFirstSnRows(rows = []) {
    if (!isQuickLogMesTraceMode()) return rows;
    const seen = new Set();
    return rows.map((row) => {
        const sn = String(row?.serialNumber || row?.SN || '').trim();
        if (!sn || seen.has(sn)) return row;
        seen.add(sn);
        return { ...row, _QuickLogFirstSnRow: true };
    });
}


function resetQuickLogResultOnly() {
    quickLogRows = [];
    quickLogSelectedIndex = -1;
    quickLogLastSummary = {};
    const summary = document.getElementById('quicklog-summary');
    if (summary) {
        summary.textContent = t('quickLogStatusReady');
        summary.dataset.custom = 'ready';
    }
    renderQuickLogRows([]);
}

function filterQuickLogResultsBySearchText(rows = []) {
    if (!quickLogResultSearchText || quickLogResultSearchText.trim() === '') return rows;
    const searchLower = quickLogResultSearchText.trim().toLowerCase();
    return rows.filter((row) => {
        const isMes = isQuickLogMesTraceMode();
        const columns = isMes ? getQuickLogMesColumns() : ['SN', 'Station', 'Mode', 'Result', 'Failitem', 'EndTime'];
        return columns.some((col) => {
            const value = String(row[col] || '').toLowerCase();
            return value.includes(searchLower);
        });
    });
}
// QL-06: Generate CSV string from visible rows

async function precheckOneClcaFile(file) {
    const key = getClcaFileKey(file);
    if (!key) return;
    clcaPrecheckByKey[key] = { loading: true };
    renderClcaMergeRenamePanel();
    const form = new FormData();
    form.append('data', file);
    form.append('selected_stations', JSON.stringify(Array.from(selectedStationsByModule.clca || [])));
    try {
        const response = await fetchRetry('/api/clca/precheck', { method: 'POST', body: form }, 1);
        const data = await response.json();
        if (!response.ok || !data.success) throw createBackendError(data, 'CLCA pre-check failed.');
        clcaPrecheckByKey[key] = data;
    } catch (err) {
        clcaPrecheckByKey[key] = { ok: false, error: String(err.message || err) };
    }
    renderClcaMergeRenamePanel();
}

function sortStationsByPresetOrder(stations, presets) {
    const source = Array.isArray(stations) ? stations : [];
    const presetMap = (presets && typeof presets === 'object') ? presets : {};
    const presetKeys = Object.keys(presetMap);
    const preferredPresetOrder = ['FATP', 'DIP', 'SMT'];
    const orderedPresetKeys = [
        ...preferredPresetOrder.filter((k) => presetKeys.includes(k)),
        ...presetKeys.filter((k) => !preferredPresetOrder.includes(k))
    ];
    const stationRank = new Map();
    let rank = 0;
    for (const presetKey of orderedPresetKeys) {
        const list = Array.isArray(presetMap[presetKey]) ? presetMap[presetKey] : [];
        for (const station of list) {
            if (!stationRank.has(station)) stationRank.set(station, rank++);
        }
    }
    const originalIndex = new Map(source.map((station, idx) => [station, idx]));
    return [...source].sort((a, b) => {
        const aRank = stationRank.has(a) ? stationRank.get(a) : Number.MAX_SAFE_INTEGER;
        const bRank = stationRank.has(b) ? stationRank.get(b) : Number.MAX_SAFE_INTEGER;
        if (aRank !== bRank) return aRank - bRank;
        return (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0);
    });
}


const dateFromEl = document.getElementById('mes-datefrom');
if (dateFromEl) {
    dateFromEl.addEventListener('change', () => {
        syncMesTimeRangeFromStart();
        updateStatus();
    });
}


const dateToEl = document.getElementById('mes-dateto');
if (dateToEl) {
    dateToEl.addEventListener('change', () => {
        syncMesHiddenRange();
        updateMesOutputNameFromRange();
        updateStatus();
    });
}


const hourFromEl = document.getElementById('mes-hourfrom');
if (hourFromEl) {
    hourFromEl.addEventListener('input', () => {
        syncMesTimeRangeFromStart();
        updateStatus();
    });
    hourFromEl.addEventListener('blur', () => {
        setMesHourValue(hourFromEl, hourFromEl.value);
        syncMesTimeRangeFromStart();
        updateStatus();
    });
}


const hourToEl = document.getElementById('mes-hourto');
if (hourToEl) {
    hourToEl.addEventListener('input', () => {
        syncMesHiddenRange();
        updateStatus();
    });
    hourToEl.addEventListener('blur', () => {
        setMesHourValue(hourToEl, hourToEl.value);
        syncMesHiddenRange();
        updateStatus();
    });
}

// Initialization moved to main.js

let currentSettingsData = {};
