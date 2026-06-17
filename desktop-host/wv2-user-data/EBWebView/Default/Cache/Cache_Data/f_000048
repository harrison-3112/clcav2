function applyMesDailySettings(settings = {}) {
    MESDAILY_SETTINGS = mergeConfigObject(MESDAILY_SETTINGS, settings);
    const defaultHour = Number(MESDAILY_SETTINGS.defaultHour);
    if (Number.isFinite(defaultHour) && defaultHour >= 0 && defaultHour <= 23) MES_DEFAULT_HOUR = Math.floor(defaultHour);
}

function getMesOutputPrefix() {
    return String(MESDAILY_SETTINGS.defaultOutputPrefix || 'MES Data').trim() || 'MES Data';
}


let mesStateHydrated = false;


let mesR001Rows = [];

let mesR001SelectedIndex = -1;

let mesDailyActiveFeature = 'rtydaily';

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


function syncMesHiddenRange() {
    const controls = getMesRangeControls();
    if (controls.hiddenFrom) controls.hiddenFrom.value = composeMesDateTime(controls.dateFrom && controls.dateFrom.value, controls.hourFrom && controls.hourFrom.value);
    if (controls.hiddenTo) controls.hiddenTo.value = composeMesDateTime(controls.dateTo && controls.dateTo.value, controls.hourTo && controls.hourTo.value);
    saveMesState();
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
