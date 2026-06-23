let clcaPrecheckByKey = {};

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

function clcaEscapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
