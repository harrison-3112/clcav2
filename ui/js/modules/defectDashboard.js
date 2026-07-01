// Defect Daily Dashboard (Pie Chart Top 3 + Line Chart FAIL/hour per WO)
'use strict';

const _defectDashboardCharts = {};

function destroyDefectDashboard() {
    Object.keys(_defectDashboardCharts).forEach((key) => {
        if (_defectDashboardCharts[key] && typeof _defectDashboardCharts[key].destroy === 'function') {
            _defectDashboardCharts[key].destroy();
        }
        delete _defectDashboardCharts[key];
    });
    const container = document.getElementById('mes-r001-dashboard');
    if (container) {
        container.innerHTML = '';
        container.classList.add('hidden');
        container.dataset.hasContent = 'false';
    }
}

function renderDefectDashboard(rows, woList) {
    destroyDefectDashboard();
    const container = document.getElementById('mes-r001-dashboard');
    if (!container || typeof Chart === 'undefined') return;
    if (!Array.isArray(rows) || !rows.length) return;

    const workOrders = Array.isArray(woList) && woList.length ? woList : [...new Set(rows.map((r) => String(r.WorkOrder || '').trim()).filter(Boolean))];
    if (!workOrders.length) return;

    container.classList.remove('hidden');
    container.dataset.hasContent = 'true';

    // Build dashboard HTML
    let html = `
        <div class="glass-card rounded-xl border border-borderLight dark:border-borderDark overflow-hidden mb-4">
            <div class="section-header-gradient justify-between !py-2 !px-4">
                <div class="flex items-center gap-2">
                    <div class="p-1 rounded-md bg-white/20 shrink-0"><i data-lucide="bar-chart-3" class="w-4 h-4"></i></div>
                    <span class="text-sm font-semibold">Defect Analytics Dashboard</span>
                </div>
                <button id="mes-r001-export-dashboard" type="button" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white transition-colors" title="Export dashboard as HTML">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i><span>Export</span>
                </button>
            </div>
            <div class="p-4 space-y-6">
    `;

    workOrders.forEach((wo, idx) => {
        const woRows = rows.filter((r) => String(r.WorkOrder || '').trim() === wo);
        if (!woRows.length) return;

        const pieId = `defect-pie-${idx}`;
        const lineId = `defect-line-${idx}`;
        const woLabel = wo.length > 20 ? wo.substring(0, 20) + '...' : wo;

        html += `
            <div class="rounded-lg border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 p-4">
                <h3 class="text-xs font-bold text-primary dark:text-secondary mb-3 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"></span>
                    WO: ${_dashEscape(woLabel)} <span class="text-textMuted dark:text-gray-400 font-normal">(${woRows.length} defects)</span>
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="relative" style="min-height:220px; max-height:280px;">
                        <p class="text-[10px] text-textMuted dark:text-gray-400 font-semibold mb-1 uppercase tracking-wider">Top Defect Codes</p>
                        <canvas id="${pieId}" style="max-height:250px;"></canvas>
                    </div>
                    <div class="relative" style="min-height:220px; max-height:280px;">
                        <p class="text-[10px] text-textMuted dark:text-gray-400 font-semibold mb-1 uppercase tracking-wider">FAIL Count by Hour</p>
                        <canvas id="${lineId}" style="max-height:250px;"></canvas>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
    _refreshIcons(container);

    // Render charts for each WO
    workOrders.forEach((wo, idx) => {
        const woRows = rows.filter((r) => String(r.WorkOrder || '').trim() === wo);
        if (!woRows.length) return;
        _renderDefectPieChart(`defect-pie-${idx}`, woRows, idx);
        _renderDefectLineChart(`defect-line-${idx}`, woRows, idx);
    });

    // Bind export button
    document.getElementById('mes-r001-export-dashboard')?.addEventListener('click', () => exportDefectDashboardHtml(rows, workOrders));

    // Fetch and render dashboard overview (KPIs + charts + alerts)
    _fetchAndRenderOverview(rows, workOrders);
}

function _dashEscape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

const _CHART_COLORS = [
    '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

function _getChartColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(_CHART_COLORS[i % _CHART_COLORS.length]);
    }
    return colors;
}

function _renderDefectPieChart(canvasId, woRows, woIdx) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Count by DefectCode
    const counts = {};
    woRows.forEach((row) => {
        const code = String(row.DefectCode || 'Unknown').trim() || 'Unknown';
        counts[code] = (counts[code] || 0) + 1;
    });

    // Sort by count desc, take top 3, rest = "Other"
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top3 = sorted.slice(0, 3);
    const otherCount = sorted.slice(3).reduce((sum, [, c]) => sum + c, 0);

    const labels = top3.map(([code]) => code);
    const data = top3.map(([, count]) => count);
    if (otherCount > 0) {
        labels.push('Other');
        data.push(otherCount);
    }

    const isDark = document.documentElement.classList.contains('dark');
    const colors = _getChartColors(labels.length);

    const chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.map(c => c + 'cc'),
                borderColor: colors,
                borderWidth: 2,
                hoverOffset: 6,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: isDark ? '#cbd5e1' : '#475569',
                        font: { size: 10, family: 'Outfit, sans-serif' },
                        padding: 8,
                        boxWidth: 12,
                        boxHeight: 12,
                        useBorderRadius: true,
                        borderRadius: 3,
                    },
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    titleColor: isDark ? '#e2e8f0' : '#1e293b',
                    bodyColor: isDark ? '#cbd5e1' : '#475569',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                    titleFont: { size: 11, weight: 'bold', family: 'Outfit, sans-serif' },
                    bodyFont: { size: 10, family: 'Outfit, sans-serif' },
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : '0';
                            return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
                        },
                    },
                },
            },
        },
    });
    _defectDashboardCharts[`pie-${woIdx}`] = chart;
}

function _renderDefectLineChart(canvasId, woRows, woIdx) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Group by hour from defectTime (format: "2026/06/10 15:20:27" or "2026-06-10T15:20:27")
    const hourCounts = {};
    woRows.forEach((row) => {
        const timeStr = String(row.defectTime || row.time || row.Time || '').trim();
        const hourMatch = timeStr.match(/(\d{1,2}):\d{2}/);
        if (hourMatch) {
            const hour = parseInt(hourMatch[1], 10);
            const key = String(hour).padStart(2, '0') + ':00';
            hourCounts[key] = (hourCounts[key] || 0) + 1;
        }
    });

    // Build full 24h labels (only hours that have data +/- 1h context)
    const allHours = Object.keys(hourCounts).sort();
    if (!allHours.length) return;

    // Determine range from min hour to max hour
    const minHour = parseInt(allHours[0], 10);
    const maxHour = parseInt(allHours[allHours.length - 1], 10);
    const startH = Math.max(0, minHour - 1);
    const endH = Math.min(23, maxHour + 1);

    const labels = [];
    const data = [];
    for (let h = startH; h <= endH; h++) {
        const key = String(h).padStart(2, '0') + ':00';
        labels.push(key);
        data.push(hourCounts[key] || 0);
    }

    const isDark = document.documentElement.classList.contains('dark');

    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'FAIL Count',
                data,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2.5,
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#fff',
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.35,
                fill: true,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ticks: {
                        color: isDark ? '#94a3b8' : '#64748b',
                        font: { size: 10, family: 'Outfit, sans-serif' },
                    },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ticks: {
                        color: isDark ? '#94a3b8' : '#64748b',
                        font: { size: 10, family: 'Outfit, sans-serif' },
                        stepSize: 1,
                        precision: 0,
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    titleColor: isDark ? '#e2e8f0' : '#1e293b',
                    bodyColor: isDark ? '#cbd5e1' : '#475569',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                    titleFont: { size: 11, weight: 'bold', family: 'Outfit, sans-serif' },
                    bodyFont: { size: 10, family: 'Outfit, sans-serif' },
                },
            },
        },
    });
    _defectDashboardCharts[`line-${woIdx}`] = chart;
}

// ============================================
// Dashboard Overview — KPIs + Charts + Alerts
// ============================================

let _dashboardOverviewCharts = {};
let _lastDashboardAlerts = [];
let _lastDashboardKpis = null;
let _dashboardAutoRefreshTimer = null;

function getDashboardAlertConfig() {
    try {
        const raw = localStorage.getItem('mesDashboardAlertConfig');
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                yieldWarning: Number(parsed.yieldWarning) || 95,
                yieldCritical: Number(parsed.yieldCritical) || 90,
                defectSpikePct: Number(parsed.defectSpikePct) || 50,
                consecutiveFails: Number(parsed.consecutiveFails) || 5,
            };
        }
    } catch (_) { /* ignore */ }
    return { yieldWarning: 95, yieldCritical: 90, defectSpikePct: 50, consecutiveFails: 5 };
}

function saveDashboardAlertConfig(config) {
    try {
        localStorage.setItem('mesDashboardAlertConfig', JSON.stringify(config));
    } catch (_) { /* ignore */ }
}

async function _fetchAndRenderOverview(r001Rows, woList, isAutoRefresh = false) {
    const woInput = document.getElementById('mes-r001-wo-input');
    const timefromInput = document.getElementById('mes-r001-timefrom');
    const timetoInput = document.getElementById('mes-r001-timeto');

    const woText = woInput ? woInput.value : (Array.isArray(woList) ? woList.join(', ') : '');
    const timefrom = timefromInput ? timefromInput.value : '';
    const timeto = timetoInput ? timetoInput.value : '';

    if (!woText.trim() || !timefrom || !timeto) return;

    Object.keys(_dashboardOverviewCharts).forEach((key) => {
        if (_dashboardOverviewCharts[key] && typeof _dashboardOverviewCharts[key].destroy === 'function') {
            _dashboardOverviewCharts[key].destroy();
        }
        delete _dashboardOverviewCharts[key];
    });

    try {
        const config = getDashboardAlertConfig();
        const selectedStations = typeof getSelectedStations === 'function' ? Array.from(getSelectedStations()) : [];
        const response = await fetch('/api/mesdaily/dashboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                woText,
                timefrom,
                timeto,
                selected_stations: selectedStations,
                thresholds: config,
                previousKpis: isAutoRefresh ? _lastDashboardKpis : null,
            }),
        });
        const data = await response.json();

        if (!data.success) {
            logToConsole(`Dashboard error: ${data.error || 'Unknown'}`, 'error');
            return;
        }

        _lastDashboardKpis = data.kpis;
        _renderOverviewContent(data, config);

        if (isAutoRefresh && Array.isArray(data.alerts)) {
            _showNewAlertToasts(data.alerts);
        }
        _lastDashboardAlerts = data.alerts || [];
    } catch (err) {
        logToConsole(`Failed to load dashboard: ${err.message || err}`, 'error');
    }
}

function _renderOverviewContent(data, config) {
    const isDark = document.documentElement.classList.contains('dark');
    const k = data.kpis;

    // Update KPI cards (static HTML elements)
    if (k) {
        const elYield = document.getElementById('dashboard-kpi-yield');
        const elOutput = document.getElementById('dashboard-kpi-output');
        const elDefects = document.getElementById('dashboard-kpi-defects');
        const elFpy = document.getElementById('dashboard-kpi-fpy');
        if (elYield) elYield.textContent = `${k.totalYield}%`;
        if (elOutput) elOutput.textContent = String(k.output);
        if (elDefects) elDefects.textContent = String(k.defects);
        if (elFpy) elFpy.textContent = `${k.fpy}%`;
    }

    // Render RTY Preview table (stationYield)
    const rtyBody = document.getElementById('mes-rty-preview-body');
    if (rtyBody && Array.isArray(data.stationYield)) {
        if (!data.stationYield.length) {
            rtyBody.innerHTML = '';
        } else {
            rtyBody.innerHTML = data.stationYield.map((s) => {
                const pass = s.input - s.fail;
                const yieldClass = s.yield < 90 ? 'text-red-600 dark:text-red-400' : (s.yield < 95 ? 'text-yellow-600 dark:text-yellow-400' : '');
                return `<tr class="hover:bg-primary/5 transition-colors">
                    <td class="border-b border-borderLight dark:border-borderDark p-2.5 font-medium">${_dashEscape(s.station)}</td>
                    <td class="border-b border-borderLight dark:border-borderDark p-2.5 text-right font-mono">${s.input}</td>
                    <td class="border-b border-borderLight dark:border-borderDark p-2.5 text-right font-mono text-green-600 dark:text-green-400">${pass}</td>
                    <td class="border-b border-borderLight dark:border-borderDark p-2.5 text-right font-mono text-red-600 dark:text-red-400">${s.fail}</td>
                    <td class="border-b border-borderLight dark:border-borderDark p-2.5 text-right font-bold ${yieldClass}">${s.yield}%</td>
                </tr>`;
            }).join('');
        }
    }

    // Render Alerts into static container
    const alertsContainer = document.getElementById('dashboard-alerts-section');
    if (alertsContainer) {
        const alerts = data.alerts || [];
        let alertsHtml = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold ${alerts.length ? 'text-red-500' : 'text-green-500'} uppercase tracking-wider">${alerts.length ? 'Alerts' : 'All Good'}</span>
                </div>
                <button id="dashboard-alert-config-btn" type="button" class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold bg-white/10 hover:bg-white/20 ${alerts.length ? 'text-red-500' : 'text-textMuted dark:text-gray-400'} transition-colors" title="Configure alert thresholds">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    <span>Config</span>
                </button>
            </div>
        `;
        if (alerts.length) {
            alertsHtml += alerts.map((a) => `
                <div class="mb-1.5 text-[10px] flex items-start gap-1.5 ${a.level === 'critical' ? 'text-red-500' : 'text-yellow-500'}">
                    <span>${a.level === 'critical' ? '🔴' : '🟡'}</span>
                    <span>${_dashEscape(a.message)}</span>
                </div>
            `).join('');
        } else {
            alertsHtml += `<div class="text-[10px] text-green-500 flex items-center gap-1.5"><span>✅</span><span>No alerts — all metrics within target</span></div>`;
        }
        alertsContainer.innerHTML = alertsHtml;
    }

    // Render charts into static canvases
    if (data.yieldTrend && data.yieldTrend.length) _renderYieldTrendChart(data.yieldTrend, isDark);
    if (data.topDefects && data.topDefects.length) _renderTopDefectsChart(data.topDefects, isDark);
    if (data.stationYield && data.stationYield.length) _renderStationYieldChart(data.stationYield, isDark);

    document.getElementById('dashboard-alert-config-btn')?.addEventListener('click', _openAlertConfigPopup);
}

function _renderYieldTrendChart(trendData, isDark) {
    const canvas = document.getElementById('dashboard-yield-trend');
    if (!canvas) return;

    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: trendData.map((d) => d.date),
            datasets: [{
                label: 'Yield %',
                data: trendData.map((d) => d.yield),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2.5,
                pointBackgroundColor: '#10B981',
                pointBorderColor: isDark ? '#1e293b' : '#fff',
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.35,
                fill: true,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10, family: 'Outfit, sans-serif' } },
                },
                y: {
                    beginAtZero: false,
                    min: 80,
                    max: 100,
                    grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10, family: 'Outfit, sans-serif' }, callback: (v) => v + '%' },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    titleColor: isDark ? '#e2e8f0' : '#1e293b',
                    bodyColor: isDark ? '#cbd5e1' : '#475569',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1, cornerRadius: 8, padding: 10,
                    callbacks: { label: (ctx) => ` Yield: ${ctx.raw}%` },
                },
            },
        },
    });
    _dashboardOverviewCharts['yieldTrend'] = chart;
}

function _renderTopDefectsChart(defects, isDark) {
    const canvas = document.getElementById('dashboard-top-defects');
    if (!canvas) return;

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: defects.map((d) => d.code),
            datasets: [{
                label: 'Count',
                data: defects.map((d) => d.count),
                backgroundColor: defects.map((_, i) => _CHART_COLORS[i % _CHART_COLORS.length] + 'cc'),
                borderColor: defects.map((_, i) => _CHART_COLORS[i % _CHART_COLORS.length]),
                borderWidth: 1.5,
                borderRadius: 4,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10, family: 'Outfit, sans-serif' }, stepSize: 1, precision: 0 },
                },
                y: {
                    grid: { display: false },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10, family: 'Outfit, sans-serif' } },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    titleColor: isDark ? '#e2e8f0' : '#1e293b',
                    bodyColor: isDark ? '#cbd5e1' : '#475569',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1, cornerRadius: 8, padding: 10,
                    callbacks: {
                        title: (items) => {
                            const idx = items[0].dataIndex;
                            const d = defects[idx];
                            return d.desc ? `${d.code}: ${d.desc}` : d.code;
                        },
                        label: (ctx) => ` Count: ${ctx.raw} (${defects[ctx.dataIndex].pct}%)`,
                    },
                },
            },
        },
    });
    _dashboardOverviewCharts['topDefects'] = chart;
}

function _renderStationYieldChart(stations, isDark) {
    const canvas = document.getElementById('dashboard-station-yield');
    if (!canvas) return;

    const colors = stations.map((s) => {
        if (s.yield < 90) return '#EF4444';
        if (s.yield < 95) return '#F59E0B';
        return '#10B981';
    });

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: stations.map((s) => s.station),
            datasets: [{
                label: 'Yield %',
                data: stations.map((s) => s.yield),
                backgroundColor: colors.map((c) => c + 'cc'),
                borderColor: colors,
                borderWidth: 1.5,
                borderRadius: 4,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 9, family: 'Outfit, sans-serif' }, maxRotation: 45, minRotation: 30 },
                },
                y: {
                    beginAtZero: false,
                    min: 70,
                    max: 100,
                    grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10, family: 'Outfit, sans-serif' }, callback: (v) => v + '%' },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    titleColor: isDark ? '#e2e8f0' : '#1e293b',
                    bodyColor: isDark ? '#cbd5e1' : '#475569',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1, cornerRadius: 8, padding: 10,
                    callbacks: {
                        label: (ctx) => {
                            const s = stations[ctx.dataIndex];
                            return ` Yield: ${s.yield}% | Input: ${s.input} | Fail: ${s.fail}`;
                        },
                    },
                },
            },
        },
    });
    _dashboardOverviewCharts['stationYield'] = chart;
}

function _showNewAlertToasts(currentAlerts) {
    if (!Array.isArray(currentAlerts)) return;
    const prevMessages = new Set((_lastDashboardAlerts || []).map((a) => a.message));
    const newAlerts = currentAlerts.filter((a) => !prevMessages.has(a.message));

    for (const alert of newAlerts) {
        const icon = alert.level === 'critical' ? '🔴' : '🟡';
        if (typeof showToast === 'function') {
            showToast(`${icon} ${alert.message}`, alert.level === 'critical' ? 'error' : 'warning');
        } else if (typeof logToConsole === 'function') {
            logToConsole(`${icon} ALERT: ${alert.message}`, alert.level === 'critical' ? 'error' : 'warning');
        }
    }
}

function _openAlertConfigPopup() {
    const config = getDashboardAlertConfig();
    const existing = document.getElementById('dashboard-alert-config-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'dashboard-alert-config-overlay';
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm';
    overlay.innerHTML = `
        <div class="glass-card rounded-xl p-6 w-full max-w-md mx-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-primary dark:text-secondary">Alert Thresholds</h3>
                <button id="alert-config-close" type="button" class="text-textMuted dark:text-gray-400 hover:text-textPrimary dark:hover:text-white transition-colors">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-textMuted dark:text-gray-400 mb-1 uppercase tracking-wider">Yield Warning (%)</label>
                    <input id="alert-cfg-yield-warn" type="number" min="0" max="100" value="${config.yieldWarning}" class="w-full rounded-lg border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 px-3 py-2 text-sm text-textPrimary dark:text-white outline-none focus:border-primary dark:focus:border-secondary">
                    <p class="text-[10px] text-textMuted dark:text-gray-500 mt-1">Yield below this → warning alert</p>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-textMuted dark:text-gray-400 mb-1 uppercase tracking-wider">Yield Critical (%)</label>
                    <input id="alert-cfg-yield-crit" type="number" min="0" max="100" value="${config.yieldCritical}" class="w-full rounded-lg border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 px-3 py-2 text-sm text-textPrimary dark:text-white outline-none focus:border-primary dark:focus:border-secondary">
                    <p class="text-[10px] text-textMuted dark:text-gray-500 mt-1">Yield below this → critical alert</p>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-textMuted dark:text-gray-400 mb-1 uppercase tracking-wider">Defect Spike (%)</label>
                    <input id="alert-cfg-spike" type="number" min="0" max="500" value="${config.defectSpikePct}" class="w-full rounded-lg border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 px-3 py-2 text-sm text-textPrimary dark:text-white outline-none focus:border-primary dark:focus:border-secondary">
                    <p class="text-[10px] text-textMuted dark:text-gray-500 mt-1">Defect count increase vs previous check</p>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-textMuted dark:text-gray-400 mb-1 uppercase tracking-wider">Consecutive Fails</label>
                    <input id="alert-cfg-fails" type="number" min="1" max="100" value="${config.consecutiveFails}" class="w-full rounded-lg border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 px-3 py-2 text-sm text-textPrimary dark:text-white outline-none focus:border-primary dark:focus:border-secondary">
                    <p class="text-[10px] text-textMuted dark:text-gray-500 mt-1">Defects per WO above this → alert</p>
                </div>
            </div>
            <div class="flex gap-2 mt-5">
                <button id="alert-config-save" type="button" class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-all">Save</button>
                <button id="alert-config-cancel" type="button" class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-textMuted dark:text-gray-400 border border-borderLight dark:border-borderDark hover:bg-white/5 transition-colors">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    _refreshIcons(overlay);

    const close = () => overlay.remove();
    document.getElementById('alert-config-close')?.addEventListener('click', close);
    document.getElementById('alert-config-cancel')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.getElementById('alert-config-save')?.addEventListener('click', () => {
        const newConfig = {
            yieldWarning: Number(document.getElementById('alert-cfg-yield-warn')?.value) || 95,
            yieldCritical: Number(document.getElementById('alert-cfg-yield-crit')?.value) || 90,
            defectSpikePct: Number(document.getElementById('alert-cfg-spike')?.value) || 50,
            consecutiveFails: Number(document.getElementById('alert-cfg-fails')?.value) || 5,
        };
        saveDashboardAlertConfig(newConfig);
        close();
        if (typeof logToConsole === 'function') logToConsole('Alert thresholds saved.', 'success');
        const woInput = document.getElementById('mes-r001-wo-input');
        const woText = woInput ? woInput.value : '';
        if (woText.trim()) _fetchAndRenderOverview([], [], false);
    });
}

function exportDefectDashboardHtml(rows, workOrders) {
    if (!Array.isArray(rows) || !rows.length) {
        logToConsole('No data to export dashboard.', 'warning');
        return;
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let tableHtml = '';
    workOrders.forEach((wo, idx) => {
        const woRows = rows.filter((r) => String(r.WorkOrder || '').trim() === wo);
        if (!woRows.length) return;

        const pieChart = _defectDashboardCharts[`pie-${idx}`];
        const lineChart = _defectDashboardCharts[`line-${idx}`];
        const pieImgUrl = pieChart ? pieChart.toBase64Image() : '';
        const lineImgUrl = lineChart ? lineChart.toBase64Image() : '';

        // Top defects
        const counts = {};
        woRows.forEach((row) => {
            const code = String(row.DefectCode || 'Unknown').trim();
            counts[code] = (counts[code] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        // Hour distribution
        const hourCounts = {};
        woRows.forEach((row) => {
            const timeStr = String(row.defectTime || '').trim();
            const hourMatch = timeStr.match(/(\d{1,2}):\d{2}/);
            if (hourMatch) {
                const key = String(parseInt(hourMatch[1], 10)).padStart(2, '0') + ':00';
                hourCounts[key] = (hourCounts[key] || 0) + 1;
            }
        });

        tableHtml += `
            <div style="margin-bottom:32px; border:1px solid #e2e8f0; border-radius:12px; padding:20px; background:#f8fafc;">
                <h2 style="color:#3b82f6; font-size:16px; margin-bottom:12px;">WO: ${_dashEscape(wo)} (${woRows.length} defects)</h2>
                <div style="display:flex; gap:24px; flex-wrap:wrap;">
                    <div style="flex:1; min-width:280px;">
                        <h3 style="font-size:13px; color:#64748b; margin-bottom:8px;">Top Defect Codes</h3>
                        ${pieImgUrl ? `<img src="${pieImgUrl}" style="width:100%; max-width:400px; display:block; margin-bottom:16px;" alt="Pie Chart"/>` : ''}
                        <table style="width:100%; border-collapse:collapse; font-size:12px;">
                            <tr style="background:#e2e8f0;"><th style="padding:6px 10px; text-align:left;">Rank</th><th style="padding:6px 10px; text-align:left;">DefectCode</th><th style="padding:6px 10px; text-align:right;">Count</th><th style="padding:6px 10px; text-align:right;">%</th></tr>
                            ${sorted.map(([code, count], i) => {
            const pct = ((count / woRows.length) * 100).toFixed(1);
            return `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:5px 10px;">${i + 1}</td><td style="padding:5px 10px;">${_dashEscape(code)}</td><td style="padding:5px 10px; text-align:right;">${count}</td><td style="padding:5px 10px; text-align:right;">${pct}%</td></tr>`;
        }).join('')}
                        </table>
                    </div>
                    <div style="flex:1; min-width:280px;">
                        <h3 style="font-size:13px; color:#64748b; margin-bottom:8px;">FAIL Count by Hour</h3>
                        ${lineImgUrl ? `<img src="${lineImgUrl}" style="width:100%; max-width:600px; display:block; margin-bottom:16px;" alt="Line Chart"/>` : ''}
                        <table style="width:100%; border-collapse:collapse; font-size:12px;">
                            <tr style="background:#e2e8f0;"><th style="padding:6px 10px; text-align:left;">Hour</th><th style="padding:6px 10px; text-align:right;">FAIL Count</th></tr>
                            ${Object.keys(hourCounts).sort().map((hour) => `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:5px 10px;">${hour}</td><td style="padding:5px 10px; text-align:right;">${hourCounts[hour]}</td></tr>`).join('')}
                        </table>
                    </div>
                </div>
            </div>
        `;
    });

    const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Defect Dashboard ${dateStr}</title>
<style>body{font-family:'Segoe UI',Outfit,sans-serif;margin:24px;color:#1e293b;background:#fff;}h1{color:#3b82f6;font-size:20px;margin-bottom:4px;}p.sub{color:#94a3b8;font-size:12px;margin-bottom:24px;}</style>
</head><body>
<h1>Defect Analytics Dashboard</h1>
<p class="sub">Generated: ${now.toLocaleString()} | Total Defects: ${rows.length}</p>
${tableHtml}
</body></html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Defect_Dashboard_${dateStr}.html`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    logToConsole(`Dashboard exported: Defect_Dashboard_${dateStr}.html`, 'success');
}
