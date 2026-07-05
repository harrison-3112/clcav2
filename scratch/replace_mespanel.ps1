$htmlPath = "ui/index.html"
$content = Get-Content -Path $htmlPath -Raw

$newPanel = @'
                <div id="mes-panel" class="hidden flex-col gap-5 w-full max-w-[1400px] mx-auto">
                    <!-- Tier 1: Control Bar -->
                    <section class="glass-card flex items-center justify-between p-3 rounded-xl border border-borderLight dark:border-borderDark">
                        <div class="flex flex-col gap-2 w-full">
                            <div class="flex items-center justify-between gap-3 w-full">
                                <textarea id="mes-r001-wo-input" rows="1" class="flex-1 bg-white/10 border border-borderLight dark:border-borderDark rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-textMain dark:text-textDark placeholder:text-textMuted resize-none" placeholder="Enter WO (comma separated)..."></textarea>
                                <div class="flex items-center gap-2">
                                    <div class="grid grid-cols-[minmax(0,1fr)_80px] gap-1.5">
                                        <input type="text" id="mes-r001-datefrom" readonly autocomplete="off" placeholder="YYYY-MM-DD" class="bg-white/10 border border-borderLight dark:border-borderDark rounded-lg px-3 py-2 text-sm text-textMain dark:text-textDark cursor-pointer">
                                        <input type="text" id="mes-r001-hourfrom" inputmode="numeric" placeholder="HH:MM" class="bg-white/10 border border-borderLight dark:border-borderDark rounded-lg px-3 py-2 text-sm text-textMain dark:text-textDark text-center">
                                    </div>
                                    <input type="hidden" id="mes-r001-timefrom">
                                    <span class="text-textMuted font-medium">-</span>
                                    <div class="grid grid-cols-[minmax(0,1fr)_80px] gap-1.5">
                                        <input type="text" id="mes-r001-dateto" readonly autocomplete="off" placeholder="YYYY-MM-DD" class="bg-white/10 border border-borderLight dark:border-borderDark rounded-lg px-3 py-2 text-sm text-textMain dark:text-textDark cursor-pointer">
                                        <input type="text" id="mes-r001-hourto" inputmode="numeric" placeholder="HH:MM" class="bg-white/10 border border-borderLight dark:border-borderDark rounded-lg px-3 py-2 text-sm text-textMain dark:text-textDark text-center">
                                    </div>
                                    <input type="hidden" id="mes-r001-timeto">
                                </div>
                                <button id="mes-r001-search" type="button" class="quicklog-generate-btn bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                    Fetch Dashboard
                                </button>
                                <div class="flex items-center gap-2 px-3 py-2 rounded-lg border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 shrink-0">
                                    <button id="mes-r001-auto-refresh-toggle" type="button" class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-white/10 text-textMuted dark:text-gray-400 transition-colors" data-active="false" title="Toggle auto-refresh">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                            <path d="M3 3v5h5" />
                                        </svg>
                                        <span>Auto</span>
                                    </button>
                                    <select id="mes-r001-auto-refresh-interval" class="text-xs rounded-md border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 px-2 py-1 text-textMain dark:text-textDark focus:outline-none">
                                        <option value="1">1m</option>
                                        <option value="3">3m</option>
                                        <option value="5" selected>5m</option>
                                        <option value="10">10m</option>
                                        <option value="15">15m</option>
                                    </select>
                                </div>
                            </div>
                            <div class="flex items-center justify-between px-2">
                                <span id="wo-count" class="text-xs text-primary dark:text-secondary font-medium">0 WOs</span>
                            </div>
                            <div id="mes-r001-history-container" class="flex flex-wrap gap-2 empty:hidden px-2"></div>
                        </div>
                    </section>

                    <!-- Tier 2: Bento Dashboard -->
                    <section id="mes-bento-dashboard" class="grid grid-cols-12 gap-5 hidden">
                        <!-- KPIs (col-span-3) -->
                        <div class="col-span-12 lg:col-span-3 grid grid-cols-2 gap-4">
                            <div class="glass-card p-4 flex flex-col justify-center relative overflow-hidden group hover:border-green-500/30 transition-colors rounded-xl border border-borderLight dark:border-borderDark bg-white/40 dark:bg-gray-800/50">
                                <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-colors"></div>
                                <span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">Yield</span>
                                <span id="dashboard-kpi-yield" class="text-3xl font-display font-bold text-green-600 dark:text-green-400">-%</span>
                            </div>
                            <div class="glass-card p-4 flex flex-col justify-center relative overflow-hidden group hover:border-secondary/30 transition-colors rounded-xl border border-borderLight dark:border-borderDark bg-white/40 dark:bg-gray-800/50">
                                <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-secondary/10 rounded-full blur-xl group-hover:bg-secondary/20 transition-colors"></div>
                                <span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">Output</span>
                                <span id="dashboard-kpi-output" class="text-3xl font-display font-bold text-primary dark:text-secondary">-</span>
                            </div>
                            <div class="glass-card p-4 flex flex-col justify-center relative overflow-hidden group hover:border-red-500/30 transition-colors rounded-xl border border-borderLight dark:border-borderDark bg-white/40 dark:bg-gray-800/50">
                                <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-colors"></div>
                                <span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">Defects</span>
                                <span id="dashboard-kpi-defects" class="text-3xl font-display font-bold text-red-600 dark:text-red-400">-</span>
                            </div>
                            <div class="glass-card p-4 flex flex-col justify-center relative overflow-hidden group hover:border-blue-500/30 transition-colors rounded-xl border border-borderLight dark:border-borderDark bg-white/40 dark:bg-gray-800/50">
                                <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
                                <span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">FPY</span>
                                <span id="dashboard-kpi-fpy" class="text-3xl font-display font-bold text-blue-600 dark:text-blue-400">-%</span>
                            </div>
                        </div>
                        <!-- Analytics (col-span-9) -->
                        <div class="col-span-12 lg:col-span-9 grid grid-cols-4 gap-4">
                            <div class="glass-card p-4 min-h-[220px] flex flex-col justify-center border-l-2 border-l-primary/50 relative overflow-hidden rounded-xl border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30">
                                <p class="text-[10px] text-textMuted dark:text-gray-400 uppercase tracking-wider font-bold mb-2">Yield Trend</p>
                                <canvas id="dashboard-yield-trend" class="w-full h-full max-h-[180px]"></canvas>
                            </div>
                            <div class="glass-card p-4 min-h-[220px] flex flex-col justify-center relative rounded-xl border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30">
                                <p class="text-[10px] text-textMuted dark:text-gray-400 uppercase tracking-wider font-bold mb-2">Top Defects Pareto</p>
                                <canvas id="dashboard-top-defects" class="w-full h-full max-h-[180px]"></canvas>
                            </div>
                            <div class="glass-card p-4 min-h-[220px] flex flex-col justify-center relative rounded-xl border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30">
                                <p class="text-[10px] text-textMuted dark:text-gray-400 uppercase tracking-wider font-bold mb-2">Station Yield</p>
                                <canvas id="dashboard-station-yield" class="w-full h-full max-h-[180px]"></canvas>
                            </div>
                            <div id="dashboard-alerts-section" class="glass-card p-4 min-h-[220px] flex flex-col relative rounded-xl border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 overflow-y-auto">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-red-500 uppercase tracking-wider">Alerts</span>
                                </div>
                            </div>
                        </div>
                        <div id="mes-r001-dashboard" class="hidden"></div>
                        <section id="mes-rty-preview-section" class="hidden"><tbody id="mes-rty-preview-body"></tbody></section>
                        <section id="mes-defect-analytics-section" class="hidden"></section>
                    </section>

                    <!-- Tier 3: Condensed Table -->
                    <section id="mes-defect-records-section" class="glass-card overflow-hidden flex flex-col gap-0 rounded-xl border border-borderLight dark:border-borderDark hidden">
                        <div class="section-header-gradient flex justify-between items-center !py-2 !px-4">
                            <span class="text-sm font-semibold flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9h18"/><path d="M3 15h18"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
                                Defect Records
                            </span>
                            
                            <div class="flex items-center gap-2">
                                <button id="mes-r001-download-zip" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white transition-colors" title="Download FAIL log files as ZIP">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    <span>Logs</span>
                                </button>
                                <span id="mes-r001-zip-status" class="relative hidden cursor-pointer" title="">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                    <span id="mes-r001-zip-tooltip" class="absolute bottom-full right-0 mb-2 hidden w-72 max-h-48 overflow-y-auto p-3 text-[10px] leading-relaxed rounded-lg bg-gray-900/95 text-gray-200 border border-gray-700 shadow-xl backdrop-blur-sm z-50 whitespace-pre-wrap"></span>
                                </span>
                                <button id="mes-r001-export-csv" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    <span>CSV</span>
                                </button>
                                <button id="mes-r001-open-log" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    <span>Open</span>
                                </button>
                                <button id="mes-r001-toggle-details" type="button" class="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ml-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    Show Details
                                </button>
                            </div>
                        </div>
                        <div class="p-3 bg-black/5 dark:bg-white/5 flex items-center justify-between border-b border-borderLight dark:border-borderDark">
                            <span id="mes-r001-summary" class="text-[11px] text-textMuted font-medium">0 FAIL rows found</span>
                            <div class="relative w-64">
                                <input type="text" id="mes-r001-result-search" placeholder="Search Results..." class="w-full text-xs px-3 py-1.5 pl-8 rounded-lg border border-borderLight dark:border-borderDark bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary/50 text-textMain dark:text-textDark">
                                <svg class="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            </div>
                        </div>
                        <div id="mes-r001-selected-row-info" class="px-4 py-1 text-xs text-primary dark:text-secondary font-medium hidden"></div>
                        <div class="p-0 overflow-x-auto quicklog-table-scroll">
                            <style>
                                table.hide-details .detail-col { display: none; }
                            </style>
                            <table id="mes-r001-table" class="w-full text-left text-sm hide-details" style="min-width: 800px;">
                                <thead id="mes-r001-head" class="bg-black/5 dark:bg-white/5 text-textMuted dark:text-gray-400 text-xs">
                                    <tr>
                                        <th class="border-b border-borderLight dark:border-borderDark p-3 font-semibold uppercase tracking-wider w-40">SN</th>
                                        <th class="border-b border-borderLight dark:border-borderDark p-3 font-semibold uppercase tracking-wider w-32">Terminal</th>
                                        <th class="border-b border-borderLight dark:border-borderDark p-3 font-semibold uppercase tracking-wider w-24">Result</th>
                                        <th class="border-b border-borderLight dark:border-borderDark p-3 font-semibold uppercase tracking-wider w-32">Defect Code</th>
                                        <th class="border-b border-borderLight dark:border-borderDark p-3 font-semibold uppercase tracking-wider w-32 detail-col">WO</th>
                                        <th class="border-b border-borderLight dark:border-borderDark p-3 font-semibold uppercase tracking-wider min-w-[200px] detail-col">Description</th>
                                        <th class="border-b border-borderLight dark:border-borderDark p-3 font-semibold uppercase tracking-wider w-24 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody id="mes-r001-body" class="divide-y divide-borderLight dark:divide-borderDark">
                                </tbody>
                            </table>
                        </div>
                    </section>
'@

# Regex replace from <div id="mes-panel"... to <!-- 5. RTY Export
$pattern = '(?s)<div id="mes-panel" class="hidden flex-col gap-5 w-full">.*?<!-- 5\. RTY Export'
$newContent = $content -replace $pattern, "$newPanel`n`n                    <!-- 5. RTY Export"

Set-Content -Path $htmlPath -Value $newContent -NoNewline
Write-Output "DONE"
