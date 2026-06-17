const stationGrid = document.getElementById('station-grid');

const stationCount = document.getElementById('station-count');

const stationPanel = document.getElementById('station-panel');

let stationPresets = {};

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