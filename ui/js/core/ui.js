let toastTimerId = null;


const toast = document.getElementById('toast');

const toastClose = document.getElementById('toast-close');

const toastTitle = document.getElementById('toast-title');

const toastMsg = document.getElementById('toast-msg');

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
    let missing = [];

    if (activeModule === 'mesdaily') {
        // Unified UI: check WO textarea instead of requirement rows
        const woText = String(document.getElementById('mes-r001-wo-input')?.value || '').trim();
        if (!woText) {
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
