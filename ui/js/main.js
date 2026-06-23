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


function updateModuleHeader() {
    const mod = MODULES[activeModule];
    moduleTitle.textContent = mod.title[currentLang];
    updateModuleUiVisibility();
    
    const btnSettings = document.getElementById('btn-settings-toggle');
    if (btnSettings) {
        btnSettings.classList.remove('hidden');
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

// ==================== INLINE STATION EDITING ====================

document.addEventListener('DOMContentLoaded', () => {
    initSettingsUI();
    initInlineStationEditor();
    if (typeof initMesTimePickers === 'function') initMesTimePickers();
    if (typeof initMesRequirements === 'function') initMesRequirements();
    if (typeof loadMesState === 'function') loadMesState();

    const sidebarBrand = document.getElementById('sidebar-brand');
    if (sidebarBrand) sidebarBrand.addEventListener('click', backToLanding);
    if (typeof btnSidebarToggle !== 'undefined' && btnSidebarToggle) btnSidebarToggle.addEventListener('click', openSidebar);
    if (typeof btnSidebarClose !== 'undefined' && btnSidebarClose) btnSidebarClose.addEventListener('click', closeSidebar);
    if (typeof sidebarBackdrop !== 'undefined' && sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);
    
    if (typeof btnSidebarToggleLg !== 'undefined' && btnSidebarToggleLg) {
        btnSidebarToggleLg.addEventListener('click', () => {
            if (typeof workspaceSidebar === 'undefined' || !workspaceSidebar) return;
            const hidden = workspaceSidebar.classList.contains('-translate-x-full');
            if (hidden) { workspaceSidebar.classList.remove('-translate-x-full'); }
            else { workspaceSidebar.classList.add('-translate-x-full'); }
        });
    }

    // Close sidebar on resize to large (sidebar becomes pinned via CSS)
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024 && typeof sidebarBackdrop !== 'undefined' && sidebarBackdrop) {
            sidebarBackdrop.classList.add('hidden', 'opacity-0');
            sidebarBackdrop.classList.remove('opacity-100');
        }
    });

    if (typeof landingThemeToggle !== 'undefined' && landingThemeToggle) landingThemeToggle.addEventListener('click', applyThemeToggle);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', applyThemeToggle);

    if (typeof landingLangEn !== 'undefined' && landingLangEn) landingLangEn.addEventListener('click', () => setLanguage('en'));
    if (typeof landingLangCn !== 'undefined' && landingLangCn) landingLangCn.addEventListener('click', () => setLanguage('cn'));
});
