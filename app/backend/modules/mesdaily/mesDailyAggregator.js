'use strict';

function normalizeMesKeys(row) {
  const out = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    out[String(key || '').trim()] = value;
  });
  return out;
}

function toMesNumber(value) {
  const clean = String(value ?? '').replace('%', '').replace(/,/g, '').trim();
  if (!clean) return 0;
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function normalizeList(values) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)));
}

function validateQueryInput({ woList, from, to, stations }) {
  const cleanWo = normalizeList(woList);
  const cleanStations = normalizeList(stations);
  if (!cleanWo.length) throw new Error('At least one WO is required.');
  if (!cleanStations.length) throw new Error('Select at least one station.');
  if (!/^\d{10}$/.test(String(from || ''))) throw new Error('From time must use YYYYMMDDHH.');
  if (!/^\d{10}$/.test(String(to || ''))) throw new Error('To time must use YYYYMMDDHH.');
  return { woList: cleanWo, from: String(from), to: String(to), stations: cleanStations };
}

function buildCommand(command, inputData) {
  return { Data: [{ Command: command, InputData: inputData }] };
}

function buildMesCommandPayloads(query) {
  const clean = validateQueryInput(query);
  const summary = [];
  const detail = [];
  clean.woList.forEach((wo) => {
    clean.stations.forEach((station) => {
      const inputData = `${wo},${clean.from},${clean.to},${station}`;
      summary.push({ command: 'VNPTH09', wo, station, payload: buildCommand('VNPTH09', inputData) });
      detail.push({ command: 'VNPTH09DT', wo, station, payload: buildCommand('VNPTH09DT', inputData) });
    });
  });
  return { ...clean, summary, detail };
}

function getDataRows(response) {
  return Array.isArray(response && response.Data) ? response.Data.map(normalizeMesKeys) : [];
}

function hourLabel(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/\s(\d{2}):/);
  return match ? `${match[1]}:00` : 'Unknown';
}

function statusToResult(status) {
  const text = String(status || '').trim();
  return text || 'FAIL';
}

function aggregateMesDailyData({ summaryResponses, detailResponses }) {
  const summaryRows = [];
  const stationMap = new Map();
  const detailRows = [];
  const defectMap = new Map();
  const hourlyMap = new Map();

  (Array.isArray(summaryResponses) ? summaryResponses : []).forEach((item) => {
    getDataRows(item.response).forEach((row) => {
      const station = item.station || row.PROCESS_NAME || 'Unknown';
      const input = toMesNumber(row.INPUT_QTY);
      const fail = toMesNumber(row.FAIL_QTY);
      const output = toMesNumber(row.OUTPUT_QTY);
      const defectQty = toMesNumber(row.DEFECT_QTY);
      const current = stationMap.get(station) || {
        station,
        model: row.MODEL_NAME || 'N/A',
        input: 0,
        fail: 0,
        output: 0,
        defectQty: 0,
      };
      current.input += input;
      current.fail += fail;
      current.output += output;
      current.defectQty += defectQty;
      stationMap.set(station, current);
      summaryRows.push({
        wo: item.wo,
        station,
        model: row.MODEL_NAME || 'N/A',
        processName: row.PROCESS_NAME || station,
        input,
        fail,
        failP: toMesNumber(row.FAIL_P),
        passP: toMesNumber(row.PASS_P),
        defectQty,
        failD: toMesNumber(row.FAIL_D),
        passD: toMesNumber(row.PASS_D),
        output,
      });
    });
  });

  (Array.isArray(detailResponses) ? detailResponses : []).forEach((item) => {
    getDataRows(item.response).forEach((row) => {
      const station = row.PROCESS_NAME || item.station || 'Unknown';
      const wo = row.WORK_ORDER || item.wo || '';
      const code = row.DEFECT_CODE || 'UNKNOWN';
      const hour = hourLabel(row.DEFECT_TIME);
      detailRows.push({
        SN: row.SERIAL_NUMBER || '',
        Serial: row.SERIAL_NUMBER || '',
        Terminal: row.TERMINAL_NAME || station,
        Station: station,
        Result: statusToResult(row.STATUS),
        DefectCode: code,
        WO: wo,
        WorkOrder: wo,
        Description: row.DEFECT_DESC || '',
        Time: row.DEFECT_TIME || '',
        Status: row.STATUS || '',
      });

      const defect = defectMap.get(code) || { code, count: 0, woBreakdown: {} };
      defect.count += 1;
      defect.woBreakdown[wo || 'Unknown'] = (defect.woBreakdown[wo || 'Unknown'] || 0) + 1;
      defectMap.set(code, defect);

      const stationHours = hourlyMap.get(station) || {};
      stationHours[hour] = (stationHours[hour] || 0) + 1;
      hourlyMap.set(station, stationHours);
    });
  });

  const stationYield = Array.from(stationMap.values()).map((item) => ({
    ...item,
    yield: item.input ? Number(((item.output / item.input) * 100).toFixed(1)) : 0,
    fpy: item.input ? Number((((item.input - item.fail) / item.input) * 100).toFixed(1)) : 0,
    failP: item.input ? Number(((item.fail / item.input) * 100).toFixed(1)) : 0,
    passP: item.input ? Number(((item.output / item.input) * 100).toFixed(1)) : 0,
    failD: item.input ? Number(((item.defectQty / item.input) * 100).toFixed(1)) : 0,
    passD: item.input ? Number(((item.output / item.input) * 100).toFixed(1)) : 0,
  }));

  const totals = stationYield.reduce((acc, item) => {
    acc.input += item.input;
    acc.output += item.output;
    acc.fail += item.fail;
    return acc;
  }, { input: 0, output: 0, fail: 0 });

  const stationHourlyTrend = {};
  hourlyMap.forEach((hours, station) => {
    stationHourlyTrend[station] = Object.entries(hours)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, fail]) => ({ hour, fail }));
  });

  return {
    success: true,
    kpis: {
      input: totals.input,
      output: totals.output,
      fail: totals.fail,
      fpy: totals.input ? Number((((totals.input - totals.fail) / totals.input) * 100).toFixed(1)) : 0,
    },
    summaryRows,
    defectRows: detailRows,
    topDefects: Array.from(defectMap.values()).sort((a, b) => b.count - a.count).slice(0, 10),
    stationYield,
    stationHourlyTrend,
  };
}

module.exports = {
  normalizeMesKeys,
  toMesNumber,
  validateQueryInput,
  buildMesCommandPayloads,
  aggregateMesDailyData,
};
