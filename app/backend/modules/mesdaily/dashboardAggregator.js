'use strict';

/**
 * dashboardAggregator.js
 *
 * Aggregates MES B005 (yield) + B006 (defect) data into a single dashboard response.
 * Reuses query/filter/dedupe functions from mes-daily/logic.js.
 */

const { getMesLogic, parseMesDateTime } = require('./mesClient');

/**
 * Parse WO input text into a list of WO strings.
 * @param {string} text
 * @returns {string[]}
 */
function parseWoInput(text) {
    const seen = new Set();
    const out = [];
    String(text || '').split(/[\s,]+/).forEach((item) => {
        const wo = String(item || '').trim();
        if (!wo || seen.has(wo)) return;
        seen.add(wo);
        out.push(wo);
    });
    return out;
}

/**
 * Default alert thresholds (can be overridden by frontend config).
 */
const DEFAULT_THRESHOLDS = {
    yieldWarning: 95,      // yield < 95% → warning
    yieldCritical: 90,     // yield < 90% → critical
    defectSpikePct: 50,    // defect count spike > 50% vs previous → warning
    consecutiveFails: 5,   // consecutive fails > 5 → warning
};

/**
 * Build the full dashboard data object.
 *
 * @param {object} params
 * @param {string} params.woText           - WO input text (comma/space separated)
 * @param {string} params.timefrom         - "yyyy-MM-ddTHH:mm"
 * @param {string} params.timeto           - "yyyy-MM-ddTHH:mm"
 * @param {string[]} [params.selectedStations] - process names to filter
 * @param {object} [params.thresholds]     - alert threshold overrides
 * @param {object} [params.previousKpis]   - previous KPIs for spike detection
 * @returns {Promise<object>}
 */
async function buildDashboardData({ woText, timefrom, timeto, selectedStations = [], thresholds = {}, previousKpis = null }) {
    const mesLogic = getMesLogic();
    if (!mesLogic || typeof mesLogic.queryMES !== 'function') {
        throw new Error('MES logic module not available.');
    }

    const woList = parseWoInput(woText);
    if (!woList.length) {
        return {
            success: true,
            kpis: null,
            yieldTrend: [],
            topDefects: [],
            stationYield: [],
            defectRows: [],
            alerts: [],
            summary: { workOrders: [], recordCount: 0 },
        };
    }

    const from = parseMesDateTime(timefrom);
    const to = parseMesDateTime(timeto);
    if (!from || !to) {
        throw new Error('Invalid MES datetime range.');
    }

    const effectiveThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

    // Build date chunks (non-overlapping 2-day windows)
    const chunks = mesLogic.getDailyDateChunks(from.date, to.date);

    const filtOpts = {
        workOrders: woList,
        processes: selectedStations,
        fromDate: from.date,
        fromHour: from.hour,
        toDate: to.date,
        toHour: to.hour,
        requirements: woList.map((wo) => ({ workOrder: wo })),
    };

    // Build fromDT/toDT for B006 filtering
    const fromDT = new Date(`${from.date.slice(0, 4)}-${from.date.slice(4, 6)}-${from.date.slice(6, 8)}T${String(from.hour).padStart(2, '0')}:${String(from.minute).padStart(2, '0')}:00Z`);
    const toDT = new Date(`${to.date.slice(0, 4)}-${to.date.slice(4, 6)}-${to.date.slice(6, 8)}T${String(to.hour).padStart(2, '0')}:${String(to.minute).padStart(2, '0')}:00Z`);

    // Fetch B005 + B006
    const b005 = [];
    const b006 = [];

    for (const chunk of chunks) {
        const rawB005 = await mesLogic.queryMES('B005', chunk.from, chunk.to);
        const filteredB005 = mesLogic.filterB005(rawB005, filtOpts);
        b005.push(...filteredB005);
    }

    for (const chunk of chunks) {
        const rawB006 = await mesLogic.queryMES('B006', chunk.from, chunk.to);
        const filteredB006 = mesLogic.filterB006(rawB006, { ...filtOpts, fromDT, toDT });
        b006.push(...filteredB006);
    }

    // Dedupe B006
    const deduped = mesLogic.dedupeB006Rows(b006);
    const b006Clean = deduped.rows;

    // ── Compute KPIs ──────────────────────────────────────────
    let totalInput = 0;
    let totalOutput = 0;
    let totalFail = 0;
    let totalDefect = 0;

    for (const r of b005) {
        const outputQty = parseInt(r.output_qty, 10) || 0;
        const failQty = parseInt(r.fail_qty, 10) || 0;
        const repassQty = parseInt(r.repass_qty, 10) || 0;
        const inputQty = outputQty + failQty - repassQty;
        totalInput += inputQty;
        totalOutput += outputQty;
        totalFail += failQty;
    }

    // Defect count from B006 (unique defective units)
    const defectUnitKeys = new Set();
    for (const r of b006Clean) {
        const wo = String(r.work_order || '').trim().toUpperCase();
        const sn = String(r.serial_number || '').trim().toUpperCase();
        if (sn) defectUnitKeys.add(`${wo}\u0000${sn}`);
    }
    totalDefect = defectUnitKeys.size;

    const totalYield = totalInput > 0 ? ((totalOutput / totalInput) * 100) : 0;
    const fpy = totalInput > 0 ? (((totalInput - totalFail) / totalInput) * 100) : 0;

    const kpis = {
        totalYield: Math.round(totalYield * 10) / 10,
        output: totalOutput,
        defects: totalDefect,
        fpy: Math.round(fpy * 10) / 10,
        passCount: totalOutput,
        failCount: totalFail,
        inputCount: totalInput,
    };

    // ── Yield Trend (by work_date) ────────────────────────────
    const yieldByDate = {};
    for (const r of b005) {
        const date = String(r.work_date || '');
        if (!date) continue;
        if (!yieldByDate[date]) yieldByDate[date] = { input: 0, output: 0 };
        const outputQty = parseInt(r.output_qty, 10) || 0;
        const failQty = parseInt(r.fail_qty, 10) || 0;
        const repassQty = parseInt(r.repass_qty, 10) || 0;
        yieldByDate[date].input += outputQty + failQty - repassQty;
        yieldByDate[date].output += outputQty;
    }
    const yieldTrend = Object.keys(yieldByDate).sort().map((date) => {
        const d = yieldByDate[date];
        const y = d.input > 0 ? (d.output / d.input) * 100 : 0;
        return {
            date: `${date.slice(4, 6)}/${date.slice(6, 8)}`,
            yield: Math.round(y * 10) / 10,
        };
    });

    // ── Top 10 Defects (Pareto) ───────────────────────────────
    const defectCounts = {};
    const defectDescs = {};
    for (const r of b006Clean) {
        const code = String(r.defect_code || 'Unknown').trim() || 'Unknown';
        defectCounts[code] = (defectCounts[code] || 0) + 1;
        if (!defectDescs[code] && r.defect_desc) defectDescs[code] = String(r.defect_desc).trim();
    }
    const totalDefectCount = Object.values(defectCounts).reduce((a, b) => a + b, 0);
    const topDefects = Object.entries(defectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([code, count]) => ({
            code,
            desc: defectDescs[code] || '',
            count,
            pct: totalDefectCount > 0 ? Math.round((count / totalDefectCount) * 1000) / 10 : 0,
        }));

    // ── Station Yield (by process_name) ───────────────────────
    const stationData = {};
    for (const r of b005) {
        const station = String(r.process_name || 'Unknown').trim() || 'Unknown';
        if (!stationData[station]) stationData[station] = { input: 0, output: 0, fail: 0 };
        const outputQty = parseInt(r.output_qty, 10) || 0;
        const failQty = parseInt(r.fail_qty, 10) || 0;
        const repassQty = parseInt(r.repass_qty, 10) || 0;
        stationData[station].input += outputQty + failQty - repassQty;
        stationData[station].output += outputQty;
        stationData[station].fail += failQty;
    }
    const stationYield = Object.entries(stationData)
        .map(([station, d]) => ({
            station,
            yield: d.input > 0 ? Math.round((d.output / d.input) * 1000) / 10 : 0,
            input: d.input,
            fail: d.fail,
        }))
        .sort((a, b) => a.station.localeCompare(b.station));

    // ── Defect Rows (for table) ───────────────────────────────
    const defectRows = b006Clean.map((r) => ({
        SerialNumber: r.serial_number || '',
        WorkOrder: r.work_order || '',
        Station: r.process_name || '',
        Terminal: r.terminal_name || '',
        DefectCode: r.defect_code || '',
        DefectDesc: r.defect_desc || '',
        Time: r.rec_time || '',
        Status: r.rstatus || '',
    }));

    // ── Alerts ────────────────────────────────────────────────
    const alerts = [];

    // 1. Station yield below threshold
    for (const s of stationYield) {
        if (s.yield < effectiveThresholds.yieldCritical) {
            alerts.push({
                level: 'critical',
                message: `${s.station} yield ${s.yield}% — below critical target`,
                station: s.station,
            });
        } else if (s.yield < effectiveThresholds.yieldWarning) {
            alerts.push({
                level: 'warning',
                message: `${s.station} yield ${s.yield}% — below target`,
                station: s.station,
            });
        }
    }

    // 2. Overall yield below threshold
    if (kpis.totalYield < effectiveThresholds.yieldCritical) {
        alerts.push({
            level: 'critical',
            message: `Overall yield ${kpis.totalYield}% — below critical target`,
            station: null,
        });
    } else if (kpis.totalYield < effectiveThresholds.yieldWarning) {
        alerts.push({
            level: 'warning',
            message: `Overall yield ${kpis.totalYield}% — below target`,
            station: null,
        });
    }

    // 3. Defect spike vs previous
    if (previousKpis && previousKpis.defects > 0) {
        const spikePct = ((kpis.defects - previousKpis.defects) / previousKpis.defects) * 100;
        if (spikePct > effectiveThresholds.defectSpikePct) {
            alerts.push({
                level: 'warning',
                message: `Defect spike +${Math.round(spikePct)}% vs previous check`,
                station: null,
            });
        }
    }

    // 4. Consecutive fails per WO
    const woFailCounts = {};
    for (const r of b006Clean) {
        const wo = String(r.work_order || '').trim();
        if (!wo) continue;
        woFailCounts[wo] = (woFailCounts[wo] || 0) + 1;
    }
    for (const [wo, count] of Object.entries(woFailCounts)) {
        if (count > effectiveThresholds.consecutiveFails) {
            alerts.push({
                level: 'warning',
                message: `WO ${wo}: ${count} defects detected`,
                station: null,
            });
        }
    }

    return {
        success: true,
        kpis,
        yieldTrend,
        topDefects,
        stationYield,
        defectRows,
        alerts,
        summary: {
            workOrders: woList,
            recordCount: defectRows.length,
        },
    };
}

module.exports = {
    buildDashboardData,
    parseWoInput,
    DEFAULT_THRESHOLDS,
};