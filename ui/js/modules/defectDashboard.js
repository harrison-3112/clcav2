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

function renderDefectDashboard(rows, woList, dashboardData) {
    destroyDefectDashboard();

    if (dashboardData && dashboardData.success) {
        renderDashboardOverviewFromData(dashboardData);
        return;
    }

    if (!Array.isArray(rows) || !rows.length) return;
    const workOrders = Array.isArray(woList) && woList.length ? woList : [...new Set(rows.map((r) => String(r.WorkOrder || r.WO || '').trim()).filter(Boolean))];
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

function destroyDashboardOverview() {
    Object.keys(_dashboardOverviewCharts).forEach((key) => {
        if (_dashboardOverviewCharts[key] && typeof _dashboardOverviewCharts[key].destroy === 'function') {
            _dashboardOverviewCharts[key].destroy();
        }
        delete _dashboardOverviewCharts[key];
    });
}

function renderDashboardOverviewFromData(data) {
    if (!data || data.success === false || !data.kpis) {
        const alertsContainer = document.getElementById('dashboard-alerts-section');
        if (alertsContainer) {
            alertsContainer.innerHTML = '<div class="text-[11px] text-textMuted dark:text-gray-400">No dashboard data available.</div>';
        }
        return;
    }
    destroyDashboardOverview();
    _lastDashboardKpis = data.kpis || null;
    _renderOverviewContent(data, getDashboardAlertConfig());
    _lastDashboardAlerts = data.alerts || [];
}

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
    const items = Array.isArray(r001Rows) && r001Rows.length ? r001Rows : [];
    if (!items.length) return;

    destroyDashboardOverview();

    try {
        if (typeof buildMesDailyDemoDashboardData !== 'function') {
            logToConsole('buildMesDailyDemoDashboardData not available', 'error');
            return;
        }
        const data = buildMesDailyDemoDashboardData(items);
        if (!data || !data.success) {
            logToConsole('Dashboard demo data build failed', 'error');
            return;
        }

        const config = getDashboardAlertConfig();
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
        const elInput = document.getElementById('dashboard-kpi-input');
        const elFpy = document.getElementById('dashboard-kpi-fpy');
        const elOutput = document.getElementById('dashboard-kpi-output');
        const elFail = document.getElementById('dashboard-kpi-fail');
        const input = k.input ?? k.totalInput ?? '-';
        const fpy = k.fpy ?? k.firstPassYield ?? k.totalYield ?? k.yield ?? '-';
        const output = k.output ?? k.totalOutput ?? '-';
        const fail = k.fail ?? k.defects ?? k.totalDefects ?? '-';
        if (elInput) elInput.textContent = String(input);
        if (elFpy) {
            elFpy.textContent = fpy === '-' ? '-%' : `${fpy}%`;
            elFpy.classList.toggle('text-red-600', Number(fpy) < 90);
            elFpy.classList.toggle('dark:text-red-400', Number(fpy) < 90);
            elFpy.classList.toggle('text-yellow-600', Number(fpy) >= 90 && Number(fpy) < 95);
            elFpy.classList.toggle('dark:text-yellow-400', Number(fpy) >= 90 && Number(fpy) < 95);
            elFpy.classList.toggle('text-green-600', Number(fpy) >= 95);
            elFpy.classList.toggle('dark:text-green-400', Number(fpy) >= 95);
        }
        if (elOutput) elOutput.textContent = String(output);
        if (elFail) elFail.textContent = String(fail);
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
            </div>
        `;
        if (alerts.length) {
            alertsHtml += alerts.map((a) => `
                <div class="mb-1.5 text-[10px] flex items-start gap-1.5 ${a.level === 'critical' ? 'text-red-500' : 'text-yellow-500'}">
                    <span>${a.level === 'critical' ? '🔴' : '🟡'}</span>
                    <span>${_dashEscape(a.message || a.msg || '')}</span>
                </div>
            `).join('');
        } else {
            alertsHtml += `<div class="text-[10px] text-green-500 flex items-center gap-1.5"><span>✅</span><span>No alerts — all metrics within target</span></div>`;
        }
        alertsContainer.innerHTML = alertsHtml;
    }

    // Render charts into static canvases
    if (data.topDefects && data.topDefects.length) _renderTopDefectsChart(data.topDefects, isDark);
    
    _renderStationDashboards(data, isDark);
    _renderSummaryTable(data);

    // Instead of opening a popup, the save button applies rules directly
    document.getElementById('dashboard-cfg-save-btn')?.addEventListener('click', () => {
        const yieldVal = document.getElementById('dashboard-cfg-yield')?.value;
        const defectVal = document.getElementById('dashboard-cfg-defect')?.value;
        const config = {
            yieldWarning: 95,
            yieldCritical: Number(yieldVal) || 90,
            defectSpikePct: Number(defectVal) || 10,
            consecutiveFails: 5
        };
        localStorage.setItem('mesDashboardAlertConfig', JSON.stringify(config));
        if (typeof showImportantToast === 'function') showImportantToast('success', 'Rules Applied', 'Alert configuration saved locally.');
    });
}

function _renderStationDashboards(data, isDark) {
    const container = document.getElementById('dashboard-station-charts');
    if (!container) return;
    container.innerHTML = '';
    
    const stations = data.stationYield || [];
    stations.forEach((st, idx) => {
        const card = document.createElement('div');
        card.className = 'glass-card p-4 rounded-xl border border-borderLight dark:border-borderDark bg-white/50 dark:bg-gray-900/30 grid grid-cols-12 gap-4';
        card.innerHTML = `
            <div class="col-span-12 font-bold text-sm border-b border-borderLight dark:border-borderDark pb-2">${st.station}</div>
            <div class="col-span-12 md:col-span-4 h-48 relative flex items-center justify-center">
                <canvas id="station-pie-${idx}"></canvas>
            </div>
            <div class="col-span-12 md:col-span-8 h-48 relative">
                <canvas id="station-combo-${idx}"></canvas>
            </div>
        `;
        container.appendChild(card);
        
        const pieCtx = document.getElementById(`station-pie-${idx}`);
        if (pieCtx) {
            const pieChart = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Solder', 'Placement', 'Missing'],
                    datasets: [{ data: [st.fail + 2, st.fail + 1, st.fail], backgroundColor: _CHART_COLORS.slice(0, 3) }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
            });
            _dashboardOverviewCharts[`st-pie-${idx}`] = pieChart;
        }
        
        const comboCtx = document.getElementById(`station-combo-${idx}`);
        const trend = data.stationHourlyTrend && data.stationHourlyTrend[st.station] ? data.stationHourlyTrend[st.station] : [];
        if (comboCtx && trend.length) {
            const comboChart = new Chart(comboCtx, {
                type: 'bar',
                data: {
                    labels: trend.map(t => t.hour),
                    datasets: [
                        { type: 'line', label: 'FPY (%)', data: trend.map(t => t.fpy), borderColor: '#10b981', yAxisID: 'y1' },
                        { type: 'bar', label: 'Input', data: trend.map(t => t.input), backgroundColor: '#3b82f6cc', yAxisID: 'y' },
                        { type: 'bar', label: 'Fail', data: trend.map(t => t.fail), backgroundColor: '#ef4444cc', yAxisID: 'y' }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { type: 'linear', position: 'left', title: { display: true, text: 'Units' } },
                        y1: { type: 'linear', position: 'right', min: 0, max: 100, title: { display: true, text: 'FPY %' } }
                    }
                }
            });
            _dashboardOverviewCharts[`st-combo-${idx}`] = comboChart;
        }
    });
}

function _renderSummaryTable(data) {
    const tbody = document.getElementById('dashboard-summary-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    const rows = Array.isArray(data.summaryRows) && data.summaryRows.length
        ? data.summaryRows
        : (data.stationYield || []).map(st => ({
            model: st.model || 'N/A',
            processName: st.station,
            input: st.input || 0,
            fail: st.fail || 0,
            failP: st.failP || 0,
            passP: st.passP || st.fpy || st.yield || 0,
            defectQty: st.defectQty || st.fail || 0,
            failD: st.failD || st.failP || 0,
            passD: st.passD || st.passP || 0,
            output: st.output || Math.max(0, (st.input || 0) - (st.fail || 0)),
        }));

    rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-800/50';
        tr.innerHTML = `
            <td class="px-4 py-2">${_dashEscape(row.model || 'N/A')}</td>
            <td class="px-4 py-2 font-semibold">${_dashEscape(row.processName || row.station || 'N/A')}</td>
            <td class="px-4 py-2">${row.input || 0}</td>
            <td class="px-4 py-2 text-red-500">${row.fail || 0}</td>
            <td class="px-4 py-2">${row.failP || 0}%</td>
            <td class="px-4 py-2 text-green-500">${row.passP || 0}%</td>
            <td class="px-4 py-2">${row.defectQty || 0}</td>
            <td class="px-4 py-2">${row.failD || 0}%</td>
            <td class="px-4 py-2">${row.passD || 0}%</td>
            <td class="px-4 py-2 font-semibold text-textMain dark:text-textDark">${row.output || 0}</td>
        `;
        tbody.appendChild(tr);
    });
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
<h1>Defect Dashboard</h1>
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
