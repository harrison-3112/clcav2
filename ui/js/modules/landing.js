const landingView = document.getElementById('landing-view');

const landingModuleGrid = document.getElementById('landing-module-grid');

const landingEnter = document.getElementById('landing-enter');

const landingLangEn = document.getElementById('landing-lang-en');

const landingLangCn = document.getElementById('landing-lang-cn');

const landingThemeToggle = document.getElementById('landing-theme-toggle');

function renderLandingModules() {
    const fragment = document.createDocumentFragment();
    getEnabledModules().forEach((mod) => {
        const card = document.createElement('button');
        card.type = 'button';
        const accentClass = mod.cardAccent === 'yield' ? 'landing-card-yield' : 'landing-card-primary';
        card.className = `${mod.cardClass || ''} module-choice-card group relative cursor-pointer transform transition-all duration-500 ${accentClass} ${selectedLandingModule === mod.id ? 'active' : ''}`;
        card.innerHTML = `
            <div class="glass-panel bg-white/70 dark:bg-card-dark h-full rounded-xl p-6 card-inner-glow relative overflow-hidden transition-all duration-500">
                <div class="scanline-layer animate-scanline"></div>
                <div class="flex flex-col h-full justify-between relative z-10 text-left">
                    <div>
                        <div class="landing-module-icon w-10 h-10 rounded-lg flex items-center justify-center mb-6 transition-transform duration-300">
                            <span class="material-symbols-outlined text-2xl">${mod.cardIcon || 'bolt'}</span>
                        </div>
                        <h3 class="landing-module-label text-xl font-semibold mb-3 transition-colors font-display">${(mod.menuTitle && mod.menuTitle[currentLang]) || mod.title[currentLang]}</h3>
                        <p class="text-textMuted dark:text-slate-400 text-sm leading-relaxed font-light">${mod.summary[currentLang]}</p>
                    </div>
                    <div class="mt-8 flex items-center text-xs font-semibold tracking-wider opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 uppercase">
                        ${t('accessModule')} <span class="material-symbols-outlined text-sm ml-2">arrow_forward</span>
                    </div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => {
            selectedLandingModule = mod.id;
            enterWorkspace();
        });
        fragment.appendChild(card);
    });

    const comingSoon = document.createElement('div');
    comingSoon.className = 'coming-soon-card group relative cursor-not-allowed transition-all duration-500';
    comingSoon.innerHTML = `
        <div class="h-full rounded-xl p-6 border border-dashed border-borderLight dark:border-borderDark/80 bg-white/20 dark:bg-white/0 flex flex-col items-center justify-center text-center transition-all animate-pulse-border">
            <div class="coming-soon-plus w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 border border-borderLight dark:border-borderDark/50">
                <span class="material-symbols-outlined text-xl text-textMuted dark:text-slate-500">add</span>
            </div>
            <h3 class="text-lg font-medium text-textMuted dark:text-slate-500 mb-1 font-display">${t('comingSoon')}</h3>
            <p class="text-textMuted/70 dark:text-slate-600 text-xs tracking-wide">${t('comingSoonSub')}</p>
        </div>
    `;
    fragment.appendChild(comingSoon);

    landingModuleGrid.innerHTML = '';
    landingModuleGrid.appendChild(fragment);
    _refreshIcons();
}


function backToLanding() {
    workspaceView.classList.add('hidden');
    statusFooter.classList.add('hidden');
    landingView.classList.remove('hidden');
    closeSidebar();
    selectedLandingModule = null; // clear pre-selection so no card is highlighted
    renderLandingModules();
    applyLanguage();
}


function enterWorkspace() {
    // Reset file state for all modules on every workspace entry
    Object.keys(MODULES).forEach((key) => { stateByModule[key].files = {}; });
    activeModule = selectedLandingModule || activeModule || 'clca';
    if (!isModuleEnabled(activeModule)) activeModule = getEnabledModules()[0]?.id || 'clca';
    resetNonPersistentModuleState(activeModule);
    landingView.classList.add('hidden');
    workspaceView.classList.remove('hidden');
    statusFooter.classList.remove('hidden');
    updateModuleHeader();
    renderSidebar();
    renderFileCards();
    setQuickLogReportControlsVisibility();
    restoreOutputPathForActiveModule();
    restoreStationsForActiveModule();
    updateStatus();
    logToConsole(`${t('moduleChanged')} <b>${moduleLabel(activeModule)}</b>`, 'system');
    dismissLoadingScreen();
}


function switchModule(moduleId) {
    if (!isModuleEnabled(moduleId) || moduleId === activeModule) return;
    saveOutputPathForActiveModule();
    persistStationsForActiveModule();
    workspaceView.classList.add('module-switching');
    activeModule = moduleId;
    resetNonPersistentModuleState(activeModule);
    activePreset = null;
    updateModuleHeader();
    renderSidebar();
    renderFileCards();
    setQuickLogReportControlsVisibility();
    restoreOutputPathForActiveModule();
    restoreStationsForActiveModule();
    hideGrrResult();
    hideToast();
    applyLanguage();
    updateStatus();
    logToConsole(`${t('moduleChanged')} <b>${moduleLabel(activeModule)}</b>`, 'system');
    setTimeout(() => workspaceView.classList.remove('module-switching'), 300);
    // Close sidebar on mobile after selecting module
    if (!isSidebarPinned()) closeSidebar();
}
