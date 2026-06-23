// CLCA input pre-check service
'use strict';

const XLSX = require('xlsx');

const DATA_REQUIRED_GROUPS = [
  ['PROCESS_NAME'],
  ['INPUT_QTY'],
  ['FAIL_QTY', '一次不良數'],
  ['FAIL_P'],
  ['FPY', 'PASS_P'],
  ['DEFECT_QTY'],
  ['FAIL_D'],
  ['PASS_D'],
  ['OUTPUT_QTY'],
];

const DETAIL_REQUIRED_GROUPS = [
  ['SERIAL_NUMBER', 'SERIALNUMBER', 'SN'],
  ['PROCESS_NAME'],
];

const DETAIL_RECOMMENDED_GROUPS = [
  ['STATUS'],
  ['DEFECT_DESC'],
  ['DEFECT_CODE'],
  ['WORK_ORDER', 'WORKORDER'],
  ['CUSTOMER_SN', 'Customer SN', 'CUSTOMERSN'],
];

function normText(input) {
  return String(input ?? '').trim().toUpperCase().replace(/[\s_\-/:()*'\[\],.]+/g, '');
}

function getRows(workbook, sheetName, limitRows = 2000) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: null, range: 0 }).slice(0, limitRows);
}

function getHeaderMap(rows) {
  const first = rows && rows[0] ? rows[0] : {};
  const map = new Map();
  Object.keys(first).forEach((key) => map.set(normText(key), key));
  return map;
}

function findColumn(headerMap, candidates) {
  for (const cand of candidates) {
    const hit = headerMap.get(normText(cand));
    if (hit) return hit;
  }
  return null;
}

function findMissingGroups(headerMap, groups) {
  return groups
    .filter((group) => !findColumn(headerMap, group))
    .map((group) => group.join('/'));
}

function extractBaseName(stationName) {
  return String(stationName || '').trim().replace(/^FATP[_\s]*/i, '');
}

function normalizeBase(value) {
  return String(value || '').trim().toUpperCase().replace(/[_\-\s]+/g, '').toLowerCase();
}

function stationMatchesProcess(selectedStation, processName) {
  const stationNorm = normalizeBase(extractBaseName(selectedStation));
  const procNorm = normalizeBase(extractBaseName(processName));
  if (stationNorm && procNorm && stationNorm === procNorm) return true;

  const procLeak = String(processName || '').toLowerCase().replace(/[ _]/g, '');
  const stationLeak = String(selectedStation || '').toLowerCase().replace(/[ _]/g, '');
  if (procLeak.includes('leaktest') && stationLeak.includes('leaktest')) {
    const procNum = (procLeak.match(/leaktest(\d*)/) || [null, ''])[1];
    const stationNum = (stationLeak.match(/leaktest(\d*)/) || [null, ''])[1];
    return procNum === stationNum || (procNum === '' && stationNum === '01') || (stationNum === '' && procNum === '01');
  }
  return false;
}

function collectProcessNames(dataRows, detailRows) {
  const processNames = new Set();
  for (const rows of [dataRows, detailRows]) {
    const headerMap = getHeaderMap(rows);
    const processCol = findColumn(headerMap, ['PROCESS_NAME']);
    if (!processCol) continue;
    rows.forEach((row) => {
      const value = row[processCol];
      if (value != null && String(value).trim()) processNames.add(String(value).trim());
    });
  }
  return [...processNames];
}

function firstNonEmpty(rows, candidates) {
  const headerMap = getHeaderMap(rows);
  const col = findColumn(headerMap, candidates);
  if (!col) return '';
  for (const row of rows) {
    const value = row[col];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function inspectClcaFile(filePath, selectedStations = []) {
  const workbook = XLSX.readFile(filePath, { raw: false, cellDates: true });
  const sheetNames = workbook.SheetNames || [];
  const dataRows = getRows(workbook, 'Data');
  const detailRows = getRows(workbook, 'Detail');

  const missingSheets = [];
  if (!workbook.Sheets.Data) missingSheets.push('Data');
  if (!workbook.Sheets.Detail) missingSheets.push('Detail');

  const dataHeader = getHeaderMap(dataRows);
  const detailHeader = getHeaderMap(detailRows);
  const missingDataColumns = missingSheets.includes('Data') ? DATA_REQUIRED_GROUPS.map((g) => g.join('/')) : findMissingGroups(dataHeader, DATA_REQUIRED_GROUPS);
  const missingDetailColumns = missingSheets.includes('Detail') ? DETAIL_REQUIRED_GROUPS.map((g) => g.join('/')) : findMissingGroups(detailHeader, DETAIL_REQUIRED_GROUPS);
  const missingRecommendedColumns = missingSheets.includes('Detail') ? DETAIL_RECOMMENDED_GROUPS.map((g) => g.join('/')) : findMissingGroups(detailHeader, DETAIL_RECOMMENDED_GROUPS);

  const processNames = collectProcessNames(dataRows, detailRows);
  const stationMatched = Array.isArray(selectedStations) && selectedStations.length
    ? selectedStations.filter((station) => processNames.some((proc) => stationMatchesProcess(station, proc)))
    : [];
  const stationUnmatched = Array.isArray(selectedStations) && selectedStations.length
    ? selectedStations.filter((station) => !stationMatched.includes(station))
    : [];

  const ok = !missingSheets.length && !missingDataColumns.length && !missingDetailColumns.length;
  return {
    ok,
    mergePossible: ok,
    sheetNames,
    missingSheets,
    missingDataColumns,
    missingDetailColumns,
    missingRecommendedColumns,
    model: firstNonEmpty(dataRows, ['MODEL_NAME']),
    workOrder: firstNonEmpty(detailRows, ['WORK_ORDER', 'WORKORDER']),
    processNames,
    stationMatchedCount: stationMatched.length,
    stationSelectedCount: Array.isArray(selectedStations) ? selectedStations.length : 0,
    stationMatched,
    stationUnmatched,
  };
}

module.exports = { inspectClcaFile };
