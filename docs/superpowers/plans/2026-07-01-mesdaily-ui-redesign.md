# MES Daily UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign MES Daily UI to be clean, logical, and aligned with backend logic — hide "Defect Analytics" until data is generated, restore RTY Export to original layout, and fix from/to alignment.

**Architecture:** MES Daily module has 2 backend endpoints: `POST /api/mesdaily/dashboard` (fetch KPIs + defect rows + charts data) and `POST /api/generate/mesdaily` (generate RTY Excel report). The UI must reflect this separation: "Data Query" section feeds the dashboard fetch, "RTY Export" section feeds the report generation. Defect Analytics (charts) section is hidden by default and only shown after `searchMesDashboard()` returns data. Clearing hides it again.

**Tech Stack:** HTML/Tailwind CSS, vanilla JS, Chart.js for charts, AirDatepicker for date pickers.

## Global Constraints

- All element IDs referenced by JS in `globals.js`, `stations.js`, `main.js`, `mesdaily.js`, `defectDashboard.js` must remain present in HTML
- Station panel must stay shared (outside mes-panel) for CLCA compatibility
- `btn-generate` and `btn-clear` must stay as shared global buttons
- `input-output` and `btn-browse-output` must stay for RTY Export
- Backend endpoints: `/api/mesdaily/dashboard` (POST, JSON body: woText, timefrom, timeto, selected_stations) and `/api/generate/mesdaily` (POST, JSON body: mode grouped, groups[], selected_stations, timefrom, timeto)
- Dashboard response schema: `{ success, kpis: { totalYield, output, defects, fpy, passCount, failCount, inputCount }, yieldTrend: [{ date, yield }], topDefects: [{ code, desc, count, pct }], stationYield: [{ station, yield, input, fail }], defectRows: [{ SerialNumber, WorkOrder, Station, Terminal, DefectCode, DefectDesc, Time, Status }], alerts: [{ level, message, station }], summary: { workOrders, recordCount } }`

---

### Task 1: Redesign mes-panel HTML — Data Query + RTY Preview + Defect Table + Defect Analytics (hidden) + RTY Export (original)

**Files:**
- Modify: `ui/index.html` — replace entire `<div id="mes-panel">` section

**Interfaces:**
- Consumes: `mes-r001-wo-input`, `mes-r001-datefrom`, `mes-r001-hourfrom`, `mes-r001-timefrom`, `mes-r001-dateto`, `mes-r001-hourto`, `mes-r001-timeto` (for Data Query)
- Produces: `mes-r001-dashboard` (hidden by default, shown after fetch), `mes-rty-preview-body`, `dashboard-kpi-*`, `dashboard-top-defects`, `dashboard-yield-trend`, `dashboard-station-yield`, `dashboard-alerts-section` (all hidden until data)

- [ ] **Step 1: Replace mes-panel HTML with redesigned version**

Replace the entire `<div id="mes-panel" class="hidden flex-col gap-5 w-full">...</div>` block with the new HTML below. The new structure has 5 sections in order:

1. **Data Query** — WO input + From/To time range (aligned, no presets) + auto-refresh toggle
2. **RTY Preview** — KPI cards + station yield table (hidden until data)
3. **Defect Records** — defect table with search + action buttons (hidden until data)
4. **Defect Analytics** — charts + alerts (hidden until data, shown after generate)
5. **RTY Export** — restore to original layout: merge checkbox + output path + browse + generate button

```html
<div id="mes-panel" class="hidden flex-col gap-5 w-full">
    <!-- 1. Data Query -->
    <section class="glass-card rounded-xl border border-borderLight dark:border-borderDark overflow-hidden">
        <div class="section-header-gradient justify-between !py-2 !px-4">
            <div class="flex items-center gap-2">
                <div class="p-1 rounded-md bg-white/20 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                </div>
                <span class="text-sm font-semibold">🔍 Data Query</span>
            </div>
        </div>
        <div class="p-5 grid gap-4">
            <label class="grid gap-1.5 text-sm">
                <span class="font-semibold text-textMain dark:text-textDark">WO Input</span>
                <textarea id="mes-r001-wo-input" rows="3"
                    class="w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-textMain dark:text-textDark resize-y"
                    placeholder="Paste WO list here... (comma, space, or newline separated)"></textarea>
                <div class="flex items-center justify-between mt-1">
                    <span class="text-xs text-textMuted dark:text-gray-400">Press <kbd class="font-sans px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded border border-black/10 dark:border-white/10 mx-0.5">Ctrl</kbd> + <kbd class="font-sans px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded border border-black/10 dark:border-white/10 mx-0.5">Enter</kbd> to search</span>
                    <span id="wo-count" class="text-xs text-primary dark:text-secondary font-medium">0 WOs</span>
                </div>
                <div id="mes-r001-history-container" class="flex flex-wrap gap-2 mt-2 empty:hidden"></div>
            </label>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-[10px] font-medium text-textMuted dark:text-gray-400 mb-1.5 uppercase tracking-wider">From</label>
                    <div class="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
                        <input type="text" id="mes-r001-datefrom" readonly autocomplete="off" placeholder="YYYY-MM-DD"
                            class="w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 text-textMain dark:text-textDark cursor-pointer">
                        <input type="text" id="mes-r001-hourfrom" inputmode="numeric" placeholder="HH:MM"
                            class="w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 text-textMain dark:text-textDark">
                    </div>
                    <input type="hidden" id="mes-r001-timefrom">
                </div>
                <div>
                    <label class="block text-[10px] font-medium text-textMuted dark:text-gray-400 mb-1.5 uppercase tracking-wider">To</label>
                    <div class="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
                        <input type="text" id="mes-r001-dateto" readonly autocomplete="off" placeholder="YYYY-MM-DD"
                            class="w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 text-textMain dark:text-textDark cursor-pointer">
                        <input type="text" id="mes-r001-hourto" inputmode="numeric" placeholder="HH:MM"
                            class="w-full text-sm px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 text-textMain dark:text-textDark">
                    </div>
                    <input type="hidden" id="mes-r001-timeto">
                </div>
            </div>

            <div class="flex items-center justify-end pt-2 border-t border-borderLight dark:border-borderDark">
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30">
                    <button id="mes-r001-auto-refresh-toggle" type="button"
                        class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-white/10 text-textMuted dark:text-gray-400 transition-colors"
                        data-active="false" title="Toggle auto-refresh">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                        </svg>
                        <span>Auto</span>
                    </button>
                    <select id="mes-r001-auto-refresh-interval"
                        class="text-xs rounded-md border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 px-2 py-1 text-textMain dark:text-textDark focus:outline-none">
                        <option value="1">1m</option><option value="3">3m</option><option value="5" selected>5m</option><option value="10">10m</option><option value="15">15m</option>
                    </select>
                </div>
            </div>
        </div>
    </section>

    <!-- 2. RTY Preview (hidden until data) -->
    <section id="mes-rty-preview-section" class="hidden glass-card rounded-xl border border-borderLight dark:border-borderDark overflow-hidden">
        <div class="section-header-gradient justify-between !py-2 !px-4">
            <div class="flex items-center gap-2">
                <div class="p-1 rounded-md bg-white/20"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg></div>
                <span class="text-sm font-semibold">📋 RTY Preview (Yield Overview)</span>
            </div>
        </div>
        <div class="p-5">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <div class="bg-white/40 dark:bg-gray-800/50 p-3 rounded-lg border border-borderLight dark:border-borderDark">
                    <p class="text-[10px] text-textMuted uppercase font-bold tracking-wider mb-1">Total Yield</p>
                    <p id="dashboard-kpi-yield" class="text-xl font-display font-bold text-green-600 dark:text-green-400">-%</p>
                </div>
                <div class="bg-white/40 dark:bg-gray-800/50 p-3 rounded-lg border border-borderLight dark:border-borderDark">
                    <p class="text-[10px] text-textMuted uppercase font-bold tracking-wider mb-1">Total Output</p>
                    <p id="dashboard-kpi-output" class="text-xl font-display font-bold text-primary dark:text-secondary">-</p>
                </div>
                <div class="bg-white/40 dark:bg-gray-800/50 p-3 rounded-lg border border-borderLight dark:border-borderDark">
                    <p class="text-[10px] text-textMuted uppercase font-bold tracking-wider mb-1">Total Defects</p>
                    <p id="dashboard-kpi-defects" class="text-xl font-display font-bold text-red-600 dark:text-red-400">-</p>
                </div>
                <div class="bg-white/40 dark:bg-gray-800/50 p-3 rounded-lg border border-borderLight dark:border-borderDark">
                    <p class="text-[10px] text-textMuted uppercase font-bold tracking-wider mb-1">FPY (First Pass)</p>
                    <p id="dashboard-kpi-fpy" class="text-xl font-display font-bold text-blue-600 dark:text-blue-400">-%</p>
                </div>
            </div>
            <div class="quicklog-table-scroll overflow-x-auto max-w-full rounded-lg border border-borderLight dark:border-borderDark">
                <table class="text-xs border-collapse w-full">
                    <thead class="bg-black/5 dark:bg-white/5 text-left text-textMuted dark:text-gray-400">
                        <tr>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5 font-semibold">Station</th>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5 font-semibold text-right">Input</th>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5 font-semibold text-right text-green-600 dark:text-green-400">Pass</th>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5 font-semibold text-right text-red-600 dark:text-red-400">Fail</th>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5 font-semibold text-right">Yield %</th>
                        </tr>
                    </thead>
                    <tbody id="mes-rty-preview-body" class="text-textMain dark:text-textDark bg-white/30 dark:bg-transparent"></tbody>
                </table>
            </div>
        </div>
    </section>

    <!-- 3. Defect Records (hidden until data) -->
    <section id="mes-defect-records-section" class="hidden glass-card rounded-xl border border-borderLight dark:border-borderDark">
        <div class="section-header-gradient justify-between !py-2 !px-4">
            <div class="flex items-center gap-2">
                <div class="p-1 rounded-md bg-white/20"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></svg></div>
                <span class="text-sm font-semibold">📋 Defect Records</span>
                <span id="mes-r001-summary" class="text-[11px] text-white/60 font-normal">0 FAIL rows found</span>
            </div>
            <div class="flex items-center gap-2">
                <button id="mes-r001-download-zip" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white transition-colors" title="Download FAIL log files as ZIP">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    <span>FAIL Logs</span>
                </button>
                <span id="mes-r001-zip-status" class="relative hidden cursor-pointer" title="">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    <span id="mes-r001-zip-tooltip" class="absolute bottom-full right-0 mb-2 hidden w-72 max-h-48 overflow-y-auto p-3 text-[10px] leading-relaxed rounded-lg bg-gray-900/95 text-gray-200 border border-gray-700 shadow-xl backdrop-blur-sm z-50 whitespace-pre-wrap"></span>
                </span>
                <button id="mes-r001-export-csv" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    <span>Export CSV</span>
                </button>
                <button id="mes-r001-open-log" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    <span>Open Log</span>
                </button>
            </div>
        </div>
        <div class="p-5">
            <div class="flex justify-end mb-4">
                <div class="relative w-full sm:w-64 shrink-0">
                    <input type="text" id="mes-r001-result-search" placeholder="Search Results..."
                        class="w-full text-xs px-3 py-2 pl-8 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-textMain dark:text-textDark">
                    <svg class="w-3.5 h-3.5 text-textMuted dark:text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
            </div>
            <div id="mes-r001-selected-row-info" class="mb-2 text-xs text-primary dark:text-secondary font-medium">No row selected</div>
            <div class="quicklog-table-scroll overflow-x-auto max-w-full">
                <table class="text-xs border-collapse w-full" style="min-width:1000px;">
                    <thead id="mes-r001-head" class="text-left text-textMuted dark:text-gray-400 bg-black/5 dark:bg-white/5">
                        <tr>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5">SN</th>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5">Terminal</th>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5">Result</th>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5">DefectCode</th>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5">Description</th>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5">WO</th>
                            <th class="border-b border-borderLight dark:border-borderDark p-2.5">Time</th>
                        </tr>
                    </thead>
                    <tbody id="mes-r001-body" class="text-textMain dark:text-textDark bg-white/30 dark:bg-transparent"></tbody>
                </table>
            </div>
        </div>
    </section>

    <!-- 4. Defect Analytics (hidden by default, shown after generate) -->
    <section id="mes-defect-analytics-section" class="hidden glass-card rounded-xl border border-borderLight dark:border-borderDark overflow-hidden">
        <div class="section-header-gradient justify-between !py-2 !px-4">
            <div class="flex items-center gap-2">
                <div class="p-1 rounded-md bg-white/20"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg></div>
                <span class="text-sm font-semibold">📊 Defect Analytics</span>
            </div>
        </div>
        <div class="p-4 space-y-4">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div class="lg:col-span-1 rounded-lg border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 p-4 relative" style="min-height:250px;">
                    <p class="text-[10px] text-textMuted dark:text-gray-400 font-semibold mb-1 uppercase tracking-wider">Top Defects Pareto</p>
                    <canvas id="dashboard-top-defects" style="max-height:220px;"></canvas>
                </div>
                <div class="lg:col-span-1 rounded-lg border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 p-4 relative" style="min-height:250px;">
                    <p class="text-[10px] text-textMuted dark:text-gray-400 font-semibold mb-1 uppercase tracking-wider">Yield Trend</p>
                    <canvas id="dashboard-yield-trend" style="max-height:220px;"></canvas>
                </div>
                <div class="lg:col-span-1 rounded-lg border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 p-4 relative" style="min-height:250px;">
                    <p class="text-[10px] text-textMuted dark:text-gray-400 font-semibold mb-1 uppercase tracking-wider">Station Yield</p>
                    <canvas id="dashboard-station-yield" style="max-height:220px;"></canvas>
                </div>
                <div id="dashboard-alerts-section" class="lg:col-span-1 rounded-lg border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 p-4 relative overflow-y-auto" style="min-height:250px;">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-red-500 uppercase tracking-wider">Alerts</span>
                        </div>
                    </div>
                </div>
            </div>
            <div id="mes-r001-dashboard" class="hidden"></div>
        </div>
    </section>

    <!-- 5. RTY Export (restored to original layout) -->
    <section class="glass-card rounded-xl border border-borderLight dark:border-borderDark overflow-hidden">
        <div class="section-header-gradient">
            <div class="p-1.5 rounded-lg bg-white/20 shrink-0">
                <i data-lucide="save" class="w-5 h-5"></i>
            </div>
            <p class="text-sm font-semibold" data-i18n="saveOutput">Save Output As</p>
        </div>
        <div class="p-5 flex flex-col gap-4">
            <div class="flex items-center gap-2.5">
                <input type="checkbox" id="mes-merge-all" class="w-4 h-4 rounded border-borderLight dark:border-borderDark accent-primary cursor-pointer shrink-0">
                <label for="mes-merge-all" class="text-xs text-textMain dark:text-textDark cursor-pointer" data-i18n="mergeAllLabel">Export merged file (all WOs combined)</label>
            </div>
            <div class="flex items-center gap-3">
                <input type="text" id="input-output" value="" placeholder="C:\Reports\" class="flex-1 text-sm px-4 py-2.5 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-textMuted/50 dark:placeholder:text-gray-500 transition-colors">
                <button id="btn-browse-output" class="py-2.5 px-5 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 flex items-center gap-2 shrink-0">
                    <i data-lucide="folder-search" class="w-4 h-4"></i>
                    <span data-i18n="browse">Browse</span>
                </button>
            </div>
        </div>
    </section>
</div>
```

- [ ] **Step 2: Verify HTML syntax — check all required IDs are present**

Run: `powershell -Command "Select-String -Path ui/index.html -Pattern 'mes-r001-wo-input|mes-r001-datefrom|mes-r001-hourfrom|mes-r001-timefrom|mes-r001-dateto|mes-r001-hourto|mes-r001-timeto|mes-r001-search|mes-r001-clear|mes-r001-auto-refresh|mes-rty-preview-section|mes-defect-records-section|mes-defect-analytics-section|mes-r001-dashboard|dashboard-kpi-yield|dashboard-kpi-output|dashboard-kpi-defects|dashboard-kpi-fpy|mes-rty-preview-body|mes-r001-head|mes-r001-body|mes-r001-summary|mes-r001-result-search|mes-r001-selected-row-info|mes-r001-download-zip|mes-r001-zip-status|mes-r001-zip-tooltip|mes-r001-export-csv|mes-r001-open-log|dashboard-top-defects|dashboard-yield-trend|dashboard-station-yield|dashboard-alerts-section|mes-merge-all|input-output|btn-browse-output' | Measure-Object | Select-Object Count"`

Expected: 34+ matches (all IDs present)

---

### Task 2: Update JS — show/hide sections based on data state

**Files:**
- Modify: `ui/js/modules/mesdaily.js` — update `applyMesDailyFeatureVisibility()`, `searchMesDashboard()`, `clearMesR001Panel()`

**Interfaces:**
- Consumes: `mes-rty-preview-section`, `mes-defect-records-section`, `mes-defect-analytics-section` (new section IDs)
- Produces: visibility toggling logic that shows sections after fetch, hides on clear

- [ ] **Step 1: Update `applyMesDailyFeatureVisibility()` to hide all data sections by default**

In `ui/js/modules/mesdaily.js`, replace the existing `applyMesDailyFeatureVisibility()` function with:

```javascript
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
    if (analyticsSection) analyticsSection.classList.toggle('hidden', !isMesDaily || !hasData);
    if (dashboard) dashboard.classList.toggle('hidden', dashboard.dataset.hasContent !== 'true' || !isMesDaily);

    if (isMesDaily && stationPanel) stationPanel.classList.remove('hidden');
    if (isMesDaily) setQuickLogReportControlsVisibility();
}
```

- [ ] **Step 2: Update `searchMesDashboard()` to show sections after successful fetch**

In `searchMesDashboard()`, after `renderMesR001Rows(mesR001Rows)` and `renderDefectDashboard(...)`, add:

```javascript
    // Show data sections after successful fetch
    document.getElementById('mes-rty-preview-section')?.classList.remove('hidden');
    document.getElementById('mes-defect-records-section')?.classList.remove('hidden');
    document.getElementById('mes-defect-analytics-section')?.classList.remove('hidden');
```

- [ ] **Step 3: Update `clearMesR001Panel()` to hide all data sections**

In `clearMesR001Panel()`, add after clearing rows:

```javascript
    // Hide all data sections
    document.getElementById('mes-rty-preview-section')?.classList.add('hidden');
    document.getElementById('mes-defect-records-section')?.classList.add('hidden');
    document.getElementById('mes-defect-analytics-section')?.classList.add('hidden');
```

- [ ] **Step 4: Verify JS syntax**

Run: `node -c ui/js/modules/mesdaily.js`
Expected: No errors

---

### Task 3: Remove `mes-r001-export-rty` button binding (RTY Export uses shared btn-generate)

**Files:**
- Modify: `ui/js/modules/mesdaily.js` — remove `mes-r001-export-rty` event binding from `ensureMesR001Panel()`

- [ ] **Step 1: Remove the export-rty binding block**

In `ensureMesR001Panel()`, remove these lines:

```javascript
        // RTY Export button — calls the shared onGenerate handler
        document.getElementById('mes-r001-export-rty')?.addEventListener('click', () => {
            if (typeof onGenerate === 'function') onGenerate();
        });
```

- [ ] **Step 2: Verify JS syntax**

Run: `node -c ui/js/modules/mesdaily.js`
Expected: No errors

---

### Task 4: Final verification — syntax + runtime

- [ ] **Step 1: Run full syntax check**

Run: `node -c ui/js/modules/mesdaily.js && node -c ui/js/modules/defectDashboard.js && node -c ui/js/main.js && node -c ui/js/core/ui.js && node -c ui/js/modules/stations.js && echo "ALL SYNTAX OK"`
Expected: `ALL SYNTAX OK`

- [ ] **Step 2: Start server and verify**

Run: `node server.js`
Expected: Server starts on port 5000 without errors

- [ ] **Step 3: Manual verification checklist**

- [ ] CLCA module: station panel visible, file cards visible, generate/clear visible
- [ ] MES Daily module: Data Query visible, RTY Preview hidden, Defect Records hidden, Defect Analytics hidden, RTY Export visible
- [ ] After fetch (enter WO + click Generate): RTY Preview visible, Defect Records visible, Defect Analytics visible
- [ ] After Clear: all data sections hidden again
- [ ] From/To time inputs are aligned (same layout, no preset buttons)
- [ ] No duplicate fetch/generate buttons in Data Query