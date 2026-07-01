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
let mesR001Filter = 'ALL';
let mesR001ResultSearchText = '';

let mesDailyActiveFeature = 'rtydaily';
let defectDailyCharts = [];

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
        .filter(({ wo, fileName }) => wo || fileName);

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
    try { localStorage.removeItem(MES_STATE_STORAGE_KEY); } catch (_) { }

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

    if (controls.hourFrom && controls.hourFrom.dataset.bound !== 'true') {
        controls.hourFrom.dataset.bound = 'true';
        controls.hourFrom.addEventListener('input', () => { syncMesTimeRangeFromStart(); updateStatus(); });
        controls.hourFrom.addEventListener('blur', () => { setMesHourValue(controls.hourFrom, controls.hourFrom.value); syncMesTimeRangeFromStart(); updateStatus(); });
    }

    if (controls.hourTo && controls.hourTo.dataset.bound !== 'true') {
        controls.hourTo.dataset.bound = 'true';
        controls.hourTo.addEventListener('input', () => { syncMesHiddenRange(); updateStatus(); });
        controls.hourTo.addEventListener('blur', () => { setMesHourValue(controls.hourTo, controls.hourTo.value); syncMesHiddenRange(); updateStatus(); });
    }

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
        fileName: String(row.querySelector('.mes-requirement-filename')?.value || '').trim(),
    }));
}


function hasIncompleteMesRequirements(entries = readMesRequirementRows()) {
    return entries.some(({ wo, fileName }) => fileName && !wo);
}


function collectMesRequirements() {
    return readMesRequirementRows()
        .filter(({ wo }) => wo)
        .map(({ wo }) => ({ wo }));
}


function updateMesRequirementRowText() {
    const rows = getMesRequirementRows();
    rows.forEach((row) => {
        const woInput = row.querySelector('.mes-requirement-wo');
        const fileNameInput = row.querySelector('.mes-requirement-filename');
        const removeBtn = row.querySelector('.mes-requirement-remove');

        if (woInput) woInput.placeholder = 'WO';
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
    row.className = 'grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_40px] gap-2 mes-requirement-row';
    row.innerHTML = [
        '<input type="text" class="mes-requirement-wo w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-textMain dark:text-textDark"  autocomplete="off">',
        '<input type="text" class="mes-requirement-filename w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-textMain dark:text-textDark" autocomplete="off" data-auto="true">',
        '<button type="button" class="mes-requirement-remove inline-flex items-center justify-center rounded-lg border border-borderLight dark:border-borderDark text-textMuted dark:text-gray-500 hover:text-red-500 hover:border-red-300 dark:hover:border-red-500/50 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>'
    ].join('');

    const woInput = row.querySelector('.mes-requirement-wo');
    const fileNameInput = row.querySelector('.mes-requirement-filename');
    if (woInput) woInput.value = values.wo || '';
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
            try { input._airDatepicker.hide(); } catch (_) { }
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
        if (compact === 'RENAMEDIPLABEL' || compact === 'RENAMEDIP_LABEL' || compact === 'RENAMEDIP') {
            el.classList.add('hidden');
            el.setAttribute('aria-hidden', 'true');
        }
    });
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
    const hasData = mesR001Rows && mesR001Rows.length > 0;

    // Data sections: show only when mesdaily + has data
    const previewSection = document.getElementById('mes-rty-preview-section');
    const defectSection = document.getElementById('mes-defect-records-section');
    const analyticsSection = document.getElementById('mes-defect-analytics-section');
    const dashboard = document.getElementById('mes-r001-dashboard');

    if (previewSection) previewSection.classList.toggle('hidden', !isMesDaily || !hasData);
    if (defectSection) defectSection.classList.toggle('hidden', !isMesDaily || !hasData);
    if (analyticsSection) analyticsSection.classList.toggle('hidden', !isMesDaily);
    if (dashboard) dashboard.classList.toggle('hidden', dashboard.dataset.hasContent !== 'true' || !isMesDaily);

    if (isMesDaily && stationPanel) stationPanel.classList.remove('hidden');
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

function getMesR001Columns() { return ['SN', 'Terminal', 'Result', 'DefectCode', 'Description', 'WO', 'Time']; }

function getMesR001Cell(row, key) {
    const map = { SN: row?.SerialNumber || '', Terminal: row?.Terminal || '', Result: row?.Status || 'FAIL', DefectCode: row?.DefectCode || '', Description: row?.DefectDesc || '', WO: row?.WorkOrder || '', Time: row?.Time || '' };
    return map[key] || '';
}

function getMesR001DisplayRows(rows = mesR001Rows) {
    let filtered = Array.isArray(rows) ? rows : [];

    if (mesR001Filter !== 'ALL') {
        filtered = filtered.filter(row => getQuickLogMesStationFilter(row) === mesR001Filter);
    }

    if (mesR001ResultSearchText) {
        const lowerSearch = mesR001ResultSearchText.toLowerCase();
        filtered = filtered.filter(row => Object.values(row).some(val => String(val || '').toLowerCase().includes(lowerSearch)));
    }

    return filtered.map((row, index) => ({ ...row, _MesR001Index: index }));
}

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
    const mesPanel = document.getElementById('mes-panel');
    if (!mesPanel) return;

    bindMesDailyFeatureToggle(document);
    const input = document.getElementById('mes-r001-wo-input');
    if (input) input.placeholder = 'Paste WO list here...';

    if (mesPanel && mesPanel.dataset.r001Bound !== 'true') {
        mesPanel.dataset.r001Bound = 'true';
        document.getElementById('mes-r001-search')?.addEventListener('click', searchMesDashboard);
        document.getElementById('mes-r001-clear')?.addEventListener('click', () => clearMesR001Panel(true));
        document.getElementById('mes-r001-open-log')?.addEventListener('click', openMesR001SelectedLogUiOnly);
        document.getElementById('mes-r001-export-csv')?.addEventListener('click', exportMesR001CsvUiOnly);
        document.getElementById('mes-r001-wo-input')?.addEventListener('input', () => updateMesR001Summary(mesR001Rows));
        document.getElementById('mes-r001-wo-input')?.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') searchMesDashboard();
        });
        document.getElementById('mes-r001-history-container')?.addEventListener('click', (event) => {
            const chip = event.target.closest('.mes-r001-history-chip');
            if (!chip) return;
            const input = document.getElementById('mes-r001-wo-input');
            if (input) input.value = chip.dataset.value || '';
        });

        document.getElementById('mes-r001-result-search')?.addEventListener('input', (event) => {
            mesR001ResultSearchText = String(event.target.value || '').trim();
            mesR001SelectedIndex = -1;
            renderMesR001Rows();
        });
        document.getElementById('mes-r001-download-zip')?.addEventListener('click', downloadMesR001LogsZip);
        // Auto-refresh toggle + interval
        document.getElementById('mes-r001-auto-refresh-toggle')?.addEventListener('click', toggleDashboardAutoRefresh);
        document.getElementById('mes-r001-auto-refresh-interval')?.addEventListener('change', (e) => {
            const minutes = Number(e.target.value) || 5;
            const isOn = document.getElementById('mes-r001-auto-refresh-toggle')?.dataset.active === 'true';
            if (isOn && typeof startDashboardAutoRefresh === 'function') startDashboardAutoRefresh(minutes);
        });
        // ZIP status tooltip toggle
        const zipStatus = document.getElementById('mes-r001-zip-status');
        const zipTooltip = document.getElementById('mes-r001-zip-tooltip');
        if (zipStatus && zipTooltip) {
            zipStatus.addEventListener('click', (e) => {
                e.stopPropagation();
                zipTooltip.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!zipStatus.contains(e.target)) zipTooltip.classList.add('hidden');
            });
        }
    }
    initMesR001TimePickers();
    ensureMesR001TimeRange();
    renderMesR001Rows(mesR001Rows);
    renderMesR001History();
    applyMesDailyFeatureVisibility();
    _refreshIcons(mesPanel);
}

function updateMesR001FiltersUI() {
    const bar = document.getElementById('mes-r001-filter-bar');
    if (!bar) return;
    bar.innerHTML = MES_R001_FILTERS.map((key) => {
        const active = mesR001Filter === key;
        const activeCls = active
            ? 'bg-primary text-white border-primary dark:bg-secondary dark:text-bgDark dark:border-secondary'
            : 'bg-white/70 dark:bg-gray-800 text-textMain dark:text-textDark border-borderLight dark:border-borderDark';
        return `<button type="button" class="quicklog-mes-filter-chip quicklog-filter-chip ${activeCls}" data-filter="${key}">${key}</button>`;
    }).join('');
}

function renderMesR001Rows(rows = mesR001Rows) {
    const head = document.getElementById('mes-r001-head');
    const body = document.getElementById('mes-r001-body');
    if (!head || !body) return;
    const columns = getMesR001Columns();
    head.innerHTML = `<tr>${columns.map((col) => `<th class="border-b border-borderLight dark:border-borderDark text-xs leading-tight whitespace-nowrap" style="min-width:120px;padding:8px 10px;white-space:nowrap;">${quickLogEscape(getQuickLogColumnDisplayName(col))}</th>`).join('')}</tr>`;
    const displayRows = getMesR001DisplayRows(rows);
    if (!displayRows.length) {
        body.innerHTML = ``;
        mesR001SelectedIndex = -1;
        updateMesR001Summary(rows);
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
    if (typeof destroyDefectDashboard === 'function') destroyDefectDashboard();
    // Hide ZIP status icon
    const zipStatus = document.getElementById('mes-r001-zip-status');
    if (zipStatus) zipStatus.classList.add('hidden');
    // Hide data sections
    document.getElementById('mes-rty-preview-section')?.classList.add('hidden');
    document.getElementById('mes-defect-records-section')?.classList.add('hidden');
}

async function searchMesDashboard() {
    ensureMesR001Panel();
    ensureMesR001TimeRange();
    syncMesR001HiddenRange();
    const input = document.getElementById('mes-r001-wo-input');
    const woText = String(input?.value || '').trim();
    const inputCount = parseMesR001WoInput(woText).length;
    if (!inputCount) { const summary = document.getElementById('mes-r001-summary'); if (summary) summary.textContent = t('mesR001NeedWo'); logToConsole(t('mesR001NeedWo'), 'warning'); showImportantToast('warning', t('reqFailed'), t('mesR001NeedWo')); return; }
    try {
        setMesR001SearchLoading(true); setStatus('generating', 'Searching...'); showProgress(); mesR001Rows = []; mesR001SelectedIndex = -1; renderMesR001Rows([]);
        const selectedStations = typeof getSelectedStations === 'function' ? Array.from(getSelectedStations()) : [];
        const response = await fetchRetry('/api/mesdaily/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ woText, timefrom: document.getElementById('mes-r001-timefrom')?.value || '', timeto: document.getElementById('mes-r001-timeto')?.value || '', selected_stations: selectedStations }) }, MAX_RETRIES);
        const data = await response.json();
        if (!response.ok || !data.success) throw createBackendError(data, 'Dashboard search failed');
        mesR001Rows = Array.isArray(data.defectRows) ? data.defectRows : [];
        renderMesR001Rows(mesR001Rows); completeProgress(); setStatus('success', t('statusSuccess')); logToConsole(`Dashboard search done. Defect rows: <b>${mesR001Rows.length}</b>`, 'success');
        saveMesR001History(woText);
        // Render per-WO charts + overview (KPIs, stationYield, alerts, global charts)
        const woList = data.summary?.workOrders || parseMesR001WoInput(woText);
        if (typeof renderDefectDashboard === 'function') renderDefectDashboard(mesR001Rows, woList);
        // Show data sections after successful fetch
        document.getElementById('mes-rty-preview-section')?.classList.remove('hidden');
        document.getElementById('mes-defect-records-section')?.classList.remove('hidden');
    } catch (error) {
        resetProgress();
        let message = error.message || String(error);
        if (message.includes('ERR_MES_API_UNREACHABLE')) {
            const tMsg = t('mesApiUnreachable');
            message = tMsg !== 'mesApiUnreachable' ? tMsg : 'Cannot connect to MES server. Please check the MES URL.';
        }
        mesR001Rows = []; mesR001SelectedIndex = -1; renderMesR001Rows([]);
        setStatus('error', t('reqFailed'));
        logToConsole(`Dashboard search failed: ${message}`, 'error');
        showImportantToast('error', t('reqFailed'), message);
    } finally { setMesR001SearchLoading(false); resetProgress(); }
}

// Keep alias for backward compatibility (auto-refresh, event bindings)
async function searchMesR001() { return searchMesDashboard(); }

function saveMesR001History(input) {
    const text = String(input || '').trim();
    if (!text) return;
    let history = [];
    try { history = JSON.parse(localStorage.getItem('mes_r001_history') || '[]'); } catch (_) { }
    history = history.filter((item) => item !== text);
    history.unshift(text);
    if (history.length > 3) history = history.slice(0, 3);
    localStorage.setItem('mes_r001_history', JSON.stringify(history));
    renderMesR001History();
}

function renderMesR001History() {
    const container = document.getElementById('mes-r001-history-container');
    if (!container) return;
    let history = [];
    try { history = JSON.parse(localStorage.getItem('mes_r001_history') || '[]'); } catch (_) { }
    if (!history.length) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = history.map((item) => {
        const text = quickLogEscape(item);
        const display = text.length > 25 ? text.substring(0, 25) + '...' : text;
        return `<button type="button" class="mes-r001-history-chip px-2 py-1 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-borderLight dark:border-borderDark rounded-md text-[10px] text-textMuted dark:text-gray-300 transition-colors" data-value="${text}" title="${text}">${display}</button>`;
    }).join('');
}

async function downloadMesR001LogsZip() {
    if (!Array.isArray(mesR001Rows) || !mesR001Rows.length) {
        logToConsole('No result rows. Search first.', 'warning');
        showImportantToast('warning', 'No Data', 'Search for defects first before downloading logs.');
        return;
    }

    // Only FAIL rows
    const failRows = mesR001Rows.filter(() => true); // R001 data is already all FAIL
    if (!failRows.length) {
        logToConsole('No FAIL rows found to download.', 'warning');
        return;
    }

    const btn = document.getElementById('mes-r001-download-zip');
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
            body: JSON.stringify({ rows: failRows, source: 'defectDaily' }),
        });

        if (!response.ok) {
            let errMsg = 'Download failed';
            try {
                const errData = await response.json();
                errMsg = errData.error || errMsg;
                // Show missing info even on error
                if (Array.isArray(errData.missing) && errData.missing.length) {
                    _showMesR001ZipStatus([], errData.missing);
                }
            } catch (_) { }
            throw new Error(errMsg);
        }

        // Read report from header
        let report = null;
        try {
            const reportB64 = response.headers.get('X-Download-Report');
            if (reportB64) report = JSON.parse(atob(reportB64));
        } catch (_) { }

        // Download blob
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

        // Show status icon with tooltip
        if (report) {
            _showMesR001ZipStatus(report.found || [], report.missing || []);
        }
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

function _showMesR001ZipStatus(found, missing) {
    const statusEl = document.getElementById('mes-r001-zip-status');
    const tooltipEl = document.getElementById('mes-r001-zip-tooltip');
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



async function openMesR001SelectedLogUiOnly() {
    if (mesR001SelectedIndex < 0 || !mesR001Rows[mesR001SelectedIndex]) {
        logToConsole(t('quickLogNoRowSelected'), 'warning');
        return;
    }
    const row = mesR001Rows[mesR001SelectedIndex];
    try {
        setQuickLogOpenLogLoading(true);
        logToConsole('Opening Defect Daily log file...', 'system');
        const program = typeof getGlobalActiveProgram === 'function' ? getGlobalActiveProgram() : { name: QUICKLOG_DEFAULT_PROGRAM };
        const response = await fetchRetry('/api/quicklog/mes-trace/open-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ row, program: program.name }),
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

    // Unified UI: read WO list from the shared textarea instead of requirement rows
    const woText = String(document.getElementById('mes-r001-wo-input')?.value || '').trim();
    const woList = parseMesR001WoInput(woText);
    // Read time range from the unified R001 hidden inputs
    const timefrom = document.getElementById('mes-r001-timefrom')?.value || '';
    const timeto = document.getElementById('mes-r001-timeto')?.value || '';

    if (mergeAll) {
        return {
            mode: 'grouped',
            groups: [{
                label: 'Merged',
                requirements: woList.map((wo) => ({ workOrder: wo })),
                output_path: outputBase,
            }],
            selected_stations: stationList,
            timefrom,
            timeto,
        };
    }

    const lastSep = Math.max(outputBase.lastIndexOf('\\'), outputBase.lastIndexOf('/'));
    const folder = lastSep > 0 ? outputBase.substring(0, lastSep) : outputBase;
    const sep = folder ? (folder.endsWith('\\') || folder.endsWith('/') ? '' : '\\') : '';
    const base = folder ? `${folder}${sep}` : '';
    const groups = woList.map((wo) => {
        const fname = `${wo}_${dateTag}.xlsx`;
        return {
            label: wo || 'Unknown',
            requirements: [{ workOrder: wo }],
            output_path: `${base}${fname}`,
        };
    });

    const payload = {
        mode: 'grouped',
        groups,
        selected_stations: stationList,
        timefrom,
        timeto,
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

// ============================================
// Dashboard Auto-Refresh Toggle
// ============================================

let dashboardAutoRefreshTimer = null;

function startDashboardAutoRefresh(minutes) {
    stopDashboardAutoRefresh();
    var ms = Math.max(1, Number(minutes) || 5) * 60 * 1000;
    dashboardAutoRefreshTimer = setInterval(function () {
        if (activeModule === 'mesdaily' && typeof searchMesDashboard === 'function') {
            logToConsole('Auto-refresh: searching MES Daily...', 'system');
            searchMesDashboard();
        }
    }, ms);
}

function stopDashboardAutoRefresh() {
    if (dashboardAutoRefreshTimer) {
        clearInterval(dashboardAutoRefreshTimer);
        dashboardAutoRefreshTimer = null;
    }
}

function toggleDashboardAutoRefresh() {
    const btn = document.getElementById('mes-r001-auto-refresh-toggle');
    if (!btn) return;
    const isOn = btn.dataset.active === 'true';
    if (isOn) {
        btn.dataset.active = 'false';
        btn.classList.remove('bg-green-500/20', 'text-green-600', 'dark:text-green-400');
        btn.classList.add('bg-white/10', 'text-textMuted', 'dark:text-gray-400');
        stopDashboardAutoRefresh();
        if (typeof logToConsole === 'function') logToConsole('Dashboard auto-refresh stopped.', 'system');
    } else {
        const intervalSelect = document.getElementById('mes-r001-auto-refresh-interval');
        const minutes = Number(intervalSelect?.value) || 5;
        btn.dataset.active = 'true';
        btn.classList.add('bg-green-500/20', 'text-green-600', 'dark:text-green-400');
        btn.classList.remove('bg-white/10', 'text-textMuted', 'dark:text-gray-400');
        startDashboardAutoRefresh(minutes);
        if (typeof logToConsole === 'function') logToConsole(`Dashboard auto-refresh started (every ${minutes} min).`, 'success');
    }
    _refreshIcons(btn);
}


function syncUnifiedMesTimeRange() {
    const r001 = getMesR001RangeControls();
    const rty = getMesRangeControls();
    if (r001.dateFrom && rty.dateFrom) rty.dateFrom.value = r001.dateFrom.value;
    if (r001.dateTo && rty.dateTo) rty.dateTo.value = r001.dateTo.value;
    if (r001.hourFrom && rty.hourFrom) rty.hourFrom.value = r001.hourFrom.value;
    if (r001.hourTo && rty.hourTo) rty.hourTo.value = r001.hourTo.value;
    syncMesHiddenRange();
    updateMesOutputNameFromRange();
}
