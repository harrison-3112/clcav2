// QuickLog pure JavaScript core logic
'use strict';
const fs = require('fs');
const path = require('path');
const { TextDecoder } = require('util');
const LOG_TIME_TOLERANCE_SECONDS = 30;
const HEADER_ALIASES = {
  ProdcutSN: 'ProductSN', PRODUCTSN: 'ProductSN', ProductSn: 'ProductSN', SN: 'ProductSN',
  Mode: 'RunMode', MODE: 'RunMode', TestMode: 'RunMode', Time: 'EndTime', ENDTIME: 'EndTime',
  Result: 'Result', RESULT: 'Result', FailItem: 'Failitem', FailItemName: 'Failitem',
};
function normalizeHeaderCell(cell) {
  const c = String(cell ?? '').trim().replace(/^\uFEFF/, '').trim();
  return HEADER_ALIASES[c] || c;
}
function looksLikeHeader(row) {
  if (!row?.length) return false;
  if (normalizeHeaderCell(row[0]) !== 'ProductSN') return false;
  const common = new Set(['Result', 'Failitem', 'EndTime', 'RunMode', 'StationName']);
  return row.map(normalizeHeaderCell).some((x) => common.has(x));
}
function buildHeaderMap(headerRow) {
  const mapping = {};
  headerRow.forEach((raw, i) => {
    const name = normalizeHeaderCell(raw);
    if (name && mapping[name] === undefined) mapping[name] = i;
  });
  return mapping;
}
function safeGet(row, headerMap, key, def = '') {
  const idx = headerMap[key];
  if (idx === undefined || idx >= row.length) return def;
  return String(row[idx] ?? '').trim().replace(/^"|"$/g, '');
}
function parseEndTime(value) {
  if (!value) return null;
  const v = String(value).trim().replace(/^"|"$/g, '');
  const m = /^(\d{4})[-/](\d{2})[-/](\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/.exec(v);
  if (!m) return null;
  const [, yy, mo, dd, hh, mi, ss, frac = '0'] = m;
  const ms = Number((frac + '000').slice(0, 3));
  const dt = new Date(Number(yy), Number(mo) - 1, Number(dd), Number(hh), Number(mi), Number(ss), ms);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
function yyyymmdd(dt) {
  return `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
}
function parseSnInput(text) {
  const seen = new Set();
  const snList = [];
  for (const item of String(text || '').trim().split(/[,;\s]+/)) {
    const sn = String(item || '').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    if (!sn || seen.has(sn)) continue;
    seen.add(sn); snList.push(sn);
  }
  return { snList, snSet: seen };
}
function parseCsvLine(line, delimiter = ',') {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (ch === delimiter && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
function decodeBuffer(buffer) {
  for (const enc of ['utf-8', 'gb18030', 'latin1']) {
    try {
      if (enc === 'latin1') return buffer.toString('latin1');
      return new TextDecoder(enc, { fatal: true }).decode(buffer);
    } catch (_) { }
  }
  return buffer.toString('utf8');
}
function readCsvForSnSet(csvPath, snSet, selectedMode, stationFolder) {
  const results = [];
  let headerMap = null;
  const lines = decodeBuffer(fs.readFileSync(csvPath)).split(/\r?\n/);

  let delimiter = ',';
  for (const line of lines) {
    if (line && line.trim()) {
      const cCount = (line.match(/,/g) || []).length;
      const sCount = (line.match(/;/g) || []).length;
      if (sCount > cCount) delimiter = ';';
      break;
    }
  }

  for (const line of lines) {
    if (!line || !line.trim()) continue;
    const row = parseCsvLine(line, delimiter);
    if (!row.length || row.every((c) => String(c || '').trim() === '')) continue;
    if (looksLikeHeader(row)) { headerMap = buildHeaderMap(row); continue; }
    if (!headerMap) continue;
    const sn = safeGet(row, headerMap, 'ProductSN');
    if (!sn || normalizeHeaderCell(sn) === 'ProductSN' || !snSet.has(sn)) continue;
    const mode = safeGet(row, headerMap, 'RunMode', selectedMode) || selectedMode;
    const station = safeGet(row, headerMap, 'StationName', stationFolder) || stationFolder;
    const endtime = safeGet(row, headerMap, 'EndTime');
    results.push({
      SN: sn,
      Station: station,
      Mode: mode,
      Result: safeGet(row, headerMap, 'Result'),
      Failitem: safeGet(row, headerMap, 'Failitem'),
      EndTime: endtime,
      SourceFile: String(csvPath),
      _EndTimeDT: parseEndTime(endtime),
    });
  }
  return results;
}
function existsDir(p) { try { return fs.existsSync(p) && fs.statSync(p).isDirectory(); } catch (_) { return false; } }
function getStations(networkBase) {
  const base = path.resolve(networkBase);
  if (!existsDir(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort();
}
function getModes(networkBase, projectName = 'VO0301') {
  const base = path.resolve(networkBase);
  const modes = new Set();
  if (!existsDir(base)) return [];
  for (const station of fs.readdirSync(base, { withFileTypes: true })) {
    if (!station.isDirectory()) continue;
    const modeRoot = path.join(base, station.name, 'CSV', projectName);
    if (!existsDir(modeRoot)) continue;
    for (const d of fs.readdirSync(modeRoot, { withFileTypes: true })) if (d.isDirectory()) modes.add(d.name);
  }
  return [...modes].sort();
}
function markLatestRows(results) {
  const latest = new Map();
  results.forEach((r, idx) => {
    r._IsLatestByStation = false;
    if (!r.SN || !r.Station || !(r._EndTimeDT instanceof Date)) return;
    const key = `${r.SN}\u0000${r.Station}`;
    if (!latest.has(key) || r._EndTimeDT > latest.get(key).dt) latest.set(key, { idx, dt: r._EndTimeDT });
  });
  for (const v of latest.values()) results[v.idx]._IsLatestByStation = true;
}
function rowToPublic(r) {
  return { SN: r.SN || '', Station: r.Station || '', Mode: r.Mode || '', Result: r.Result || '', Failitem: r.Failitem || '', EndTime: r.EndTime || '', SourceFile: r.SourceFile || '', IsLatestByStation: !!r._IsLatestByStation };
}
function searchSn(networkBase, snText, mode = 'PROD', projectName = 'VO0301', fixtureName = 'J01') {
  const { snList, snSet } = parseSnInput(snText);
  if (!snSet.size) return { success: false, error: 'Missing SN input.', rows: [], summary: {} };
  const base = path.resolve(networkBase);
  const start = Date.now();
  let scannedStations = 0, readFiles = 0, errorFiles = 0;
  const results = [];
  if (!existsDir(base)) return { success: false, error: `Network base not found: ${base}`, rows: [], summary: { inputSnCount: snSet.size, recordCount: 0, readFiles: 0 } };
  for (const station of getStations(base)) {
    scannedStations++;
    const baseCsvDir = path.join(base, station, 'CSV');
    if (!existsDir(baseCsvDir)) continue;
    const projects = fs.readdirSync(baseCsvDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    for (const proj of projects) {
      const csvDir = path.join(baseCsvDir, proj, mode, station, fixtureName);
      if (!existsDir(csvDir)) continue;
      const dirsToScan = [csvDir];
      const subDirs = fs.readdirSync(csvDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => path.join(csvDir, d.name));
      dirsToScan.push(...subDirs);
      const csvFiles = [];
      for (const d of dirsToScan) {
        if (!existsDir(d)) continue;
        const files = fs.readdirSync(d, { withFileTypes: true }).filter(f => f.isFile() && f.name.toLowerCase().endsWith('.csv')).map(f => path.join(d, f.name));
        csvFiles.push(...files);
      }
      csvFiles.sort();
      for (const csvFile of csvFiles) {
        readFiles++;
        try { results.push(...readCsvForSnSet(csvFile, snSet, mode, station)); }
        catch (_) { errorFiles++; }
      }
    }
  }
  results.sort((a, b) => String(a.SN || '').localeCompare(String(b.SN || '')) || String(a.Station || '').localeCompare(String(b.Station || '')) || ((a._EndTimeDT?.getTime?.() ?? Number.MAX_SAFE_INTEGER) - (b._EndTimeDT?.getTime?.() ?? Number.MAX_SAFE_INTEGER)));
  markLatestRows(results);
  const found = new Set(results.map(r => r.SN).filter(Boolean));
  const notFound = snList.filter(sn => !found.has(sn));
  return { success: true, rows: results.map(rowToPublic), summary: { inputSnCount: snSet.size, recordCount: results.length, foundSnCount: found.size, notFoundCount: notFound.length, notFound, scannedStations, readFiles, errorFiles, elapsedSeconds: Math.round((Date.now() - start) / 10) / 100 } };
}
function fileDiffSeconds(filePath, targetDt) {
  const st = fs.statSync(filePath);
  const diffM = Math.abs(st.mtimeMs - targetDt.getTime()) / 1000;
  const diffC = Math.abs(st.ctimeMs - targetDt.getTime()) / 1000;
  let diff = Math.min(diffM, diffC);

  // Handle 12-hour AM/PM mismatches (CSV recorded 09:18 but actual file is 21:18)
  const diff12 = Math.abs(diff - 43200);
  if (diff12 < diff) diff = diff12;

  return diff;
}
function findLogFileForRow(networkBase, row, projectName = 'VO0301', fixtureName = 'J01', toleranceSeconds = LOG_TIME_TOLERANCE_SECONDS) {
  const sn = String(row?.SN || '').trim();
  const station = String(row?.Station || '').trim();
  const mode = String(row?.Mode || 'PROD').trim();
  const result = String(row?.Result || '').trim().toUpperCase();
  const dt = parseEndTime(row?.EndTime || '');
  if (!sn || !station || !mode) return { success: false, error: 'Missing SN / Station / Mode.' };
  if (!dt) return { success: false, error: `Invalid EndTime for SN ${sn}.` };

  // networkBase now includes the model and 'SYNC LOCAL DATA' from server.js
  const dateDir = path.join(path.resolve(networkBase), station, 'Log', projectName, mode, station, fixtureName, yyyymmdd(dt));
  const dirs = [];
  if (result === 'PASS' || result === 'FAIL') dirs.push(path.join(dateDir, result));
  for (const alt of ['PASS', 'FAIL']) { const p = path.join(dateDir, alt); if (!dirs.includes(p)) dirs.push(p); }
  const checkedPaths = [], matches = [];
  for (const folder of dirs) {
    checkedPaths.push(folder);
    if (!existsDir(folder)) continue;
    for (const d of fs.readdirSync(folder, { withFileTypes: true })) {
      if (!d.isFile()) continue;
      if (!d.name.startsWith(`${sn}_`) || !d.name.toLowerCase().endsWith('.txt')) continue;

      const filePath = path.join(folder, d.name);
      const diff = fileDiffSeconds(filePath, dt);

      if (diff <= toleranceSeconds) {
        matches.push({ diff, filePath });
      }
    }
  }
  if (!matches.length) return { success: false, error: 'Log file not found.', checkedPaths, pattern: `${sn}_*.txt`, toleranceSeconds };

  matches.sort((a, b) => a.diff - b.diff);
  return { success: true, path: matches[0].filePath, diffSeconds: Math.round(matches[0].diff * 1000) / 1000 };
}

// ---- MES Trace logic merged into QuickLog core (logic only, no UI) ----
const http = require('http');
const https = require('https');
const { execFile } = require('child_process');

const DEFAULT_MES_TRACE_SETTINGS = {
  apiUrl: process.env.MES_API_URL || 'http://10.24.97.22/MES_API/api/MESApi/ApiAll',
  apiTimeoutMs: Number(process.env.MES_API_TIMEOUT_MS || 15000),
  logRoot: process.env.MES_TRACE_LOG_ROOT || '\\\\10.24.111.80\\Testlog\\camera',
  logIndexTtlMs: Number(process.env.MES_TRACE_LOG_INDEX_TTL_MS || 5 * 60 * 1000),
  logScanMaxDirs: Number(process.env.MES_TRACE_LOG_SCAN_MAX_DIRS || 12000),
  logTimeBeforeMs: Number(process.env.MES_TRACE_LOG_TIME_BEFORE_MS || 5 * 60 * 1000),
  modelFolderRules: { splitByUnderscore: true },
  modelAliases: {},
  stationAliases: {},
  stationFallbacks: {},
};

function deepMergePlain(base, override) {
  const out = { ...(base || {}) };
  if (!override || typeof override !== 'object' || Array.isArray(override)) return out;
  for (const [key, value] of Object.entries(override)) {
    out[key] = value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])
      ? deepMergePlain(out[key], value)
      : value;
  }
  return out;
}

function readQuickLogModelsConfig() {
  const candidates = [
    process.env.QUICKLOG_MODELS_CONFIG,
    path.resolve(__dirname, '../../../../config/quicklog.models.json'),
    path.resolve(process.cwd(), 'config', 'quicklog.models.json'),
    path.resolve(process.cwd(), 'quicklog.models.json'),
  ].filter(Boolean);
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (_) { }
  }
  return {};
}

function getMesTraceSettings(options = {}) {
  const cfg = readQuickLogModelsConfig();
  const fromConfig = cfg && typeof cfg === 'object' && cfg.mesTrace ? cfg.mesTrace : {};
  return deepMergePlain(deepMergePlain(DEFAULT_MES_TRACE_SETTINGS, fromConfig), options || {});
}

function normalizeMesApiUrl(rawUrl) {
  const defaults = getMesTraceSettings();
  const url = String(rawUrl || '').trim();
  if (!url || url === 'undefined' || url === 'null') return defaults.apiUrl;
  if (/\/swagger\/ui\/index/i.test(url)) {
    try {
      const u = new URL(url);
      const prefix = u.pathname.split('/swagger/')[0] || '/MES_API';
      return `${u.protocol}//${u.host}${prefix}/api/MESApi/ApiAll`;
    } catch (_) {
      return defaults.apiUrl;
    }
  }
  return url;
}

function buildMesPayload(command, inputData) {
  return { Data: [{ Command: String(command || '').trim(), InputData: String(inputData || '').trim() }] };
}

function postJson(url, body, timeoutMs) {
  const targetUrl = normalizeMesApiUrl(url);
  const ms = Number(timeoutMs || getMesTraceSettings().apiTimeoutMs || 15000);
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const lib = u.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(body);
    const req = lib.request({
      method: 'POST',
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: ms,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`HTTP ${res.statusCode}: ${text.slice(0, 500)}`));
        try { resolve(JSON.parse(text)); }
        catch (e) { reject(new Error(`Invalid JSON response: ${e.message}\n${text.slice(0, 500)}`)); }
      });
    });
    req.on('timeout', () => req.destroy(new Error(`MES API timeout after ${ms} ms`)));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function callMesCommand(apiUrl, command, inputData, timeoutMs) {
  const started = Date.now();
  const response = await postJson(apiUrl, buildMesPayload(command, inputData), timeoutMs);
  return { command, inputData, elapsedMs: Date.now() - started, response };
}

function arr(v) { return Array.isArray(v) ? v : []; }
function firstData(response) { return arr(response && response.Data)[0] || null; }
function uniq(list) {
  const seen = new Set();
  const out = [];
  for (const x of list || []) {
    const v = String(x || '').trim();
    if (v && !seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}
function parseInputList(text) { return uniq(String(text || '').split(/[\s,;]+/)); }

function getFirstMesField(row, fieldNames = []) {
  if (!row || typeof row !== 'object') return '';
  for (const name of fieldNames) {
    if (Object.prototype.hasOwnProperty.call(row, name)) {
      const value = row[name];
      if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
    }
  }
  const wanted = fieldNames.map((x) => String(x || '').toLowerCase());
  for (const [key, value] of Object.entries(row)) {
    const lower = String(key || '').toLowerCase();
    if (wanted.includes(lower) && value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}
function getFirstMesFieldByKeyword(row, keywords = []) {
  if (!row || typeof row !== 'object') return '';
  const keys = Object.keys(row).sort((a, b) => String(a).length - String(b).length);
  for (const key of keys) {
    const lower = String(key || '').toLowerCase();
    if (!keywords.some((kw) => lower.includes(String(kw).toLowerCase()))) continue;
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}
function extractMesDefect(row) {
  return getFirstMesField(row, [
    'Defect', 'DefectDesc', 'DefectDescription', 'DefectCode', 'DefectName', 'DefectItem',
    'Failitem', 'FailItem', 'FailItemName', 'FailItemDesc', 'FailCode', 'FailDesc',
    'ErrorCode', 'ErrorDesc', 'ErrorDescription', 'NGItem', 'NGCode', 'NGDesc'
  ]) || getFirstMesFieldByKeyword(row, ['defect', 'fail', 'error', 'ng']);
}
function extractMesReason(row) {
  return getFirstMesField(row, [
    'Reason', 'ReasonDesc', 'ReasonDescription', 'ReasonCode', 'ReasonName',
    'Cause', 'CauseDesc', 'RootCause', 'AnalysisReason'
  ]) || getFirstMesFieldByKeyword(row, ['reason', 'cause']);
}
function normalizeMesStatusInput(row) {
  if (row && typeof row === 'object') {
    return getFirstMesField(row, ['Status', 'Result', 'TestResult', 'TestStatus', 'PassFail', 'PassOrFail', 'State']);
  }
  return row;
}
function statusToResult(status) {
  const raw = normalizeMesStatusInput(status);
  const s = String(raw == null ? '' : raw).trim();
  const upper = s.toUpperCase();
  if (!upper) return '';
  if (upper === '0' || upper === 'PASS' || upper === 'PASSED' || upper === 'OK' || upper === 'TRUE' || upper === 'Y') return 'PASS';
  if (upper === '1' || upper === 'FAIL' || upper === 'FAILED' || upper === 'NG' || upper === 'NOK' || upper === 'FALSE' || upper === 'N') return 'FAIL';
  if (/^PASS/.test(upper)) return 'PASS';
  if (/^FAIL/.test(upper)) return 'FAIL';
  return upper;
}
function mesTimeMs(t) {
  const ms = Date.parse(String(t || '').replace(' ', 'T'));
  return Number.isFinite(ms) ? ms : Number.NaN;
}
function mesYmd(time) {
  const d = new Date(String(time || '').replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
function configAliasList(map, key) {
  const want = String(key || '').trim().toUpperCase();
  for (const [k, v] of Object.entries(map || {})) {
    if (String(k || '').trim().toUpperCase() === want) return Array.isArray(v) ? v : [v];
  }
  return [];
}
function modelRootName(modelNo, settings = getMesTraceSettings()) {
  const raw = String(modelNo || '').trim();
  const alias = configAliasList(settings.modelAliases, raw)[0];
  if (alias) return String(alias).trim();
  if (settings.modelFolderRules && settings.modelFolderRules.splitByUnderscore !== false) return raw.split('_')[0].trim();
  return raw;
}
function sortMesRowsByTime(a, b) {
  const ta = mesTimeMs(a.time), tb = mesTimeMs(b.time);
  if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return ta - tb;
  if (Number.isFinite(ta) && !Number.isFinite(tb)) return -1;
  if (!Number.isFinite(ta) && Number.isFinite(tb)) return 1;
  return String(a.serialNumber || '').localeCompare(String(b.serialNumber || ''));
}
function normalizeS001(response, input) {
  const r = firstData(response);
  if (!r) return { input, serialNumber: '', customerSN: '', raw: null };
  return {
    input,
    serialNumber: String(r.SerialNumber || '').trim(),
    customerSN: String(r.CustomerSN || '').trim(),
    partNo: String(r.PartNo || '').trim(),
    modelNo: String(r.ModelNo || '').trim(),
    currentWO: String(r.CurrentWO || '').trim(),
    originalWO: String(r.OriginalWO || '').trim(),
    productionDate: String(r.ProductionDate || '').trim(),
    raw: r,
  };
}
function normalizeA003Rows(response, identity, options = {}) {
  const settings = getMesTraceSettings(options);
  return arr(response && response.Data).map((r, index) => {
    const process = String(r.ProcessName || '').trim();
    const result = statusToResult(r);
    const time = String(r.OutputTime || '').trim();
    return {
      type: 'PROCESS', source: 'A003', index, time,
      serialNumber: String(r.SerialNumber || identity.serialNumber || '').trim(),
      customerSN: identity.customerSN || '',
      modelNo: identity.modelNo || '',
      modelRoot: modelRootName(identity.modelNo, settings),
      workOrder: String(r.WorkOrder || '').trim(),
      partNo: String(r.PartNo || identity.partNo || '').trim(),
      process,
      status: normalizeMesStatusInput(r),
      result,
      terminal: String(r.TerminalName || '').trim(),
      defect: extractMesDefect(r),
      reason: extractMesReason(r),
      repairState: '',
      canOpenLog: Boolean(process && time && result),
      raw: r,
    };
  });
}
function hasRepairPassAfter(processRows, repairRow) {
  const rt = mesTimeMs(repairRow.RepairTime);
  return processRows.some((p) => {
    const proc = String(p.ProcessName || '').toUpperCase();
    const term = String(p.TerminalName || '').toUpperCase();
    const pass = String(p.Status == null ? '' : p.Status).trim() === '0';
    const pt = mesTimeMs(p.OutputTime);
    return pass && Number.isFinite(pt) && (!Number.isFinite(rt) || pt >= rt) && (proc.includes('REPAIR') || term.includes('REPAIR01'));
  });
}
function normalizeA004Rows(response, identity, processRawRows, options = {}) {
  const settings = getMesTraceSettings(options);
  return arr(response && response.Data).map((r, index) => {
    const repairedOk = hasRepairPassAfter(processRawRows, r);
    return {
      type: 'A004_REPAIR_INFO', source: 'A004', index,
      time: String(r.RepairTime || '').trim(),
      serialNumber: String(r.SerialNumber || identity.serialNumber || '').trim(),
      customerSN: identity.customerSN || '',
      modelNo: identity.modelNo || '',
      modelRoot: modelRootName(identity.modelNo, settings),
      workOrder: String(r.WorkOrder || '').trim(),
      partNo: identity.partNo || '',
      process: String(r.DefectProcess || '').trim(),
      defectProcess: String(r.DefectProcess || '').trim(),
      status: String(r.RepairStatus == null ? '' : r.RepairStatus).trim(),
      repairStatus: String(r.RepairStatus == null ? '' : r.RepairStatus).trim(),
      result: '',
      terminal: '',
      defect: extractMesDefect(r),
      reason: extractMesReason(r),
      repairState: repairedOk ? 'REPAIR_PASS' : 'REPAIR_PENDING',
      canOpenLog: false,
      raw: r,
    };
  });
}
function isMesRepairStationRow(row) {
  const text = `${row && row.process || ''} ${row && row.terminal || ''}`.toUpperCase();
  return text.includes('REPAIR');
}
function isMesRepairPassProcessRow(row) {
  return !!row && row.type === 'PROCESS' && isMesRepairStationRow(row) && String(row.result || '').toUpperCase() === 'PASS';
}
function sameMesSn(a, b) {
  return String(a && a.serialNumber || '').trim() === String(b && b.serialNumber || '').trim();
}
function sameMesWoIfPresent(a, b) {
  const wa = String(a && a.workOrder || '').trim();
  const wb = String(b && b.workOrder || '').trim();
  return !wa || !wb || wa === wb;
}
function normalizeMesProcessName(value) {
  return String(value || '').trim().toUpperCase().replace(/[\s_-]+/g, '');
}
function sameMesDefectProcess(failRow, repairInfo) {
  const fp = normalizeMesProcessName(failRow && failRow.process);
  const rp = normalizeMesProcessName((repairInfo && (repairInfo.defectProcess || repairInfo.process)) || '');
  return !!fp && !!rp && fp === rp;
}
function findA004InfoForRepair(failRow, repairPassRow, repairInfoRows) {
  const failTime = mesTimeMs(failRow && failRow.time);
  const repairPassTime = mesTimeMs(repairPassRow && repairPassRow.time);
  const base = (repairInfoRows || []).filter((repairInfo) => {
    if (!sameMesSn(failRow, repairInfo)) return false;
    if (!sameMesWoIfPresent(failRow, repairInfo)) return false;
    const hasDefectProcess = Boolean(String((repairInfo && (repairInfo.defectProcess || repairInfo.process)) || '').trim());
    return !hasDefectProcess || sameMesDefectProcess(failRow, repairInfo);
  });
  const withinTenSeconds = base
    .filter((repairInfo) => {
      const repairInfoTime = mesTimeMs(repairInfo && repairInfo.time);
      return Number.isFinite(repairInfoTime) && Number.isFinite(repairPassTime) && Math.abs(repairInfoTime - repairPassTime) <= 10000;
    })
    .sort((a, b) => Math.abs(mesTimeMs(a.time) - repairPassTime) - Math.abs(mesTimeMs(b.time) - repairPassTime))[0];
  if (withinTenSeconds) return withinTenSeconds;
  return base
    .filter((repairInfo) => {
      const repairInfoTime = mesTimeMs(repairInfo && repairInfo.time);
      if (!Number.isFinite(repairInfoTime) || !Number.isFinite(failTime)) return true;
      return repairInfoTime >= failTime;
    })
    .sort((a, b) => {
      const ta = mesTimeMs(a && a.time);
      const tb = mesTimeMs(b && b.time);
      if (Number.isFinite(repairPassTime) && Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) {
        return Math.abs(ta - repairPassTime) - Math.abs(tb - repairPassTime);
      }
      if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return ta - tb;
      return (a.index || 0) - (b.index || 0);
    })[0] || null;
}
function findNearestFailBeforeRepair(repairPassRow, failRows, usedFailIndexes) {
  const repairTime = mesTimeMs(repairPassRow && repairPassRow.time);
  return (failRows || [])
    .filter((item) => !usedFailIndexes.has(item.index))
    .filter((item) => sameMesSn(item.row, repairPassRow))
    .filter((item) => sameMesWoIfPresent(item.row, repairPassRow))
    .filter((item) => {
      if (!Number.isFinite(item.timeMs) || !Number.isFinite(repairTime)) return true;
      return item.timeMs <= repairTime;
    })
    .sort((a, b) => {
      if (Number.isFinite(a.timeMs) && Number.isFinite(b.timeMs) && a.timeMs !== b.timeMs) return b.timeMs - a.timeMs;
      return b.index - a.index;
    })[0] || null;
}
function applyRepairMarkersToProcessRows(processRows, repairRows) {
  const repairs = Array.isArray(repairRows) ? repairRows : [];
  const rows = Array.isArray(processRows) ? processRows : [];
  const usedFailIndexes = new Set();
  const failRows = [];
  const repairPassRows = [];

  rows.forEach((row, index) => {
    row.resultDisplay = row.result || '';
    row.repairDisplay = '';
    row.repairLinked = false;
    row.relatedRepairTime = '';
    row.relatedRepairState = '';
    if (String(row.result || '').toUpperCase() === 'FAIL' && !isMesRepairStationRow(row)) {
      failRows.push({ row, index, timeMs: mesTimeMs(row.time) });
    }
    if (isMesRepairPassProcessRow(row)) {
      row.resultDisplay = 'REPAIR';
      row.repairDisplay = 'REPAIR';
      row.repairState = 'REPAIR_PASS';
      repairPassRows.push({ row, index, timeMs: mesTimeMs(row.time) });
    }
  });

  repairPassRows.sort((a, b) => {
    if (Number.isFinite(a.timeMs) && Number.isFinite(b.timeMs) && a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
    return a.index - b.index;
  });

  repairPassRows.forEach((repairItem) => {
    const bestFail = findNearestFailBeforeRepair(repairItem.row, failRows, usedFailIndexes);
    if (!bestFail) return;
    const repairInfo = findA004InfoForRepair(bestFail.row, repairItem.row, repairs);
    bestFail.row.resultDisplay = 'FAIL(REPAIR)';
    bestFail.row.repairDisplay = 'REPAIR';
    bestFail.row.repairState = 'REPAIR_PENDING';
    bestFail.row.repairLinked = true;
    bestFail.row.relatedRepairTime = (repairInfo && repairInfo.time) || repairItem.row.time || '';
    bestFail.row.relatedRepairState = (repairInfo && repairInfo.repairState) || repairItem.row.repairState || '';
    if (repairInfo) {
      if (!bestFail.row.defect) bestFail.row.defect = repairInfo.defect || '';
      if (!bestFail.row.reason) bestFail.row.reason = repairInfo.reason || '';
    }
    usedFailIndexes.add(bestFail.index);
  });
  return rows;
}

async function traceOne(inputValue, options = {}) {
  const settings = getMesTraceSettings(options);
  const apiUrl = normalizeMesApiUrl(options.apiUrl || settings.apiUrl);
  const timeoutMs = Number(options.timeoutMs || settings.apiTimeoutMs || 15000);
  const input = String(inputValue || '').trim();
  if (!input) throw new Error('Missing SN / CustomerSN input.');
  const s001 = await callMesCommand(apiUrl, 'S001', input, timeoutMs);
  const identity = normalizeS001(s001.response, input);
  if (!identity.serialNumber) {
    return { success: false, input, error: 'S001 did not return SerialNumber. A003/A004 require SerialNumber.', identity, s001Response: s001.response, rows: [], timings: { S001: s001.elapsedMs } };
  }
  const [a003, a004] = await Promise.all([
    callMesCommand(apiUrl, 'A003', identity.serialNumber, timeoutMs),
    callMesCommand(apiUrl, 'A004', identity.serialNumber, timeoutMs),
  ]);
  const a003Raw = arr(a003.response && a003.response.Data);
  const processRows = normalizeA003Rows(a003.response, identity, settings);
  const repairRows = normalizeA004Rows(a004.response, identity, a003Raw, settings);
  applyRepairMarkersToProcessRows(processRows, repairRows);
  const rows = processRows.sort(sortMesRowsByTime);
  return { success: true, input, identity, rows, timings: { S001: s001.elapsedMs, A003: a003.elapsedMs, A004: a004.elapsedMs } };
}
async function pingMesServer(apiUrl) {
  const targetUrl = normalizeMesApiUrl(apiUrl);
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request({ method: 'HEAD', hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname + u.search, timeout: 3000 }, (res) => {
      resolve();
    });
    req.on('timeout', () => req.destroy(new Error('ERR_MES_API_UNREACHABLE')));
    req.on('error', () => reject(new Error('ERR_MES_API_UNREACHABLE')));
    req.end();
  });
}

async function traceMany(inputText, options = {}) {
  const settings = getMesTraceSettings(options);
  const apiUrl = normalizeMesApiUrl(options.apiUrl || settings.apiUrl);
  await pingMesServer(apiUrl);

  const inputs = parseInputList(inputText);
  const results = [];
  for (const input of inputs) {
    try { results.push(await traceOne(input, options)); }
    catch (e) { results.push({ success: false, input, error: String(e.message || e), rows: [] }); }
  }
  const rows = results.flatMap((r) => r.rows || []).sort(sortMesRowsByTime);
  const ok = results.filter((r) => r.success);
  return {
    success: ok.length > 0,
    summary: {
      inputCount: inputs.length,
      foundCount: ok.length,
      rowCount: rows.length,
      repairCount: rows.filter((r) => isMesRepairPassProcessRow(r)).length,
      failCount: rows.filter((r) => String(r.result || '').toUpperCase() === 'FAIL' || String(r.resultDisplay || '').toUpperCase().includes('FAIL')).length,
      serialNumbers: uniq(ok.map((r) => r.identity && r.identity.serialNumber)),
      customerSNs: uniq(ok.map((r) => r.identity && r.identity.customerSN)),
    },
    results,
    rows,
  };
}

function pathParts(p) { return String(p || '').split(/[\\/]+/).filter(Boolean); }
function pathHasResult(p, resultFolder) {
  const target = String(resultFolder || '').toUpperCase();
  return pathParts(p).some((x) => x.toUpperCase() === target);
}
function safeReaddir(dir) { try { return fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return []; } }
function fileTimeMs(fp) { try { const st = fs.statSync(fp); return st.mtimeMs || st.birthtimeMs || st.ctimeMs; } catch (_) { return Number.NaN; } }
function isSnTxtFile(entryName, sn) { return String(entryName || '').startsWith(`${sn}_`) && String(entryName || '').toLowerCase().endsWith('.txt'); }
const MES_TRACE_LOG_INDEX_CACHE = new Map();
function cacheGetDateDirs(baseRoot, date, settings) {
  const k = `${baseRoot}\n${date}`;
  const h = MES_TRACE_LOG_INDEX_CACHE.get(k);
  return h && (Date.now() - h.ts) < Number(settings.logIndexTtlMs || 300000) ? h.value : null;
}
function cacheSetDateDirs(baseRoot, date, value) {
  MES_TRACE_LOG_INDEX_CACHE.set(`${baseRoot}\n${date}`, { ts: Date.now(), value });
  return value;
}
function looksLikeDateDirName(name) { return /^20\d{6}$/.test(String(name || '')); }
function baseName(p) { return path.basename(String(p || '')).trim(); }
function normalizeStationText(v) { return String(v || '').trim().toUpperCase().replace(/\s+/g, ' '); }
function stationNameCompact(v) { return String(v || '').trim().replace(/[\s_-]+/g, '').toUpperCase(); }
function addUnique(list, v) { v = String(v || '').trim(); if (v && !list.includes(v)) list.push(v); }
function stationFolderCandidates(row, options = {}) {
  const settings = getMesTraceSettings(options);
  const out = [];
  const configuredCandidates = [];
  for (const value of (Array.isArray(row && row._QuickLogLocalStationCandidates) ? row._QuickLogLocalStationCandidates : [])) addUnique(configuredCandidates, value);
  for (const value of (Array.isArray(options && options.localStationCandidates) ? options.localStationCandidates : [])) addUnique(configuredCandidates, value);
  if (configuredCandidates.length) return configuredCandidates;
  const rawValues = [row && row.terminal, row && row.process].filter(Boolean);
  for (const raw of rawValues) {
    const s = normalizeStationText(raw), compact = stationNameCompact(raw);
    for (const alias of configAliasList(settings.stationAliases, raw)) addUnique(out, alias);
    for (const alias of configAliasList(settings.stationFallbacks, raw)) addUnique(out, alias);
    if (s === 'DIP_PCBA TEST02' || compact === 'DIPPCBA TEST02'.replace(/[\s_-]+/g, '')) addUnique(out, 'PCBA02');
    if (s === 'DIP_PCBA TEST03' || compact === 'DIPPCBA TEST03'.replace(/[\s_-]+/g, '')) addUnique(out, 'PCBA03');
    if (s === 'DIP_PCBA_01' || compact === 'DIPPCBA01') { addUnique(out, 'PCBA01'); addUnique(out, 'FPC01'); addUnique(out, 'FPC02'); addUnique(out, 'FPC03'); }
    if (s === 'FATP_CHECK' || compact === 'FATPCHECK') addUnique(out, 'FT_Check');
    let m = s.match(/FATP[_\s-]*FT[_\s-]*(\d{1,2})/i) || compact.match(/FATPFT(\d{1,2})/i);
    if (m) addUnique(out, `FT${String(m[1]).padStart(2, '0')}`);
    m = s.match(/DIP[_\s-]*PCBA[_\s-]*TEST[_\s-]*(\d{1,2})/i) || compact.match(/DIPPCBATEST(\d{1,2})/i);
    if (m) addUnique(out, `PCBA${String(m[1]).padStart(2, '0')}`);
    m = s.match(/DIP[_\s-]*PCBA[_\s-]*(\d{1,2})/i) || compact.match(/DIPPCBA(\d{1,2})/i);
    if (m) { const n = String(m[1]).padStart(2, '0'); addUnique(out, `PCBA${n}`); addUnique(out, `FPC${n}`); }
    m = compact.match(/^(PCBA|FPC|FT)(\d{1,2})$/i);
    if (m) addUnique(out, `${m[1].toUpperCase()}${String(m[2]).padStart(2, '0')}`);
    if (compact === 'FTCHECK') addUnique(out, 'FT_Check');
    addUnique(out, String(raw).trim());
  }
  return out;
}
function rowTargetRoots(root, row, model, options = {}) {
  const roots = [], stations = stationFolderCandidates(row, options);
  const add = (p) => { if (p && !roots.includes(p)) roots.push(p); };
  for (const station of stations) add(path.join(root, model, 'SYNC LOCAL DATA', station, 'Log', model, 'PROD', station));
  for (const station of stations) add(path.join(root, model, 'SYNC LOCAL DATA', station));
  add(path.join(root, model, 'SYNC LOCAL DATA'));
  return roots;
}
function findDateDirsFast(baseRoot, date, options = {}) {
  const settings = getMesTraceSettings(options);
  const cached = cacheGetDateDirs(baseRoot, date, settings);
  if (cached) return Object.assign({ fromCache: true }, cached);
  const out = [], stack = [baseRoot];
  let scannedDirs = 0, truncated = false;
  const maxDirs = Number(settings.logScanMaxDirs || 12000);
  while (stack.length) {
    const dir = stack.pop();
    scannedDirs += 1;
    if (scannedDirs > maxDirs) { truncated = true; break; }
    const base = baseName(dir);
    if (base === String(date)) { out.push(dir); continue; }
    if (looksLikeDateDirName(base) && base !== String(date)) continue;
    for (const entry of safeReaddir(dir)) if (entry.isDirectory()) stack.push(path.join(dir, entry.name));
  }
  return cacheSetDateDirs(baseRoot, date, { dateDirs: out, scannedDirs, truncated, fromCache: false });
}
function collectSnTxtInsideDateDirs(dateDirs, sn, resultFolder, options = {}) {
  const settings = getMesTraceSettings(options);
  const out = [];
  let scannedDirs = 0, truncated = false;
  const wantResult = String(resultFolder || 'ANY').toUpperCase();
  const maxDirs = Number(settings.logScanMaxDirs || 12000);
  for (const dateDir of dateDirs || []) {
    const stack = [dateDir];
    while (stack.length) {
      const dir = stack.pop();
      scannedDirs += 1;
      if (scannedDirs > maxDirs) { truncated = true; break; }
      for (const entry of safeReaddir(dir)) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.isFile() && isSnTxtFile(entry.name, sn) && (wantResult === 'ANY' || pathHasResult(full, wantResult))) out.push(full);
      }
      if (truncated) break;
    }
    if (truncated) break;
  }
  return { candidates: out, scannedDirs, truncated };
}
function collectDayTxtLogsOptimized(rootDir, row, sn, date, resultFolder, options = {}) {
  const settings = getMesTraceSettings(options);
  const model = modelRootName(row.modelRoot || row.modelNo || '', settings);
  const roots = rowTargetRoots(rootDir, row, model, settings).filter(existsDir);
  const checkedRoots = [];
  let totalScannedDirs = 0, totalDateDirs = 0, truncated = false, fromCache = false;
  for (const baseRoot of roots) {
    checkedRoots.push(baseRoot);
    const dateInfo = findDateDirsFast(baseRoot, date, settings);
    totalScannedDirs += dateInfo.scannedDirs || 0;
    totalDateDirs += (dateInfo.dateDirs || []).length;
    truncated = truncated || !!dateInfo.truncated;
    fromCache = fromCache || !!dateInfo.fromCache;
    if (!(dateInfo.dateDirs || []).length) continue;
    const snInfo = collectSnTxtInsideDateDirs(dateInfo.dateDirs, sn, resultFolder, settings);
    totalScannedDirs += snInfo.scannedDirs || 0;
    truncated = truncated || !!snInfo.truncated;
    if (snInfo.candidates && snInfo.candidates.length) return { candidates: snInfo.candidates, scannedDirs: totalScannedDirs, dateDirs: totalDateDirs, truncated, fromCache, checkedRoots, usedRoot: baseRoot };
  }
  return { candidates: [], scannedDirs: totalScannedDirs, dateDirs: totalDateDirs, truncated, fromCache, checkedRoots, usedRoot: '' };
}
function resultPriorityList(rowResult) {
  const r = String(rowResult || '').toUpperCase();
  if (r === 'PASS') return ['PASS', 'FAIL', 'ANY'];
  if (r === 'FAIL') return ['FAIL', 'PASS', 'ANY'];
  return ['ANY'];
}
function chooseDayCandidate(allCandidates, row, resultFolder, options = {}) {
  const settings = getMesTraceSettings(options);
  const base = mesTimeMs(row && row.time);
  const beforeMs = Number(settings.logTimeBeforeMs || 5 * 60 * 1000);
  const from = Number.isFinite(base) ? base - beforeMs : Number.NaN;
  const to = Number.isFinite(base) ? base : Number.NaN;
  const processName = String(row && row.process || '').toUpperCase();
  let candidates = allCandidates || [];
  if (resultFolder && resultFolder !== 'ANY') candidates = candidates.filter((fp) => pathHasResult(fp, resultFolder));
  if (!candidates.length) return null;
  let best = null;
  for (const fp of candidates) {
    const ft = fileTimeMs(fp);
    const hasTime = Number.isFinite(base) && Number.isFinite(ft);
    const inWindow = hasTime ? (ft >= from && ft <= to) : false;
    const beforeMes = hasTime ? (ft <= base) : true;
    const diffMs = hasTime ? Math.abs(base - ft) : 0;
    const p = String(fp || '').toUpperCase();
    let score = 0;
    if (resultFolder !== 'ANY' && pathHasResult(fp, resultFolder)) score += 10000000;
    if (processName && p.includes(processName)) score += 1000000;
    if (inWindow) score += 100000;
    else if (beforeMes) score += 50000;
    score -= Math.floor(diffMs / 1000);
    const item = {
      filePath: fp,
      fileTime: Number.isFinite(ft) ? new Date(ft).toISOString() : '',
      diffMs,
      inWindow,
      beforeMes,
      resultPriority: resultFolder,
      score,
      windowFrom: Number.isFinite(from) ? new Date(from).toISOString() : '',
      windowTo: Number.isFinite(to) ? new Date(to).toISOString() : '',
    };
    if (!best || item.score > best.score || (item.score === best.score && item.diffMs < best.diffMs)) best = item;
  }
  return best;
}
function findMesTraceLogFile(row, options = {}) {
  const settings = getMesTraceSettings(options);
  const model = modelRootName(row && (row.modelRoot || row.modelNo || ''), settings);
  const sn = String(row && row.serialNumber || '').trim();
  const date = mesYmd(row && row.time);
  const result = String(row && row.result || '').toUpperCase();
  if (!model || !sn || !date) return { success: false, error: 'Missing model/sn/date for log path.' };
  const root = path.join(settings.logRoot, model, 'SYNC LOCAL DATA');
  const stationCandidates = stationFolderCandidates(row, settings);
  const checkedPaths = [`${root} [model=${model}; mesModel=${row.modelNo || row.modelRoot || ''}; date=${date}; stationCandidates=${stationCandidates.join(',')}]`];
  if (!existsDir(root)) return { success: false, error: 'Model SYNC LOCAL DATA path not found.', checkedPaths, resolved: { mesModel: row.modelNo || row.modelRoot || '', model, sn, date, root, stationCandidates } };
  let lastFound = null;
  for (const resultFolder of resultPriorityList(result)) {
    const found = collectDayTxtLogsOptimized(root, row, sn, date, resultFolder, settings);
    lastFound = found;
    const allCandidates = uniq(found.candidates);
    const picked = chooseDayCandidate(allCandidates, row, resultFolder, settings);
    if (picked && picked.filePath) {
      return {
        success: true,
        path: picked.filePath,
        checkedPaths: checkedPaths.concat((found.checkedRoots || []).map((x) => `${x} [station alias optimized root]`)),
        selectedBy: 'station-alias-date-cache-mtime',
        diffMs: Math.round(picked.diffMs),
        fileTime: picked.fileTime,
        windowFrom: picked.windowFrom,
        windowTo: picked.windowTo,
        resultPriority: resultFolder,
        candidateCount: allCandidates.length,
        scannedDirs: found.scannedDirs,
        dateDirs: found.dateDirs,
        truncated: found.truncated,
        fromCache: found.fromCache,
        usedRoot: found.usedRoot,
      };
    }
  }
  const found = lastFound || { candidates: [], scannedDirs: 0, dateDirs: 0, truncated: false, checkedRoots: [] };
  const allCandidates = uniq(found.candidates || []);
  return {
    success: false,
    error: 'Log file not found for this SN in the MES date under model SYNC LOCAL DATA.',
    checkedPaths,
    resolved: { model, sn, date, root, mesModel: row.modelNo || row.modelRoot || '', stationCandidates, searchedRoots: found.checkedRoots || [], rule: 'search all .txt files in date path under \\\\10.24.111.80\\Testlog\\camera\\<MODEL>\\SYNC LOCAL DATA; PASS/FAIL may be nested folder; exact SN_ prefix required' },
    candidateCount: allCandidates.length,
    scannedDirs: found.scannedDirs,
    dateDirs: found.dateDirs,
    truncated: found.truncated,
  };
}
function openMesTraceLogFile(filePath) {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') execFile('cmd', ['/c', 'start', '', filePath], { windowsHide: true }, (e) => e ? reject(e) : resolve(true));
    else execFile(process.platform === 'darwin' ? 'open' : 'xdg-open', [filePath], (e) => e ? reject(e) : resolve(true));
  });
}

module.exports = {
  parseSnInput,
  parseEndTime,
  getStations,
  getModes,
  searchSn,
  findLogFileForRow,
  getMesTraceSettings,
  normalizeMesApiUrl,
  traceOne,
  traceMany,
  findMesTraceLogFile,
  openMesTraceLogFile,
  stationFolderCandidates,
  modelRootName,
};
