'use strict';

function toMesCommandHour(dateText, hourText) {
    const date = String(dateText || '').trim().replace(/-/g, '');
    const hour = String(hourText || '').trim().slice(0, 2).padStart(2, '0');
    if (!/^\d{8}$/.test(date)) throw new Error('Date must use YYYY-MM-DD.');
    if (!/^\d{2}$/.test(hour)) throw new Error('Hour must use HH:mm.');
    return `${date}${hour}`;
}

function buildMesDailyApiRequest({ woList, stations, dateFrom, hourFrom, dateTo, hourTo }) {
    const cleanWo = Array.from(new Set((Array.isArray(woList) ? woList : [])
        .map(value => String(value || '').trim())
        .filter(Boolean)));
    const cleanStations = Array.from(new Set((Array.isArray(stations) ? stations : [])
        .map(value => String(value || '').trim())
        .filter(Boolean)));

    if (!cleanWo.length) throw new Error('WO Input is required.');
    if (!cleanStations.length) throw new Error('Select at least one station.');

    return {
        woList: cleanWo,
        stations: cleanStations,
        from: toMesCommandHour(dateFrom, hourFrom),
        to: toMesCommandHour(dateTo, hourTo),
    };
}

function normalizeMesDailyApiDashboard(data) {
    if (!data || data.success === false) {
        throw new Error(data && data.message ? data.message : 'MES Daily query failed.');
    }

    return {
        success: true,
        kpis: data.kpis || { input: 0, fpy: 0, output: 0, fail: 0 },
        summaryRows: Array.isArray(data.summaryRows) ? data.summaryRows : [],
        defectRows: Array.isArray(data.defectRows) ? data.defectRows : [],
        topDefects: Array.isArray(data.topDefects) ? data.topDefects : [],
        stationYield: Array.isArray(data.stationYield) ? data.stationYield : [],
        stationHourlyTrend: data.stationHourlyTrend || {},
        alerts: Array.isArray(data.alerts) ? data.alerts : [],
    };
}
