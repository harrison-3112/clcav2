let quickLogRows = [];

let quickLogSelectedIndex = -1;

let quickLogLastSummary = {};

let quickLogSearchSource = 'local'; // 'local' | 'mesTrace'

let quickLogMesTraceFilter = 'ALL'; // ALL/SMT/DIP/FATP/PASS/FAIL; single active filter

let quickLogResultSearchText = ''; // QL-05: search text within result

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

function getQuickLogLocalStationMissingMessage() {
    const message = (QUICKLOG_LOCAL_STATIONS_CONFIG && QUICKLOG_LOCAL_STATIONS_CONFIG.message) || {};
    return currentLang === 'cn' ? (message.cn || '本地文件夹中不存在该日志文件') : (message.en || 'Log file dont exist on local folder');
}

function getQuickLogRowStationForOpen(row) {
    return String(row?.terminal || row?.process || row?.Station || '').trim();
}

function getQuickLogRowModelForOpen(row, fallbackModel) {
    return getQuickLogModelRootName(row?.modelRoot || row?.modelNo || row?._QuickLogModel || fallbackModel || getQuickLogSelectedModelName() || 'VO0301');
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




function getQuickLogProgram(programName) {
    return QUICKLOG_PROGRAMS.find((p) => p.name === programName) || QUICKLOG_PROGRAMS[0];
}

function getQuickLogSelectedProgramName() {
    return document.getElementById('quicklog-program')?.value || QUICKLOG_DEFAULT_PROGRAM;
}

function getQuickLogSelectedProgram() {
    return getQuickLogProgram(getQuickLogSelectedProgramName());
}

function renderQuickLogProgramMenuOptions(selectedProgram = QUICKLOG_DEFAULT_PROGRAM) {
    return QUICKLOG_PROGRAMS.map((program) => {
        const selected = program.name === selectedProgram;
        return `<button type="button" class="quicklog-combo-option ${selected ? 'active' : ''}" data-program="${quickLogEscape(program.name)}">${quickLogEscape(program.name)}</button>`;
    }).join('');
}

function renderQuickLogProgramDropdown(selectedProgram = QUICKLOG_DEFAULT_PROGRAM) {
    const safeProgram = QUICKLOG_PROGRAMS.some((p) => p.name === selectedProgram) ? selectedProgram : ((QUICKLOG_PROGRAMS[0] && QUICKLOG_PROGRAMS[0].name) || QUICKLOG_DEFAULT_PROGRAM);
    return `
        <div id="quicklog-program-combo" class="quicklog-combo" data-open="false">
            <input type="hidden" id="quicklog-program" value="${quickLogEscape(safeProgram)}">
            <button id="quicklog-program-button" type="button" class="quicklog-combo-button" aria-haspopup="listbox" aria-expanded="false">
                <span id="quicklog-program-selected" class="truncate">${quickLogEscape(safeProgram)}</span>
                <i data-lucide="chevron-down" class="w-4 h-4 shrink-0 quicklog-combo-chevron"></i>
            </button>
            <div id="quicklog-program-menu" class="quicklog-combo-menu hidden" role="listbox">
                ${renderQuickLogProgramMenuOptions(safeProgram)}
            </div>
        </div>
    `;
}

function closeQuickLogProgramDropdown() {
    const combo = document.getElementById('quicklog-program-combo');
    const btn = document.getElementById('quicklog-program-button');
    const menu = document.getElementById('quicklog-program-menu');
    if (!combo || !btn || !menu) return;
    combo.dataset.open = 'false';
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.add('hidden');
}

function setQuickLogProgramValue(programName) {
    const safeProgram = QUICKLOG_PROGRAMS.some((p) => p.name === programName) ? programName : ((QUICKLOG_PROGRAMS[0] && QUICKLOG_PROGRAMS[0].name) || QUICKLOG_DEFAULT_PROGRAM);
    const input = document.getElementById('quicklog-program');
    const label = document.getElementById('quicklog-program-selected');
    const menu = document.getElementById('quicklog-program-menu');
    if (input) input.value = safeProgram;
    if (label) label.textContent = safeProgram;
    if (menu) {
        menu.querySelectorAll('.quicklog-combo-option').forEach((item) => {
            item.classList.toggle('active', item.dataset.program === safeProgram);
        });
    }
}

function refreshQuickLogProgramDropdown(selectedProgram = QUICKLOG_DEFAULT_PROGRAM) {
    const combo = document.getElementById('quicklog-program-combo');
    if (!combo) return;
    combo.outerHTML = renderQuickLogProgramDropdown(selectedProgram);
    bindQuickLogProgramDropdown();
    _refreshIcons(document.getElementById('quicklog-program-combo'));
}

function bindQuickLogProgramDropdown() {
    const combo = document.getElementById('quicklog-program-combo');
    const btn = document.getElementById('quicklog-program-button');
    const menu = document.getElementById('quicklog-program-menu');
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
        setQuickLogProgramValue(option.dataset.program || QUICKLOG_DEFAULT_PROGRAM);
        closeQuickLogProgramDropdown();
    });
    if (!window.__quickLogProgramDropdownDocBound) {
        document.addEventListener('click', (event) => {
            const activeCombo = document.getElementById('quicklog-program-combo');
            if (activeCombo && !activeCombo.contains(event.target)) closeQuickLogProgramDropdown();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeQuickLogProgramDropdown();
        });
        window.__quickLogProgramDropdownDocBound = true;
    }
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
    if (inputLabel) inputLabel.textContent = isMes ? 'SN / CSN Input' : t('quickLogInput');
    updateQuickLogSourceToggle();
    renderQuickLogMesTraceFilterBar();
    renderMesTraceHistory();
    const historyContainer = document.getElementById('quicklog-mestrace-history-container');
    if (historyContainer) {
        historyContainer.classList.toggle('hidden', !isMes);
    }
}


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
    if (quickLogMesTraceFilter === 'ALL') return true;
    const isMes = isQuickLogMesTraceMode();
    
    if (isMes) {
        if (['SMT', 'DIP', 'FATP'].includes(quickLogMesTraceFilter)) return getQuickLogMesStationFilter(row) === quickLogMesTraceFilter;
        if (['PASS', 'FAIL'].includes(quickLogMesTraceFilter)) return getQuickLogMesResultFilter(row) === quickLogMesTraceFilter;
    } else {
        if (['PASS', 'FAIL'].includes(quickLogMesTraceFilter)) return getQuickLogBaseResult(row) === quickLogMesTraceFilter;
    }
    
    return true;
}

function renderQuickLogMesTraceFilterBar() {
    const bar = document.getElementById('quicklog-mes-filter-bar');
    if (!bar) return;
    const isMes = isQuickLogMesTraceMode();
    bar.classList.remove('hidden'); // Always show filter bar
    const filters = isMes ? QUICKLOG_MES_TRACE_FILTERS : QUICKLOG_LOCAL_FILTERS;
    
    // Ensure current filter is valid for current mode
    if (!filters.includes(quickLogMesTraceFilter)) {
        quickLogMesTraceFilter = 'ALL';
    }

    bar.innerHTML = filters.map((key) => {
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
        const filters = isQuickLogMesTraceMode() ? QUICKLOG_MES_TRACE_FILTERS : QUICKLOG_LOCAL_FILTERS;
        if (!filters.includes(key)) return;
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
    const program = typeof getGlobalActiveProgram === 'function' ? getGlobalActiveProgram() : { name: QUICKLOG_DEFAULT_PROGRAM };
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
        const payload = isMesTrace ? { input: snText } : { program: program.name, model: model.name, mode, snText, _QuickLogBase: model.resolvedPath || model.path };
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
        if (isMesTrace) saveMesTraceHistory(snText);
        // Show/hide download button based on mode
        const qlZipBtn = document.getElementById('quicklog-download-zip');
        if (qlZipBtn) qlZipBtn.classList.toggle('hidden', !isMesTrace || quickLogRows.length === 0);
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
    const existingProgram = typeof getQuickLogSelectedProgramName === 'function' ? getQuickLogSelectedProgramName() : QUICKLOG_DEFAULT_PROGRAM;
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
                    <div class="flex items-center justify-between mt-1">
                        <span id="quicklog-input-hint" class="text-xs text-textMuted dark:text-gray-400">Support comma, space, newline (Press <kbd class="font-sans px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded border border-black/10 dark:border-white/10 mx-0.5">Ctrl</kbd> + <kbd class="font-sans px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded border border-black/10 dark:border-white/10 mx-0.5">Enter</kbd> to search)</span>
                    </div>
                    <div id="quicklog-mestrace-history-container" class="flex flex-wrap gap-2 mt-2 hidden empty:hidden"></div>
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
                    <button id="quicklog-download-zip" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white transition-colors hidden" title="Download FAIL log files as ZIP">
                        <i data-lucide="archive" class="w-3.5 h-3.5"></i><span>FAIL Logs</span>
                    </button>
                    <span id="quicklog-zip-status" class="relative hidden cursor-pointer" title="">
                        <i data-lucide="info" class="w-4 h-4 text-white/70 hover:text-white transition-colors"></i>
                        <span id="quicklog-zip-tooltip" class="absolute bottom-full right-0 mb-2 hidden w-72 max-h-48 overflow-y-auto p-3 text-[10px] leading-relaxed rounded-lg bg-gray-900/95 text-gray-200 border border-gray-700 shadow-xl backdrop-blur-sm z-50 whitespace-pre-wrap"></span>
                    </span>
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
    loadQuickLogPrograms();
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
    // History click
    document.getElementById('quicklog-mestrace-history-container')?.addEventListener('click', (event) => {
        const chip = event.target.closest('.quicklog-mestrace-history-chip');
        if (!chip) return;
        const input = document.getElementById('quicklog-input');
        if (input) input.value = chip.dataset.value || '';
    });
    // Download FAIL logs ZIP
    document.getElementById('quicklog-download-zip')?.addEventListener('click', downloadQuickLogFailLogsZip);
    const qlZipStatus = document.getElementById('quicklog-zip-status');
    const qlZipTooltip = document.getElementById('quicklog-zip-tooltip');
    if (qlZipStatus && qlZipTooltip) {
        qlZipStatus.addEventListener('mouseenter', () => qlZipTooltip.classList.remove('hidden'));
        qlZipStatus.addEventListener('mouseleave', () => qlZipTooltip.classList.add('hidden'));
    }
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
    // Hide ZIP button and status
    const qlZipBtn = document.getElementById('quicklog-download-zip');
    if (qlZipBtn) qlZipBtn.classList.add('hidden');
    const qlZipStatus = document.getElementById('quicklog-zip-status');
    if (qlZipStatus) qlZipStatus.classList.add('hidden');
}

async function downloadQuickLogFailLogsZip() {
    if (!isQuickLogMesTraceMode()) {
        logToConsole('Download FAIL Logs is only available in MES Trace mode.', 'warning');
        return;
    }
    const failRows = quickLogRows.filter((row) => {
        const result = String(row?.result ?? row?.status ?? '').toUpperCase().trim();
        return result === '1' || result === 'FAIL' || result === 'NG';
    });
    if (!failRows.length) {
        logToConsole('No FAIL rows found to download.', 'warning');
        showImportantToast('warning', 'No FAIL Rows', 'No FAIL results found in the current search.');
        return;
    }

    const btn = document.getElementById('quicklog-download-zip');
    const originalHtml = btn ? btn.innerHTML : '';
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Downloading...</span>`;
            _refreshIcons(btn);
        }
        logToConsole(`Downloading FAIL logs for ${failRows.length} rows...`, 'system');

        const response = await fetch('/api/logs/download-zip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: failRows, source: 'mesTrace' }),
        });

        if (!response.ok) {
            let errMsg = 'Download failed';
            try {
                const errData = await response.json();
                errMsg = errData.error || errMsg;
                if (Array.isArray(errData.missing) && errData.missing.length) {
                    _showQuickLogZipStatus([], errData.missing);
                }
            } catch (_) {}
            throw new Error(errMsg);
        }

        let report = null;
        try {
            const reportB64 = response.headers.get('X-Download-Report');
            if (reportB64) report = JSON.parse(atob(reportB64));
        } catch (_) {}

        const blob = await response.blob();
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const zipName = `FAIL Log ${mm}.${dd}.zip`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = zipName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        const foundCount = report ? report.foundCount : '?';
        const missingCount = report ? report.missingCount : '?';
        logToConsole(`Downloaded: ${zipName} (${foundCount} files, ${missingCount} missing)`, 'success');

        if (report) _showQuickLogZipStatus(report.found || [], report.missing || []);
    } catch (err) {
        logToConsole(`Download FAIL logs failed: ${err.message || err}`, 'error');
        showImportantToast('error', 'Download Failed', err.message || String(err));
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            _refreshIcons(btn);
        }
    }
}

function _showQuickLogZipStatus(found, missing) {
    const statusEl = document.getElementById('quicklog-zip-status');
    const tooltipEl = document.getElementById('quicklog-zip-tooltip');
    if (!statusEl || !tooltipEl) return;

    let text = `✅ Downloaded: ${found.length} files\n`;
    if (found.length) {
        found.slice(0, 20).forEach((f) => { text += `  ✓ ${f.sn} | ${f.station}\n`; });
        if (found.length > 20) text += `  ... and ${found.length - 20} more\n`;
    }
    if (missing.length) {
        text += `\n❌ Missing: ${missing.length} files\n`;
        missing.slice(0, 20).forEach((m) => { text += `  ✗ ${m.sn} | ${m.station}\n    ${m.reason}\n`; });
        if (missing.length > 20) text += `  ... and ${missing.length - 20} more\n`;
    }

    tooltipEl.textContent = text.trim();
    statusEl.classList.remove('hidden');
    _refreshIcons(statusEl);
}

function saveMesTraceHistory(input) {
    const text = String(input || '').trim();
    if (!text) return;
    let history = [];
    try { history = JSON.parse(localStorage.getItem('quicklog_mestrace_history') || '[]'); } catch (_) {}
    history = history.filter((item) => item !== text);
    history.unshift(text);
    if (history.length > 3) history = history.slice(0, 3);
    localStorage.setItem('quicklog_mestrace_history', JSON.stringify(history));
    if (isQuickLogMesTraceMode()) renderMesTraceHistory();
}

function renderMesTraceHistory() {
    const container = document.getElementById('quicklog-mestrace-history-container');
    if (!container) return;
    let history = [];
    try { history = JSON.parse(localStorage.getItem('quicklog_mestrace_history') || '[]'); } catch (_) {}
    if (!history.length) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = history.map((item) => {
        const text = quickLogEscape(item);
        const display = text.length > 25 ? text.substring(0, 25) + '...' : text;
        return `<button type="button" class="quicklog-mestrace-history-chip px-2 py-1 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-borderLight dark:border-borderDark rounded-md text-[10px] text-textMuted dark:text-gray-300 transition-colors" data-value="${text}" title="${text}">${display}</button>`;
    }).join('');
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
function filterQuickLogResultsBySearchText(rows) {
    if (!quickLogResultSearchText) return rows;
    const lowerSearch = quickLogResultSearchText.toLowerCase();
    const isMes = isQuickLogMesTraceMode();
    const columns = isMes ? getQuickLogMesColumns() : ['SN', 'Station', 'Mode', 'Result', 'Failitem', 'EndTime'];
    
    return rows.filter(row => {
        return columns.some(col => {
            const val = String(row[col] || '').toLowerCase();
            return val.includes(lowerSearch);
        });
    });
}

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
        const program = typeof getGlobalActiveProgram === 'function' ? getGlobalActiveProgram() : { name: QUICKLOG_DEFAULT_PROGRAM };
        const body = isMesTraceRow ? { row: selectedRow } : {
            program: program.name,
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


