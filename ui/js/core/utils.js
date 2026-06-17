function pad2(value) {
    return String(value).padStart(2, '0');
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


function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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


function isValidUploadFile(file) {
    return !!file && typeof file === 'object' && typeof file.name === 'string' && file.name.trim() !== '';
}

function normalizeUploadFileList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(isValidUploadFile);
    if (typeof value !== 'string' && typeof value.length === 'number' && typeof value.item === 'function') return Array.from(value).filter(isValidUploadFile);
    return isValidUploadFile(value) ? [value] : [];
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
