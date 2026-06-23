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

function exportDefectDashboardHtml(rows, workOrders) {
    if (!Array.isArray(rows) || !rows.length) {
        logToConsole('No data to export dashboard.', 'warning');
        return;
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let tableHtml = '';
    workOrders.forEach((wo) => {
        const woRows = rows.filter((r) => String(r.WorkOrder || '').trim() === wo);
        if (!woRows.length) return;

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
