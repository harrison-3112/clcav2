'use strict';

// ============================================================================
// MES Daily — Frontend Demo Data (Deterministic)
// ============================================================================
// Functions build synthetic rows, dashboard KPIs, log text, and CSV
// from a work-order list.  All data is deterministic so the same WO list
// always produces the same output — helpful for screenshots and testing.
// ============================================================================

const _DEMO_STATIONS = ['ST1', 'ST2', 'ST3', 'ST4', 'ST5'];
const _DEMO_DEFECT_CODES = ['SCRATCH', 'DENT', 'BURR', 'MISALIGN', 'CRACK', 'VOID', 'CONTAM'];
const _DEMO_DEFECT_DESCS = {
    SCRATCH: 'Surface scratch',
    DENT: 'Panel dent',
    BURR: 'Burr on edge',
    MISALIGN: 'Misalignment',
    CRACK: 'Material crack',
    VOID: 'Void detected',
    CONTAM: 'Contamination',
};

/**
 * Deterministic PRNG (mulberry32).
 * Returns a float in [0, 1) and advances state.
 */
let _seed = 42;
function _random() {
    _seed |= 0;
    _seed = _seed + 0x6D2B79F5 | 0;
    let t = Math.imul(_seed ^ _seed >>> 15, 1 | _seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

/** Reset the seed so a given WO list is deterministic. */
function _resetSeed(woList) {
    let hash = 0;
    const key = Array.isArray(woList) ? woList.sort().join(',') : String(woList);
    for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) - hash) + key.charCodeAt(i);
        hash |= 0;
    }
    _seed = hash >>> 0;
}

/** Format a Date as YYYY/MM/DD HH:MM:SS (matches MES trace log timestamps). */
function _fmtDate(d) {
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}/${MM}/${dd} ${HH}:${mm}:${ss}`;
}

/**
 * Build synthetic defect rows for a list of work orders.
 * @param {string[]} woList
 * @returns {Object[]} Rows with keys: WorkOrder, DefectCode, Description, Station, defectTime, Model, Serial
 */
function buildMesDailyDemoRows(woList) {
    if (!Array.isArray(woList) || !woList.length) return [];
    _resetSeed(woList);

    const rows = [];
    const baseDefects = 20 + Math.floor(_random() * 30); // 20-49 defects per WO

    for (const wo of woList) {
        const defectCount = baseDefects + Math.floor(_random() * 11); // ±5
        // Shift hours so each WO has a slightly different time profile
        const hourOffset = Math.floor(_random() * 8);

        for (let i = 0; i < defectCount; i++) {
            const code = _DEMO_DEFECT_CODES[Math.floor(_random() * _DEMO_DEFECT_CODES.length)];
            const station = _DEMO_STATIONS[Math.floor(_random() * _DEMO_STATIONS.length)];

            // Distribute across a 16-hour window (6:00–22:00)
            const hour = 6 + Math.floor(_random() * 16);
            const minute = Math.floor(_random() * 60);
            const second = Math.floor(_random() * 60);

            const d = new Date(2026, 0, 1 + Math.floor(_random() * 180));
            d.setHours(hour, minute, second, 0);

            rows.push({
                WorkOrder: wo,
                DefectCode: code,
                Description: _DEMO_DEFECT_DESCS[code] || code,
                Station: station,
                defectTime: _fmtDate(d),
                Model: 'M-X' + Math.floor(_random() * 10),
                Serial: 'SN' + String(Math.floor(_random() * 900000 + 100000)),
            });
        }
    }

    return rows;
}

/**
 * Build dashboard overview data (deterministic) from defect rows.
 * @param {Object[]} rows
 * @returns {{ success: true, kpis: Object, topDefects: Object[], stationYield: Object[], yieldTrend: Object[] }}
 */
function buildMesDailyDemoDashboardData(rows) {
    if (!Array.isArray(rows) || !rows.length) return { success: true, kpis: {}, topDefects: [], stationYield: [], yieldTrend: [] };

    _resetSeed(rows.map(r => r.WorkOrder).filter(Boolean));

    const total = rows.length;
    const defectCounts = {};
    const stationCounts = {};

    for (const r of rows) {
        const code = String(r.DefectCode || 'Unknown').trim();
        defectCounts[code] = (defectCounts[code] || 0) + 1;

        const st = String(r.Station || 'Unknown').trim();
        if (!stationCounts[st]) stationCounts[st] = { input: 0, fail: 0 };
        stationCounts[st].fail += 1;
    }

    // Input ≈ fail + some deterministic pass count
    _DEMO_STATIONS.forEach(st => {
        if (!stationCounts[st]) stationCounts[st] = { input: 0, fail: 0 };
        stationCounts[st].input = stationCounts[st].fail + 80 + Math.floor(_random() * 40);
    });

    const stationYield = Object.entries(stationCounts).map(([station, v]) => ({
        station,
        input: v.input,
        fail: v.fail,
        yield: v.input > 0 ? parseFloat(((1 - v.fail / v.input) * 100).toFixed(1)) : 100,
        model: 'M-X' + Math.floor(_random() * 10),
        defectQty: v.fail + Math.floor(_random() * 2),
        failD: parseFloat(((v.fail / (v.input || 1)) * 100).toFixed(1)),
        passD: parseFloat((100 - ((v.fail / (v.input || 1)) * 100)).toFixed(1)),
        output: v.input - v.fail,
        failP: parseFloat(((v.fail / (v.input || 1)) * 100).toFixed(1)),
        passP: parseFloat((100 - ((v.fail / (v.input || 1)) * 100)).toFixed(1))
    }));

    const sortedDefects = Object.entries(defectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([code, count]) => ({
            code,
            desc: _DEMO_DEFECT_DESCS[code] || code,
            count,
            pct: parseFloat(((count / total) * 100).toFixed(1)),
        }));

    const totalYield = stationYield.length
        ? parseFloat((stationYield.reduce((s, x) => s + x.yield, 0) / stationYield.length).toFixed(1))
        : 0;
    const output = stationYield.reduce((s, x) => s + (x.input - x.fail), 0);

    const yieldTrend = [];
    for (let d = 6; d >= 0; d--) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        yieldTrend.push({
            date: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`,
            yield: parseFloat((totalYield - 2 + _random() * 4).toFixed(1)),
        });
    }

    const stationHourlyTrend = {};
    _DEMO_STATIONS.forEach(st => {
        stationHourlyTrend[st] = Array.from({length: 12}).map((_, i) => ({
            hour: `${8 + i}:00`,
            input: 20 + Math.floor(_random() * 10),
            fail: Math.floor(_random() * 3),
            fpy: 90 + _random() * 10
        }));
    });

    return {
        success: true,
        kpis: {
            yield: totalYield,
            output,
            defects: total,
            fpy: parseFloat((_random() * 5 + 82).toFixed(1)),
        },
        topDefects: sortedDefects,
        stationYield,
        yieldTrend,
        stationHourlyTrend,
        alerts: [
            { id: 1, type: 'warning', msg: 'Yield dropped below 90% on FPC02', time: '10:15 AM' },
            { id: 2, type: 'critical', msg: 'Top defect MISSING_SCREW limit reached on ICT', time: '11:30 AM' },
        ],
    };
}

/**
 * Build a synthetic log preview text for a single defect row.
 * @param {Object} row — single row from buildMesDailyDemoRows
 * @returns {string}
 */
function buildMesDailyDemoLogText(row) {
    const d = new Date(String(row.defectTime || '').replace(/\//g, '-'));
    const ts = isNaN(d.getTime()) ? 'N/A' : d.toISOString().replace('T', ' ').slice(0, 19);

    const lines = [
        '========================================',
        `LOG VIEWER — MES Daily (Demo)`,
        '========================================',
        '',
        `Work Order   : ${row.WorkOrder || 'N/A'}`,
        `Station      : ${row.Station || 'N/A'}`,
        `Defect Code  : ${row.DefectCode || 'N/A'}`,
        `Description  : ${row.Description || 'N/A'}`,
        `Timestamp    : ${ts}`,
        `Model        : ${row.Model || 'N/A'}`,
        `Serial       : ${row.Serial || 'N/A'}`,
        '',
        '----------------------------------------',
        'Trace Log:',
        '----------------------------------------',
        `${ts}  INFO  Station ${row.Station || '?'} — cycle start`,
        `${ts}  INFO  Inspection camera triggered`,
        `${ts}  WARN  Defect candidate: ${row.DefectCode || '?'}`,
        `${ts}  INFO  Image saved to archive`,
        `${ts}  INFO  Cycle complete (PASS: 0, FAIL: 1)`,
        '',
        '========================================',
        'END OF LOG',
        '========================================',
    ];
    return lines.join('\n');
}

/**
 * Build a complete CSV string from defect rows.
 * @param {Object[]} rows
 * @returns {string} CSV content (RFC 4180)
 */
function buildMesDailyDemoCsv(rows) {
    if (!Array.isArray(rows) || !rows.length) return '';

    const headers = ['WorkOrder', 'DefectCode', 'Description', 'Station', 'defectTime', 'Model', 'Serial'];
    const lines = [headers.join(',')];

    for (const r of rows) {
        lines.push(headers.map(h => {
            const v = String(r[h] ?? '');
            // Escape CSV fields containing comma, quote, or newline
            if (v.includes(',') || v.includes('"') || v.includes('\n')) {
                return '"' + v.replace(/"/g, '""') + '"';
            }
            return v;
        }).join(','));
    }

    return lines.join('\r\n');
}