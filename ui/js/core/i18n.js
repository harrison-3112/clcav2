let currentLang = localStorage.getItem('clca_lang') || getDefaultUiLanguage();

const themeToggle = document.getElementById('themeToggle');

function t(key) {
    return (LANG[currentLang] && LANG[currentLang][key]) || LANG.en[key] || key;
}


function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        const value = t(key);
        if (value) el.textContent = value;
    });

    toastTitle.textContent = t('toastTitle');
    toastMsg.textContent = t('toastMsg');
    updateModuleUiVisibility();
    initMesTimePickers();
    updateMesRequirementRowText();

    landingLangEn.classList.toggle('active', currentLang === 'en');
    landingLangCn.classList.toggle('active', currentLang === 'cn');
    if (langToggleEn) langToggleEn.classList.toggle('active', currentLang === 'en');
    if (langToggleCn) langToggleCn.classList.toggle('active', currentLang === 'cn');

    ['feat1-title','feat1-sub','feat2-title','feat2-sub','feat3-title','feat3-sub'].forEach((id, i) => {
        const keys = ['feat1Title','feat1Sub','feat2Title','feat2Sub','feat3Title','feat3Sub'];
        const el = document.getElementById(id);
        if (el) el.textContent = t(keys[i]);
    });

    renderLandingModules();
    renderSidebar();
    if (landingView.classList.contains('hidden')) {
        if (activeModule === 'quicklog') {
            applyQuickLogLanguageNoAnimation();
            return;
        }
        updateModuleHeader();
        renderStationCheckboxes(false);
        updateMesRequirementRowText();
        if (activeModule === 'mesdaily') { ensureMesDailyFeatureTabs(); ensureMesR001Panel(); initMesR001TimePickers(); }
        if (activeModule === 'clca') {
            updateClcaLocalizedText();
            updateClcaDataFileDisplay();
            renderClcaMergeRenamePanel();
        }
        updateStatus();
        return;
    }
    renderFileCards();
    updateModuleHeader();
    renderStationCheckboxes(false);
    updateStatus();
}


function setLanguage(lang) {
    if (!LANG[lang]) return;
    currentLang = lang;
    localStorage.setItem('clca_lang', currentLang);
    if (activeModule === 'quicklog' && landingView.classList.contains('hidden')) {
        applyQuickLogLanguageNoAnimation();
        return;
    }
    // Crossfade text on module cards when switching language on landing
    if (!landingView.classList.contains('hidden') && selectedLandingModule !== 'quicklog') {
        const textEls = landingModuleGrid.querySelectorAll('.landing-module-label, .module-choice-card p, .module-choice-card .uppercase');
        textEls.forEach(el => { el.style.transition = 'opacity 0.35s ease'; el.style.opacity = '0'; });
        setTimeout(() => {
            applyLanguage();
            requestAnimationFrame(() => {
                const freshEls = landingModuleGrid.querySelectorAll('.landing-module-label, .module-choice-card p, .module-choice-card .uppercase');
                freshEls.forEach(el => { el.style.opacity = '0'; el.style.transition = 'opacity 0.45s ease'; });
                requestAnimationFrame(() => freshEls.forEach(el => { el.style.opacity = '1'; }));
            });
        }, 350);
    } else {
        applyLanguage();
    }
}
