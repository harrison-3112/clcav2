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


function getModelRowHtml(name, logPath = '', csvPath = '') {
    return `
        <tr class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
            <td class="px-2 py-2 border-r border-borderLight dark:border-borderDark">
                <input type="text" class="settings-model-name w-full bg-transparent outline-none font-mono text-xs" value="${clcaEscapeHtml(name)}" placeholder="VO0301">
            </td>
            <td class="px-2 py-2 border-r border-borderLight dark:border-borderDark">
                <input type="text" class="settings-model-log-path w-full bg-transparent outline-none font-mono text-xs" value="${clcaEscapeHtml(logPath)}" placeholder="\\\\server\\Testlog\\camera\\VO0301\\SYNC LOCAL DATA">
            </td>
            <td class="px-2 py-2 border-r border-borderLight dark:border-borderDark">
                <input type="text" class="settings-model-csv-path w-full bg-transparent outline-none font-mono text-xs" value="${clcaEscapeHtml(csvPath)}" placeholder="\\\\server\\Testlog\\camera\\VO0301\\CSV">
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
        const logPath = typeof m === 'object' ? (m.logPath || '') : '';
        const csvPath = typeof m === 'object' ? (m.csvPath || '') : '';
        if (name) modelsTbody.insertAdjacentHTML('beforeend', getModelRowHtml(name, logPath, csvPath));
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
            const logPath = tr.querySelector('.settings-model-log-path')?.value?.trim() || '';
            const csvPath = tr.querySelector('.settings-model-csv-path')?.value?.trim() || '';
            if (name) newModels.push({ name, logPath, csvPath });
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
