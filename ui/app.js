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

const MODULES = {
    clca: {
        id: 'clca',
        cardClass: 'card-clca',
        cardAccent: 'primary',
        cardIcon: 'bolt',
        singleInputLayout: true,
        icon: 'file-bar-chart-2',
        menuTitle: { en: 'CLCA Generator', cn: 'CLCA 生成器' },
        title: { en: 'CLCA Gen', cn: 'CLCA Gen' },
        summary: { en: 'Defect handling per station', cn: '按站点处理不良' },
        endpoint: '/api/generate',
        outputKey: 'clca_last_output_path',
        stationKey: 'clca_last_stations',
        defaultOutputName: 'CLCA_Report.xlsx',
        needsStations: true,
        fields: [
            { key: 'data', required: true, multiple: true, icon: 'database', grad: 'from-primary via-secondary to-cyan-400', label: { en: 'Data File', cn: '数据文件' }, accept: '.xlsx,.xls' }
        ]
    },

    mesdaily: {
        id: 'mesdaily',
        cardClass: 'card-yield',
        cardAccent: 'yield',
        cardIcon: 'calendar_month',
        icon: 'calendar-days',
        menuTitle: { en: 'MES Daily Report', cn: 'MES 每日报表' },
        title: { en: 'MES Daily', cn: 'MES 每日' },
        summary: { en: 'Generate daily MES report', cn: '生成每日 MES 报表' },
        endpoint: '/api/generate/mesdaily',
        outputKey: 'mesdaily_last_output_path',
        stationKey: 'mesdaily_last_stations',
        defaultOutputName: 'MES_Daily_Report.xlsx',
        needsStations: true,
        fields: []
    },


    quicklog: {
        id: 'quicklog',
        cardClass: 'card-quicklog',
        cardAccent: 'primary',
        cardIcon: 'search',
        icon: 'search',
        menuTitle: { en: 'QuickLog', cn: 'QuickLog' },
        title: { en: 'QuickLog', cn: 'QuickLog' },
        summary: { en: 'Fast SN log lookup', cn: '快速查询 SN 日志' },
        endpoint: '/api/quicklog/search',
        outputKey: 'quicklog_last_output_path',
        stationKey: 'quicklog_last_stations',
        defaultOutputName: 'QuickLog_Result.xlsx',
        needsStations: false,
        fields: [],
        uiOnly: false
    },

};

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
function applyMesDailySettings(settings = {}) {
    MESDAILY_SETTINGS = mergeConfigObject(MESDAILY_SETTINGS, settings);
    const defaultHour = Number(MESDAILY_SETTINGS.defaultHour);
    if (Number.isFinite(defaultHour) && defaultHour >= 0 && defaultHour <= 23) MES_DEFAULT_HOUR = Math.floor(defaultHour);
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
function getMesOutputPrefix() {
    return String(MESDAILY_SETTINGS.defaultOutputPrefix || 'MES Data').trim() || 'MES Data';
}

let currentLang = localStorage.getItem('clca_lang') || getDefaultUiLanguage();
let activeModule = 'clca';
let selectedLandingModule = null;
let serverOnline = false;
let isBrowsingOutput = false;
let activePreset = null;
let toastTimerId = null;

const stateByModule = Object.fromEntries(Object.keys(MODULES).map((key) => [key, { files: {}, output: '', mergeAll: false, useCsnMapping: false, mergeSheetPrefixes: {} }]));
const selectedStationsByModule = Object.fromEntries(Object.keys(MODULES).map((key) => [key, new Set()]));

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
let MES_DEFAULT_HOUR = 15;
const MES_STATE_STORAGE_KEY = 'mesdaily_state_v1';
let mesStateHydrated = false;

const htmlElement = document.documentElement;
const landingView = document.getElementById('landing-view');
const workspaceView = document.getElementById('workspace-view');
const statusFooter = document.getElementById('status-footer');
const landingModuleGrid = document.getElementById('landing-module-grid');
const landingEnter = document.getElementById('landing-enter');
const landingLangEn = document.getElementById('landing-lang-en');
const landingLangCn = document.getElementById('landing-lang-cn');
const landingThemeToggle = document.getElementById('landing-theme-toggle');
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
const themeToggle = document.getElementById('themeToggle');
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
const stationGrid = document.getElementById('station-grid');
const stationCount = document.getElementById('station-count');
const stationPanel = document.getElementById('station-panel');
const btnSelectAll = document.getElementById('btn-select-all');
const btnSelectNone = document.getElementById('btn-select-none');
const btnPresetSmt = document.getElementById('btn-preset-smt');
const btnPresetDip = document.getElementById('btn-preset-dip');
const btnPresetFatp = document.getElementById('btn-preset-fatp');
const toast = document.getElementById('toast');
const toastClose = document.getElementById('toast-close');
const toastTitle = document.getElementById('toast-title');
const toastMsg = document.getElementById('toast-msg');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const consolePanel = document.getElementById('console-panel');
const grrResultPanel = document.getElementById('grr-result-panel');

let allStations = [];
let stationPresets = {};
let quickLogRows = [];
let quickLogSelectedIndex = -1;
let quickLogLastSummary = {};
let quickLogSearchSource = 'local'; // 'local' | 'mesTrace'
let quickLogMesTraceFilter = 'ALL'; // ALL/SMT/DIP/FATP/PASS/FAIL; single active filter
let quickLogResultSearchText = ''; // QL-05: search text within result
let mesR001Rows = [];
let mesR001SelectedIndex = -1;
let mesDailyActiveFeature = 'rtydaily';
let clcaPrecheckByKey = {};
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
let quickLogLocalStationsConfigLoaded = false;

function quickLogNormalizeStationName(value) {
    return String(value || '').trim().replace(/[\t ]+/g, ' ').toUpperCase();
}
function quickLogCompactStationName(value) {
    return quickLogNormalizeStationName(value).replace(/[\s_-]+/g, '');
}
function getQuickLogModelRootName(value) {
    const raw = String(value || '').trim();
    return raw.includes('_') ? raw.split('_')[0] : raw;
}
function getQuickLogLocalStationModelConfig(modelName) {
    const cfg = QUICKLOG_LOCAL_STATIONS_CONFIG || {};
    const models = cfg.models || {};
    const key = getQuickLogModelRootName(modelName || 'VO0301') || 'VO0301';
    let modelCfg = models[key] || models.VO0301 || null;
    if (modelCfg && modelCfg.inheritFrom && models[modelCfg.inheritFrom]) modelCfg = models[modelCfg.inheritFrom];
    return modelCfg || null;
}
function quickLogStationMatches(a, b) {
    return quickLogNormalizeStationName(a) === quickLogNormalizeStationName(b) || quickLogCompactStationName(a) === quickLogCompactStationName(b);
}
function quickLogAliasTargets(value, raw) {
    if (value === null) return null;
    if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
    const single = String(value || raw || '').trim();
    return single ? [single] : [];
}
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
function getQuickLogLocalStationMissingMessage() {
    const message = (QUICKLOG_LOCAL_STATIONS_CONFIG && QUICKLOG_LOCAL_STATIONS_CONFIG.message) || {};
    return currentLang === 'cn' ? (message.cn || '本地文件夹中不存在该日志文件') : (message.en || 'Log file dont exist on local folder');
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
function getQuickLogRowStationForOpen(row) {
    return String(row?.terminal || row?.process || row?.Station || '').trim();
}
function getQuickLogRowModelForOpen(row, fallbackModel) {
    return getQuickLogModelRootName(row?.modelRoot || row?.modelNo || row?._QuickLogModel || fallbackModel || getQuickLogSelectedModelName() || 'VO0301');
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
function setQuickLogOpenLogLoading(isLoading) {
    const btn = document.getElementById('quicklog-result-open-log');
    if (!btn) return;
    btn.disabled = !!isLoading;
    btn.classList.toggle('opacity-70', !!isLoading);
    btn.classList.toggle('cursor-not-allowed', !!isLoading);
    btn.innerHTML = isLoading
        ? `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span id="quicklog-open-log-label">${t('quickLogOpenLog')}</span>`
        : `<i data-lucide="file-search" class="w-3.5 h-3.5"></i><span id="quicklog-open-log-label">${t('quickLogOpenLog')}</span>`;
    _refreshIcons(btn);
}
// QL-06: Set export CSV button loading state with animation
function setQuickLogExportLoading(isLoading) {
    const btn = document.getElementById('quicklog-export-csv');
    if (!btn) return;
    btn.disabled = !!isLoading;
    btn.classList.toggle('opacity-70', !!isLoading);
    btn.classList.toggle('cursor-not-allowed', !!isLoading);
    btn.innerHTML = isLoading
        ? `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>${t('quickLogExportCsv')}</span>`
        : `<i data-lucide="download" class="w-3.5 h-3.5"></i><span>${t('quickLogExportCsv')}</span>`;
    _refreshIcons(btn);
}


const MES_DATEPICKER_LOCALES = {
    en: {
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        today: 'Today',
        clear: 'Clear',
        dateFormat: 'yyyy-MM-dd',
        firstDay: 0
    },
    cn: {
        days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
        daysShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        daysMin: ['日', '一', '二', '三', '四', '五', '六'],
        months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        today: '今天',
        clear: '清除',
        dateFormat: 'yyyy-MM-dd',
        firstDay: 1
    }
};

function pad2(value) {
    return String(value).padStart(2, '0');
}

function formatMesDate(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseMesDate(value) {
    const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, year, month, day] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeMesTime(value, fallbackHour = MES_DEFAULT_HOUR, fallbackMinute = 0) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return { hour: fallbackHour, minute: fallbackMinute };

    const match = trimmed.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
    if (!match) return { hour: fallbackHour, minute: fallbackMinute };

    const hour = Math.max(0, Math.min(23, Number(match[1])));
    const minute = match[2] === undefined ? fallbackMinute : Math.max(0, Math.min(59, Number(match[2])));
    return {
        hour: Number.isFinite(hour) ? hour : fallbackHour,
        minute: Number.isFinite(minute) ? minute : fallbackMinute
    };
}

function formatMesTime(value, fallbackHour = MES_DEFAULT_HOUR, fallbackMinute = 0) {
    const { hour, minute } = normalizeMesTime(value, fallbackHour, fallbackMinute);
    return `${pad2(hour)}:${pad2(minute)}`;
}

function setMesHourValue(input, value, fallbackMinute = 0) {
    if (!input) return;
    input.value = formatMesTime(value, MES_DEFAULT_HOUR, fallbackMinute);
}

function getMesRangeControls() {
    return {
        dateFrom: document.getElementById('mes-datefrom'),
        dateTo: document.getElementById('mes-dateto'),
        hourFrom: document.getElementById('mes-hourfrom'),
        hourTo: document.getElementById('mes-hourto'),
        hiddenFrom: document.getElementById('mes-timefrom'),
        hiddenTo: document.getElementById('mes-timeto')
    };
}

function composeMesDateTime(dateValue, timeValue) {
    const date = parseMesDate(dateValue);
    if (!date) return '';
    const { hour, minute } = normalizeMesTime(timeValue);
    return `${formatMesDate(date)}T${pad2(hour)}:${pad2(minute)}`;
}

function syncMesHiddenRange() {
    const controls = getMesRangeControls();
    if (controls.hiddenFrom) controls.hiddenFrom.value = composeMesDateTime(controls.dateFrom && controls.dateFrom.value, controls.hourFrom && controls.hourFrom.value);
    if (controls.hiddenTo) controls.hiddenTo.value = composeMesDateTime(controls.dateTo && controls.dateTo.value, controls.hourTo && controls.hourTo.value);
    saveMesState();
}

function getDefaultMesTimeRange(anchor = new Date()) {
    const toDate = new Date(anchor);
    toDate.setHours(MES_DEFAULT_HOUR, 0, 0, 0);
    const fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - 1);
    return { fromDate, toDate };
}

function setMesInputDate(input, date) {
    if (!input || !(date instanceof Date) || Number.isNaN(date.getTime())) return;
    const pureDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    input.value = formatMesDate(pureDate);
    if (input._airDatepicker) {
        input._airDatepicker.selectDate(pureDate, { silent: true });
        input._airDatepicker.setViewDate(pureDate);
    }
}

function syncMesTimeRangeFromStart() {
    const controls = getMesRangeControls();
    const fromDate = parseMesDate(controls.dateFrom && controls.dateFrom.value);
    if (!fromDate || Number.isNaN(fromDate.getTime())) return;
    const fromTime = formatMesTime(controls.hourFrom && controls.hourFrom.value);
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 1);
    setMesInputDate(controls.dateTo, toDate);
    setMesHourValue(controls.hourTo, fromTime);
    syncMesHiddenRange();
    updateMesOutputNameFromRange();
}

function buildMesOutputNameFromToDate(toDateValue, currentFileName = '') {
    const toDate = parseMesDate(toDateValue);
    if (!toDate || Number.isNaN(toDate.getTime())) return '';
    const dateTag = `${pad2(toDate.getMonth() + 1)}.${pad2(toDate.getDate())}`;
    const rawName = String(currentFileName || '').trim().replace(/\.[^.\\/]+$/, '');
    const withoutDateSuffix = rawName.replace(/\s+\d{2}\.\d{2}$/i, '').trim();
    const prefix = withoutDateSuffix || getMesOutputPrefix();
    return `${prefix} ${dateTag}.xlsx`;
}

function updateMesOutputNameFromRange() {
    if (activeModule !== 'mesdaily') return;

    const controls = getMesRangeControls();
    const currentPath = String(inputOutput.value || '').trim();
    const sepIdx = Math.max(currentPath.lastIndexOf('\\'), currentPath.lastIndexOf('/'));
    const currentFileName = sepIdx >= 0
        ? currentPath.substring(sepIdx + 1)
        : currentPath;
    const autoName = buildMesOutputNameFromToDate(controls.dateTo && controls.dateTo.value, currentFileName);
    if (!autoName) return;

    const nextPath = sepIdx >= 0
        ? `${currentPath.substring(0, sepIdx + 1)}${autoName}`
        : autoName;

    if (nextPath !== currentPath) {
        inputOutput.value = nextPath;
    }
    saveOutputPathForActiveModule();
}

function getMesStatePayload() {
    const controls = getMesRangeControls();
    const requirements = readMesRequirementRows()
        .filter(({ wo, pdline, fileName }) => wo || pdline || fileName);

    return {
        dateFrom: String(controls.dateFrom?.value || '').trim(),
        dateTo: String(controls.dateTo?.value || '').trim(),
        hourFrom: String(controls.hourFrom?.value || '').trim(),
        hourTo: String(controls.hourTo?.value || '').trim(),
        requirements,
        mergeAll: document.getElementById('mes-merge-all')?.checked || false,
    };
}

function saveMesState() {
    // MES Daily should not persist previous date/time, station, or merge option.
    // Save Output Path is still handled separately by saveOutputPathForActiveModule().
}

function loadMesState() {
    mesStateHydrated = false;
    try { localStorage.removeItem(MES_STATE_STORAGE_KEY); } catch (_) {}

    // Reset MES inputs on every app open: no previous date/time/merge restore.
    resetMesRequirementRows([{}]);
    const mergeEl = document.getElementById('mes-merge-all');
    if (mergeEl) mergeEl.checked = false;
    ensureMesTimeRange(true);
    syncMesHiddenRange();
    applyMesMergeModeUi();

    mesStateHydrated = true;
}

function ensureMesTimeRange(forceReset = false) {
    const controls = getMesRangeControls();
    if (!controls.dateFrom || !controls.dateTo || !controls.hourFrom || !controls.hourTo) return;

    const hasFromDate = Boolean(String(controls.dateFrom.value || '').trim());
    const hasToDate = Boolean(String(controls.dateTo.value || '').trim());
    const hasFromHour = Boolean(String(controls.hourFrom.value || '').trim());
    const hasToHour = Boolean(String(controls.hourTo.value || '').trim());

    const { fromDate, toDate } = getDefaultMesTimeRange();

    if (forceReset || !hasFromDate) setMesInputDate(controls.dateFrom, fromDate);
    if (forceReset || !hasFromHour) setMesHourValue(controls.hourFrom, `${pad2(fromDate.getHours())}:${pad2(fromDate.getMinutes())}`);
    if (forceReset || !hasToDate) setMesInputDate(controls.dateTo, toDate);
    if (forceReset || !hasToHour) setMesHourValue(controls.hourTo, `${pad2(toDate.getHours())}:${pad2(toDate.getMinutes())}`);

    syncMesHiddenRange();
}

function initMesTimePickers() {
    const controls = getMesRangeControls();
    if (!controls.dateFrom || !controls.dateTo) return;

    if (typeof window.AirDatepicker === 'function') {
        const locale = MES_DATEPICKER_LOCALES[currentLang] || MES_DATEPICKER_LOCALES.en;
        const initDatePicker = (input, trigger, onSelect) => {
            if (input._airDatepicker) {
                input._airDatepicker.update({ locale }, { silent: true });
                return;
            }

            const picker = new window.AirDatepicker(input, {
                autoClose: true,
                classes: 'mes-air-datepicker',
                dateFormat: 'yyyy-MM-dd',
                locale,
                position: 'bottom left',
                selectedDates: input.value ? [input.value] : false,
                onSelect: ({ formattedDate }) => {
                    input.value = Array.isArray(formattedDate) ? formattedDate[0] || '' : (formattedDate || '');
                    onSelect();
                }
            });

            input._airDatepicker = picker;
            input.addEventListener('click', () => picker.show());
            input.addEventListener('focus', () => picker.show());
            if (trigger) trigger.addEventListener('click', () => picker.show());
        };

        initDatePicker(controls.dateFrom, document.getElementById('mes-datefrom-trigger'), () => {
            syncMesTimeRangeFromStart();
            updateStatus();
        });

        initDatePicker(controls.dateTo, document.getElementById('mes-dateto-trigger'), () => {
            syncMesHiddenRange();
            updateMesOutputNameFromRange();
            updateStatus();
        });
    }

    ensureMesTimeRange();
}

function getMesRequirementRows() {
    return Array.from(document.querySelectorAll('#mes-requirement-list .mes-requirement-row'));
}

function readMesRequirementRows() {
    return getMesRequirementRows().map((row) => ({
        wo: String(row.querySelector('.mes-requirement-wo')?.value || '').trim(),
        pdline: String(row.querySelector('.mes-requirement-pdline')?.value || '').trim(),
        fileName: String(row.querySelector('.mes-requirement-filename')?.value || '').trim(),
    }));
}

function hasIncompleteMesRequirements(entries = readMesRequirementRows()) {
    return entries.some(({ wo, pdline }) => (wo || pdline) && !wo);
}

function collectMesRequirements() {
    return readMesRequirementRows()
        .filter(({ wo }) => wo)
        .map(({ wo, pdline }) => ({ wo, pdline }));
}

function updateMesRequirementRowText() {
    const rows = getMesRequirementRows();
    rows.forEach((row) => {
        const woInput = row.querySelector('.mes-requirement-wo');
        const pdLineInput = row.querySelector('.mes-requirement-pdline');
        const fileNameInput = row.querySelector('.mes-requirement-filename');
        const removeBtn = row.querySelector('.mes-requirement-remove');

        if (woInput) woInput.placeholder = 'WO';
        if (pdLineInput) pdLineInput.placeholder = 'PDLINE';
        if (fileNameInput && !fileNameInput.value) fileNameInput.placeholder = t('fileNameLabel');

        if (removeBtn) {
            const disableRemove = rows.length === 1;
            removeBtn.title = t('removeRow');
            removeBtn.setAttribute('aria-label', t('removeRow'));
            removeBtn.disabled = disableRemove;
            removeBtn.classList.toggle('opacity-40', disableRemove);
            removeBtn.classList.toggle('cursor-not-allowed', disableRemove);
        }
    });
    updateMesRequirementStaticLabels();
}

function getMesDateTag() {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
}

function addMesRequirementRow(values = {}) {
    const list = document.getElementById('mes-requirement-list');
    if (!list) return null;

    const row = document.createElement('div');
    row.className = 'grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)_40px] gap-2 mes-requirement-row';
    row.innerHTML = [
        '<input type="text" class="mes-requirement-wo w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-textMain dark:text-textDark"  autocomplete="off">',
        '<input type="text" class="mes-requirement-pdline w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-textMain dark:text-textDark" autocomplete="off">',
        '<input type="text" class="mes-requirement-filename w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-textMain dark:text-textDark" autocomplete="off" data-auto="true">',
        '<button type="button" class="mes-requirement-remove inline-flex items-center justify-center rounded-lg border border-borderLight dark:border-borderDark text-textMuted dark:text-gray-500 hover:text-red-500 hover:border-red-300 dark:hover:border-red-500/50 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>'
    ].join('');

    const woInput       = row.querySelector('.mes-requirement-wo');
    const pdLineInput   = row.querySelector('.mes-requirement-pdline');
    const fileNameInput = row.querySelector('.mes-requirement-filename');
    if (woInput)       woInput.value       = values.wo        || '';
    if (pdLineInput)   pdLineInput.value   = values.pdline    || '';
    if (fileNameInput) {
        fileNameInput.value = values.fileName || '';
        fileNameInput.dataset.auto = values.fileName ? 'false' : 'true';
    }

    // Auto-fill fileName from WO
    if (woInput && fileNameInput) {
        woInput.addEventListener('input', () => {
            if (fileNameInput.dataset.auto === 'true') {
                const wo = woInput.value.trim();
                fileNameInput.value = wo ? `${wo}_${getMesDateTag()}` : '';
            }
            updateStatus();
            saveMesState();
        });
    }
    // Mark fileName as manual when user types in it
    if (fileNameInput) {
        fileNameInput.addEventListener('input', () => {
            fileNameInput.dataset.auto = 'false';
            updateStatus();
            saveMesState();
        });
    }
    row.querySelectorAll('input:not(.mes-requirement-wo):not(.mes-requirement-filename)').forEach((input) =>
        input.addEventListener('input', () => { updateStatus(); saveMesState(); })
    );
    row.querySelector('.mes-requirement-remove')?.addEventListener('click', () => {
        if (row.querySelector('.mes-requirement-remove')?.disabled) return;
        row.remove();
        if (!getMesRequirementRows().length) addMesRequirementRow();
        updateMesRequirementRowText();
        updateStatus();
        saveMesState();
    });

    list.appendChild(row);
    _refreshIcons(row);
    updateMesRequirementRowText();
    applyMesMergeModeUi();
    saveMesState();
    return row;
}

function resetMesRequirementRows(values = [{}]) {
    const list = document.getElementById('mes-requirement-list');
    if (!list) return;
    list.innerHTML = '';
    (values.length ? values : [{}]).forEach((value) => addMesRequirementRow(value));
    updateMesRequirementRowText();
}

function initMesRequirements() {
    const addBtn = document.getElementById('mes-requirement-add');
    if (addBtn) addBtn.addEventListener('click', () => { addMesRequirementRow(); });
    if (!getMesRequirementRows().length) addMesRequirementRow();
    updateMesRequirementRowText();
    initMesMergeOption();
}

function parseMesR001WoInput(text) {
    const seen = new Set();
    const list = [];
    String(text || '').split(/[\s,]+/).forEach((item) => {
        const wo = String(item || '').trim();
        if (!wo || seen.has(wo)) return;
        seen.add(wo); list.push(wo);
    });
    return list;
}




function hideMesDatepickers() {
    ['mes-datefrom', 'mes-dateto', 'mes-r001-datefrom', 'mes-r001-dateto'].forEach((id) => {
        const input = document.getElementById(id);
        if (input && input._airDatepicker && typeof input._airDatepicker.hide === 'function') {
            try { input._airDatepicker.hide(); } catch (_) {}
        }
    });
}
// Removed renderMesDailyFeatureToggle as it's now static in HTML
function updateMesDailyFeatureToggleState(root = document) {
    const isDefect = mesDailyActiveFeature === 'defectdaily';
    const paint = (btn, active) => {
        if (!btn) return;
        btn.classList.toggle('bg-white', active);
        btn.classList.toggle('text-primary', active);
        btn.classList.toggle('shadow-sm', active);
        btn.classList.toggle('text-white', !active);
        btn.classList.toggle('hover:bg-white/20', !active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    };
    root.querySelectorAll('[data-mesdaily-feature="rtydaily"]').forEach((btn) => {
        btn.textContent = t('mesDailyTabRtyDaily');
        paint(btn, !isDefect);
    });
    root.querySelectorAll('[data-mesdaily-feature="defectdaily"]').forEach((btn) => {
        btn.textContent = t('mesDailyTabDefectDaily');
        paint(btn, isDefect);
    });
}
function bindMesDailyFeatureToggle(root = document) {
    if (window.__mesDailyFeatureToggleBound) return;
    window.__mesDailyFeatureToggleBound = true;
    root.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const btn = target.closest('[data-mesdaily-feature]');
        if (!btn) return;
        event.preventDefault();
        event.stopPropagation();
        switchMesDailyFeature(btn.getAttribute('data-mesdaily-feature'));
    });
}
// updateMesDailyHeaderTitles removed (header is static now)
function updateMesRequirementStaticLabels() {
    const panel = document.getElementById('mes-panel');
    if (!panel) return;
    panel.querySelectorAll('span, label, div, th').forEach((el) => {
        if (el.id === 'mes-requirement-header-aligned' || el.closest('.mesdaily-feature-toggle')) return;
        const raw = String(el.textContent || '').trim();
        const compact = raw.replace(/\s+/g, '').toUpperCase();
        if (compact === 'PDLINELABEL' || compact === 'PDLINE' || raw === 'PDLine') el.textContent = 'PDLINE';
        if (compact === 'RENAMEDIPLABEL' || compact === 'RENAMEDIP_LABEL' || compact === 'RENAMEDIP') {
            el.classList.add('hidden');
            el.setAttribute('aria-hidden', 'true');
        }
    });
    panel.querySelectorAll('.mes-requirement-pdline').forEach((input) => { input.placeholder = 'PDLINE'; });
    ensureMesRequirementHeaderAlignment();
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
function ensureMesRequirementHeaderAlignment() {
    const list = document.getElementById('mes-requirement-list');
    if (!list || !list.parentNode) return;
    removeDuplicatedMesRequirementHeaders(list);
    let header = document.getElementById('mes-requirement-header-aligned');
    if (!header) {
        header = document.createElement('div');
        header.id = 'mes-requirement-header-aligned';
        header.innerHTML = '<div>WO</div><div>PDLINE</div><div>File name</div><div></div>';
        list.parentNode.insertBefore(header, list);
    }
    header.className = 'hidden md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)_40px] gap-2 mb-2 px-0 text-[11px] font-bold uppercase tracking-wide text-textMuted dark:text-gray-400';
}
function ensureMesDailyFeatureTabs() {
    const mesPanel = document.getElementById('mes-panel');
    if (!mesPanel) return;
    bindMesDailyFeatureToggle(document);
    updateMesRequirementStaticLabels();
    updateMesDailyFeatureToggleState(mesPanel);
    applyMesDailyFeatureVisibility();
}

function switchMesDailyFeature(feature) {
    hideMesDatepickers();
    mesDailyActiveFeature = feature === 'defectdaily' ? 'defectdaily' : 'rtydaily';
    ensureMesDailyFeatureTabs();
    if (mesDailyActiveFeature === 'defectdaily') ensureMesR001Panel();
    applyMesDailyFeatureVisibility();
    updateMesDailyFeatureToggleState(document.getElementById('mes-panel') || document);
    updateStatus();
}
function isMesDailyDefectDailyActive() {
    return activeModule === 'mesdaily' && mesDailyActiveFeature === 'defectdaily';
}
function applyMesDailyFeatureVisibility() {
    const isMesDaily = activeModule === 'mesdaily';
    const isDefectDaily = mesDailyActiveFeature === 'defectdaily';
    const rtySection = document.getElementById('mes-rty-daily-section');
    const defectSection = document.getElementById('mes-defect-daily-section');
    const resultPanel = document.getElementById('mes-r001-result-panel');
    
    if (rtySection) rtySection.classList.toggle('hidden', isDefectDaily);
    if (defectSection) defectSection.classList.toggle('hidden', !isDefectDaily);
    if (resultPanel) resultPanel.classList.toggle('hidden', !isMesDaily || !isDefectDaily);
    
    if (isMesDaily && stationPanel) stationPanel.classList.toggle('hidden', isDefectDaily);
    if (isMesDaily) setQuickLogReportControlsVisibility();
}
function getMesR001RangeControls() {
    return {
        dateFrom: document.getElementById('mes-r001-datefrom'),
        dateTo: document.getElementById('mes-r001-dateto'),
        hourFrom: document.getElementById('mes-r001-hourfrom'),
        hourTo: document.getElementById('mes-r001-hourto'),
        triggerFrom: document.getElementById('mes-r001-datefrom-trigger'),
        triggerTo: document.getElementById('mes-r001-dateto-trigger'),
    };
}
function syncMesR001HiddenRange() {
    const r001 = getMesR001RangeControls();
    const hiddenFrom = document.getElementById('mes-r001-timefrom');
    const hiddenTo = document.getElementById('mes-r001-timeto');
    if (hiddenFrom) hiddenFrom.value = composeMesDateTime(r001.dateFrom?.value, r001.hourFrom?.value);
    if (hiddenTo) hiddenTo.value = composeMesDateTime(r001.dateTo?.value, r001.hourTo?.value);
}
function ensureMesR001TimeRange(forceReset = false) {
    const controls = getMesR001RangeControls();
    if (!controls.dateFrom || !controls.dateTo || !controls.hourFrom || !controls.hourTo) return;
    const { fromDate, toDate } = getDefaultMesTimeRange();
    if (forceReset || !String(controls.dateFrom.value || '').trim()) setMesInputDate(controls.dateFrom, fromDate);
    if (forceReset || !String(controls.hourFrom.value || '').trim()) setMesHourValue(controls.hourFrom, `${pad2(fromDate.getHours())}:${pad2(fromDate.getMinutes())}`);
    if (forceReset || !String(controls.dateTo.value || '').trim()) setMesInputDate(controls.dateTo, toDate);
    if (forceReset || !String(controls.hourTo.value || '').trim()) setMesHourValue(controls.hourTo, `${pad2(toDate.getHours())}:${pad2(toDate.getMinutes())}`);
    syncMesR001HiddenRange();
}
function syncMesR001TimeRangeFromStart() {
    const controls = getMesR001RangeControls();
    const fromDate = parseMesDate(controls.dateFrom && controls.dateFrom.value);
    if (!fromDate || Number.isNaN(fromDate.getTime())) return;
    const fromTime = formatMesTime(controls.hourFrom && controls.hourFrom.value);
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 1);
    setMesInputDate(controls.dateTo, toDate);
    setMesHourValue(controls.hourTo, fromTime);
    syncMesR001HiddenRange();
}
function initMesR001TimePickers() {
    const controls = getMesR001RangeControls();
    if (!controls.dateFrom || !controls.dateTo) return;
    const onManualInput = () => { syncMesR001HiddenRange(); updateStatus(); };
    [controls.hourFrom, controls.hourTo].forEach((input) => {
        if (input && input.dataset.bound !== 'true') {
            input.dataset.bound = 'true';
            input.addEventListener('input', onManualInput);
            input.addEventListener('blur', () => { input.value = formatMesTime(input.value); syncMesR001HiddenRange(); });
        }
    });
    if (typeof window.AirDatepicker === 'function') {
        const locale = MES_DATEPICKER_LOCALES[currentLang] || MES_DATEPICKER_LOCALES.en;
        const initDatePicker = (input, trigger, onSelect) => {
            if (input._airDatepicker) {
                input._airDatepicker.update({ locale }, { silent: true });
                return;
            }
            const picker = new window.AirDatepicker(input, {
                autoClose: true,
                classes: 'mes-air-datepicker',
                dateFormat: 'yyyy-MM-dd',
                locale,
                position: 'bottom left',
                selectedDates: input.value ? [input.value] : false,
                onSelect: ({ formattedDate }) => {
                    input.value = Array.isArray(formattedDate) ? formattedDate[0] || '' : (formattedDate || '');
                    onSelect();
                }
            });
            input._airDatepicker = picker;
            input.addEventListener('click', () => picker.show());
            input.addEventListener('focus', () => picker.show());
            if (trigger && trigger.dataset.bound !== 'true') {
                trigger.dataset.bound = 'true';
                trigger.addEventListener('click', () => picker.show());
            }
        };
        initDatePicker(controls.dateFrom, controls.triggerFrom, () => { syncMesR001TimeRangeFromStart(); updateStatus(); });
        initDatePicker(controls.dateTo, controls.triggerTo, () => { syncMesR001HiddenRange(); updateStatus(); });
    }
    ensureMesR001TimeRange();
}
function getMesR001Columns() { return ['SN', 'Model', 'Station', 'Result', 'ErrorCode', 'Reason', 'WO', 'PartNo', 'Time']; }
function getMesR001Cell(row, key) {
    const map = { SN: row?.SerialNumber || '', Model: row?.ModelName || '', Station: row?.Terminal || '', Result: 'FAIL', ErrorCode: row?.DefectCode || '', Reason: row?.DefectDesc || '', WO: row?.WorkOrder || '', PartNo: row?.PartNo || '', Time: row?.defectTime || '' };
    return map[key] || '';
}
function getMesR001DisplayRows(rows = mesR001Rows) { return (Array.isArray(rows) ? rows : []).map((row, index) => ({ ...row, _MesR001Index: index })); }
function getMesR001InputCount() { return parseMesR001WoInput(document.getElementById('mes-r001-wo-input')?.value || '').length; }
function updateMesR001Summary(rows = mesR001Rows) {
    const summary = document.getElementById('mes-r001-summary');
    if (!summary) return;
    const inputCount = getMesR001InputCount();
    const foundSn = new Set((Array.isArray(rows) ? rows : []).map((row) => String(row?.SerialNumber || '').trim()).filter(Boolean)).size;
    const rowCount = Array.isArray(rows) ? rows.length : 0;
    summary.textContent = `Input: ${inputCount} | Found: ${foundSn} | Rows: ${rowCount}`;
}
function updateMesR001SelectedRowLabel() {
    const label = document.getElementById('mes-r001-selected-row-info');
    if (!label) return;
    if (mesR001SelectedIndex < 0 || !mesR001Rows[mesR001SelectedIndex]) { label.textContent = t('mesR001SelectedRowLabel'); return; }
    const row = mesR001Rows[mesR001SelectedIndex];
    label.textContent = t('mesR001SelectedRowFormat').replace('{sn}', getMesR001Cell(row, 'SN')).replace('{station}', getMesR001Cell(row, 'Station')).replace('{result}', getMesR001Cell(row, 'Result'));
}
function setMesR001SearchLoading(isLoading) {
    const btn = document.getElementById('mes-r001-search');
    if (!btn) return;
    btn.disabled = !!isLoading;
    btn.classList.toggle('opacity-70', !!isLoading);
    btn.classList.toggle('cursor-not-allowed', !!isLoading);
    btn.innerHTML = isLoading ? `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>${t('mesR001Search')}</span>` : `<i data-lucide="search" class="w-5 h-5"></i><span data-i18n="mesR001Search">${t('mesR001Search')}</span>`;
    _refreshIcons(btn);
}
function setMesR001ExportLoading(isLoading) {
    const btn = document.getElementById('mes-r001-export-csv');
    if (!btn) return;
    btn.disabled = !!isLoading;
    btn.classList.toggle('opacity-70', !!isLoading);
    btn.classList.toggle('cursor-not-allowed', !!isLoading);
    btn.innerHTML = isLoading ? `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>${t('mesR001ExportCsv')}</span>` : `<i data-lucide="download" class="w-3.5 h-3.5"></i><span data-i18n="mesR001ExportCsv">${t('mesR001ExportCsv')}</span>`;
    _refreshIcons(btn);
}
function ensureMesR001Panel() {
    const defectSection = document.getElementById('mes-defect-daily-section');
    if (!defectSection) return;
    
    bindMesDailyFeatureToggle(document);
    updateMesDailyFeatureToggleState(defectSection);
    const input = document.getElementById('mes-r001-wo-input');
    if (input) input.placeholder = 'Paste WO list here...';
    const resultTitle = document.getElementById('mes-r001-result-title');
    if (resultTitle) resultTitle.textContent = t('mesR001ResultTitle');
    
    if (defectSection && defectSection.dataset.bound !== 'true') {
        defectSection.dataset.bound = 'true';
        document.getElementById('mes-r001-search')?.addEventListener('click', searchMesR001);
        document.getElementById('mes-r001-clear')?.addEventListener('click', () => clearMesR001Panel(true));
        document.getElementById('mes-r001-open-log')?.addEventListener('click', openMesR001SelectedLogUiOnly);
        document.getElementById('mes-r001-export-csv')?.addEventListener('click', exportMesR001CsvUiOnly);
        document.getElementById('mes-r001-wo-input')?.addEventListener('input', () => updateMesR001Summary(mesR001Rows));
    }
    initMesR001TimePickers();
    ensureMesR001TimeRange();
    renderMesR001Rows(mesR001Rows);
    applyMesDailyFeatureVisibility();
    _refreshIcons(defectSection);
}
function renderMesR001Rows(rows = mesR001Rows) {
    const head = document.getElementById('mes-r001-head');
    const body = document.getElementById('mes-r001-body');
    if (!head || !body) return;
    const columns = getMesR001Columns();
    head.innerHTML = `<tr>${columns.map((col) => `<th class="border-b border-borderLight dark:border-borderDark text-xs leading-tight whitespace-nowrap" style="min-width:120px;padding:8px 10px;white-space:nowrap;">${quickLogEscape(getQuickLogColumnDisplayName(col))}</th>`).join('')}</tr>`;
    const displayRows = getMesR001DisplayRows(rows);
    if (!displayRows.length) {
        body.innerHTML = `<tr><td colspan="${columns.length}" class="border-b border-borderLight dark:border-borderDark text-xs text-textMuted dark:text-gray-400" style="padding:10px;">${quickLogEscape(t('mesR001NoRows'))}</td></tr>`;
        mesR001SelectedIndex = -1;
        updateMesR001Summary([]);
        updateMesR001SelectedRowLabel();
        return;
    }
    body.innerHTML = '';
    displayRows.forEach((row) => {
        const tr = document.createElement('tr');
        tr.className = 'quicklog-result-row cursor-pointer transition-colors';
        tr.innerHTML = columns.map((col) => { const value = getMesR001Cell(row, col); const safe = quickLogEscape(value); const resultClass = col === 'Result' ? 'text-red-600 dark:text-red-400 font-bold' : ''; return `<td class="border-b border-borderLight dark:border-borderDark text-xs leading-tight whitespace-nowrap ${resultClass}" style="min-width:120px;padding:7px 10px;white-space:nowrap;" title="${safe}">${safe}</td>`; }).join('');
        tr.addEventListener('click', () => { mesR001SelectedIndex = Number.isInteger(row._MesR001Index) ? row._MesR001Index : -1; body.querySelectorAll('tr').forEach((item) => item.classList.remove('quicklog-row-selected')); tr.classList.add('quicklog-row-selected'); updateMesR001SelectedRowLabel(); });
        body.appendChild(tr);
    });
    updateMesR001Summary(rows);
    updateMesR001SelectedRowLabel();
}
function clearMesR001Panel(clearInput = false) {
    mesR001Rows = [];
    mesR001SelectedIndex = -1;
    if (clearInput) { const input = document.getElementById('mes-r001-wo-input'); if (input) input.value = ''; }
    renderMesR001Rows([]);
    updateMesR001Summary([]);
    updateMesR001SelectedRowLabel();
}
async function searchMesR001() {
    ensureMesR001Panel();
    ensureMesR001TimeRange();
    syncMesR001HiddenRange();
    const input = document.getElementById('mes-r001-wo-input');
    const woText = String(input?.value || '').trim();
    const inputCount = parseMesR001WoInput(woText).length;
    if (!inputCount) { const summary = document.getElementById('mes-r001-summary'); if (summary) summary.textContent = t('mesR001NeedWo'); logToConsole(t('mesR001NeedWo'), 'warning'); showImportantToast('warning', t('reqFailed'), t('mesR001NeedWo')); return; }
    try {
        setMesR001SearchLoading(true); setStatus('generating', 'Searching...'); showProgress(); mesR001Rows = []; mesR001SelectedIndex = -1; renderMesR001Rows([]);
        const response = await fetchRetry('/api/mesdaily/r001-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ woText, timefrom: document.getElementById('mes-r001-timefrom')?.value || '', timeto: document.getElementById('mes-r001-timeto')?.value || '' }) }, MAX_RETRIES);
        const data = await response.json();
        if (!response.ok || !data.success) throw createBackendError(data, 'Defect Daily search failed');
        mesR001Rows = Array.isArray(data.rows) ? data.rows : [];
        renderMesR001Rows(mesR001Rows); completeProgress(); setStatus('success', t('statusSuccess')); logToConsole(`Defect Daily search done. Rows: <b>${mesR001Rows.length}</b>`, 'success');
    } catch (error) {
        resetProgress();
        let message = error.message || String(error);
        if (message.includes('ERR_MES_API_UNREACHABLE')) {
            const tMsg = t('mesApiUnreachable');
            message = tMsg !== 'mesApiUnreachable' ? tMsg : 'Cannot connect to MES server. Please check the MES URL.';
        }
        mesR001Rows = []; mesR001SelectedIndex = -1; renderMesR001Rows([]);
        setStatus('error', t('reqFailed'));
        logToConsole(`Defect Daily search failed: ${message}`, 'error');
        showImportantToast('error', t('reqFailed'), message);
    } finally { setMesR001SearchLoading(false); resetProgress(); }
}
async function openMesR001SelectedLogUiOnly() {
    if (mesR001SelectedIndex < 0 || !mesR001Rows[mesR001SelectedIndex]) {
        logToConsole(t('quickLogNoRowSelected'), 'warning');
        return;
    }
    const row = mesR001Rows[mesR001SelectedIndex];
    try {
        setQuickLogOpenLogLoading(true);
        logToConsole('Opening Defect Daily log file...', 'system');
        const response = await fetchRetry('/api/quicklog/mes-trace/open-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ row }),
        }, 1);
        const data = await response.json();
        if (!response.ok || !data.success) {
            const message = getQuickLogOpenLogNotFoundMessage(true, data);
            throw createBackendError(data, message);
        }
        logToConsole(`Opened log: <b>${data.path}</b>`, 'success');
        showLogContentModal(data.path || 'Unknown', data.content);
    } catch (err) {
        logToConsole(`Open log failed: ${err.message || err}`, 'error');
        showImportantToast('error', t('reqFailed'), err.message || String(err));
    } finally {
        setQuickLogOpenLogLoading(false);
    }
}
function exportMesR001CsvUiOnly() { setMesR001ExportLoading(true); setTimeout(() => { logToConsole('Defect Daily Export CSV UI added. Backend will be implemented later.', 'warning'); setMesR001ExportLoading(false); }, 150); }
function getMesExportDate() {
    const controls = getMesRangeControls();
    const dateTo = controls.dateTo && controls.dateTo.value;
    if (dateTo && /^\d{4}-\d{2}-\d{2}/.test(dateTo)) {
        return dateTo.substring(0, 10).replace(/-/g, '.');
    }
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
}

function getMesSimpleGroupedPayload(stationList) {
    const outputBase = String(inputOutput?.value || '').trim();
    const mergeAll = document.getElementById('mes-merge-all')?.checked;
    const dateTag = getMesDateTag();

    const rows = readMesRequirementRows().filter((r) => r.wo);
    if (mergeAll) {
        return {
            mode: 'grouped',
            groups: [{
                label: 'Merged',
                requirements: rows.map((r) => ({ workOrder: r.wo, pdLine: r.pdline })),
                output_path: outputBase,
            }],
            selected_stations: stationList,
            timefrom: document.getElementById('mes-timefrom').value,
            timeto: document.getElementById('mes-timeto').value,
        };
    }

    const lastSep = Math.max(outputBase.lastIndexOf('\\'), outputBase.lastIndexOf('/'));
    const folder = lastSep > 0 ? outputBase.substring(0, lastSep) : outputBase;
    const sep = folder ? (folder.endsWith('\\') || folder.endsWith('/') ? '' : '\\') : '';
    const base = folder ? `${folder}${sep}` : '';
    const groups = rows.map((r) => {
        let fname = (r.fileName || '').trim();
        if (!fname) fname = `${r.wo}_${dateTag}`;
        if (!fname.toLowerCase().endsWith('.xlsx')) fname += '.xlsx';
        return {
            label: r.wo,
            requirements: [{ workOrder: r.wo, pdLine: r.pdline }],
            output_path: `${base}${fname}`,
        };
    });

    const payload = {
        mode: 'grouped',
        groups,
        selected_stations: stationList,
        timefrom: document.getElementById('mes-timefrom').value,
        timeto:   document.getElementById('mes-timeto').value,
    };
    return payload;
}

function applyMesMergeModeUi() {
    const mergeCheck = document.getElementById('mes-merge-all');
    const mergeEnabled = !!mergeCheck?.checked;
    const lockOutput = activeModule === 'mesdaily' && !mergeEnabled;

    if (inputOutput) {
        inputOutput.disabled = lockOutput;
        inputOutput.classList.toggle('opacity-60', lockOutput);
        inputOutput.classList.toggle('cursor-not-allowed', lockOutput);
    }
    if (btnBrowseOutput) {
        btnBrowseOutput.disabled = lockOutput;
        btnBrowseOutput.classList.toggle('opacity-60', lockOutput);
        btnBrowseOutput.classList.toggle('cursor-not-allowed', lockOutput);
    }

    getMesRequirementRows().forEach((row) => {
        const fileNameInput = row.querySelector('.mes-requirement-filename');
        if (!fileNameInput) return;
        fileNameInput.disabled = mergeEnabled;
        fileNameInput.classList.toggle('opacity-60', mergeEnabled);
        fileNameInput.classList.toggle('cursor-not-allowed', mergeEnabled);
    });
}

function initMesMergeOption() {
    const mergeCheck = document.getElementById('mes-merge-all');
    if (mergeCheck) mergeCheck.addEventListener('change', () => {
        applyMesMergeModeUi();
        saveMesState();
    });
    applyMesMergeModeUi();
    setQuickLogReportControlsVisibility();
}

function t(key) {
    return (LANG[currentLang] && LANG[currentLang][key]) || LANG.en[key] || key;
}

function moduleLabel(moduleId) {
    const m = MODULES[moduleId];
    return m ? m.title[currentLang] : moduleId;
}

function getOutputExtension(moduleId = activeModule) {
    const module = MODULES[moduleId];
    const match = module && module.defaultOutputName && String(module.defaultOutputName).match(/(\.[a-z0-9]+)$/i);
    return (match ? match[1] : '.xlsx').toLowerCase();
}

function withOutputExtension(fileName, extension) {
    const name = String(fileName || '').trim();
    if (!name) return '';
    if (name.toLowerCase().endsWith(extension)) return name;
    return name.replace(/\.[^.\\/]+$/, '') + extension;
}

function updateModuleUiVisibility() {
    const module = MODULES[activeModule];
    if (stationPanel) {
        stationPanel.classList.toggle('hidden', !module.needsStations || isMesDailyDefectDailyActive());
        const titleEl = stationPanel.querySelector('h2');
        if (titleEl) {
            titleEl.textContent = activeModule === 'mesdaily' ? t('station') : t('stations');
        }
    }
    const outputPlaceholderKey = getOutputExtension() === '.csv' ? 'outputPlaceholderCsv' : 'outputPlaceholder';
    inputOutput.placeholder = t(outputPlaceholderKey);

    const mesPanel = document.getElementById('mes-panel');
    const resultPanel = document.getElementById('mes-r001-result-panel');
    if (mesPanel) mesPanel.classList.toggle('hidden', activeModule !== 'mesdaily');
    if (resultPanel) resultPanel.classList.toggle('hidden', activeModule !== 'mesdaily' || mesDailyActiveFeature !== 'defectdaily');
    if (fileCards) fileCards.classList.toggle('hidden', activeModule === 'mesdaily');
    if (activeModule === 'mesdaily') { ensureMesTimeRange(); ensureMesDailyFeatureTabs(); ensureMesR001Panel(); initMesR001TimePickers(); }
    applyMesMergeModeUi();
    setQuickLogReportControlsVisibility();
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkServer() {
    try {
        const c = new AbortController();
        const timeout = setTimeout(() => c.abort(), 1500);
        const res = await fetch('/api/health', { method: 'GET', cache: 'no-store', signal: c.signal });
        clearTimeout(timeout);
        serverOnline = res.ok;
        return res.ok;
    } catch (_) {
        serverOnline = false;
        return false;
    }
}

async function fetchRetry(url, options = {}, retries = MAX_RETRIES) {
    let lastErr = null;
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetch(url, options);
            serverOnline = true;
            return res;
        } catch (err) {
            lastErr = err;
            logToConsole(`Connection attempt ${i + 1}/${retries + 1} failed: ${err.message}`, 'warning');
            if (i < retries) {
                await sleep(RETRY_DELAY);
                const alive = await checkServer();
                if (!alive) logToConsole('Server not responding, retrying...', 'warning');
            }
        }
    }
    serverOnline = false;
    throw lastErr || new Error('Server not reachable');
}

function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
        htmlElement.classList.remove('light');
    } else {
        htmlElement.classList.remove('dark');
        htmlElement.classList.add('light');
    }
}

function getActiveState() {
    return stateByModule[activeModule];
}

function getSelectedStations() {
    return selectedStationsByModule[activeModule];
}

function resetNonPersistentModuleState(moduleId) {
    if (!stateByModule[moduleId]) return;
    if (moduleId === 'clca') {
        stateByModule.clca.mergeAll = false;
        stateByModule.clca.useCsnMapping = false;
        selectedStationsByModule.clca = new Set();
    }
    if (moduleId === 'mesdaily') {
        mesDailyActiveFeature = 'rtydaily';
        selectedStationsByModule.mesdaily = new Set();
        const mergeEl = document.getElementById('mes-merge-all');
        if (mergeEl) mergeEl.checked = false;
        ensureMesTimeRange(true);
        syncMesHiddenRange();
        applyMesMergeModeUi();
    }
}

function getBrowseLoadingHtml() {
    return `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>${t('browse')}</span>`;
}

function getBrowseDefaultHtml() {
    return `<i data-lucide="folder-search" class="w-4 h-4"></i><span data-i18n="browse">${t('browse')}</span>`;
}

function getGenerateLoadingHtml() {
    return `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>${t('generating')}</span>`;
}

function getGenerateDefaultHtml() {
    return `<i data-lucide="zap" class="w-5 h-5"></i><span data-i18n="generate">${t('generate')}</span>`;
}

function renderLandingModules() {
    const fragment = document.createDocumentFragment();
    getEnabledModules().forEach((mod) => {
        const card = document.createElement('button');
        card.type = 'button';
        const accentClass = mod.cardAccent === 'yield' ? 'landing-card-yield' : 'landing-card-primary';
        card.className = `${mod.cardClass || ''} module-choice-card group relative cursor-pointer transform transition-all duration-500 ${accentClass} ${selectedLandingModule === mod.id ? 'active' : ''}`;
        card.innerHTML = `
            <div class="glass-panel bg-white/70 dark:bg-card-dark h-full rounded-xl p-6 card-inner-glow relative overflow-hidden transition-all duration-500">
                <div class="scanline-layer animate-scanline"></div>
                <div class="flex flex-col h-full justify-between relative z-10 text-left">
                    <div>
                        <div class="landing-module-icon w-10 h-10 rounded-lg flex items-center justify-center mb-6 transition-transform duration-300">
                            <span class="material-symbols-outlined text-2xl">${mod.cardIcon || 'bolt'}</span>
                        </div>
                        <h3 class="landing-module-label text-xl font-semibold mb-3 transition-colors font-display">${(mod.menuTitle && mod.menuTitle[currentLang]) || mod.title[currentLang]}</h3>
                        <p class="text-textMuted dark:text-slate-400 text-sm leading-relaxed font-light">${mod.summary[currentLang]}</p>
                    </div>
                    <div class="mt-8 flex items-center text-xs font-semibold tracking-wider opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 uppercase">
                        ${t('accessModule')} <span class="material-symbols-outlined text-sm ml-2">arrow_forward</span>
                    </div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => {
            selectedLandingModule = mod.id;
            enterWorkspace();
        });
        fragment.appendChild(card);
    });

    const comingSoon = document.createElement('div');
    comingSoon.className = 'coming-soon-card group relative cursor-not-allowed transition-all duration-500';
    comingSoon.innerHTML = `
        <div class="h-full rounded-xl p-6 border border-dashed border-borderLight dark:border-borderDark/80 bg-white/20 dark:bg-white/0 flex flex-col items-center justify-center text-center transition-all animate-pulse-border">
            <div class="coming-soon-plus w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 border border-borderLight dark:border-borderDark/50">
                <span class="material-symbols-outlined text-xl text-textMuted dark:text-slate-500">add</span>
            </div>
            <h3 class="text-lg font-medium text-textMuted dark:text-slate-500 mb-1 font-display">${t('comingSoon')}</h3>
            <p class="text-textMuted/70 dark:text-slate-600 text-xs tracking-wide">${t('comingSoonSub')}</p>
        </div>
    `;
    fragment.appendChild(comingSoon);

    landingModuleGrid.innerHTML = '';
    landingModuleGrid.appendChild(fragment);
    _refreshIcons();
}

function renderSidebar() {
    const fragment = document.createDocumentFragment();
    getEnabledModules().forEach((mod) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `sidebar-module-btn ${mod.id === activeModule ? 'active' : ''}`;
        button.innerHTML = `<span class="sidebar-module-text text-sm font-semibold leading-tight font-display">${mod.title[currentLang]}</span>`;
        button.addEventListener('click', () => switchModule(mod.id));
        fragment.appendChild(button);
    });
    sidebar.innerHTML = '';
    sidebar.appendChild(fragment);
}

function getFieldDisplayName(fieldKey) {
    const module = MODULES[activeModule];
    const field = module.fields.find((f) => f.key === fieldKey);
    if (!field) return fieldKey;
    return field.label[currentLang];
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function hideGrrResult() {
    if (!grrResultPanel) return;
    grrResultPanel.classList.add('hidden');
    grrResultPanel.innerHTML = '';
}

function renderGrrResult(stats) {
    if (!grrResultPanel) return;
    const s = stats || {};
    const inputRows  = s.inputRows  != null ? Number(s.inputRows).toLocaleString()  : '—';
    const outputRows = s.outputRows != null ? Number(s.outputRows).toLocaleString() : '—';
    const removedDup  = s.removedDup  != null ? Number(s.removedDup).toLocaleString()  : '—';
    const removedFail = s.removedFail != null ? Number(s.removedFail).toLocaleString() : '—';

    grrResultPanel.innerHTML = `
        <div class="section-header-gradient !py-2.5 !px-4">
            <div class="p-1 rounded-md bg-white/20">
                <i data-lucide="bar-chart-2" class="w-4 h-4"></i>
            </div>
            <span class="text-sm font-semibold">GRR Prep — Result Summary</span>
        </div>
        <div class="p-5 flex flex-col gap-0">
            <div class="grr-stat-row">
                <span class="grr-stat-label"><i data-lucide="file-input" class="w-4 h-4 shrink-0"></i> Input rows (total SNs)</span>
                <span class="grr-stat-value">${inputRows}</span>
            </div>
            <div class="grr-stat-row">
                <span class="grr-stat-label"><i data-lucide="copy-x" class="w-4 h-4 shrink-0"></i> Removed — duplicate</span>
                <span class="grr-stat-value removed">${removedDup !== '—' ? '−' + removedDup : '—'}</span>
            </div>
            <div class="grr-stat-row">
                <span class="grr-stat-label"><i data-lucide="x-circle" class="w-4 h-4 shrink-0"></i> Removed — FAIL result</span>
                <span class="grr-stat-value removed">${removedFail !== '—' ? '−' + removedFail : '—'}</span>
            </div>
            <div class="grr-stat-row">
                <span class="grr-stat-label"><i data-lucide="check-circle-2" class="w-4 h-4 shrink-0"></i> Output rows (kept)</span>
                <span class="grr-stat-value success-val">${outputRows}</span>
            </div>
        </div>
    `;
    grrResultPanel.classList.remove('hidden');
    _refreshIcons(grrResultPanel);
}



function createBackendError(data = {}, fallbackMessage = 'Request failed') {
    const message = String(data && (data.error || data.message) || fallbackMessage || 'Request failed');
    const err = new Error(message);
    if (data && typeof data === 'object') {
        err.data = data;
        if (data.code) err.code = data.code;
    }
    return err;
}

function extractBackendError(data = {}, fallbackMessage = 'Request failed') {
    let msg = fallbackMessage || 'Request failed';
    if (data && typeof data === 'object') {
        const direct = data.error || data.message || data.detail || data.reason;
        if (direct) msg = String(direct);
        else if (data.result && typeof data.result === 'object') {
            const nested = data.result.error || data.result.message || data.result.detail;
            if (nested) msg = String(nested);
        }
        else if (data.mergedResult && typeof data.mergedResult === 'object') {
            const merged = data.mergedResult.error || data.mergedResult.message || data.mergedResult.detail;
            if (merged) msg = String(merged);
        }
        else if (Array.isArray(data.errors) && data.errors.length) {
            msg = data.errors.map((item) => {
                if (!item) return '';
                if (typeof item === 'string') return item;
                return item.error || item.message || JSON.stringify(item);
            }).filter(Boolean).join('\n') || msg;
        }
    }
    if (msg.includes('ERR_MES_API_UNREACHABLE')) return t('mesApiUnreachable') || 'Không thể kết nối tới máy chủ MES... Vui lòng kiểm tra lại đường dẫn MES...';
    return msg;
}

function extractBackendTrace(data = {}) {
    if (!data || typeof data !== 'object') return '';
    return String(
        data.traceback ||
        data.trace ||
        data.stack ||
        data.stderr ||
        data.backendTrace ||
        data.details?.traceback ||
        data.details?.trace ||
        data.result?.traceback ||
        data.result?.trace ||
        data.mergedResult?.traceback ||
        data.mergedResult?.trace ||
        ''
    );
}

function quickLogEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getQuickLogModel(modelName) {
    return QUICKLOG_MODELS.find((model) => model.name === modelName) || QUICKLOG_MODELS[0];
}

function getQuickLogSelectedModelName() {
    return document.getElementById('quicklog-model')?.value || QUICKLOG_DEFAULT_MODEL;
}

function getQuickLogSelectedModel() {
    return getQuickLogModel(getQuickLogSelectedModelName());
}

function formatQuickLogModelValue(modelName) {
    const model = getQuickLogModel(modelName);
    return `${model.name} (${model.resolvedPath || model.path || ''})`;
}

function renderQuickLogModelMenuOptions(selectedModel = QUICKLOG_DEFAULT_MODEL) {
    return QUICKLOG_MODELS.map((model) => {
        const selected = model.name === selectedModel;
        return `<button type="button" class="quicklog-combo-option ${selected ? 'active' : ''}" data-model="${quickLogEscape(model.name)}">${quickLogEscape(model.name)}</button>`;
    }).join('');
}

function renderQuickLogModelDropdown(selectedModel = QUICKLOG_DEFAULT_MODEL) {
    const safeModel = QUICKLOG_MODELS.some((model) => model.name === selectedModel)
        ? selectedModel
        : ((QUICKLOG_MODELS[0] && QUICKLOG_MODELS[0].name) || QUICKLOG_DEFAULT_MODEL);
    return `
        <div id="quicklog-model-combo" class="quicklog-combo" data-open="false">
            <input type="hidden" id="quicklog-model" value="${quickLogEscape(safeModel)}">
            <button id="quicklog-model-button" type="button" class="quicklog-combo-button" aria-haspopup="listbox" aria-expanded="false">
                <span id="quicklog-model-selected" class="truncate">${quickLogEscape(formatQuickLogModelValue(safeModel))}</span>
                <i data-lucide="chevron-down" class="w-4 h-4 shrink-0 quicklog-combo-chevron"></i>
            </button>
            <div id="quicklog-model-menu" class="quicklog-combo-menu quicklog-model-combo-menu hidden" role="listbox">
                ${renderQuickLogModelMenuOptions(safeModel)}
            </div>
        </div>
    `;
}

function closeQuickLogModelDropdown() {
    const combo = document.getElementById('quicklog-model-combo');
    const btn = document.getElementById('quicklog-model-button');
    const menu = document.getElementById('quicklog-model-menu');
    if (!combo || !btn || !menu) return;
    combo.dataset.open = 'false';
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.add('hidden');
}

function setQuickLogModelValue(modelName) {
    const safeModel = QUICKLOG_MODELS.some((model) => model.name === modelName)
        ? modelName
        : ((QUICKLOG_MODELS[0] && QUICKLOG_MODELS[0].name) || QUICKLOG_DEFAULT_MODEL);
    const input = document.getElementById('quicklog-model');
    const label = document.getElementById('quicklog-model-selected');
    const menu = document.getElementById('quicklog-model-menu');
    if (input) input.value = safeModel;
    if (label) label.textContent = formatQuickLogModelValue(safeModel);
    if (menu) {
        menu.querySelectorAll('.quicklog-combo-option').forEach((item) => {
            item.classList.toggle('active', item.dataset.model === safeModel);
        });
    }
}

function refreshQuickLogModelDropdown(selectedModel = QUICKLOG_DEFAULT_MODEL) {
    const combo = document.getElementById('quicklog-model-combo');
    if (!combo) return;
    combo.outerHTML = renderQuickLogModelDropdown(selectedModel);
    bindQuickLogModelDropdown();
    _refreshIcons(document.getElementById('quicklog-model-combo'));
}

function bindQuickLogModelDropdown() {
    const combo = document.getElementById('quicklog-model-combo');
    const btn = document.getElementById('quicklog-model-button');
    const menu = document.getElementById('quicklog-model-menu');
    if (!combo || !btn || !menu || combo.dataset.bound === 'true') return;
    combo.dataset.bound = 'true';
    btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = combo.dataset.open === 'true';
        combo.dataset.open = open ? 'false' : 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        menu.classList.toggle('hidden', open);
    });
    menu.addEventListener('click', async (event) => {
        const option = event.target.closest('.quicklog-combo-option');
        if (!option) return;
        setQuickLogModelValue(option.dataset.model || QUICKLOG_DEFAULT_MODEL);
        closeQuickLogModelDropdown();
        quickLogRows = [];
        quickLogSelectedIndex = -1;
        renderQuickLogRows([]);
        await loadQuickLogModes(true);
    });
    if (!window.__quickLogModelDropdownDocBound) {
        document.addEventListener('click', (event) => {
            const activeCombo = document.getElementById('quicklog-model-combo');
            if (activeCombo && !activeCombo.contains(event.target)) closeQuickLogModelDropdown();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeQuickLogModelDropdown();
        });
        window.__quickLogModelDropdownDocBound = true;
    }
}

function renderQuickLogModeOptions(selectedMode = 'PROD') {
    return QUICKLOG_MODE_OPTIONS.map((mode) =>
        `<option value="${quickLogEscape(mode)}" ${mode === selectedMode ? 'selected' : ''}>${quickLogEscape(mode)}</option>`
    ).join('');
}


function getQuickLogSelectedMode() {
    return document.getElementById('quicklog-mode')?.value || 'PROD';
}

function renderQuickLogModeMenuOptions(selectedMode = 'PROD') {
    return QUICKLOG_MODE_OPTIONS.map((mode) => {
        const selected = mode === selectedMode;
        return `<button type="button" class="quicklog-combo-option ${selected ? 'active' : ''}" data-mode="${quickLogEscape(mode)}">${quickLogEscape(mode)}</button>`;
    }).join('');
}

function renderQuickLogModeDropdown(selectedMode = 'PROD') {
    const safeMode = QUICKLOG_MODE_OPTIONS.includes(selectedMode) ? selectedMode : (QUICKLOG_MODE_OPTIONS[0] || 'PROD');
    return `
        <div id="quicklog-mode-combo" class="quicklog-combo" data-open="false">
            <input type="hidden" id="quicklog-mode" value="${quickLogEscape(safeMode)}">
            <button id="quicklog-mode-button" type="button" class="quicklog-combo-button" aria-haspopup="listbox" aria-expanded="false">
                <span id="quicklog-mode-selected" class="truncate">${quickLogEscape(safeMode)}</span>
                <i data-lucide="chevron-down" class="w-4 h-4 shrink-0 quicklog-combo-chevron"></i>
            </button>
            <div id="quicklog-mode-menu" class="quicklog-combo-menu hidden" role="listbox">
                ${renderQuickLogModeMenuOptions(safeMode)}
            </div>
        </div>
    `;
}

function closeQuickLogModeDropdown() {
    const combo = document.getElementById('quicklog-mode-combo');
    const btn = document.getElementById('quicklog-mode-button');
    const menu = document.getElementById('quicklog-mode-menu');
    if (!combo || !btn || !menu) return;
    combo.dataset.open = 'false';
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.add('hidden');
}

function setQuickLogModeValue(mode) {
    const safeMode = QUICKLOG_MODE_OPTIONS.includes(mode) ? mode : (QUICKLOG_MODE_OPTIONS[0] || 'PROD');
    const input = document.getElementById('quicklog-mode');
    const label = document.getElementById('quicklog-mode-selected');
    const menu = document.getElementById('quicklog-mode-menu');
    if (input) input.value = safeMode;
    if (label) label.textContent = safeMode;
    if (menu) {
        menu.querySelectorAll('.quicklog-combo-option').forEach((item) => {
            item.classList.toggle('active', item.dataset.mode === safeMode);
        });
    }
}

function refreshQuickLogModeDropdown(selectedMode = 'PROD') {
    const combo = document.getElementById('quicklog-mode-combo');
    if (!combo) return;
    combo.outerHTML = renderQuickLogModeDropdown(selectedMode);
    bindQuickLogModeDropdown();
    _refreshIcons(document.getElementById('quicklog-mode-combo'));
}

function bindQuickLogModeDropdown() {
    const combo = document.getElementById('quicklog-mode-combo');
    const btn = document.getElementById('quicklog-mode-button');
    const menu = document.getElementById('quicklog-mode-menu');
    if (!combo || !btn || !menu || combo.dataset.bound === 'true') return;
    combo.dataset.bound = 'true';
    btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = combo.dataset.open === 'true';
        combo.dataset.open = open ? 'false' : 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        menu.classList.toggle('hidden', open);
    });
    menu.addEventListener('click', (event) => {
        const option = event.target.closest('.quicklog-combo-option');
        if (!option) return;
        setQuickLogModeValue(option.dataset.mode || 'PROD');
        closeQuickLogModeDropdown();
    });
    if (!window.__quickLogModeDropdownDocBound) {
        document.addEventListener('click', (event) => {
            const activeCombo = document.getElementById('quicklog-mode-combo');
            if (activeCombo && !activeCombo.contains(event.target)) closeQuickLogModeDropdown();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeQuickLogModeDropdown();
        });
        window.__quickLogModeDropdownDocBound = true;
    }
}

function setQuickLogModelDropdownDisplay() {
    refreshQuickLogModelDropdown(getQuickLogSelectedModelName());
}

function updateQuickLogLocalizedText() {
    if (activeModule !== 'quicklog') return;
    const pairs = [
        ['quicklog-model-label', 'quickLogNetworkBase'],
        ['quicklog-mode-label', 'quickLogMode'],
        ['quicklog-input-label', 'quickLogInput'],
        ['quicklog-input-hint', 'quickLogInputHint'],
        ['quicklog-generate-label', 'quickLogSearch'],
        ['quicklog-main-clear-label', 'clearAll'],
        ['quicklog-result-title', 'quickLogResult'],
        ['quicklog-open-log-label', 'quickLogOpenLog'],
    ];
    pairs.forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = t(key);
    });
    const input = document.getElementById('quicklog-input');
    if (input) input.placeholder = t('quickLogPlaceholder');
    const summary = document.getElementById('quicklog-summary');
    if (summary && (!summary.dataset.custom || summary.dataset.custom === 'ready')) {
        summary.textContent = t('quickLogStatusReady');
        summary.dataset.custom = 'ready';
    }
    setQuickLogModelDropdownDisplay(false);
}

function applyQuickLogLanguageNoAnimation() {
    landingLangEn.classList.toggle('active', currentLang === 'en');
    landingLangCn.classList.toggle('active', currentLang === 'cn');
    if (langToggleEn) langToggleEn.classList.toggle('active', currentLang === 'en');
    if (langToggleCn) langToggleCn.classList.toggle('active', currentLang === 'cn');
    updateQuickLogLocalizedText();
    updateModuleHeader();
    setQuickLogReportControlsVisibility();
    updateStatus();
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
function isQuickLogMesTraceMode() {
    return quickLogSearchSource === 'mesTrace';
}
function updateQuickLogSourceToggle() {
    const localBtn = document.getElementById('quicklog-source-local');
    const mesBtn = document.getElementById('quicklog-source-mes');
    const setBtn = (btn, active) => {
        if (!btn) return;
        btn.classList.toggle('bg-white', active);
        btn.classList.toggle('text-primary', active);
        btn.classList.toggle('shadow-sm', active);
        btn.classList.toggle('text-white', !active);
        btn.classList.toggle('hover:bg-white/20', !active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    };
    setBtn(localBtn, quickLogSearchSource === 'local');
    setBtn(mesBtn, quickLogSearchSource === 'mesTrace');
}
function updateQuickLogSourceVisibility() {
    const isMes = isQuickLogMesTraceMode();
    document.getElementById('quicklog-model-field')?.classList.toggle('hidden', isMes);
    document.getElementById('quicklog-mode-field')?.classList.toggle('hidden', isMes);
    const inputLabel = document.getElementById('quicklog-input-label');
    const inputHint = document.getElementById('quicklog-input-hint');
    if (inputLabel) inputLabel.textContent = isMes ? 'SN / CSN Input' : t('quickLogInput');
    if (inputHint) inputHint.textContent = t('quickLogInputHint');
    updateQuickLogSourceToggle();
    renderQuickLogMesTraceFilterBar();
}

const QUICKLOG_MES_TRACE_FILTERS = ['ALL', 'SMT', 'DIP', 'FATP', 'PASS', 'FAIL'];
function getQuickLogMesStationFilter(row) {
    const text = `${row?.terminal || ''} ${row?.process || ''} ${row?.Station || ''}`.toUpperCase();
    if (text.includes('SMT')) return 'SMT';
    if (text.includes('FATP') || /^FT[_\s-]?\d+/.test(text) || text.includes('FT_CHECK')) return 'FATP';
    if (text.includes('DIP') || text.includes('PCBA') || text.includes('FPC')) return 'DIP';
    return '';
}
function getQuickLogMesResultFilter(row) {
    const result = String(getQuickLogMesResultText(row) || row?.result || row?.status || '').toUpperCase().replace(/\s+/g, '');
    if (result.includes('FAIL')) return 'FAIL';
    if (result === 'PASS') return 'PASS';
    return '';
}
function quickLogMesTraceRowMatchesFilters(row) {
    if (!isQuickLogMesTraceMode() || quickLogMesTraceFilter === 'ALL') return true;
    if (['SMT', 'DIP', 'FATP'].includes(quickLogMesTraceFilter)) return getQuickLogMesStationFilter(row) === quickLogMesTraceFilter;
    if (['PASS', 'FAIL'].includes(quickLogMesTraceFilter)) return getQuickLogMesResultFilter(row) === quickLogMesTraceFilter;
    return true;
}
function renderQuickLogMesTraceFilterBar() {
    const bar = document.getElementById('quicklog-mes-filter-bar');
    if (!bar) return;
    const isMes = isQuickLogMesTraceMode();
    bar.classList.toggle('hidden', !isMes);
    if (!isMes) return;
    bar.innerHTML = QUICKLOG_MES_TRACE_FILTERS.map((key) => {
        const active = quickLogMesTraceFilter === key;
        const activeCls = active
            ? 'bg-primary text-white border-primary dark:bg-secondary dark:text-bgDark dark:border-secondary'
            : 'bg-white/70 dark:bg-gray-800 text-textMain dark:text-textDark border-borderLight dark:border-borderDark';
        return `<button type="button" class="quicklog-mes-filter-chip quicklog-filter-chip ${activeCls}" data-filter="${key}">${key}</button>`;
    }).join('');
}
function bindQuickLogMesTraceFilters() {
    const bar = document.getElementById('quicklog-mes-filter-bar');
    if (!bar || bar.dataset.bound === 'true') return;
    bar.dataset.bound = 'true';
    bar.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-filter]');
        if (!btn) return;
        const key = String(btn.dataset.filter || '').toUpperCase();
        if (!QUICKLOG_MES_TRACE_FILTERS.includes(key)) return;
        quickLogMesTraceFilter = key;
        quickLogSelectedIndex = -1;
        quickLogResultSearchText = ''; // QL-05: reset search when filter changes
        const searchInput = document.getElementById('quicklog-result-search');
        if (searchInput) searchInput.value = '';
        renderQuickLogMesTraceFilterBar();
        renderQuickLogRows(quickLogRows);
        updateQuickLogSelectedRowLabel(); // QL-04: reset label when filter changes
    });
}
function applyQuickLogMesTraceFilters(rows = []) {
    return isQuickLogMesTraceMode() ? rows.filter((row) => quickLogMesTraceRowMatchesFilters(row)) : rows;
}
function formatCountText(key, count) {
    return String(t(key)).replace('{count}', String(count));
}
function updateClcaLocalizedText() {
    if (activeModule !== 'clca') return;
    const module = MODULES.clca;
    const dataField = module && module.fields ? module.fields.find((field) => field.key === 'data') : null;

    const dataTitle = document.querySelector('[data-clca-file-card="true"] h2');
    if (dataTitle && dataField) dataTitle.textContent = dataField.label[currentLang];

    const dropTitle = document.querySelector('[data-clca-drop-zone="true"] [data-drop-title="true"]');
    if (dropTitle) dropTitle.textContent = t('clcaDropHint');

    const dropSub = document.querySelector('[data-clca-drop-zone="true"] .mt-1');
    if (dropSub) dropSub.textContent = t('clcaDropSub');

    const mergeLabel = document.querySelector('#clca-merge-all')?.closest('label')?.querySelector('span');
    if (mergeLabel) mergeLabel.textContent = t('clcaMergeAllLabel');

    const csnLabel = document.querySelector('#clca-use-csn-mapping')?.closest('label')?.querySelector('span');
    if (csnLabel) csnLabel.textContent = t('clcaCsnMappingLabel');
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
function getQuickLogMesDisplaySummary(displayRows = []) {
    const rows = Array.isArray(displayRows) ? displayRows : [];
    return {
        rowCount: rows.length,
        failCount: rows.filter((row) => getQuickLogMesResultFilter(row) === 'FAIL').length,
        repairCount: rows.filter((row) => String(getQuickLogMesResultText(row) || '').toUpperCase().replace(/\s+/g, '') === 'REPAIR').length,
    };
}
function updateQuickLogDisplayedSummary(displayRows = []) {
    if (!isQuickLogMesTraceMode()) return;
    const displaySummary = getQuickLogMesDisplaySummary(displayRows);
    updateQuickLogSummary({ ...quickLogLastSummary, ...displaySummary });
}
function updateQuickLogSummary(summary = {}) {
    const el = document.getElementById('quicklog-summary');
    if (!el) return;
    el.dataset.custom = 'result';
    if (isQuickLogMesTraceMode()) {
        const inputCount = summary.inputCount ?? '-';
        const foundCount = summary.foundCount ?? '-';
        const rowCount = summary.rowCount ?? 0;
        const failCount = summary.failCount ?? 0;
        const repairCount = summary.repairCount ?? 0;
        el.textContent = `Input: ${inputCount} | Found: ${foundCount} | Rows: ${rowCount} | Fail: ${failCount} | Repair: ${repairCount}`;
        return;
    }
    const recordCount = summary.recordCount ?? quickLogRows.length;
    const foundSnCount = summary.foundSnCount ?? '-';
    const notFoundCount = summary.notFoundCount ?? '-';
    const readFiles = summary.readFiles ?? '-';
    const elapsed = summary.elapsedSeconds ?? '-';
    el.textContent = `Records: ${recordCount} | Found SN: ${foundSnCount} | Not found: ${notFoundCount} | Read CSV: ${readFiles} | ${elapsed}s`;
}
async function searchQuickLog() {
    const model = getQuickLogSelectedModel();
    const mode = getQuickLogSelectedMode();
    const snText = document.getElementById('quicklog-input')?.value || '';
    const searchBtn = document.getElementById('quicklog-generate');
    const isMesTrace = isQuickLogMesTraceMode();
    if (!String(snText).trim()) {
        logToConsole('Missing SN input.', 'error');
        return;
    }
    if (!isMesTrace && (!model || (!model.path && !model.resolvedPath))) {
        logToConsole('Model path not configured.', 'error');
        return;
    }
    try {
        if (searchBtn) {
            searchBtn.disabled = true;
            searchBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>Searching...</span>`;
            _refreshIcons(searchBtn);
        }
        setStatus('generating', 'Searching...');
        showProgress();
        quickLogRows = [];
        quickLogSelectedIndex = -1;
        renderQuickLogRows([]);
        const summary = document.getElementById('quicklog-summary');
        if (summary) {
            summary.dataset.custom = 'searching';
            summary.textContent = 'Searching...';
        }
        const endpoint = isMesTrace ? '/api/quicklog/mes-trace/search' : '/api/quicklog/search';
        const payload = isMesTrace ? { input: snText } : { model: model.name, mode, snText, _QuickLogBase: model.resolvedPath || model.path };
        const response = await fetchRetry(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }, 1);
        const data = await response.json();
        if (!response.ok || !data.success) throw createBackendError(data, isMesTrace ? 'MES Trace search failed.' : 'QuickLog search failed.');
        quickLogRows = (Array.isArray(data.rows) ? data.rows : []).map((row) => isMesTrace ? {
            ...row,
            _QuickLogSource: 'mesTrace',
        } : {
            ...row,
            _QuickLogSource: 'local',
            _QuickLogModel: model.name,
            _QuickLogBase: model.resolvedPath || model.path,
            _QuickLogProject: model.project || model.name,
            _QuickLogFixture: model.fixture || 'J01',
        });
        quickLogLastSummary = data.summary || {};
        renderQuickLogRows(quickLogRows);
        if (!isMesTrace) updateQuickLogSummary(quickLogLastSummary);
        completeProgress();
        setStatus('success', t('statusSuccess'));
        logToConsole(`${isMesTrace ? 'MES Trace' : 'QuickLog'} search done. Rows: <b>${quickLogRows.length}</b>`, 'success');
        if (!isMesTrace && data.summary && Array.isArray(data.summary.notFound) && data.summary.notFound.length) {
            logToConsole(`Not found: ${data.summary.notFound.join(', ')}`, 'warning');
        }
    } catch (err) {
        resetProgress();
        setStatus('error', t('reqFailed'));
        let message = err.message || String(err);
        if (message.includes('ERR_MES_API_UNREACHABLE')) {
            const tMsg = t('mesApiUnreachable');
            message = tMsg !== 'mesApiUnreachable' ? tMsg : 'Cannot connect to MES server. Please check the MES URL.';
        }
        logToConsole(`${isMesTrace ? 'MES Trace' : 'QuickLog'} search failed: ${message}`, 'error');
        showImportantToast('error', t('reqFailed'), message);
        const summary = document.getElementById('quicklog-summary');
        if (summary) {
            summary.dataset.custom = 'error';
            summary.textContent = `Search failed: ${message}`;
        }
    } finally {
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.innerHTML = `<i data-lucide="search" class="w-5 h-5"></i><span id="quicklog-generate-label">${t('quickLogSearch')}</span>`;
            _refreshIcons(searchBtn);
        }
        resetProgress();
    }
}

function renderQuickLogPanel() {
    const existingModel = document.getElementById('quicklog-model')?.value || QUICKLOG_DEFAULT_MODEL;
    const existingMode = document.getElementById('quicklog-mode')?.value || 'PROD';
    const existingInput = document.getElementById('quicklog-input')?.value || '';
    const selectedModel = getQuickLogModel(existingModel);
    fileCards.classList.add('single-input-layout');
    fileCards.innerHTML = `
        <div class="glass-card rounded-xl border border-borderLight dark:border-borderDark overflow-hidden">
            <div class="section-header-gradient justify-between !py-2 !px-4">
                <div class="p-1 rounded-md bg-white/20 shrink-0"><i data-lucide="search" class="w-4 h-4"></i></div>
                <div class="inline-flex bg-black/20 dark:bg-black/40 rounded-xl p-1 gap-1 ml-auto overflow-x-auto">
                    <button id="quicklog-source-local" type="button" class="px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors" aria-pressed="true">Local Log</button>
                    <button id="quicklog-source-mes" type="button" class="px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors" aria-pressed="false">MES Trace</button>
                </div>
            </div>
            <div class="p-5 grid gap-4">
                <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_180px] gap-3">
                    <label id="quicklog-model-field" class="grid gap-1.5 text-sm">
                        <span id="quicklog-model-label" class="font-semibold text-textMain dark:text-textDark">${t('quickLogNetworkBase')}</span>
                        ${renderQuickLogModelDropdown(selectedModel.name)}
                    </label>
                    <label id="quicklog-mode-field" class="grid gap-1.5 text-sm">
                    <span id="quicklog-mode-label" class="font-semibold text-textMain dark:text-textDark">${t('quickLogMode')}</span>
                    ${renderQuickLogModeDropdown(existingMode)}
                </label>
                </div>
                <label class="grid gap-1.5 text-sm">
                    <span id="quicklog-input-label" class="font-semibold text-textMain dark:text-textDark">${t('quickLogInput')}</span>
                    <textarea id="quicklog-input" rows="5" class="w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-textMain dark:text-textDark resize-y" placeholder="${t('quickLogPlaceholder')}">${quickLogEscape(existingInput)}</textarea>
                    <span id="quicklog-input-hint" class="text-xs text-textMuted dark:text-gray-400">${t('quickLogInputHint')}</span>
                </label>
                <div class="quicklog-main-actions flex items-center gap-3">
                    <button id="quicklog-generate" type="button" class="quicklog-generate-btn flex-1 py-3.5 px-8 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-500 hover:from-cyan-400 hover:via-blue-500 hover:to-violet-400 dark:from-cyan-400 dark:via-blue-400 dark:to-violet-400 dark:hover:from-cyan-300 dark:hover:via-blue-300 dark:hover:to-violet-300 text-white dark:text-bgDark font-semibold text-base shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg relative overflow-hidden font-display tracking-wide">
                        <i data-lucide="search" class="w-5 h-5"></i>
                        <span id="quicklog-generate-label">${t('quickLogSearch')}</span>
                    </button>
                    <button id="quicklog-main-clear" type="button" class="quicklog-clear-btn py-3.5 px-8 min-w-[140px] rounded-xl font-medium transition-all duration-200 focus:outline-none flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] shrink-0">
                        <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                        <span id="quicklog-main-clear-label">${t('clearAll')}</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="glass-card rounded-xl border border-borderLight dark:border-borderDark overflow-hidden">
            <div class="section-header-gradient justify-between">
                <div class="flex items-center gap-2">
                    <div class="p-1 rounded-md bg-white/20"><i data-lucide="table" class="w-4 h-4"></i></div>
                    <span id="quicklog-result-title" class="text-sm font-semibold">${t('quickLogResult')}</span>
                </div>
                <div class="flex items-center gap-2">
                    <button id="quicklog-export-csv" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white transition-colors" title="${t('quickLogExportCsv')}">
                        <i data-lucide="download" class="w-3.5 h-3.5"></i><span>${t('quickLogExportCsv')}</span>
                    </button>
                    <button id="quicklog-result-open-log" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white transition-colors">
                        <i data-lucide="file-search" class="w-3.5 h-3.5"></i><span id="quicklog-open-log-label">${t('quickLogOpenLog')}</span>
                    </button>
                </div>
            </div>
            <div class="p-4">
                <div id="quicklog-summary" data-custom="ready" class="mb-3 text-xs text-textMuted dark:text-gray-400">${t('quickLogStatusReady')}</div>
                <div id="quicklog-selected-row-info" class="mb-2 text-xs text-primary dark:text-secondary font-medium">${t('quickLogSelectedRowLabel')}</div>
                        <div id="quicklog-mes-filter-bar" class="quicklog-filter-scroll hidden mb-3"></div>
                <div class="mb-3">
                    <input id="quicklog-result-search" type="text" placeholder="${t('quickLogResultSearch')}" class="w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-textMuted/50 dark:placeholder:text-gray-500 transition-colors" />
                </div>
                <div class="quicklog-table-scroll overflow-x-auto max-w-full">
                <table class="w-full text-sm border-collapse">
                    <thead id="quicklog-result-head" class="text-left text-textMuted dark:text-gray-400">
                        <tr>
                            <th class="px-3 py-2 border-b border-borderLight dark:border-borderDark">SN</th>
                            <th class="px-3 py-2 border-b border-borderLight dark:border-borderDark">Station</th>
                            <th class="px-3 py-2 border-b border-borderLight dark:border-borderDark">Mode</th>
                            <th class="px-3 py-2 border-b border-borderLight dark:border-borderDark">Result</th>
                            <th class="px-3 py-2 border-b border-borderLight dark:border-borderDark">ErrorCode</th>
                            <th class="px-3 py-2 border-b border-borderLight dark:border-borderDark">EndTime</th>
                        </tr>
                    </thead>
                    <tbody id="quicklog-result-body" class="text-textMain dark:text-textDark"></tbody>
                </table>
                </div>
            </div>
        </div>
    `;
    bindQuickLogUi();
    bindQuickLogMesTraceFilters();
    updateQuickLogSourceVisibility();
    renderQuickLogMesTraceFilterBar();
    renderQuickLogRows(quickLogRows);
    _refreshIcons(fileCards);
    loadQuickLogModels();
}
function bindQuickLogUi() {
    bindQuickLogModelDropdown();
    bindQuickLogModeDropdown();
    document.getElementById('quicklog-source-local')?.addEventListener('click', () => {
        if (quickLogSearchSource === 'local') return;
        quickLogSearchSource = 'local';
        quickLogMesTraceFilter = 'ALL';
        updateQuickLogSourceVisibility();
        resetQuickLogResultOnly();
    });
    document.getElementById('quicklog-source-mes')?.addEventListener('click', () => {
        if (quickLogSearchSource === 'mesTrace') return;
        quickLogSearchSource = 'mesTrace';
        updateQuickLogSourceVisibility();
        resetQuickLogResultOnly();
    });
    document.getElementById('quicklog-generate')?.addEventListener('click', searchQuickLog);
    document.getElementById('quicklog-main-clear')?.addEventListener('click', clearQuickLogUi);
    document.getElementById('quicklog-input')?.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') searchQuickLog();
    });
    document.getElementById('quicklog-result-open-log')?.addEventListener('click', openQuickLogSelectedLog);
    // QL-05: Bind search input
    document.getElementById('quicklog-result-search')?.addEventListener('input', (event) => {
        quickLogResultSearchText = event.target.value;
        quickLogSelectedIndex = -1; // reset selected when searching
        renderQuickLogRows(quickLogRows);
    });
    // QL-06: Bind export button
    document.getElementById('quicklog-export-csv')?.addEventListener('click', downloadQuickLogCsv);
}
function clearQuickLogUi() {
    quickLogRows = [];
    quickLogSelectedIndex = -1;
    quickLogLastSummary = {};
    quickLogMesTraceFilter = 'ALL';
    quickLogResultSearchText = ''; // QL-05: reset search
    const input = document.getElementById('quicklog-input');
    const summary = document.getElementById('quicklog-summary');
    const searchInput = document.getElementById('quicklog-result-search'); // QL-05: clear search input
    if (input) input.value = '';
    if (summary) {
        summary.textContent = t('quickLogStatusReady');
        summary.dataset.custom = 'ready';
    }
    if (searchInput) searchInput.value = ''; // QL-05: clear search input
    renderQuickLogRows([]);
    updateQuickLogSelectedRowLabel(); // QL-04: reset label to "No row selected"
}

function getQuickLogMesColumns() {
    return ['SN', 'CSN', 'Model', 'Station', 'Result', 'Failitem', 'Reason', 'WO', 'PartNo', 'Time'];
}
function getQuickLogMesColStyle(key, isHeader = false) {
    const widths = {
        SN: 150,
        CSN: 145,
        Model: 90,
        Station: 190,
        Result: 95,
        Failitem: 260,
        Reason: 300,
        WO: 125,
        PartNo: 170,
        Time: 180,
    };
    const width = widths[key] || 140;
    const padding = isHeader ? '8px 10px' : '7px 10px';
    return [
        `min-width:${width}px`,
        'width:max-content',
        'max-width:none',
        `padding:${padding}`,
        'white-space:nowrap',
        'overflow:visible',
        'text-overflow:clip',
        'vertical-align:top',
    ].join(';');
}
function getQuickLogMesColClass(isHeader = false) {
    return isHeader
        ? 'border-b border-borderLight dark:border-borderDark text-xs leading-tight whitespace-nowrap'
        : 'border-b border-borderLight dark:border-borderDark text-xs leading-tight whitespace-nowrap';
}

function getQuickLogColumnDisplayName(key) {
    return key === 'Failitem' ? 'ErrorCode' : key;
}
function renderQuickLogResultHeader() {
    const thead = document.getElementById('quicklog-result-head');
    if (!thead) return;
    const isMes = isQuickLogMesTraceMode();
    const columns = isMes ? getQuickLogMesColumns() : ['SN', 'Station', 'Mode', 'Result', 'Failitem', 'EndTime'];
    if (isMes) {
        thead.innerHTML = `<tr>${columns.map((col) => `<th class="${getQuickLogMesColClass(true)}" style="${getQuickLogMesColStyle(col, true)}">${quickLogEscape(getQuickLogColumnDisplayName(col))}</th>`).join('')}</tr>`;
        return;
    }
    thead.innerHTML = `<tr>${columns.map((col) => `<th class="px-3 py-2 border-b border-borderLight dark:border-borderDark">${quickLogEscape(getQuickLogColumnDisplayName(col))}</th>`).join('')}</tr>`;
}
// QL-04: Update selected row indicator label
function updateQuickLogSelectedRowLabel() {
    const label = document.getElementById('quicklog-selected-row-info');
    if (!label) return;
    if (quickLogSelectedIndex < 0 || !quickLogRows[quickLogSelectedIndex]) {
        label.textContent = t('quickLogSelectedRowLabel');
        return;
    }
    const row = quickLogRows[quickLogSelectedIndex];
    const isMes = row._QuickLogSource === 'mesTrace' || isQuickLogMesTraceMode();
    const sn = quickLogEscape(isMes ? (row.serialNumber || row.SN || row.customerSN || '') : (row.SN || row.serialNumber || ''));
    const station = quickLogEscape(isMes ? (row.terminal || row.process || row.Station || '') : (row.Station || row.ProcessName || row.TerminalName || ''));
    const result = quickLogEscape(isMes ? (getQuickLogMesResultText(row) || getQuickLogBaseResult(row) || '') : (row.Result || row.status || row.Status || row.resultDisplay || ''));
    const formatted = t('quickLogSelectedRowFormat')
        .replace('{sn}', sn)
        .replace('{station}', station)
        .replace('{result}', result);
    label.textContent = formatted;
}
// QL-05: Filter rows by search text in all visible columns
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
function generateQuickLogCsv(displayRows = []) {
    const isMes = isQuickLogMesTraceMode();
    const columns = isMes ? getQuickLogMesColumns() : ['SN', 'Station', 'Mode', 'Result', 'Failitem', 'EndTime'];
    // Helper to escape CSV cell
    function escapeCsvCell(value) {
        const str = String(value || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
    // Header row
    const header = columns.map(escapeCsvCell).join(',');
    // Data rows
    const rows = displayRows.map((row) => columns.map((col) => escapeCsvCell(row[col] || '')).join(','));
    return [header, ...rows].join('\n');
}
// QL-06: Download CSV file of visible result rows
function downloadQuickLogCsv() {
    const isMes = isQuickLogMesTraceMode();
    const tbody = document.getElementById('quicklog-result-body');
    if (!tbody || tbody.children.length === 0) {
        logToConsole('No result rows to export.', 'warning');
        return;
    }
    // QL-06: Show loading state
    setQuickLogExportLoading(true);
    
    // Simulate small delay for feedback (typically browser is fast)
    setTimeout(() => {
        try {
            // Get all visible rows from current rendered table
            const visibleRows = [];
            tbody.querySelectorAll('tr').forEach((tr) => {
                const cells = tr.querySelectorAll('td');
                if (cells.length === 0) return; // skip if no cells
                const columns = isMes ? getQuickLogMesColumns() : ['SN', 'Station', 'Mode', 'Result', 'Failitem', 'EndTime'];
                const row = {};
                columns.forEach((col, idx) => {
                    if (idx < cells.length) row[col] = cells[idx].textContent.trim();
                });
                visibleRows.push(row);
            });
            const csvContent = generateQuickLogCsv(visibleRows);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const fileName = isMes ? `QuickLog_MESTrace_${timestamp}.csv` : `QuickLog_Local_${timestamp}.csv`;
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', fileName);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            logToConsole(t('quickLogExportedCount').replace('{count}', String(visibleRows.length)), 'success');
        } catch (error) {
            logToConsole(`Export CSV failed: ${error.message || error}`, 'error');
        } finally {
            // QL-06: Reset loading state
            setQuickLogExportLoading(false);
        }
    }, 100);
}
function isQuickLogRepairStationRow(row) {
    const text = `${row?.process || ''} ${row?.ProcessName || ''} ${row?.terminal || ''} ${row?.TerminalName || ''} ${row?.Station || ''}`.toUpperCase();
    return text.includes('REPAIR');
}
function hasQuickLogA004RepairInfo(row) {
    return !!row && Boolean(
        row.defectProcess || row.DefectProcess ||
        row.repairDefectProcess || row.RepairDefectProcess ||
        row.repairTime || row.RepairTime ||
        row.repairStatus || row.RepairStatus ||
        row.defectDesc || row.DefectDesc ||
        row.reasonDesc || row.ReasonDesc
    );
}
function isQuickLogA004OnlyRow(row) {
    if (!row || !hasQuickLogA004RepairInfo(row)) return false;
    if (isQuickLogRepairDisplayRow(row)) return false;
    if (getQuickLogBaseResult(row) === 'FAIL') return false;
    const rawResult = String(row?.result ?? row?.status ?? row?.Status ?? row?.resultDisplay ?? row?.repairState ?? '').trim().toUpperCase().replace(/\s+/g, '');
    const hasA003Terminal = Boolean(String(row?.terminal ?? row?.TerminalName ?? row?.Station ?? '').trim());
    return !hasA003Terminal || rawResult === 'REPAIR' || rawResult.includes('REPAIR');
}
function isQuickLogRepairLinkRow(row) {
    if (!row) return false;
    if (hasQuickLogA004RepairInfo(row)) return true;
    const rawResult = String(row?.result ?? row?.status ?? row?.Status ?? row?.resultDisplay ?? '').trim().toUpperCase().replace(/\s+/g, '');
    const repairState = String(row?.repairState ?? '').trim().toUpperCase();
    return !isQuickLogRepairStationRow(row) && (rawResult === 'REPAIR' || repairState.includes('REPAIR'));
}
function isQuickLogRepairDisplayRow(row) {
    return !!row && isQuickLogRepairStationRow(row);
}
function isQuickLogRepairPassRow(row) {
    return isQuickLogRepairStationRow(row) && getQuickLogBaseResult(row) === 'PASS';
}
function getQuickLogRepairDedupKey(row) {
    const sn = String(row?.serialNumber || row?.SN || row?.SerialNumber || '').trim();
    const wo = String(row?.workOrder || row?.WO || row?.WorkOrder || '').trim();
    const station = String(row?.terminal || row?.TerminalName || row?.process || row?.ProcessName || row?.Station || '').trim().toUpperCase();
    const time = String(row?.time || row?.Time || row?.EndTime || row?.OutputTime || '').trim().replace(/:\d{2}$/, '');
    return `${sn}|${wo}|${station}|${time}`;
}
function getQuickLogBaseResult(row) {
    const raw = String(row?.result ?? row?.status ?? row?.Status ?? '').trim().toUpperCase();
    if (raw === '1' || raw === 'FAIL' || raw === 'NG') return 'FAIL';
    if (raw === '0' || raw === 'PASS' || raw === 'OK') return 'PASS';
    if (raw === 'REPAIR') return 'REPAIR';
    return raw;
}
function getQuickLogDefectProcess(row) {
    return String(row?.defectProcess ?? row?.DefectProcess ?? row?.repairDefectProcess ?? row?.RepairDefectProcess ?? '').trim();
}
function getQuickLogProcessName(row) {
    return String(row?.process ?? row?.ProcessName ?? row?.terminal ?? row?.TerminalName ?? row?.Station ?? '').trim();
}
function getQuickLogRepairTimeValue(row) {
    return String(row?.repairTime ?? row?.RepairTime ?? row?.time ?? row?.Time ?? row?.EndTime ?? row?.OutputTime ?? '').trim();
}
function getQuickLogRowTimeMs(row) {
    const value = row?.repairTime ?? row?.RepairTime ?? row?.time ?? row?.Time ?? row?.EndTime ?? row?.OutputTime ?? '';
    const ms = Date.parse(String(value).replace(' ', 'T'));
    return Number.isFinite(ms) ? ms : Number.NaN;
}
function isQuickLogSameSn(a, b) {
    return String(a?.serialNumber ?? a?.SN ?? a?.SerialNumber ?? '').trim() === String(b?.serialNumber ?? b?.SN ?? b?.SerialNumber ?? '').trim();
}
function isQuickLogSameWoIfPresent(a, b) {
    const wa = String(a?.workOrder ?? a?.WO ?? a?.WorkOrder ?? '').trim();
    const wb = String(b?.workOrder ?? b?.WO ?? b?.WorkOrder ?? '').trim();
    return !wa || !wb || wa === wb;
}
function isQuickLogSameDefectProcessIfPresent(failRow, repairRow) {
    const defectProcess = quickLogNormalizeStationName(getQuickLogDefectProcess(repairRow));
    const failProcess = quickLogNormalizeStationName(getQuickLogProcessName(failRow));
    if (!defectProcess || !failProcess) return false;
    return defectProcess === failProcess;
}
function getQuickLogRepairRowsForDisplay(rows = []) {
    return rows
        .map((row, index) => ({ row, index, timeMs: getQuickLogRowTimeMs(row) }))
        .filter((item) => item.row && isQuickLogRepairLinkRow(item.row))
        .sort((a, b) => {
            if (Number.isFinite(a.timeMs) && Number.isFinite(b.timeMs) && a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
            return a.index - b.index;
        });
}
function getQuickLogFailRowsForDisplay(rows = []) {
    return rows
        .map((row, index) => ({ row, index, timeMs: getQuickLogRowTimeMs(row) }))
        .filter((item) => item.row && getQuickLogBaseResult(item.row) === 'FAIL' && !isQuickLogRepairStationRow(item.row));
}
function getQuickLogRepairPassRowsForDisplay(rows = []) {
    return rows
        .map((row, index) => ({ row, index, timeMs: getQuickLogRowTimeMs(row) }))
        .filter((item) => item.row && isQuickLogRepairPassRow(item.row))
        .sort((a, b) => {
            if (Number.isFinite(a.timeMs) && Number.isFinite(b.timeMs) && a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
            return a.index - b.index;
        });
}
function findQuickLogA004ForRepair(failRow, repairPassRow, a004Rows = []) {
    const repairTimeMs = getQuickLogRowTimeMs(repairPassRow);
    const failTimeMs = getQuickLogRowTimeMs(failRow);
    const sameBase = a004Rows.filter((item) =>
        isQuickLogSameSn(item.row, failRow) &&
        isQuickLogSameWoIfPresent(item.row, failRow) &&
        (!getQuickLogDefectProcess(item.row) || isQuickLogSameDefectProcessIfPresent(failRow, item.row))
    );
    const withinTenSeconds = sameBase
        .filter((item) => Number.isFinite(item.timeMs) && Number.isFinite(repairTimeMs) && Math.abs(item.timeMs - repairTimeMs) <= 10000)
        .sort((a, b) => Math.abs(a.timeMs - repairTimeMs) - Math.abs(b.timeMs - repairTimeMs))[0];
    if (withinTenSeconds) return withinTenSeconds.row;
    return sameBase
        .filter((item) => {
            if (!Number.isFinite(item.timeMs) || !Number.isFinite(failTimeMs)) return true;
            return item.timeMs >= failTimeMs;
        })
        .sort((a, b) => {
            if (Number.isFinite(a.timeMs) && Number.isFinite(b.timeMs) && a.timeMs !== b.timeMs) {
                if (Number.isFinite(repairTimeMs)) return Math.abs(a.timeMs - repairTimeMs) - Math.abs(b.timeMs - repairTimeMs);
                return a.timeMs - b.timeMs;
            }
            return a.index - b.index;
        })[0]?.row || null;
}
function getQuickLogRepairGroupKey(row) {
    const sn = String(row?.serialNumber ?? row?.SN ?? row?.SerialNumber ?? '').trim();
    const wo = String(row?.workOrder ?? row?.WO ?? row?.WorkOrder ?? '').trim();
    return `${sn}\u0000${wo}`;
}
function isQuickLogFailAfterPreviousRepair(failItem, repairRow, previousRepairByKey) {
    const previousRepairTime = previousRepairByKey.get(getQuickLogRepairGroupKey(repairRow));
    if (!Number.isFinite(previousRepairTime) || !Number.isFinite(failItem.timeMs)) return true;
    return failItem.timeMs > previousRepairTime;
}
function findQuickLogFailBeforeRepair(repairItem, failRows = [], usedFailIndexes = new Set(), previousRepairByKey = new Map()) {
    const repairRow = repairItem.row;
    return failRows
        .filter((failItem) => !usedFailIndexes.has(failItem.index))
        .filter((failItem) => isQuickLogSameSn(failItem.row, repairRow))
        .filter((failItem) => isQuickLogSameWoIfPresent(failItem.row, repairRow))
        .filter((failItem) => isQuickLogFailAfterPreviousRepair(failItem, repairRow, previousRepairByKey))
        .filter((failItem) => {
            if (!Number.isFinite(failItem.timeMs) || !Number.isFinite(repairItem.timeMs)) return true;
            return failItem.timeMs <= repairItem.timeMs;
        })
        .sort((a, b) => {
            if (Number.isFinite(a.timeMs) && Number.isFinite(b.timeMs) && a.timeMs !== b.timeMs) return b.timeMs - a.timeMs;
            return b.index - a.index;
        })[0];
}
function decorateQuickLogMesRowsForDisplay(rows = []) {
    if (!isQuickLogMesTraceMode()) return rows;
    const decorated = rows.map((row, index) => ({ ...row, _QuickLogOriginalIndex: index }));
    const usedFailIndexes = new Set();
    const previousRepairByKey = new Map();
    const failRows = getQuickLogFailRowsForDisplay(decorated);
    const repairPassRows = getQuickLogRepairPassRowsForDisplay(decorated);
    const a004Rows = getQuickLogRepairRowsForDisplay(decorated);

    a004Rows.forEach((repairItem) => {
        if (isQuickLogA004OnlyRow(repairItem.row)) repairItem.row._QuickLogHideRow = true;
    });

    repairPassRows.forEach((repairItem) => {
        const repairRow = repairItem.row;
        const repairKey = getQuickLogRepairGroupKey(repairRow);
        repairRow._QuickLogUiResultDisplay = 'REPAIR';
        repairRow._QuickLogUiRepairPassed = true;

        const bestFail = findQuickLogFailBeforeRepair(repairItem, failRows, usedFailIndexes, previousRepairByKey);
        if (!bestFail) {
            if (previousRepairByKey.has(repairKey)) repairRow._QuickLogHideRow = true;
            if (Number.isFinite(repairItem.timeMs)) previousRepairByKey.set(repairKey, repairItem.timeMs);
            return;
        }

        const a004Row = findQuickLogA004ForRepair(bestFail.row, repairRow, a004Rows);
        decorated[bestFail.index]._QuickLogUiResultDisplay = 'FAIL(REPAIR)';
        if (a004Row) {
            decorated[bestFail.index]._QuickLogRepairTime = getQuickLogRepairTimeValue(a004Row);
            decorated[bestFail.index]._QuickLogRepairDefect = a004Row.defect ?? a004Row.DefectDesc ?? a004Row.defectDesc ?? '';
            decorated[bestFail.index]._QuickLogRepairReason = a004Row.reason ?? a004Row.ReasonDesc ?? a004Row.reasonDesc ?? '';
            if (!decorated[bestFail.index].defect) decorated[bestFail.index].defect = decorated[bestFail.index]._QuickLogRepairDefect;
            if (!decorated[bestFail.index].reason) decorated[bestFail.index].reason = decorated[bestFail.index]._QuickLogRepairReason;
        }
        usedFailIndexes.add(bestFail.index);
        if (Number.isFinite(repairItem.timeMs)) previousRepairByKey.set(repairKey, repairItem.timeMs);
    });

    return decorated;
}
function getQuickLogMesResultText(row) {
    if (row && row._QuickLogUiResultDisplay) return String(row._QuickLogUiResultDisplay || '').trim();
    if (row && isQuickLogRepairDisplayRow(row)) return 'REPAIR';
    return getQuickLogBaseResult(row);
}
function getQuickLogRepairResult(row) {
    return getQuickLogMesResultText(row);
}
function getQuickLogMesCell(row, key) {
    const map = {
        SN: row.serialNumber,
        CSN: row.customerSN,
        Model: row.modelRoot || row.modelNo,
        Station: row.terminal || row.process,
        Result: getQuickLogMesResultText(row),
        Failitem: row.defect,
        Reason: row.reason,
        WO: row.workOrder,
        PartNo: row.partNo,
        Time: row.time,
    };
    return map[key] || '';
}
function getQuickLogResultBadgeClass(row) {
    const result = String(getQuickLogMesResultText(row) || '').toUpperCase();
    if (result === 'REPAIR') return 'text-emerald-600 dark:text-emerald-400 font-bold';
    if (result === 'PASS') return 'text-emerald-600 dark:text-emerald-400 font-bold';
    if (result === 'FAIL' || result === 'FAIL(REPAIR)' || result === 'FAIL (REPAIR)') return 'text-red-600 dark:text-red-400 font-bold';
    return 'font-semibold';
}
function renderQuickLogMesResultContent(row) {
    const result = String(getQuickLogMesResultText(row) || '').trim();
    const upper = result.toUpperCase().replace(/\s+/g, '');
    if (upper === 'FAIL(REPAIR)') {
        return `<span class="text-red-600 dark:text-red-400 font-bold">FAIL</span><span class="text-amber-600 dark:text-amber-400 font-bold">(REPAIR)</span>`;
    }
    if (upper === 'REPAIR') {
        return `<span class="text-emerald-600 dark:text-emerald-400 font-bold">REPAIR</span>`;
    }
    if (upper === 'PASS') {
        return `<span class="text-emerald-600 dark:text-emerald-400 font-bold">PASS</span>`;
    }
    if (upper === 'FAIL') {
        return `<span class="text-red-600 dark:text-red-400 font-bold">FAIL</span>`;
    }
    return `<span class="${getQuickLogResultBadgeClass(row)}">${quickLogEscape(result)}</span>`;
}
function renderQuickLogMesCell(row, key) {
    const value = getQuickLogMesCell(row, key);
    const safeValue = quickLogEscape(value);
    const cellClass = getQuickLogMesColClass(false);
    const cellStyle = getQuickLogMesColStyle(key, false);
    if (key === 'Result') {
        return `<td class="${cellClass}" style="${cellStyle}" title="${safeValue}">${renderQuickLogMesResultContent(row)}</td>`;
    }
    return `<td class="${cellClass}" style="${cellStyle}" title="${safeValue}">${safeValue}</td>`;
}
function applyQuickLogTableScrollMode(isMes) {
    const tbody = document.getElementById('quicklog-result-body');
    const table = tbody?.closest('table');
    const wrapper = tbody?.closest('.quicklog-table-scroll');
    if (wrapper) {
        wrapper.style.overflowX = isMes ? 'auto' : '';
        wrapper.style.overflowY = 'auto';
        wrapper.style.maxWidth = '100%';
        wrapper.style.width = '100%';
    }
    if (table) {
        if (isMes) {
            table.className = 'text-xs border-collapse';
            table.style.tableLayout = 'auto';
            table.style.width = 'max-content';
            table.style.minWidth = '1800px';
            table.style.maxWidth = 'none';
        } else {
            table.className = 'w-full text-sm border-collapse';
            table.style.tableLayout = '';
            table.style.width = '';
            table.style.minWidth = '';
            table.style.maxWidth = '';
        }
    }
}
function renderQuickLogRows(rows = []) {
    const tbody = document.getElementById('quicklog-result-body');
    if (!tbody) return;
    const isMes = isQuickLogMesTraceMode();
    renderQuickLogResultHeader();
    applyQuickLogTableScrollMode(isMes);
    tbody.innerHTML = '';
    const columns = isMes ? getQuickLogMesColumns() : ['SN', 'Station', 'Mode', 'Result', 'Failitem', 'EndTime'];
    // QL-05: Add search filter to display chain
    let displayRows = isMes ? markQuickLogFirstSnRows(applyQuickLogMesTraceFilters(normalizeQuickLogMesDisplayRows(decorateQuickLogMesRowsForDisplay(rows)))) : rows;
    displayRows = filterQuickLogResultsBySearchText(displayRows);
    if (isMes) updateQuickLogDisplayedSummary(displayRows);
    displayRows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.className = `quicklog-result-row cursor-pointer transition-colors ${row.IsLatestByStation ? 'quicklog-row-latest' : ''} ${row._QuickLogFirstSnRow ? 'quicklog-row-first-sn' : ''}`;
        tr.innerHTML = isMes
            ? columns.map((key) => renderQuickLogMesCell(row, key)).join('')
            : columns.map((key) => `<td class="px-3 py-2 border-b border-borderLight dark:border-borderDark whitespace-nowrap">${quickLogEscape(row[key] || '')}</td>`).join('');
        tr.addEventListener('click', () => {
            quickLogSelectedIndex = Number.isInteger(row._QuickLogOriginalIndex) ? row._QuickLogOriginalIndex : index;
            tbody.querySelectorAll('tr').forEach((item) => item.classList.remove('quicklog-row-selected'));
            tr.classList.add('quicklog-row-selected');
            updateQuickLogSelectedRowLabel(); // QL-04: update label when row clicked
        });
        tbody.appendChild(tr);
    });
    updateQuickLogSelectedRowLabel(); // QL-04: update label after rendering
}

function getQuickLogOpenLogNotFoundMessage(isMesTraceRow, data = {}) {
    if (isMesTraceRow || data?.code === 'LOCAL_LOG_STATION_NOT_CONFIGURED') return "Couldn't find log file on local path";
    return data?.error || 'Open log failed.';
}

function formatQuickLogOpenError(data, fallbackMessage) {
    const parts = [fallbackMessage || data?.error || 'Open log failed.'];
    if (data?.error) parts.push(data.error);
    if (data?.resolved) parts.push(`Resolved: ${JSON.stringify(data.resolved)}`);
    if (data?.candidateCount != null) parts.push(`candidateCount=${data.candidateCount}`);
    if (data?.scannedDirs != null) parts.push(`scannedDirs=${data.scannedDirs}`);
    if (data?.fromCache != null) parts.push(`fromCache=${data.fromCache}`);
    if (Array.isArray(data?.checkedPaths) && data.checkedPaths.length) parts.push(`checkedPaths:\n${data.checkedPaths.join('\n')}`);
    return parts.filter(Boolean).join('\n');
}
async function openQuickLogSelectedLog() {
    if (quickLogSelectedIndex < 0 || !quickLogRows[quickLogSelectedIndex]) {
        logToConsole(t('quickLogNoRowSelected'), 'warning');
        return;
    }
    const selectedRow = quickLogRows[quickLogSelectedIndex];
    const isMesTraceRow = selectedRow._QuickLogSource === 'mesTrace' || isQuickLogMesTraceMode();
    const rowModelName = String(selectedRow._QuickLogModel || '').trim();
    const model = rowModelName ? getQuickLogModel(rowModelName) : getQuickLogSelectedModel();
    if (!isMesTraceRow && (!model || (!model.path && !model.resolvedPath))) {
        logToConsole(`Model path not configured for open-log: ${rowModelName || getQuickLogSelectedModelName()}`, 'error');
        return;
    }
    const skipByConfig = await shouldQuickLogSkipOpenByLocalStationConfig(selectedRow, model && model.name);
    // Bypass frontend block and always try calling backend
    // if (skipByConfig) return;
    if (isMesTraceRow && !selectedRow.canOpenLog) {
        const message = getQuickLogLocalStationMissingMessage();
        logToConsole(message, 'warning');
        showImportantToast('error', t('reqFailed'), message);
        return;
    }
    try {
        setQuickLogOpenLogLoading(true);
        logToConsole(`Opening ${isMesTraceRow ? 'MES Trace' : 'QuickLog'} log file...`, 'system');
        const endpoint = isMesTraceRow ? '/api/quicklog/mes-trace/open-log' : '/api/quicklog/open-log';
        const body = isMesTraceRow ? { row: selectedRow } : {
            model: model.name,
            base: model.resolvedPath || model.path,
            project: model.project || model.name,
            fixture: model.fixture || 'J01',
            row: selectedRow,
        };
        const response = await fetchRetry(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }, 1);
        const data = await response.json();
        if (!response.ok || !data.success) {
            const message = getQuickLogOpenLogNotFoundMessage(isMesTraceRow, data);
            throw createBackendError(data, message);
        }
        const extra = isMesTraceRow && data.resultPriority ? ` | priority=${data.resultPriority} | scannedDirs=${data.scannedDirs ?? '-'} | fromCache=${data.fromCache ?? '-'}` : '';
        logToConsole(`Opened log: <b>${data.path}</b>${extra}`, 'success');
        if (data.opened) {
            showImportantToast('success', t('success'), t('quickLogOpenLogSuccess') || 'Opened successfully');
        } else if (data.content && typeof showLogContentModal !== 'undefined') {
            showLogContentModal(data.path || 'Unknown', data.content);
        }
    } catch (err) {
        logToConsole(`Open log failed: ${err.message || err}`, 'error');
        showImportantToast('error', t('reqFailed'), err.message || String(err));
    } finally {
        setQuickLogOpenLogLoading(false);
    }
}
function setQuickLogReportControlsVisibility() {
    const hideReportControls = activeModule === 'quicklog' || isMesDailyDefectDailyActive();
    const outputSection = inputOutput ? inputOutput.closest('section') : null;
    if (outputSection) outputSection.classList.toggle('hidden', hideReportControls);
    const actionSection = btnGenerate ? btnGenerate.closest('section') : null;
    if (actionSection) actionSection.classList.toggle('hidden', hideReportControls);
    if (!actionSection) {
        if (btnGenerate) btnGenerate.classList.toggle('hidden', hideReportControls);
        if (btnClear) btnClear.classList.toggle('hidden', hideReportControls);
    }
}


function clcaEscapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function isValidUploadFile(file) {
    return !!file && typeof file === 'object' && typeof file.name === 'string' && file.name.trim() !== '';
}
function normalizeUploadFileList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(isValidUploadFile);
    if (typeof value !== 'string' && typeof value.length === 'number' && typeof value.item === 'function') return Array.from(value).filter(isValidUploadFile);
    return isValidUploadFile(value) ? [value] : [];
}
function getClcaDataFiles() {
    const state = stateByModule.clca || getActiveState();
    return normalizeUploadFileList(state.files?.dataFiles || state.files?.data || null);
}
function getClcaFileKey(file) {
    return isValidUploadFile(file) ? `${file.name || ''}__${file.size || 0}__${file.lastModified || 0}` : '';
}
function mergeClcaFileLists(existingFiles = [], newFiles = []) {
    const out = [];
    const seen = new Set();
    [...normalizeUploadFileList(existingFiles), ...normalizeUploadFileList(newFiles)].forEach((file) => {
        const key = getClcaFileKey(file) || file.name;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(file);
    });
    return out;
}
function ensureClcaSheetPrefixState() {
    const state = stateByModule.clca || getActiveState();
    if (!state.mergeSheetPrefixes || typeof state.mergeSheetPrefixes !== 'object') state.mergeSheetPrefixes = {};
    return state.mergeSheetPrefixes;
}
function updateClcaDataFileDisplay() {
    if (activeModule !== 'clca') return;
    const files = getClcaDataFiles();
    const nameEl = document.getElementById('name-data');
    const icon = document.getElementById('icon-data');
    if (nameEl) {
        nameEl.textContent = files.length > 1 ? `${files.length} files selected: ${files.map((file) => file.name || '(unnamed)').join(', ')}` : files.length === 1 ? files[0].name : `${t('noFile')} (xlsx,xls)`;
        nameEl.classList.toggle('text-textMuted', !files.length);
        nameEl.classList.toggle('dark:text-gray-400', !files.length);
        nameEl.classList.toggle('text-textMain', !!files.length);
        nameEl.classList.toggle('dark:text-textDark', !!files.length);
        nameEl.classList.toggle('font-medium', !!files.length);
    }
    if (icon) {
        icon.classList.toggle('opacity-0', !files.length);
        icon.classList.toggle('opacity-100', !!files.length);
    }
}
function removeClcaDataFile(fileKey) {
    if (activeModule !== 'clca') return;
    const state = getActiveState();
    const files = getClcaDataFiles().filter((file) => getClcaFileKey(file) !== fileKey);
    if (files.length) { state.files.data = files[0]; state.files.dataFiles = files; }
    else { delete state.files.data; delete state.files.dataFiles; const fileInput = document.getElementById('input-data'); if (fileInput) fileInput.value = ''; }
    const prefixes = ensureClcaSheetPrefixState();
    Object.keys(prefixes).forEach((name) => { if (!files.some((file) => file.name === name)) delete prefixes[name]; });
    updateClcaDataFileDisplay(); renderClcaMergeRenamePanel(); updateStatus(); runClcaPrecheck(files);
}

function getClcaPrecheckMeta(file) {
    return clcaPrecheckByKey[getClcaFileKey(file)] || null;
}
function renderClcaPrecheckStatus(meta) {
    if (!meta) return '<span class="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 dark:bg-gray-800 text-textMuted dark:text-gray-400">Pending</span>';
    if (meta.loading) return '<span class="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300">Checking...</span>';
    if (meta.error) return `<span class="inline-flex items-center px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300" title="${clcaEscapeHtml(meta.error)}">Error</span>`;
    if (meta.ok) return '<span class="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300">OK</span>';
    return '<span class="inline-flex items-center px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300">Missing</span>';
}
function summarizeClcaPrecheck(meta) {
    if (!meta || meta.loading) return '—';
    if (meta.error) return meta.error;
    const parts = [];
    if (meta.missingSheets && meta.missingSheets.length) parts.push(`Missing sheets: ${meta.missingSheets.join(', ')}`);
    if (meta.missingDataColumns && meta.missingDataColumns.length) parts.push(`Data cols: ${meta.missingDataColumns.join(', ')}`);
    if (meta.missingDetailColumns && meta.missingDetailColumns.length) parts.push(`Detail cols: ${meta.missingDetailColumns.join(', ')}`);
    if (!parts.length && meta.missingRecommendedColumns && meta.missingRecommendedColumns.length) parts.push(`Optional cols missing: ${meta.missingRecommendedColumns.join(', ')}`);
    return parts.length ? parts.join(' | ') : 'Ready';
}
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
function runClcaPrecheck(files = getClcaDataFiles()) {
    if (activeModule !== 'clca') return;
    normalizeUploadFileList(files).forEach((file) => precheckOneClcaFile(file));
}

function renderClcaMergeRenamePanel() {
    if (activeModule !== 'clca') return;
    const panel = document.getElementById('clca-merge-rename-panel');
    if (!panel) return;
    const files = getClcaDataFiles();
    const prefixes = ensureClcaSheetPrefixState();
    const activeKeys = new Set(files.map((file) => getClcaFileKey(file)));
    Object.keys(clcaPrecheckByKey).forEach((key) => { if (!activeKeys.has(key)) delete clcaPrecheckByKey[key]; });
    const activeNames = new Set(files.map((file) => file.name));
    Object.keys(prefixes).forEach((name) => { if (!activeNames.has(name)) delete prefixes[name]; });
    if (!files.length) { panel.innerHTML = ''; panel.classList.add('hidden'); return; }
    panel.classList.remove('hidden');
    const rows = files.map((file, index) => {
        const keyRaw = getClcaFileKey(file);
        const key = clcaEscapeHtml(keyRaw);
        const safeName = clcaEscapeHtml(file.name || '(unnamed)');
        const meta = getClcaPrecheckMeta(file);
        const modelWo = meta && !meta.loading && !meta.error ? `${meta.model || '—'} / ${meta.workOrder || '—'}` : '—';
        const stationMatch = meta && !meta.loading && !meta.error && meta.stationSelectedCount ? `${meta.stationMatchedCount}/${meta.stationSelectedCount}` : '—';
        const mergePossible = meta && !meta.loading && !meta.error ? (meta.mergePossible ? 'Yes' : 'No') : '—';
        const detailTitle = clcaEscapeHtml(summarizeClcaPrecheck(meta));
        return `<tr class="clca-file-row border-b border-borderLight dark:border-borderDark last:border-b-0" data-clca-prefix-row="${index}">
            <td class="px-3 py-2 max-w-[220px]"><div class="truncate font-medium text-textMain dark:text-textDark" title="${safeName}">${safeName}</div><div class="text-[11px] text-textMuted dark:text-gray-500 truncate" title="${detailTitle}">${detailTitle}</div></td>
            <td class="px-3 py-2 whitespace-nowrap">${renderClcaPrecheckStatus(meta)}</td>
            <td class="px-3 py-2 whitespace-nowrap text-textMuted dark:text-gray-400">${clcaEscapeHtml(modelWo)}</td>
            <td class="px-3 py-2 whitespace-nowrap text-textMuted dark:text-gray-400">${clcaEscapeHtml(stationMatch)}</td>
            <td class="px-3 py-2 whitespace-nowrap text-textMuted dark:text-gray-400">${mergePossible}</td>
            <td class="px-3 py-2 min-w-[160px]"><input type="text" class="clca-sheet-prefix-input w-full text-xs px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-textMain dark:text-textDark" data-file-name="${safeName}" value="${clcaEscapeHtml(prefixes[file.name] || '')}" placeholder="FATP / Rear FPC / 8 Bay Dock"></td>
            <td class="px-3 py-2 text-right"><button type="button" class="clca-remove-file-btn inline-flex items-center justify-center w-8 h-8 rounded-lg border border-borderLight dark:border-borderDark text-textMuted dark:text-gray-400 hover:text-red-500 hover:border-red-300" data-file-key="${key}" title="${t('clcaRemoveFile')}"><i data-lucide="x" class="w-4 h-4"></i></button></td>
        </tr>`;
    }).join('');
    panel.innerHTML = `<div class="rounded-xl border border-borderLight dark:border-borderDark bg-white/45 dark:bg-gray-900/25 overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-3 py-2 border-b border-borderLight dark:border-borderDark">
            <div><div class="text-xs font-semibold text-textMain dark:text-textDark">${t('clcaPrecheckTitle')}</div><div class="text-[11px] text-textMuted dark:text-gray-400">${t('clcaPrecheckSubtitle')}</div></div>
            <div class="text-[11px] text-textMuted dark:text-gray-400">${formatCountText('clcaFileCount', files.length)}</div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
                <thead class="text-textMuted dark:text-gray-400 bg-white/40 dark:bg-gray-800/30">
                    <tr><th class="px-3 py-2">${t('clcaFileNameHeader')}</th><th class="px-3 py-2">${t('clcaStatusHeader')}</th><th class="px-3 py-2">${t('clcaModelWoHeader')}</th><th class="px-3 py-2">${t('clcaStationMatchedHeader')}</th><th class="px-3 py-2">${t('clcaMergePossibleHeader')}</th><th class="px-3 py-2">${t('clcaSheetPrefixHeader')}</th><th class="px-3 py-2"></th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
    panel.querySelectorAll('.clca-sheet-prefix-input').forEach((input) => input.addEventListener('input', () => { prefixes[input.dataset.fileName] = input.value; }));
    panel.querySelectorAll('.clca-remove-file-btn').forEach((btn) => btn.addEventListener('click', () => removeClcaDataFile(btn.dataset.fileKey || '')));
    _refreshIcons(panel);
}
function getClcaSheetPrefixesPayload(files = getClcaDataFiles()) {
    const prefixes = ensureClcaSheetPrefixState();
    return normalizeUploadFileList(files).map((file) => ({ fileName: file.name, prefix: String(prefixes[file.name] || '').trim() }));
}

function renderFileCards() {
    const module = MODULES[activeModule];
    if (activeModule === 'quicklog') {
        renderQuickLogPanel();
        return;
    }
    const moduleState = getActiveState();
    const useSingleInputLayout = Boolean(module.singleInputLayout) && module.fields.length === 1;

    fileCards.classList.toggle('single-input-layout', useSingleInputLayout);

    fileCards.innerHTML = module.fields.map((field) => {
        const storedValue = moduleState.files[`${field.key}Files`] || moduleState.files[field.key] || null;
        const files = normalizeUploadFileList(storedValue);
        const acceptedFormats = (field.accept || '')
            .split(',')
            .map((value) => value.trim().replace(/^\./, '').toLowerCase())
            .filter(Boolean);
        const formatLabel = acceptedFormats.length ? ` (${acceptedFormats.join(',')})` : '';
        let nameText = `${t('noFile')}${formatLabel}`;
        if (files.length === 1) {
            nameText = files[0].name;
        } else if (files.length > 1) {
            nameText = `${files.length} files selected: ${files.map((f) => f.name || '(unnamed)').join(', ')}`;
        }
        const nameClass = files.length
            ? 'text-textMain dark:text-textDark font-medium'
            : 'text-textMuted dark:text-gray-400';
        const optionalText = field.required ? '' : `<span class="text-xs font-normal text-textMuted dark:text-gray-400">${field.optional[currentLang]}</span>`;
        const isClcaDataField = activeModule === 'clca' && field.key === 'data';
        return `
            <div class="glass-card group relative rounded-xl border border-borderLight dark:border-borderDark transition-all duration-200 hover:shadow-glass-hover flex flex-col h-full overflow-hidden" data-clca-file-card="${isClcaDataField ? 'true' : 'false'}">
                <div class="h-1.5 bg-gradient-to-r ${field.grad}"></div>
                <div class="p-6 flex flex-col flex-1">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="p-2 rounded-lg bg-light dark:bg-gray-800 text-primary">
                                <i data-lucide="${field.icon}" class="w-5 h-5"></i>
                            </div>
                            <h2 class="font-semibold text-primary dark:text-secondary font-display">${field.label[currentLang]} ${optionalText}</h2>
                        </div>
                        <i data-lucide="check-circle-2" id="icon-${field.key}" class="w-5 h-5 text-status-success ${files.length ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300"></i>
                    </div>
                    <p class="text-sm mb-4 flex-1 ${nameClass}" id="name-${field.key}">${nameText}</p>

                    <input type="file" id="input-${field.key}" class="hidden" accept="${field.accept || ''}" ${field.multiple ? 'multiple' : ''}>

                    ${isClcaDataField ? `
                        <button type="button" data-file-trigger="${field.key}" data-clca-drop-zone="true" class="w-full rounded-2xl border border-dashed border-primary/30 dark:border-secondary/30 bg-white/45 dark:bg-gray-900/25 px-5 py-5 text-center cursor-pointer transition-all duration-200 hover:border-primary/60 dark:hover:border-secondary/60 hover:bg-primary/5 dark:hover:bg-secondary/10 hover:shadow-[0_10px_28px_rgba(0,118,182,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                            <div class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary transition-transform duration-200">
                                <i data-lucide="upload-cloud" class="w-5 h-5"></i>
                            </div>
                            <div data-drop-title="true" class="text-sm font-semibold text-textMain dark:text-textDark">${t('clcaDropHint')}</div>
                            <div class="mt-1 text-xs text-textMuted dark:text-gray-400">${t('clcaDropSub')}</div>
                        </button>
                        <div class="mt-4 text-xs text-textMuted dark:text-gray-400" style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:16px;">
                            <label class="select-none cursor-pointer" style="display:inline-flex;align-items:center;gap:8px;min-width:0;max-width:calc(100% - 160px);">
                                <input type="checkbox" id="clca-merge-all" class="w-4 h-4 rounded border-borderLight dark:border-borderDark accent-primary" style="flex:0 0 auto;" ${moduleState.mergeAll ? 'checked' : ''}>
                                <span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t('clcaMergeAllLabel')}</span>
                            </label>
                            <label class="select-none cursor-pointer" style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap;flex:0 0 auto;margin-left:auto;">
                                <input type="checkbox" id="clca-use-csn-mapping" class="w-4 h-4 rounded border-borderLight dark:border-borderDark accent-primary" style="flex:0 0 auto;" ${moduleState.useCsnMapping ? 'checked' : ''}>
                                <span>${t('clcaCsnMappingLabel')}</span>
                            </label>
                        </div>
                        <div id="clca-merge-rename-panel" class="mt-4 hidden"></div>
                    ` : `
                        <button type="button" data-file-trigger="${field.key}" class="file-select-btn w-full py-2.5 px-4 rounded-full border border-borderLight dark:border-borderDark text-sm font-medium hover:bg-light dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">${t('selectFile') || 'Select File'}</button>
                    `}
                </div>
            </div>
        `;
    }).join('');

    module.fields.forEach((field) => {
        const trigger = fileCards.querySelector(`[data-file-trigger="${field.key}"]`);
        const input = document.getElementById(`input-${field.key}`);
        if (trigger && input) {
            trigger.addEventListener('click', () => {
                input.click();
            });
            input.addEventListener('change', (e) => handleFileSelect(field.key, e));
        }

        // UI-only drag & drop support for CLCA Data File, focused on the drop label/zone.
        if (activeModule === 'clca' && field.key === 'data' && input) {
            const card = input.closest('.glass-card');
            const dropZone = fileCards.querySelector('[data-clca-drop-zone="true"]');
            const dropTitle = dropZone ? dropZone.querySelector('[data-drop-title="true"]') : null;
            const defaultDropTitle = dropTitle ? dropTitle.textContent : '';

            const setDragActive = (active) => {
                if (card) {
                    card.classList.toggle('ring-2', active);
                    card.classList.toggle('ring-primary/30', active);
                    card.classList.toggle('dark:ring-secondary/30', active);
                    card.style.transform = active ? 'translateY(-2px)' : '';
                    card.style.boxShadow = active
                        ? '0 18px 46px rgba(0,118,182,0.16), 0 0 0 1px rgba(34,211,238,0.18)'
                        : '';
                }
                if (dropZone) {
                    dropZone.classList.toggle('border-primary', active);
                    dropZone.classList.toggle('dark:border-secondary', active);
                    dropZone.classList.toggle('bg-primary/10', active);
                    dropZone.classList.toggle('dark:bg-secondary/10', active);
                    dropZone.style.transform = active ? 'scale(1.01)' : '';
                    dropZone.style.boxShadow = active ? 'inset 0 0 0 1px rgba(0,118,182,0.18), 0 14px 30px rgba(0,118,182,0.10)' : '';
                }
                if (dropTitle) {
                    dropTitle.textContent = active ? t('clcaDragActive') : defaultDropTitle;
                }
            };

            const handleDrag = (event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragActive(true);
            };
            const handleDragLeave = (event) => {
                event.preventDefault();
                event.stopPropagation();
                const related = event.relatedTarget;
                if (dropZone && related && dropZone.contains(related)) return;
                setDragActive(false);
            };
            const handleDrop = (event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragActive(false);
                const droppedFiles = Array.from(event.dataTransfer?.files || []);
                if (!droppedFiles.length) return;
                handleFileSelect(field.key, { target: { files: droppedFiles } });
            };

            [card, dropZone].filter(Boolean).forEach((target) => {
                target.addEventListener('dragenter', handleDrag);
                target.addEventListener('dragover', handleDrag);
                target.addEventListener('dragleave', handleDragLeave);
                target.addEventListener('drop', handleDrop);
            });
        }
    });

    // UI-only CLCA checkbox states.
    if (activeModule === 'clca') {
        const mergeCheck = document.getElementById('clca-merge-all');
        if (mergeCheck) {
            mergeCheck.addEventListener('change', () => {
                getActiveState().mergeAll = mergeCheck.checked;
                renderClcaMergeRenamePanel();
                updateStatus();
                logToConsole(`CLCA merge mode: <b>${mergeCheck.checked ? 'ON' : 'OFF'}</b>`, 'system');
            });
        }

        const csnMappingCheck = document.getElementById('clca-use-csn-mapping');
        if (csnMappingCheck) {
            csnMappingCheck.addEventListener('change', () => {
                getActiveState().useCsnMapping = csnMappingCheck.checked;
                logToConsole(`CSN mapping: <b>${csnMappingCheck.checked ? 'ON' : 'OFF'}</b>`, 'system');
            });
        }
    }

    renderClcaMergeRenamePanel();
    _refreshIcons(fileCards);
}

function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        const value = t(key);
        if (value) el.textContent = value;
    });

    toastTitle.textContent = t('toastTitle');
    toastMsg.textContent = t('toastMsg');
    updateModuleUiVisibility();
    initMesTimePickers();
    updateMesRequirementRowText();

    landingLangEn.classList.toggle('active', currentLang === 'en');
    landingLangCn.classList.toggle('active', currentLang === 'cn');
    if (langToggleEn) langToggleEn.classList.toggle('active', currentLang === 'en');
    if (langToggleCn) langToggleCn.classList.toggle('active', currentLang === 'cn');

    ['feat1-title','feat1-sub','feat2-title','feat2-sub','feat3-title','feat3-sub'].forEach((id, i) => {
        const keys = ['feat1Title','feat1Sub','feat2Title','feat2Sub','feat3Title','feat3Sub'];
        const el = document.getElementById(id);
        if (el) el.textContent = t(keys[i]);
    });

    renderLandingModules();
    renderSidebar();
    if (landingView.classList.contains('hidden')) {
        if (activeModule === 'quicklog') {
            applyQuickLogLanguageNoAnimation();
            return;
        }
        updateModuleHeader();
        renderStationCheckboxes(false);
        updateMesRequirementRowText();
        if (activeModule === 'mesdaily') { ensureMesDailyFeatureTabs(); ensureMesR001Panel(); initMesR001TimePickers(); }
        if (activeModule === 'clca') {
            updateClcaLocalizedText();
            updateClcaDataFileDisplay();
            renderClcaMergeRenamePanel();
        }
        updateStatus();
        return;
    }
    renderFileCards();
    updateModuleHeader();
    renderStationCheckboxes(false);
    updateStatus();
}

function updateModuleHeader() {
    const mod = MODULES[activeModule];
    moduleTitle.textContent = mod.title[currentLang];
    updateModuleUiVisibility();
    
    const btnSettings = document.getElementById('btn-settings-toggle');
    if (btnSettings) {
        btnSettings.classList.remove('hidden');
    }
}

function setLanguage(lang) {
    if (!LANG[lang]) return;
    currentLang = lang;
    localStorage.setItem('clca_lang', currentLang);
    if (activeModule === 'quicklog' && landingView.classList.contains('hidden')) {
        applyQuickLogLanguageNoAnimation();
        return;
    }
    // Crossfade text on module cards when switching language on landing
    if (!landingView.classList.contains('hidden') && selectedLandingModule !== 'quicklog') {
        const textEls = landingModuleGrid.querySelectorAll('.landing-module-label, .module-choice-card p, .module-choice-card .uppercase');
        textEls.forEach(el => { el.style.transition = 'opacity 0.35s ease'; el.style.opacity = '0'; });
        setTimeout(() => {
            applyLanguage();
            requestAnimationFrame(() => {
                const freshEls = landingModuleGrid.querySelectorAll('.landing-module-label, .module-choice-card p, .module-choice-card .uppercase');
                freshEls.forEach(el => { el.style.opacity = '0'; el.style.transition = 'opacity 0.45s ease'; });
                requestAnimationFrame(() => freshEls.forEach(el => { el.style.opacity = '1'; }));
            });
        }, 350);
    } else {
        applyLanguage();
    }
}

function openSidebar() {
    workspaceSidebar.classList.remove('-translate-x-full');
    sidebarBackdrop.classList.remove('hidden', 'opacity-0');
    sidebarBackdrop.classList.add('opacity-100');
}

function closeSidebar() {
    workspaceSidebar.classList.add('-translate-x-full');
    sidebarBackdrop.classList.add('opacity-0');
    setTimeout(() => sidebarBackdrop.classList.add('hidden'), 300);
}

function isSidebarPinned() {
    return window.innerWidth >= 1024;
}

function backToLanding() {
    workspaceView.classList.add('hidden');
    statusFooter.classList.add('hidden');
    landingView.classList.remove('hidden');
    closeSidebar();
    selectedLandingModule = null; // clear pre-selection so no card is highlighted
    renderLandingModules();
    applyLanguage();
}

function enterWorkspace() {
    // Reset file state for all modules on every workspace entry
    Object.keys(MODULES).forEach((key) => { stateByModule[key].files = {}; });
    activeModule = selectedLandingModule || activeModule || 'clca';
    if (!isModuleEnabled(activeModule)) activeModule = getEnabledModules()[0]?.id || 'clca';
    resetNonPersistentModuleState(activeModule);
    landingView.classList.add('hidden');
    workspaceView.classList.remove('hidden');
    statusFooter.classList.remove('hidden');
    updateModuleHeader();
    renderSidebar();
    renderFileCards();
    setQuickLogReportControlsVisibility();
    restoreOutputPathForActiveModule();
    restoreStationsForActiveModule();
    updateStatus();
    logToConsole(`${t('moduleChanged')} <b>${moduleLabel(activeModule)}</b>`, 'system');
    dismissLoadingScreen();
}

function switchModule(moduleId) {
    if (!isModuleEnabled(moduleId) || moduleId === activeModule) return;
    saveOutputPathForActiveModule();
    persistStationsForActiveModule();
    workspaceView.classList.add('module-switching');
    activeModule = moduleId;
    resetNonPersistentModuleState(activeModule);
    activePreset = null;
    updateModuleHeader();
    renderSidebar();
    renderFileCards();
    setQuickLogReportControlsVisibility();
    restoreOutputPathForActiveModule();
    restoreStationsForActiveModule();
    hideGrrResult();
    hideToast();
    updateStatus();
    logToConsole(`${t('moduleChanged')} <b>${moduleLabel(activeModule)}</b>`, 'system');
    setTimeout(() => workspaceView.classList.remove('module-switching'), 300);
    // Close sidebar on mobile after selecting module
    if (!isSidebarPinned()) closeSidebar();
}

function saveOutputPathForActiveModule() {
    const module = MODULES[activeModule];
    const value = String(inputOutput.value || '').trim();
    stateByModule[activeModule].output = value;
    if (value) localStorage.setItem(module.outputKey, value);
}

function restoreOutputPathForActiveModule() {
    const module = MODULES[activeModule];
    const localVal = String(localStorage.getItem(module.outputKey) || '').trim();
    const memoryVal = String(stateByModule[activeModule].output || '').trim();
    inputOutput.value = memoryVal || localVal || '';
    if (activeModule === 'mesdaily') updateMesOutputNameFromRange();
}

function persistStationsForActiveModule() {
    if (activeModule === 'clca' || activeModule === 'mesdaily') {
        try { localStorage.removeItem(MODULES[activeModule].stationKey); } catch (_) {}
        return;
    }
    const module = MODULES[activeModule];
    localStorage.setItem(module.stationKey, JSON.stringify([...getSelectedStations()]));
}

function restoreStationsForActiveModule() {
    if (activeModule === 'clca' || activeModule === 'mesdaily') {
        try { localStorage.removeItem(MODULES[activeModule].stationKey); } catch (_) {}
        setStationSelection([], false);
        return;
    }
    const module = MODULES[activeModule];
    const saved = localStorage.getItem(module.stationKey);
    if (saved !== null) {
        try {
            const arr = JSON.parse(saved);
            if (Array.isArray(arr)) {
                setStationSelection(arr, false);
                return;
            }
        } catch (_) {}
    }
    renderStationCheckboxes(false);
}

function logToConsole(message, type = 'info') {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const row = document.createElement('div');
    let colorClass = 'text-gray-300';
    if (type === 'success') colorClass = 'text-status-success';
    if (type === 'error') colorClass = 'text-status-error';
    if (type === 'warning') colorClass = 'text-status-warning';
    if (type === 'system') colorClass = 'text-gray-500';
    row.className = colorClass;
    row.innerHTML = `<span class="text-gray-500">[${timeString}]</span> ${message}`;
    consoleOutput.appendChild(row);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function appendBackendLogs(logs = []) {
    if (!Array.isArray(logs)) return;
    logs.forEach((entry) => {
        String(entry || '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => {
                const lowered = line.toLowerCase();
                const type = lowered.includes('error')
                    ? 'error'
                    : lowered.includes('warn')
                        ? 'warning'
                        : 'system';
                logToConsole(line, type);
            });
    });
}

function extractModelName(value) {
    if (!value) return '';
    const raw = String(value).trim();
    if (!raw) return '';
    const idx = raw.indexOf('_');
    return idx > 0 ? raw.substring(0, idx) : raw;
}

function buildAutoOutputName(moduleId, modelValue) {
    const model = extractModelName(modelValue);
    if (!model) return '';
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const reportLabel = 'CLCA Report';
    return `${model} ${reportLabel} ${mm}.${dd}.xlsx`;
}

function buildGrrFinalOutputName(fileName) {
    const raw = String(fileName || '').trim();
    if (!raw) return '';
    const base = raw.replace(/\.[^.]+$/, '');
    return `${base} Final.csv`;
}

async function fetchModelNameFromDataFile(file) {
    if (!file) return '';
    const formData = new FormData();
    formData.append('data', file);
    const response = await fetchRetry('/api/inspect-model', { method: 'POST', body: formData }, 1);
    const result = await response.json();
    if (!response.ok || !result.success || !result.model) {
        throw createBackendError(result, 'Cannot read MODEL_NAME from data file.');
    }
    return String(result.model).trim();
}

async function updateOutputNameFromData() {
    if (activeModule !== 'clca') return;
    const dataFile = getActiveState().files.data;
    if (!dataFile) return;
    try {
        const modelValue = await fetchModelNameFromDataFile(dataFile);
        const autoName = buildAutoOutputName(activeModule, modelValue);
        if (!autoName) return;
        const currentPath = String(inputOutput.value || '').trim();
        if (currentPath) {
            const sepIdx = Math.max(currentPath.lastIndexOf('\\'), currentPath.lastIndexOf('/'));
            if (sepIdx >= 0) {
                const dir = currentPath.substring(0, sepIdx + 1);
                inputOutput.value = dir + autoName;
            } else {
                inputOutput.value = autoName;
            }
        } else {
            inputOutput.value = autoName;
        }
        saveOutputPathForActiveModule();
        logToConsole(`Output filename auto-set to: <b>${autoName}</b>`, 'info');
    } catch (error) {
        logToConsole(`Cannot parse MODEL_NAME from data file: ${error.message || error}`, 'warning');
    }
}

function updateOutputNameFromGrrInput(file) {
    if (activeModule !== 'grrprep' || !file) return;
    const autoName = buildGrrFinalOutputName(file.name);
    if (!autoName) return;

    const currentPath = String(inputOutput.value || '').trim();
    if (currentPath) {
        const sepIdx = Math.max(currentPath.lastIndexOf('\\'), currentPath.lastIndexOf('/'));
        if (sepIdx >= 0) {
            const dir = currentPath.substring(0, sepIdx + 1);
            inputOutput.value = dir + autoName;
        } else {
            inputOutput.value = autoName;
        }
    } else {
        inputOutput.value = autoName;
    }

    saveOutputPathForActiveModule();
    logToConsole(`Output filename auto-set to: <b>${autoName}</b>`, 'info');
}

async function inspectStationsFromFile(file) {
    if (!isValidUploadFile(file)) return { matched: [], unmatched: [], fileName: '(invalid)' };
    const formData = new FormData();
    formData.append('data', file);
    const response = await fetchRetry('/api/inspect-stations', { method: 'POST', body: formData }, 1);
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw createBackendError(result, `Inspect stations failed for ${file.name}`);
    }
    return {
        matched: Array.isArray(result.matched) ? result.matched : [],
        unmatched: Array.isArray(result.unmatched) ? result.unmatched : [],
        fileName: file.name,
    };
}

async function autoDetectStations(fileOrFiles) {
    const files = normalizeUploadFileList(fileOrFiles);
    if (!files.length) return;

    try {
        const unionMatched = [];
        const unionUnmatched = [];
        const seenMatched = new Set();
        const seenUnmatched = new Set();
        const perFileSummaries = [];

        for (const file of files) {
            const result = await inspectStationsFromFile(file);
            const matched = result.matched || [];
            const unmatched = result.unmatched || [];

            matched.forEach((station) => {
                if (!seenMatched.has(station)) {
                    seenMatched.add(station);
                    unionMatched.push(station);
                }
            });

            unmatched.forEach((station) => {
                if (!seenUnmatched.has(station)) {
                    seenUnmatched.add(station);
                    unionUnmatched.push(station);
                }
            });

            perFileSummaries.push(`${result.fileName}: matched=${matched.length}, new=${unmatched.length}`);
        }

        // Auto-add unmatched PROCESS_NAME values as new stations
        if (unionUnmatched.length > 0) {
            try {
                const currentStations = [...allStations];
                const newStations = unionUnmatched.filter(s => !currentStations.includes(s));
                if (newStations.length > 0) {
                    const merged = [...currentStations, ...newStations];
                    const res = await fetch('/api/stations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stations: merged })
                    });
                    const json = await res.json();
                    if (json.success) {
                        logToConsole(
                            `Auto-added <b>${newStations.length}</b> new station(s) to config: ${newStations.join(', ')}`,
                            'info'
                        );
                        // Reload stations grid so new stations appear and can be filtered
                        await loadStations();
                        // After reload, select matched + newly added unmatched
                        const allToSelect = [...unionMatched, ...newStations];
                        activePreset = null;
                        setStationSelection(allToSelect, true);
                        logToConsole(
                            `Auto-selected <b>${allToSelect.length}</b> station(s): ${allToSelect.join(', ')}`,
                            'info'
                        );
                        logToConsole(`Station detect per file: ${perFileSummaries.join(' | ')}`, 'system');
                        return;
                    } else {
                        logToConsole(`Failed to save new stations: ${json.error}`, 'warning');
                    }
                } else {
                    logToConsole(`Unmatched processes (already in config): ${unionUnmatched.join(', ')}`, 'system');
                }
            } catch (addErr) {
                logToConsole(`Auto-add stations failed: ${addErr.message || addErr}`, 'warning');
            }
        }

        if (!unionMatched.length && !unionUnmatched.length) {
            logToConsole(`No matching stations found in ${files.length} data file(s).`, 'warning');
            return;
        }

        if (unionMatched.length) {
            activePreset = null;
            setStationSelection(unionMatched, true);
            logToConsole(
                `Auto-selected <b>${unionMatched.length}</b> station(s) from <b>${files.length}</b> data file(s): ${unionMatched.join(', ')}`,
                'info'
            );
        }
        logToConsole(`Station detect per file: ${perFileSummaries.join(' | ')}`, 'system');

        if (unionUnmatched.length) {
            logToConsole(`Unmatched processes in data files: ${unionUnmatched.join(', ')}`, 'warning');
        }
    } catch (err) {
        logToConsole(`Station auto-detect skipped: ${err.message || err}`, 'warning');
    }
}


function handleFileSelect(fieldKey, event) {
    let files = Array.from(event.target.files || []);
    if (!files.length) return;

    const module = MODULES[activeModule];
    const field = module.fields.find((f) => f.key === fieldKey);
    const allowMultiple = Boolean(field && field.multiple);
    const acceptedExts = (field && field.accept ? field.accept : '')
        .split(',')
        .map((ext) => ext.trim().toLowerCase())
        .filter(Boolean);

    if (acceptedExts.length) {
        files = files.filter((file) => {
            const name = String(file.name || '').toLowerCase();
            return acceptedExts.some((ext) => name.endsWith(ext));
        });
    }
    if (!files.length) return;

    const moduleState = getActiveState();

    if (activeModule === 'clca' && fieldKey === 'data' && allowMultiple) {
        files = mergeClcaFileLists(getClcaDataFiles(), files);
    }

    // UI-only multiple file state. Keep files[fieldKey] as the first file so existing generation logic is not changed here.
    moduleState.files[fieldKey] = files[0];
    if (allowMultiple) moduleState.files[`${fieldKey}Files`] = files;

    const nameEl = document.getElementById(`name-${fieldKey}`);
    const icon = document.getElementById(`icon-${fieldKey}`);
    if (nameEl) {
        nameEl.textContent = allowMultiple && files.length > 1
            ? `${files.length} files selected: ${files.map((f) => f.name || '(unnamed)').join(', ')}`
            : files[0].name;
        nameEl.classList.remove('text-textMuted', 'dark:text-gray-400');
        nameEl.classList.add('text-textMain', 'dark:text-textDark', 'font-medium');
    }
    if (icon) {
        icon.classList.remove('opacity-0', 'icon-pop');
        icon.classList.add('opacity-100');
        void icon.offsetWidth;
        icon.classList.add('icon-pop');
    }

    if (allowMultiple && files.length > 1) {
        logToConsole(`Selected ${getFieldDisplayName(fieldKey)}: <b>${files.length}</b> file(s)`, 'info');
        files.forEach((file) => {
            logToConsole(`- ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'system');
        });
    } else {
        logToConsole(`Selected ${getFieldDisplayName(fieldKey)}: <b>${files[0].name}</b> (${(files[0].size / 1024).toFixed(1)} KB)`, 'info');
    }

    updateStatus();
    if (activeModule === 'clca' && fieldKey === 'data') {
        ensureClcaSheetPrefixState();
        updateClcaDataFileDisplay();
        renderClcaMergeRenamePanel();
        runClcaPrecheck(getClcaDataFiles());
        updateOutputNameFromData();
        const clcaFilesForStationDetect = getClcaDataFiles();
        if (clcaFilesForStationDetect.length) autoDetectStations(clcaFilesForStationDetect);
    } else if (activeModule === 'grrprep' && fieldKey === 'data') {
        updateOutputNameFromGrrInput(files[0]);
    }
    if (event.target && typeof event.target.value === 'string') event.target.value = '';
}

async function browseSaveViaDesktopHost(defaultFileName) {
    try {
        const host = window?.chrome?.webview?.hostObjects?.sync?.clcaHost;
        if (!host || typeof host.BrowseSave !== 'function') {
            return { available: false, path: null };
        }
        const selectedPath = host.BrowseSave(defaultFileName);
        const normalizedPath = typeof selectedPath === 'string' ? selectedPath.trim() : '';
        return { available: true, path: normalizedPath || null };
    } catch (error) {
        return { available: true, path: null, error: error?.message || String(error) };
    }
}

const STATUS_COLORS = {
    waiting: 'bg-status-waiting',
    ready: 'bg-status-ready',
    generating: 'bg-status-generating',
    success: 'bg-status-success',
    error: 'bg-status-error'
};

function setStatus(state, message) {
    Object.values(STATUS_COLORS).forEach((color) => {
        statusDot.classList.remove(color);
        statusPing.classList.remove(color);
    });
    statusDot.classList.add(STATUS_COLORS[state]);
    statusPing.classList.add(STATUS_COLORS[state]);
    statusDot.classList.remove('status-slow-throb');
    statusText.textContent = message;
    const forceModulePing = (activeModule === 'mesdaily' || activeModule === 'quicklog') && (state === 'ready' || state === 'waiting' || state === 'generating');
    if (state === 'generating' || state === 'waiting' || forceModulePing) statusPing.classList.remove('hidden');
    else statusPing.classList.add('hidden');
}

function updateStatus() {
    if (workspaceView.classList.contains('hidden')) return;
    if (activeModule === 'quicklog') {
        setStatus('ready', t('quickLogStatusReady'));
        return;
    }
    if (activeModule === 'clca') {
        const clcaFiles = getClcaDataFiles();
        if (clcaFiles.length > 1 && isClcaMultiFileMergeRequired() && !getActiveState().mergeAll) {
            setStatus('waiting', t('multipleFilesRequireMerge'));
            return;
        }
    }
    const module = MODULES[activeModule];
    const moduleState = getActiveState();
    const selectedStations = getSelectedStations();
    const mesRequirementRows = activeModule === 'mesdaily' ? readMesRequirementRows() : [];
    let missing = [];

    if (activeModule === 'mesdaily') {
        const validRequirements = mesRequirementRows.filter(({ wo }) => wo);
        if (validRequirements.length === 0 || hasIncompleteMesRequirements(mesRequirementRows)) {
            missing.push(t('needRequirement'));
        }
    } else {
        missing = module.fields.filter((f) => f.required && !moduleState.files[f.key]).map((f) => f.label[currentLang]);
    }

    const requiresStationSelection = module.needsStations && activeModule !== 'mesdaily';
    if (requiresStationSelection && selectedStations.size === 0) {
        missing.push(t('needStations'));
    }

    if (missing.length === 0) {
        setStatus('ready', t('statusReady'));
    } else {
        setStatus('waiting', `${t('statusNeed')} ${missing.join(' + ')}`);
    }
}

function showProgress() {
    progressContainer.classList.add('active');
    progressBar.classList.add('animating');
    progressBar.style.width = '0%';
    requestAnimationFrame(() => {
        progressBar.style.transition = 'width 5s cubic-bezier(0.4, 0, 0.2, 1)';
        progressBar.style.width = '70%';
    });
    consolePanel.classList.add('console-active-border');
    setTimeout(() => consolePanel.classList.remove('console-active-border'), 1500);
}

function completeProgress() {
    progressBar.style.transition = 'width 0.3s ease-out';
    progressBar.style.width = '100%';
    progressBar.classList.remove('animating');
    setTimeout(() => {
        progressContainer.classList.remove('active');
        progressBar.style.width = '0%';
        progressBar.style.transition = '';
    }, 1000);
}

function resetProgress() {
    progressContainer.classList.remove('active');
    progressBar.classList.remove('animating');
    progressBar.style.width = '0%';
    progressBar.style.transition = '';
}

function getImportantToastMeta(type = 'success') {
    const map = {
        success: { icon: 'check', fg: '#10B981', bg: 'rgba(16, 185, 129, 0.14)', bar: 'linear-gradient(90deg, #10B981, #22D3EE, #8B5CF6)' },
        error: { icon: 'x-circle', fg: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', bar: 'linear-gradient(90deg, #EF4444, #F97316, #EF4444)' },
        warning: { icon: 'x-circle', fg: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', bar: 'linear-gradient(90deg, #EF4444, #F97316, #EF4444)' },
        info: { icon: 'info', fg: '#0076B6', bg: 'rgba(0, 118, 182, 0.14)', bar: 'linear-gradient(90deg, #0076B6, #22D3EE, #8B5CF6)' },
    };
    return map[type] || map.info;
}

function isFailureToastText(title = '', message = '') {
    const text = `${title || ''} ${message || ''}`.toLowerCase();
    return text.includes('failed')
        || text.includes('fail')
        || text.includes('error')
        || text.includes('generation failed')
        || text.includes('multiple files require')
        || text.includes('missing')
        || text.includes('lỗi')
        || text.includes('thất bại')
        || text.includes('生成失败')
        || text.includes('缺少');
}

function normalizeToastType(type = 'info', title = '', message = '') {
    if (type === 'error' || type === 'warning') return 'error';
    if (isFailureToastText(title, message)) return 'error';
    return type === 'success' ? 'success' : 'info';
}

function setImportantStyle(el, prop, value) {
    if (el) el.style.setProperty(prop, value, 'important');
}

function applyToastCardBaseStyle(toastCard) {
    if (!toastCard) return;
    const dark = document.documentElement.classList.contains('dark');
    toastCard.className = 'cloudmetrics-toast-card';
    setImportantStyle(toastCard, 'position', 'relative');
    setImportantStyle(toastCard, 'display', 'flex');
    setImportantStyle(toastCard, 'align-items', 'flex-start');
    setImportantStyle(toastCard, 'gap', '12px');
    setImportantStyle(toastCard, 'width', 'min(384px, calc(100vw - 48px))');
    setImportantStyle(toastCard, 'max-width', '384px');
    setImportantStyle(toastCard, 'min-width', '320px');
    setImportantStyle(toastCard, 'padding', '16px');
    setImportantStyle(toastCard, 'border-radius', '12px');
    setImportantStyle(toastCard, 'overflow', 'hidden');
    setImportantStyle(toastCard, 'background', dark ? '#111B2E' : '#FFFFFF');
    setImportantStyle(toastCard, 'border', dark ? '1px solid #1E3A4F' : '1px solid #C7DFF0');
    setImportantStyle(toastCard, 'box-shadow', dark ? '0 20px 48px rgba(2, 6, 23, 0.60)' : '0 18px 42px rgba(15, 23, 42, 0.20)');
    setImportantStyle(toastCard, 'backdrop-filter', 'none');
    setImportantStyle(toastCard, '-webkit-backdrop-filter', 'none');
    setImportantStyle(toastCard, 'opacity', '1');
    setImportantStyle(toastCard, 'color', dark ? '#E8F4FD' : '#0F172A');
}

function applyToastIconStyle(iconWrap, meta) {
    if (!iconWrap) return;
    iconWrap.className = 'cloudmetrics-toast-icon-wrap';
    setImportantStyle(iconWrap, 'display', 'inline-flex');
    setImportantStyle(iconWrap, 'align-items', 'center');
    setImportantStyle(iconWrap, 'justify-content', 'center');
    setImportantStyle(iconWrap, 'width', '32px');
    setImportantStyle(iconWrap, 'height', '32px');
    setImportantStyle(iconWrap, 'min-width', '32px');
    setImportantStyle(iconWrap, 'min-height', '32px');
    setImportantStyle(iconWrap, 'padding', '6px');
    setImportantStyle(iconWrap, 'margin-top', '2px');
    setImportantStyle(iconWrap, 'border-radius', '9999px');
    setImportantStyle(iconWrap, 'flex', '0 0 auto');
    setImportantStyle(iconWrap, 'background', meta.bg);
    setImportantStyle(iconWrap, 'color', meta.fg);
    setImportantStyle(iconWrap, 'opacity', '1');
    iconWrap.innerHTML = `<i data-lucide="${meta.icon}" class="w-5 h-5"></i>`;
    const icon = iconWrap.querySelector('i');
    setImportantStyle(icon, 'color', meta.fg);
}

function applyToastTextStyle() {
    const dark = document.documentElement.classList.contains('dark');
    setImportantStyle(toastTitle, 'color', dark ? '#E8F4FD' : '#0F172A');
    setImportantStyle(toastTitle, 'font-weight', '700');
    setImportantStyle(toastTitle, 'line-height', '1.25');
    setImportantStyle(toastMsg, 'color', dark ? '#CBD5E1' : '#64748B');
    setImportantStyle(toastMsg, 'line-height', '1.35');
}

function showImportantToast(type = 'info', title = '', message = '') {
    if (toastTimerId) clearTimeout(toastTimerId);

    const normalizedType = normalizeToastType(type, title, message);
    const meta = getImportantToastMeta(normalizedType);
    const toastCard = toast.querySelector(':scope > div');
    const iconWrap = toastCard ? toastCard.querySelector(':scope > div:first-child') : null;
    const countdown = document.getElementById('toast-countdown');

    toastTitle.textContent = title || t('toastTitle');
    toastMsg.textContent = message || t('toastMsg');

    applyToastCardBaseStyle(toastCard);
    applyToastIconStyle(iconWrap, meta);
    applyToastTextStyle();

    if (countdown) {
        countdown.style.animation = 'none';
        setImportantStyle(countdown, 'background', meta.bar);
        setImportantStyle(countdown, 'opacity', '1');
        void countdown.offsetWidth;
        countdown.style.animation = '';
    }

    setImportantStyle(toast, 'z-index', '9999');
    setImportantStyle(toast, 'opacity', '1');
    toast.dataset.type = normalizedType;
    toast.classList.add('toast-show');
    _refreshIcons(toast);
    toastTimerId = setTimeout(hideToast, 5000);
}

function showToast() {
    showImportantToast('success', t('toastTitle'), t('toastMsg'));
}

function hideToast() {
    toast.classList.remove('toast-show');
    if (toastTimerId) {
        clearTimeout(toastTimerId);
        toastTimerId = null;
    }
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

function renderStationCheckboxes(animate) {
    const selectedStations = getSelectedStations();
    const fragment = document.createDocumentFragment();
    allStations.forEach((station, index) => {
        const checked = selectedStations.has(station) ? 'checked' : '';
        const label = document.createElement('label');
        const animClass = animate ? ' station-enter' : '';
        label.className = 'flex items-center gap-1.5 px-2 py-1.5 rounded-md border cursor-pointer transition-all duration-200 text-xs select-none' + animClass + ' '
            + (selectedStations.has(station)
                ? 'border-primary bg-primary/10 dark:border-secondary dark:bg-secondary/10 text-primary dark:text-secondary font-medium'
                : 'border-borderLight dark:border-borderDark hover:bg-light dark:hover:bg-gray-800 text-textMuted dark:text-gray-400');
        if (animate) {
            const delay = Math.min(index * 15, 300);
            label.style.animationDelay = `${delay}ms`;
        }
        label.innerHTML = `<div class="station-check-container"><input type="checkbox" value="${station}"><svg viewBox="0 0 64 64" class="station-check-svg"><path class="station-check-path" d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16"/></svg></div><span class="truncate">${station}</span>`;
        const cb = label.querySelector('input');
        if (selectedStations.has(station)) cb.checked = true;
        const applyCheckedState = (isChecked) => {
            cb.checked = !!isChecked;
            const currentStations = getSelectedStations();
            if (cb.checked) currentStations.add(station);
            else currentStations.delete(station);
            label.className = 'flex items-center gap-1.5 px-2 py-1.5 rounded-md border cursor-pointer transition-all duration-200 text-xs select-none '
                + (cb.checked
                    ? 'border-primary bg-primary/10 dark:border-secondary dark:bg-secondary/10 text-primary dark:text-secondary font-medium'
                    : 'border-borderLight dark:border-borderDark hover:bg-light dark:hover:bg-gray-800 text-textMuted dark:text-gray-400');
            stationCount.textContent = `${getSelectedStations().size} / ${allStations.length}`;
            updateStatus();
            persistStationsForActiveModule();
        };
        // Use one click path to avoid duplicate toggles from mixed label/input events in WebView2.
        label.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            applyCheckedState(!getSelectedStations().has(station));
        });
        fragment.appendChild(label);
    });
    stationGrid.innerHTML = '';
    stationGrid.appendChild(fragment);
    stationCount.textContent = `${selectedStations.size} / ${allStations.length}`;
}

function setStationSelection(stationArray, animate) {
    const aliases = { 'CHECK Test': 'CHECK' };
    const selectedStations = getSelectedStations();
    const newSet = new Set();
    for (const s of stationArray) {
        const normalized = aliases[s] || s;
        if (allStations.includes(normalized)) newSet.add(normalized);
    }
    // Update in-place if grid already has labels so SVG animation fires
    const existingLabels = stationGrid.querySelectorAll('label');
    if (existingLabels.length === allStations.length && existingLabels.length > 0) {
        selectedStations.clear();
        newSet.forEach(s => selectedStations.add(s));
        existingLabels.forEach(label => {
            const cb = label.querySelector('input');
            if (!cb) return;
            const station = cb.value;
            const shouldCheck = newSet.has(station);
            cb.checked = shouldCheck;
            label.className = 'flex items-center gap-1.5 px-2 py-1.5 rounded-md border cursor-pointer transition-all duration-200 text-xs select-none '
                + (shouldCheck
                    ? 'border-primary bg-primary/10 dark:border-secondary dark:bg-secondary/10 text-primary dark:text-secondary font-medium'
                    : 'border-borderLight dark:border-borderDark hover:bg-light dark:hover:bg-gray-800 text-textMuted dark:text-gray-400');
        });
        stationCount.textContent = `${selectedStations.size} / ${allStations.length}`;
    } else {
        selectedStations.clear();
        newSet.forEach(s => selectedStations.add(s));
        renderStationCheckboxes(!!animate);
    }
    updateStatus();
    persistStationsForActiveModule();
}

function applyPresetToggle(presetName) {
    if (activePreset === presetName) {
        // Second click = deselect all
        activePreset = null;
        setStationSelection([], false);
    } else {
        activePreset = presetName;
        // Match stations by prefix first (handles newly added stations)
        const prefix = presetName.toUpperCase();
        const prefixMatched = allStations.filter(s =>
            s.toUpperCase().startsWith(prefix + '_') ||
            s.toUpperCase().startsWith(prefix + ' ') ||
            s.toUpperCase() === prefix
        );
        // Fallback: also include stations listed in the preset config (for stations with different naming)
        const configPreset = stationPresets[presetName] || [];
        const combined = new Set([...prefixMatched, ...configPreset]);
        const finalList = allStations.filter(s => combined.has(s)); // keep original order
        setStationSelection(finalList, false);
    }
}

async function loadStations() {
    try {
        const res = await fetchRetry('/api/stations', { method: 'GET' }, 2);
        const data = await res.json();
        stationPresets = data.presets || {};
        allStations = data.stations || [];
        Object.keys(MODULES).forEach((moduleId) => {
            if (moduleId === 'clca' || moduleId === 'mesdaily') {
                try { localStorage.removeItem(MODULES[moduleId].stationKey); } catch (_) {}
                selectedStationsByModule[moduleId] = new Set();
                return;
            }
            const saved = localStorage.getItem(MODULES[moduleId].stationKey);
            if (!saved) return;
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    selectedStationsByModule[moduleId] = new Set(parsed.filter((s) => allStations.includes(s)));
                }
            } catch (_) {}
        });
        renderStationCheckboxes(true);
        updateStatus();
    } catch (e) {
        logToConsole(`Failed to load stations: ${e.message}`, 'error');
    }
}

function clearInputs() {
    if (activeModule === 'quicklog') {
        clearQuickLogUi();
        updateStatus();
        logToConsole(t('allCleared'), 'warning');
        return;
    }
    const moduleState = getActiveState();
    moduleState.files = {};
    moduleState.output = '';
    moduleState.mergeAll = false;
    moduleState.useCsnMapping = false;
    moduleState.mergeSheetPrefixes = {};
    inputOutput.value = '';
    if (activeModule === 'mesdaily') {
        ['datefrom', 'hourfrom', 'dateto', 'hourto', 'timefrom', 'timeto'].forEach((id) => {
            const el = document.getElementById(`mes-${id}`);
            if (el) el.value = '';
        });
        resetMesRequirementRows();
        localStorage.removeItem(MES_STATE_STORAGE_KEY);
        ensureMesTimeRange(true);
        ensureMesR001TimeRange(true);
        clearMesR001Panel(true);
    }
    activePreset = null;
    setStationSelection([], true);
    renderFileCards();
    hideGrrResult();
    hideToast();
    updateStatus();
    logToConsole(t('allCleared'), 'warning');
}

async function onGenerate() {
    const module = MODULES[activeModule];
    if (activeModule === 'quicklog') {
        logToConsole(t('quickLogUiOnlyNotice'), 'warning');
        setStatus('ready', t('quickLogStatusReady'));
        return;
    }
    const moduleState = getActiveState();
    const selectedStations = getSelectedStations();
    let missingFieldsCount = 0;
    let mesRequirements = [];
    if (activeModule === 'mesdaily') {
        if (isMesDailyDefectDailyActive()) {
            await searchMesR001();
            return;
        }
        ensureMesTimeRange();
        mesRequirements = collectMesRequirements();
        if (!mesRequirements.length || hasIncompleteMesRequirements()) missingFieldsCount = 1;
    } else {
        missingFieldsCount = module.fields.filter((f) => f.required && !moduleState.files[f.key]).length;
    }
    const outputPath = String(inputOutput.value || '').trim();
    const stationList = [...selectedStations];
    const requiresStationSelection = module.needsStations && activeModule !== 'mesdaily';

    if (activeModule === 'clca') {
        const clcaDataFiles = getClcaDataFiles();
        if (clcaDataFiles.length > 1 && isClcaMultiFileMergeRequired() && !moduleState.mergeAll) {
            btnGenerate.classList.add('animate-shake');
            setStatus('error', t('multipleFilesRequireMerge'));
            logToConsole(t('multipleFilesRequireMerge'), 'error');
            showImportantToast('warning', t('genFailed'), t('multipleFilesRequireMerge'));
            setTimeout(() => {
                btnGenerate.classList.remove('animate-shake');
                updateStatus();
            }, 400);
            return;
        }
    }

    if (missingFieldsCount > 0 || (requiresStationSelection && stationList.length === 0)) {
        btnGenerate.classList.add('animate-shake');
        setStatus('error', t('missingInputs'));
        logToConsole(t('missingInputs'), 'error');
        showImportantToast('warning', t('genFailed'), t('missingInputs'));
        if (requiresStationSelection && stationList.length === 0) {
            logToConsole(t('noStations'), 'error');
        }
        setTimeout(() => {
            btnGenerate.classList.remove('animate-shake');
            updateStatus();
        }, 400);
        return;
    }

    if (!outputPath) {
        btnGenerate.classList.add('animate-shake');
        setStatus('error', t('missingOutput'));
        logToConsole(t('missingOutputPath'), 'error');
        showImportantToast('warning', t('missingOutput'), t('missingOutputPath'));
        setTimeout(() => {
            btnGenerate.classList.remove('animate-shake');
            updateStatus();
        }, 400);
        return;
    }

    saveOutputPathForActiveModule();
    btnGenerate.disabled = true;
    btnGenerate.innerHTML = getGenerateLoadingHtml();
    _refreshIcons(btnGenerate);

    setStatus('generating', t('statusGenerating'));
    showProgress();
    logToConsole(t('startGen'), 'info');
    logToConsole(`Module:   ${moduleLabel(activeModule)}`, 'system');
    logToConsole(`Stations: ${stationList.join(', ') || '(all)'}`, 'system');
    if (activeModule === 'mesdaily' && stationList.length === 0) {
        logToConsole(t('noStationsProceedAny'), 'warning');
    }
    if (activeModule === 'mesdaily') {
        const requirementSummary = mesRequirements
            .map(({ wo, pdline }) => `${wo} @ ${pdline || '(any line)'}`)
            .join(' | ');
        logToConsole(`Requirements: ${requirementSummary}`, 'system');
    }
    module.fields.forEach((field) => {
        const file = moduleState.files[field.key];
        logToConsole(`${field.label.en}: ${file ? file.name : '(not provided)'}`, 'system');
    });
    logToConsole(`Output:   ${outputPath}`, 'system');

    try {
        let fetchOptions;
        if (activeModule === 'mesdaily') {
            fetchOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(getMesSimpleGroupedPayload(stationList)),
            };
        } else {
            const formData = new FormData();
            if (activeModule === 'clca') {
                const clcaDataFiles = normalizeUploadFileList(getClcaDataFiles());
                const mergeAllWo = !!getActiveState().mergeAll;
                if (mergeAllWo) {
                    clcaDataFiles.forEach((file) => formData.append('data', file));
                    formData.append('merge_all_wo', 'true');
                } else {
                    formData.append('data', moduleState.files.data);
                    formData.append('merge_all_wo', 'false');
                }
                formData.append('sheet_prefixes', JSON.stringify(getClcaSheetPrefixesPayload(clcaDataFiles)));
                formData.append('use_customer_sn_mapping', getActiveState().useCsnMapping ? 'true' : 'false');
                formData.append('useCsnMapping', getActiveState().useCsnMapping ? 'true' : 'false');
            } else {
                module.fields.forEach((field) => {
                    const selected = moduleState.files[field.key];
                    if (selected) formData.append(field.key, selected);
                });
            }
            formData.append('output_path', outputPath);
            formData.append('selected_stations', JSON.stringify(stationList));
            fetchOptions = { method: 'POST', body: formData };
        }

        if (module.uiOnly) {
            completeProgress();
            setStatus('success', t('statusSuccess'));
            logToConsole(t('uiOnlyModuleNotice'), 'warning');
            showToast();
            return;
        }

        const response = await fetchRetry(module.endpoint, fetchOptions, MAX_RETRIES);

        const result = await response.json();
        if (response.ok && result.success) {
            completeProgress();
            if (result.mode === 'grouped') {
                (result.results || []).forEach((r) => {
                    if (r.ok) {
                        logToConsole(`Group ${r.label}: ${t('reportSaved')} <b>${r.output_path}</b>`, 'success');
                    } else {
                        logToConsole(`Group ${r.label}: failed — ${r.error}`, 'error');
                    }
                    if (Array.isArray(r.logs)) appendBackendLogs(r.logs);
                });
                if (result.mergedResult) {
                    if (result.mergedResult.ok) {
                        logToConsole(`Merged: ${t('reportSaved')} <b>${result.mergedResult.output_path}</b>`, 'success');
                    } else {
                        logToConsole(`Merged: failed — ${result.mergedResult.error}`, 'error');
                    }
                    if (Array.isArray(result.mergedResult.logs)) appendBackendLogs(result.mergedResult.logs);
                }
                setStatus('success', t('statusSuccess'));
                logToConsole(t('genSuccess'), 'success');
                showToast();
            } else {
                const outputFileName = (result.output_path || outputPath).split(/[\\/]/).pop();
                appendBackendLogs(result.logs);
                setStatus('success', t('statusSuccess'));
                logToConsole(`${t('reportSaved')} <b>${result.output_path}</b>`, 'success');
                logToConsole(`${t('outputFile')} <b>${outputFileName}</b>`, 'success');
                if (result.sheet_name) logToConsole(`Sheet name: ${result.sheet_name}`, 'system');
                logToConsole(t('genSuccess'), 'success');
                showToast();
                if (activeModule === 'grrprep') {
                    renderGrrResult(result.stats || {});
                }
            }
        } else {
  resetProgress();
  setStatus('error', t('genFailed'));

  appendBackendLogs(result.logs);

  const backendError = extractBackendError(result, 'Generation failed.');
  const backendTrace = extractBackendTrace(result);

  logToConsole(`Backend error: ${backendError}`, 'error');
  showImportantToast('error', t('genFailed'), backendError);

  if (backendTrace) {
    logToConsole(
      `Backend traceback: ${String(backendTrace)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}`,
      'error'
    );
  }

  console.error('[BACKEND GENERATE ERROR]', result);
        }
    } catch (err) {
  resetProgress();

  const stack = err && err.stack ? err.stack : String(err);

  logToConsole(
    `Frontend/connection error: ${String(stack)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}`,
    'error'
  );

  console.error('[FRONTEND GENERATE CATCH]', err);



        const alive = await checkServer();
        if (alive) {
            setStatus('error', t('reqFailed'));
            logToConsole(t('serverRunning'), 'warning');
            showImportantToast('error', t('reqFailed'), t('serverRunning'));
        } else {
            setStatus('error', t('serverOffline'));
            logToConsole(t('serverRestart'), 'error');
            showImportantToast('error', t('serverOffline'), t('serverRestart'));
        }
    } finally {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = getGenerateDefaultHtml();
        _refreshIcons(btnGenerate);
    }
}

landingEnter.addEventListener('click', enterWorkspace);
landingLangEn.addEventListener('click', () => setLanguage('en'));
landingLangCn.addEventListener('click', () => setLanguage('cn'));
if (langToggle) langToggle.addEventListener('click', () => setLanguage(currentLang === 'en' ? 'cn' : 'en'));
if (langToggleEn) langToggleEn.addEventListener('click', () => setLanguage('en'));
if (langToggleCn) langToggleCn.addEventListener('click', () => setLanguage('cn'));

btnClearLog.addEventListener('click', () => {
    consoleOutput.innerHTML = '';
    logToConsole(t('consoleClear'), 'system');
});

if (themeToggle) themeToggle.addEventListener('click', applyThemeToggle);

btnBrowseOutput.addEventListener('click', async () => {
    if (isBrowsingOutput) return;
    isBrowsingOutput = true;
    btnBrowseOutput.disabled = true;
    btnBrowseOutput.innerHTML = getBrowseLoadingHtml();
    _refreshIcons(btnBrowseOutput);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), getBrowseSaveTimeoutMs());

        let defaultFileName = MODULES[activeModule].defaultOutputName;
        const outputExt = getOutputExtension();
        const currentOutput = String(inputOutput.value || '').trim();
        if (currentOutput) {
            const parts = currentOutput.split(/[\\/]/);
            const picked = String(parts[parts.length - 1] || '').trim();
            if (picked) defaultFileName = withOutputExtension(picked, outputExt);
        }

        const desktopBrowse = await browseSaveViaDesktopHost(defaultFileName);
        if (desktopBrowse.available && desktopBrowse.path) {
            inputOutput.value = desktopBrowse.path;
            saveOutputPathForActiveModule();
            logToConsole(`Output path set to: <b>${desktopBrowse.path}</b>`, 'info');
            return;
        }
        if (desktopBrowse.available && !desktopBrowse.path && !desktopBrowse.error) {
            logToConsole(t('browseCanceled'), 'system');
            return;
        }
        if (desktopBrowse.error) {
            logToConsole(`Desktop browse bridge failed, fallback to server API: ${desktopBrowse.error}`, 'warning');
        }

        const res = await fetchRetry('/api/browse-save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ defaultFileName }),
            signal: controller.signal
        }, 1);

        clearTimeout(timeoutId);

        const text = await res.text();
        let data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { error: 'Invalid response from browse endpoint' };
        }

        if (!res.ok) {
            throw createBackendError(data, 'Browse endpoint failed');
        }

        if (data.path) {
            inputOutput.value = data.path;
            saveOutputPathForActiveModule();
            logToConsole(`Output path set to: <b>${data.path}</b>`, 'info');
        } else {
            logToConsole(t('browseCanceled'), 'system');
        }
    } catch (e) {
        const message = e.name === 'AbortError' ? t('browseTimeout') : (e.message || 'Failed to fetch');
        logToConsole(`${t('browseError')} ${message}`, 'error');
        logToConsole(t('browseRetry'), 'warning');
    } finally {
        isBrowsingOutput = false;
        btnBrowseOutput.disabled = false;
        btnBrowseOutput.innerHTML = getBrowseDefaultHtml();
        _refreshIcons(btnBrowseOutput);
        applyMesMergeModeUi();
    }
});

btnGenerate.addEventListener('click', onGenerate);
btnClear.addEventListener('click', clearInputs);
inputOutput.addEventListener('change', saveOutputPathForActiveModule);
inputOutput.addEventListener('blur', saveOutputPathForActiveModule);
toastClose.addEventListener('click', hideToast);
btnSelectAll.addEventListener('click', () => { activePreset = null; setStationSelection(allStations, false); });
btnSelectNone.addEventListener('click', () => { activePreset = null; setStationSelection([], true); });
btnPresetSmt.addEventListener('click', () => applyPresetToggle('SMT'));
btnPresetDip.addEventListener('click', () => applyPresetToggle('DIP'));
btnPresetFatp.addEventListener('click', () => applyPresetToggle('FATP'));

// Sidebar toggle (hamburger / close / backdrop)
const sidebarBrand = document.getElementById('sidebar-brand');
if (sidebarBrand) sidebarBrand.addEventListener('click', backToLanding);
if (btnSidebarToggle) btnSidebarToggle.addEventListener('click', openSidebar);
if (btnSidebarClose) btnSidebarClose.addEventListener('click', closeSidebar);
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);
if (btnSidebarToggleLg) {
    btnSidebarToggleLg.addEventListener('click', () => {
        const hidden = workspaceSidebar.classList.contains('-translate-x-full');
        if (hidden) { workspaceSidebar.classList.remove('-translate-x-full'); }
        else { workspaceSidebar.classList.add('-translate-x-full'); }
    });
}

// Close sidebar on resize to large (sidebar becomes pinned via CSS)
window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
        sidebarBackdrop.classList.add('hidden', 'opacity-0');
        sidebarBackdrop.classList.remove('opacity-100');
    }
});

// Landing theme toggle
function applyThemeToggle() {
    htmlElement.classList.add('theme-transitioning');
    htmlElement.classList.toggle('dark');
    if (htmlElement.classList.contains('dark')) {
        htmlElement.classList.remove('light');
        localStorage.theme = 'dark';
    } else {
        htmlElement.classList.add('light');
        localStorage.theme = 'light';
    }
    setTimeout(() => htmlElement.classList.remove('theme-transitioning'), 500);
}
if (landingThemeToggle) landingThemeToggle.addEventListener('click', applyThemeToggle);

(async () => {
    await loadAppSettings();
    await loadAppModules();
    await loadReportSettings();
    initTheme();
    renderLandingModules();
    applyLanguage();
})();

logToConsole('CloudMetrics shell initialized.', 'system');
logToConsole(`Origin: ${window.location.origin || window.location.protocol}`, 'system');

(async () => {
    dismissLoadingScreen(); // dismiss native splash immediately — UI is ready
    try {
        const ok = await checkServer();
        logToConsole(ok ? 'Server OK.' : 'Server offline.', ok ? 'system' : 'warning');
        if (ok) await loadStations();
    } catch (e) {
        logToConsole('Initialization error: ' + (e && e.message ? e.message : e), 'warning');
    }
})();

// MES Daily event listeners
['datefrom', 'dateto', 'hourfrom', 'hourto'].forEach((id) => {
    const el = document.getElementById(`mes-${id}`);
    if (el) el.addEventListener('input', updateStatus);
});

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

initMesTimePickers();
initMesRequirements();
loadMesState();
// ==================== DEBUG: GLOBAL ERROR LOGGER ====================
window.addEventListener('error', (event) => {
  try {
    const msg = [
      '[GLOBAL JS ERROR]',
      event.message || '',
      event.filename ? `file=${event.filename}` : '',
      Number.isFinite(event.lineno) ? `line=${event.lineno}` : '',
      Number.isFinite(event.colno) ? `col=${event.colno}` : '',
      event.error && event.error.stack ? `stack=${event.error.stack}` : ''
    ].filter(Boolean).join(' | ');

    console.error(msg);

    if (typeof logToConsole === 'function') {
      logToConsole(msg.replace(/</g, '&lt;').replace(/>/g, '&gt;'), 'error');
    }
  } catch (e) {
    console.error('[GLOBAL ERROR LOGGER FAILED]', e);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  try {
    const reason = event.reason;
    const stack = reason && reason.stack ? reason.stack : String(reason || '');

    const msg = `[UNHANDLED PROMISE REJECTION] ${stack}`;

    console.error(msg);

    if (typeof logToConsole === 'function') {
      logToConsole(msg.replace(/</g, '&lt;').replace(/>/g, '&gt;'), 'error');
    }
  } catch (e) {
    console.error('[PROMISE ERROR LOGGER FAILED]', e);
  }
});
// ==================== SETTINGS MODAL LOGIC ====================
let currentSettingsData = {};

function initSettingsUI() {
    const btnSettings = document.getElementById('btn-settings-toggle');
    const modal = document.getElementById('settings-modal');
    const btnClose = document.getElementById('btn-settings-close');
    const btnCancel = document.getElementById('btn-settings-cancel');
    const btnSave = document.getElementById('btn-settings-save');
    const btnAddAlias = document.getElementById('settings-add-alias');
    const btnAddModel = document.getElementById('settings-add-model');
    if (btnSettings) btnSettings.addEventListener('click', openSettingsModal);
    if (btnClose) btnClose.addEventListener('click', closeSettingsModal);
    if (btnCancel) btnCancel.addEventListener('click', closeSettingsModal);
    if (btnSave) btnSave.addEventListener('click', saveSettings);
    
    // Tab switching
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.settings-tab-btn').forEach(b => {
                b.classList.remove('bg-primary/10', 'text-primary', 'dark:bg-secondary/10', 'dark:text-secondary', 'active');
                b.classList.add('text-textMuted');
            });
            const target = e.currentTarget;
            target.classList.remove('text-textMuted');
            target.classList.add('bg-primary/10', 'text-primary', 'dark:bg-secondary/10', 'dark:text-secondary', 'active');
            
            document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(target.dataset.tab).classList.remove('hidden');
        });
    });

    if (btnAddAlias) {
        btnAddAlias.addEventListener('click', () => {
            const tbody = document.getElementById('settings-aliases-tbody');
            tbody.insertAdjacentHTML('beforeend', getAliasRowHtml('', ''));
            lucide.createIcons();
        });
    }

    if (btnAddModel) {
        btnAddModel.addEventListener('click', () => {
            const tbody = document.getElementById('settings-models-tbody');
            tbody.insertAdjacentHTML('beforeend', getModelRowHtml(''));
            lucide.createIcons();
        });
    }
    // Delete row delegation
    document.addEventListener('click', (e) => {
        const btnDelete = e.target.closest('.btn-delete-row');
        if (btnDelete) {
            btnDelete.closest('tr').remove();
        }
    });
}


function getAliasRowHtml(mesName, networkNames) {
    return `
        <tr class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
            <td class="px-3 py-2 border-r border-borderLight dark:border-borderDark">
                <input type="text" class="settings-alias-mes w-full bg-transparent outline-none font-mono" value="${clcaEscapeHtml(mesName)}" placeholder="e.g. DIP_PCBA_01">
            </td>
            <td class="px-3 py-2 border-r border-borderLight dark:border-borderDark">
                <input type="text" class="settings-alias-net w-full bg-transparent outline-none font-mono" value="${clcaEscapeHtml(networkNames)}" placeholder="e.g. PCBA01, FPC01">
            </td>
            <td class="px-3 py-2 text-center">
                <button type="button" class="btn-delete-row p-1.5 text-textMuted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `;
}

function getModelRowHtml(name) {
    return `
        <tr class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
            <td class="px-2 py-2 border-r border-borderLight dark:border-borderDark">
                <input type="text" class="settings-model-name w-full bg-transparent outline-none font-mono text-xs" value="${clcaEscapeHtml(name)}" placeholder="VO0301">
            </td>
            <td class="px-2 py-2 text-center">
                <button type="button" class="btn-delete-row p-1.5 text-textMuted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `;
}


async function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const backdrop = document.getElementById('settings-modal-backdrop');
    const content = document.getElementById('settings-modal-content');
    
    try {
        const resQuicklog = await fetch('/api/config/quicklog').then(r => r.json());
        
        if (resQuicklog.success) {
            currentSettingsData = resQuicklog.data || {};
            populateSettingsUI(currentSettingsData);
        } else {
            showImportantToast('error', 'Failed to load settings', resQuicklog.error);
        }
    } catch (e) {
        showImportantToast('error', 'Network Error', e.message);
    }
    
    updateSettingsModalLang();
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        content.classList.remove('opacity-0', 'scale-95');
        lucide.createIcons();
    });
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const backdrop = document.getElementById('settings-modal-backdrop');
    const content = document.getElementById('settings-modal-content');
    
    backdrop.classList.add('opacity-0');
    content.classList.add('opacity-0', 'scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function populateSettingsUI(data) {
    const mesTrace = data.mesTrace || {};
    document.getElementById('settings-api-url').value = mesTrace.apiUrl || '';
    document.getElementById('settings-log-root').value = mesTrace.logRoot || '';
    
    const modelsTbody = document.getElementById('settings-models-tbody');
    modelsTbody.innerHTML = '';
    const models = Array.isArray(data.models) ? data.models : [];
    models.forEach(m => {
        const name = typeof m === 'string' ? m : (m.name || '');
        if (name) modelsTbody.insertAdjacentHTML('beforeend', getModelRowHtml(name));
    });
    
    const aliasesTbody = document.getElementById('settings-aliases-tbody');
    aliasesTbody.innerHTML = '';
    const aliases = mesTrace.stationAliases || {};
    Object.entries(aliases).forEach(([mesName, arr]) => {
        const netNames = Array.isArray(arr) ? arr.join(', ') : arr;
        aliasesTbody.insertAdjacentHTML('beforeend', getAliasRowHtml(mesName, netNames));
    });
}

async function saveSettings() {
    const btnSave = document.getElementById('btn-settings-save');
    const originalHtml = btnSave.innerHTML;
    btnSave.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Saving...';
    btnSave.disabled = true;
    lucide.createIcons();
    
    try {
        // Construct new data
        const newData = JSON.parse(JSON.stringify(currentSettingsData));
        newData.mesTrace = newData.mesTrace || {};
        
        // Read General
        newData.mesTrace.apiUrl = document.getElementById('settings-api-url').value.trim();
        newData.mesTrace.logRoot = document.getElementById('settings-log-root').value.trim();
        
        // Read Models
        const newModels = [];
        document.querySelectorAll('#settings-models-tbody tr').forEach(tr => {
            const name = tr.querySelector('.settings-model-name')?.value?.trim();
            if (name) newModels.push(name);
        });
        newData.models = newModels;
        
        // Read Aliases
        const newAliases = {};
        document.querySelectorAll('#settings-aliases-tbody tr').forEach(tr => {
            const mesName = tr.querySelector('.settings-alias-mes')?.value?.trim();
            const netStr = tr.querySelector('.settings-alias-net')?.value?.trim();
            if (mesName && netStr) {
                newAliases[mesName] = netStr.split(',').map(s => s.trim()).filter(Boolean);
            }
        });
        newData.mesTrace.stationAliases = newAliases;
        
        const resQuicklog = await fetch('/api/config/quicklog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
        });
        
        const jsonQuicklog = await resQuicklog.json();
        
        if (jsonQuicklog.success) {
            showImportantToast('success', t('settingsSaved'), t('settingsSavedMsg'));
            closeSettingsModal();
            if (typeof loadStations === 'function') loadStations(); // Refresh stations UI
        } else {
            showImportantToast('error', t('reqFailed'), jsonQuicklog.error || 'Unknown error');
        }
    } catch (e) {
        showImportantToast('error', 'Network Error', e.message);
    } finally {
        btnSave.innerHTML = originalHtml;
        btnSave.disabled = false;
        lucide.createIcons();
    }
}

// Apply i18n to all [data-i18n] elements inside the settings modal
function updateSettingsModalLang() {
    document.querySelectorAll('#settings-modal [data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = t(key);
        if (text) el.textContent = text;
    });
}

// ==================== INLINE STATION EDITING ====================
function initInlineStationEditor() {
    const btnEdit = document.getElementById('btn-edit-stations');
    const btnCancel = document.getElementById('btn-cancel-edit-stations');
    const btnSave = document.getElementById('btn-save-edit-stations');
    const container = document.getElementById('station-edit-container');
    const textarea = document.getElementById('station-edit-textarea');
    const grid = document.getElementById('station-grid');

    if (!btnEdit || !container) return;

    btnEdit.addEventListener('click', () => {
        textarea.value = allStations.join('\n');
        grid.style.opacity = '0';
        setTimeout(() => {
            container.classList.remove('hidden');
        }, 150);
    });

    btnCancel.addEventListener('click', () => {
        container.classList.add('hidden');
        grid.style.opacity = '1';
    });

    btnSave.addEventListener('click', async () => {
        const originalHtml = btnSave.innerHTML;
        btnSave.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Saving...';
        btnSave.disabled = true;
        lucide.createIcons();

        try {
            const rawText = textarea.value;
            const parsed = rawText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
            const newStations = [...new Set(parsed)];

            const res = await fetch('/api/stations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stations: newStations })
            });

            const json = await res.json();
            if (json.success) {
                showImportantToast('success', t('settingsSaved') || 'Saved', 'Station list updated successfully.');
                container.classList.add('hidden');
                grid.style.opacity = '1';
                await loadStations();
            } else {
                showImportantToast('error', t('reqFailed') || 'Failed', json.error || 'Unknown error');
            }
        } catch (e) {
            showImportantToast('error', 'Network Error', e.message);
        } finally {
            btnSave.innerHTML = originalHtml;
            btnSave.disabled = false;
            lucide.createIcons();
        }
    });
}

// Bind at end of document load
document.addEventListener('DOMContentLoaded', () => {
    initSettingsUI();
    initInlineStationEditor();
});
