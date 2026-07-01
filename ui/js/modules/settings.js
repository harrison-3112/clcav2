let currentSettingsData = {};

function initSettingsUI() {
    const btnSettings = document.getElementById('btn-settings-toggle');
    const modal = document.getElementById('settings-modal');
    const btnClose = document.getElementById('btn-settings-close');
    const btnCancel = document.getElementById('btn-settings-cancel');
    const btnSave = document.getElementById('btn-settings-save');
    const btnAddAlias = document.getElementById('settings-add-alias');
    const btnAddProgram = document.getElementById('settings-add-program');
    if (btnSettings) btnSettings.addEventListener('click', openSettingsModal);
    if (btnClose) btnClose.addEventListener('click', closeSettingsModal);
    if (btnCancel) btnCancel.addEventListener('click', closeSettingsModal);
    if (btnSave) btnSave.addEventListener('click', saveSettings);
    let pendingInputTarget = null;
    let hasWarnedProgramEdit = false;
    
    function switchTab(target) {
        document.querySelectorAll('.settings-tab-btn').forEach(b => {
            b.classList.remove('bg-primary/10', 'text-primary', 'dark:bg-secondary/10', 'dark:text-secondary', 'active');
            b.classList.add('text-textMuted');
        });
        target.classList.remove('text-textMuted');
        target.classList.add('bg-primary/10', 'text-primary', 'dark:bg-secondary/10', 'dark:text-secondary', 'active');
        
        document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(target.dataset.tab).classList.remove('hidden');
    }

    // Tab switching
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.currentTarget);
        });
    });

    // Program edit warning delegation
    document.addEventListener('focusin', (e) => {
        const target = e.target;
        if (target.classList.contains('settings-program-log-path') || 
            target.classList.contains('settings-program-csv-path') || 
            target.classList.contains('settings-program-name')) {
            if (!hasWarnedProgramEdit) {
                target.blur();
                pendingInputTarget = target;
                
                const warningModal = document.getElementById('program-warning-modal');
                const backdrop = document.getElementById('program-warning-backdrop');
                const content = document.getElementById('program-warning-content');
                if (warningModal) {
                    warningModal.classList.remove('hidden');
                    void warningModal.offsetWidth;
                    backdrop.classList.remove('opacity-0');
                    backdrop.classList.add('opacity-100');
                    content.classList.remove('scale-95', 'opacity-0');
                    content.classList.add('scale-100', 'opacity-100');
                }
            }
        }
    });

    const btnWarningCancel = document.getElementById('btn-program-warning-cancel');
    const btnWarningProceed = document.getElementById('btn-program-warning-proceed');
    
    function closeWarningModal() {
        const warningModal = document.getElementById('program-warning-modal');
        const backdrop = document.getElementById('program-warning-backdrop');
        const content = document.getElementById('program-warning-content');
        
        if (!warningModal) return;
        
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            warningModal.classList.add('hidden');
        }, 300);
        pendingInputTarget = null;
    }

    if (btnWarningCancel) btnWarningCancel.addEventListener('click', closeWarningModal);
    if (btnWarningProceed) {
        btnWarningProceed.addEventListener('click', () => {
            hasWarnedProgramEdit = true;
            closeWarningModal();
            if (pendingInputTarget) pendingInputTarget.focus();
        });
    }

    if (btnAddAlias) {
        btnAddAlias.addEventListener('click', () => {
            const tbody = document.getElementById('settings-aliases-tbody');
            tbody.insertAdjacentHTML('beforeend', getAliasRowHtml('', ''));
            lucide.createIcons();
        });
    }

    if (btnAddProgram) {
        btnAddProgram.addEventListener('click', () => {
            const tbody = document.getElementById('settings-programs-tbody');
            tbody.insertAdjacentHTML('beforeend', getProgramRowHtml(''));
            lucide.createIcons();
        });
    }
    // Row actions delegation
    document.addEventListener('click', (e) => {
        const btnDelete = e.target.closest('.btn-delete-row');
        if (btnDelete) {
            btnDelete.closest('tr').remove();
            return;
        }
        
        const btnReset = e.target.closest('.btn-reset-row');
        if (btnReset) {
            const tr = btnReset.closest('tr');
            if (tr) {
                const logInput = tr.querySelector('.settings-program-log-path');
                const csvInput = tr.querySelector('.settings-program-csv-path');
                if (logInput) logInput.value = '{Root}\\{Model}\\SYNC LOCAL DATA\\{Station}\\Log\\{Model}\\{Mode}\\{Station}\\{Fixture}\\{Date}\\{Result}';
                if (csvInput) csvInput.value = '{Root}\\{Model}\\SYNC LOCAL DATA\\{Station}\\CSV\\{Model}\\{Mode}\\{Station}\\{Fixture}';
            }
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


function getProgramRowHtml(name, logPath = '', csvPath = '') {
    const finalLogPath = logPath || '{Root}\\{Model}\\SYNC LOCAL DATA\\{Station}\\Log\\{Model}\\{Mode}\\{Station}\\{Fixture}\\{Date}\\{Result}';
    const finalCsvPath = csvPath || '{Root}\\{Model}\\SYNC LOCAL DATA\\{Station}\\CSV\\{Model}\\{Mode}\\{Station}\\{Fixture}';
    return `
        <tr class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
            <td class="px-2 py-2 border-r border-borderLight dark:border-borderDark">
                <input type="text" class="settings-program-name w-full bg-transparent outline-none font-mono text-xs" value="${clcaEscapeHtml(name)}" placeholder="MFGX">
            </td>
            <td class="px-2 py-2 border-r border-borderLight dark:border-borderDark">
                <input type="text" class="settings-program-log-path w-full bg-transparent outline-none font-mono text-xs" value="${clcaEscapeHtml(finalLogPath)}" placeholder="{Root}\\{Model}\\SYNC LOCAL DATA\\{Station}\\Log\\{Model}\\{Mode}\\{Station}\\{Fixture}\\{Date}\\{Result}">
            </td>
            <td class="px-2 py-2 border-r border-borderLight dark:border-borderDark">
                <input type="text" class="settings-program-csv-path w-full bg-transparent outline-none font-mono text-xs" value="${clcaEscapeHtml(finalCsvPath)}" placeholder="{Root}\\{Model}\\SYNC LOCAL DATA\\{Station}\\CSV\\{Model}\\{Mode}\\{Station}\\{Fixture}">
            </td>
            <td class="px-2 py-2 text-center flex items-center justify-center gap-1">
                <button type="button" class="btn-reset-row p-1.5 text-textMuted hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="${t('settingsProgramReset')}">
                    <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                </button>
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
    
    const programsTbody = document.getElementById('settings-programs-tbody');
    programsTbody.innerHTML = '';
    let programs = Array.isArray(data.programs) ? data.programs : [];
    if (!programs.length) {
        programs = [{ name: 'MFGX', logPath: '{Root}\\{Model}\\SYNC LOCAL DATA\\{Station}\\Log\\{Model}\\{Mode}\\{Station}\\{Fixture}\\{Date}\\{Result}', csvPath: '{Root}\\{Model}\\SYNC LOCAL DATA\\{Station}\\CSV\\{Model}\\{Mode}\\{Station}\\{Fixture}' }];
    }
    
    const activeProgramSelect = document.getElementById('settings-active-program');
    if (activeProgramSelect) {
        activeProgramSelect.innerHTML = '';
        const currentActive = typeof getGlobalActiveProgramName === 'function' ? getGlobalActiveProgramName() : 'MFGX';
        programs.forEach(p => {
            const name = typeof p === 'string' ? p : (p.name || '');
            if (name) {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                if (name === currentActive) opt.selected = true;
                activeProgramSelect.appendChild(opt);
            }
        });
    }

    programs.forEach(p => {
        const name = typeof p === 'string' ? p : (p.name || '');
        const logPath = typeof p === 'object' ? (p.logPath || '') : '';
        const csvPath = typeof p === 'object' ? (p.csvPath || '') : '';
        if (name) programsTbody.insertAdjacentHTML('beforeend', getProgramRowHtml(name, logPath, csvPath));
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
        
        // Read Programs
        const newPrograms = [];
        document.querySelectorAll('#settings-programs-tbody tr').forEach(tr => {
            const name = tr.querySelector('.settings-program-name')?.value?.trim();
            const logPath = tr.querySelector('.settings-program-log-path')?.value?.trim() || '';
            const csvPath = tr.querySelector('.settings-program-csv-path')?.value?.trim() || '';
            if (name) newPrograms.push({ name, logPath, csvPath });
        });
        newData.programs = newPrograms;
        
        const activeProgramSelect = document.getElementById('settings-active-program');
        if (activeProgramSelect && activeProgramSelect.value && typeof setGlobalActiveProgram === 'function') {
            setGlobalActiveProgram(activeProgramSelect.value);
        }
        
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
            if (typeof loadQuickLogPrograms === 'function') loadQuickLogPrograms();
            if (typeof loadQuickLogModels === 'function') loadQuickLogModels(); // Refresh models UI
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
