/**
 * logic.js - MES API → Excel Export
 *
 * Cách dùng:
 *   1. Sửa phần CẤU HÌNH ở cuối file (WO, PDLINE, PROCESSES, FROM_DATE, FROM_HOUR, OUTPUT_NAME)
 *   2. Chạy: node logic.js
 *   3. File Excel sẽ được tạo tại OUTPUT_DIR
 *
 * Quy tắc ca: FROM_DATE FROM_HOUR:00 → (FROM_DATE+1) FROM_HOUR:00
 *
 * Dependencies: npm install exceljs node-fetch@2
 */

"use strict";

const ExcelJS = require("exceljs");
const fetch   = global.fetch || require("node-fetch");
const path    = require("path");
const fs      = require("fs");

// -------------------------------------------------------
// Constants
// -------------------------------------------------------
const API_URL   = "http://10.24.97.22/MES_API/api/MESApi";
const PLANT_CODE = "429B";

// Statuses treated as "not defective" — these do NOT count as defects.
// 已維修 is intentionally excluded: a repaired board was still a defect at the station.
// Only boards that re-tested clean (重測通過 / 重測不維修) are non-defects.
const PASS_STATUSES = [
  "\u91CD\u6E2C\u901A\u904E",           // 重測通過
  "\u91CD\u6E2C\u4E0D\u7DAD\u4FEE",     // 重測不維修
];

// STATUS display mapping: B006 API internal values → MES display values
// Applied when writing the STATUS column in the Detail sheet
const STATUS_MAP = {
  "\u91CD\u6E2C\u4E0D\u7DAD\u4FEE": "\u91CD\u6E2C\u901A\u904E",  // 重測不維修 → 重測通過
  "\u5F85\u7DAD\u4FEE":             "\u672A\u7DAD\u4FEE",          // 待維修     → 未維修
};

const PASS_STATUS_SET = new Set(PASS_STATUSES);

function normalizeStatus(status) {
  const raw = String(status || "").trim();
  if (!raw) return "";
  return STATUS_MAP[raw] ?? raw;
}

function isPassStatus(status) {
  return PASS_STATUS_SET.has(normalizeStatus(status));
}

// -------------------------------------------------------
// API helpers
// -------------------------------------------------------

async function pingMesServer() {
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 60000;
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      await fetch(API_URL, { method: "HEAD", signal: controller.signal });
      clearTimeout(id);
      return; // Success
    } catch (err) {
      clearTimeout(id);
      if (i === MAX_RETRIES - 1) {
        throw new Error('ERR_MES_API_UNREACHABLE');
      }
      // Wait a short delay before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function fetchWithTimeout(url, options, timeoutMs = 300000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error(`Connection to MES API timed out sau ${timeoutMs/60000} phút. Dữ liệu có thể quá lớn hoặc server MES đang bận.`);
    }
    throw new Error(`MES API Error: ${err.message}`);
  }
}

/**
 * Query Data from MES API
 * @param {string} command  - "B005" or "B006"
 * @param {string} fromDate - "yyyyMMdd"
 * @param {string} toDate   - "yyyyMMdd"
 * @returns {Promise<object[]>} raw data array
 */
async function queryMES(command, fromDate, toDate) {
  await pingMesServer(); // Kiểm tra mạng nhanh trước
  const body = JSON.stringify({
    Data: [{ Command: command, InputData: `${fromDate},${toDate}` }],
  });
  // Đặt timeout lớn (5 phút) cho các query lấy data nặng
  const res = await fetchWithTimeout(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }, 300000);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${command} ${fromDate}-${toDate}`);
  const json = await res.json();
  if (!json.Result || !json.Data) return [];
  return json.Data;
}

async function queryMESInput(command, inputData) {
  await pingMesServer(); // Kiểm tra mạng nhanh trước
  const body = JSON.stringify({ Data: [{ Command: command, InputData: String(inputData || "").trim() }] });
  const res = await fetchWithTimeout(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body }, 300000);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${command} ${inputData}`);
  const json = await res.json();
  if (!json.Result || !json.Data) return [];
  return json.Data;
}

/**
 * Chunk a date range into ≤7-day windows (API limit safety).
 * @param {string} fromDate - "yyyyMMdd"
 * @param {string} toDate   - "yyyyMMdd"
 * @returns {Array<{from:string, to:string}>}
 */
function getDateChunks(fromDate, toDate) {
  const chunks = [];
  let current  = parseDate(fromDate);
  const end    = parseDate(toDate);
  while (current <= end) {
    const batchEnd = new Date(Math.min(addDays(current, 6).getTime(), end.getTime()));
    chunks.push({ from: fmtDate(current), to: fmtDate(batchEnd) });
    current = addDays(batchEnd, 1);
  }
  return chunks;
}

function getDailyDateChunks(fromDate, toDate) {
  const chunks = [];
  let current = parseDate(fromDate);
  const end = parseDate(toDate);
  while (current <= end) {
    const day = fmtDate(current);
    const nextDay = fmtDate(addDays(current, 1));
    // MES B005/B006 cannot use same-day windows.
    // API date range is inclusive, so use non-overlapping 2-day windows to avoid double-counting middle dates.
    // Exact requested time range is still enforced after fetch by filterB005/filterB006.
    chunks.push({ from: day, to: nextDay });
    current = addDays(current, 2);
  }
  return chunks;
}


function normalizeRequirements(requirements = []) {
  if (!Array.isArray(requirements)) return [];
  return requirements
    .map((req) => ({
      workOrder: String(req.workOrder || req.wo || "").trim(),
    }))
    .filter((req) => req.workOrder);
}

function createRequirementMatcher(requirements = []) {
  const normalized = normalizeRequirements(requirements);
  if (!normalized.length) {
    return {
      hasRules: false,
      match: () => null,
    };
  }

  const byWorkOrder = new Map();

  for (const req of normalized) {
    if (!byWorkOrder.has(req.workOrder)) {
      byWorkOrder.set(req.workOrder, req);
    }
  }

  const match = (record) => {
    return byWorkOrder.get(record.work_order) || null;
  };

  return {
    hasRules: true,
    match,
  };
}

function findMatchedRequirement(record, requirements = []) {
  if (typeof requirements === "function") {
    return requirements(record);
  }
  const matcher = createRequirementMatcher(requirements);
  return matcher.match(record);
}

function getEffectiveProcessName(record) {
  return record.process_name;
}

// -------------------------------------------------------
// Filter helpers
// -------------------------------------------------------

/**
 * Filter B005 records client-side.
 * @param {object[]} data
 * @param {object}   opts
 * @param {string[]} opts.workOrders  - WO numbers (empty = any)
 * @param {string[]} opts.processes   - process names (empty = any)
 * @param {string}   opts.pdLine      - PDLine name (empty = any)
 * @param {string}   opts.fromDate    - "yyyyMMdd"
 * @param {number}   opts.fromHour    - 0–23
 * @param {string}   opts.toDate      - "yyyyMMdd"
 * @param {number}   opts.toHour      - 0–23
 * @returns {object[]}
 */
function filterB005(data, { workOrders = [], processes = [], fromDate, fromHour, toDate, toHour, requirements = [] }) {
  const requirementMatcher = createRequirementMatcher(requirements);
  const workOrderSet = workOrders.length > 0 ? new Set(workOrders) : null;
  const processSet = processes.length > 0 ? new Set(processes) : null;

  return data.filter((r) => {
    if (requirementMatcher.hasRules) {
      if (!requirementMatcher.match(r)) return false;
    } else {
      if (workOrderSet && !workOrderSet.has(r.work_order))                return false;
    }
    if (processSet && !processSet.has(r.process_name))                    return false;
    const wh = parseInt(r.work_time, 10);
    if (r.work_date === fromDate && wh >= fromHour) return true;
    if (r.work_date  > fromDate  && r.work_date < toDate) return true;
    if (r.work_date === toDate   && wh < toHour)   return true;
    return false;
  });
}

/**
 * Filter B006 records client-side.
 * @param {object[]} data
 * @param {object}   opts
 * @param {string[]} opts.workOrders  - WO numbers (empty = any)
 * @param {string[]} opts.processes   - process names (empty = any)
 * @param {string}   opts.pdLine      - PDLine name (empty = any)
 * @param {Date}     opts.fromDT      - start datetime (inclusive)
 * @param {Date}     opts.toDT        - end datetime (exclusive)
 * @returns {object[]}
 */
function filterB006(data, { workOrders = [], processes = [], fromDT, toDT, requirements = [] }) {
  const requirementMatcher = createRequirementMatcher(requirements);
  const workOrderSet = workOrders.length > 0 ? new Set(workOrders) : null;
  const processSet = processes.length > 0 ? new Set(processes) : null;

  return data.filter((r) => {
    if (requirementMatcher.hasRules) {
      if (!requirementMatcher.match(r)) return false;
    } else {
      if (workOrderSet && !workOrderSet.has(r.work_order))                return false;
    }
    if (processSet && !processSet.has(r.process_name))                    return false;
    const rt = recTimeToDate(r.rec_time);
    if (!rt) return false;
    return rt >= fromDT && rt < toDT;
  });
}

function getB006DedupeKey(row) {
  return [
    row.work_order || "",
    row.serial_number || "",
    row.process_name || "",
    row.terminal_name || "",
    row.defect_code || "",
    row.rec_time || "",
  ].map((value) => String(value || "").trim().toUpperCase()).join("\u0000");
}

function getB006LatestTimeMs(row) {
  const candidates = [row.out_time, row.repair_time, row.in_time, row.rec_time];
  for (const value of candidates) {
    const parsed = recTimeToDate(value);
    if (parsed) return parsed.getTime();
  }
  return 0;
}

function chooseB006DedupeWinner(current, incoming) {
  if (!current) return incoming;
  return getB006LatestTimeMs(incoming) > getB006LatestTimeMs(current) ? incoming : current;
}

function dedupeB006Rows(rows = []) {
  const byKey = new Map();
  const duplicateStats = new Map();
  let duplicateCount = 0;

  for (const row of rows || []) {
    const key = getB006DedupeKey(row);
    if (!key || key.replace(/\u0000/g, "") === "") continue;
    if (byKey.has(key)) {
      duplicateCount += 1;
      const processName = String(row.process_name || "(blank)").trim() || "(blank)";
      duplicateStats.set(processName, (duplicateStats.get(processName) || 0) + 1);
      byKey.set(key, chooseB006DedupeWinner(byKey.get(key), row));
    } else {
      byKey.set(key, row);
    }
  }

  return {
    rows: Array.from(byKey.values()),
    duplicateCount,
    duplicateStats: Array.from(duplicateStats.entries())
      .map(([processName, count]) => ({ processName, count }))
      .sort((a, b) => b.count - a.count || a.processName.localeCompare(b.processName)),
  };
}

function getB006DefectUnitKey(row) {
  const wo = String(row && row.work_order || "").trim().toUpperCase();
  const sn = String(row && row.serial_number || "").trim().toUpperCase();
  if (sn) return `${wo}\u0000${sn}`;
  // Fallback for abnormal rows without SN: do not collapse unrelated blank-SN records.
  return [
    wo,
    row && row.process_name || "",
    row && row.terminal_name || "",
    row && row.defect_code || "",
    row && row.rec_time || "",
    row && row.rownum || "",
  ].map((value) => String(value || "").trim().toUpperCase()).join("\u0000");
}

// -------------------------------------------------------
// Data aggregation
// -------------------------------------------------------

/**
 * Build Data sheet rows — one row per process_name.
 * @param {object[]} b005      - filtered B005 records
 * @param {object[]} b006      - filtered B006 records
 */
function buildDataRows(b005, processRemap = {}, requirements = [], b006 = []) {
  // model lookup from B005
  const modelLookup = {};
  for (const r of b005) {
    if (!modelLookup[r.work_order]) modelLookup[r.work_order] = r.model_name;
  }

  const requirementMatcher = createRequirementMatcher(requirements);

  // Group by effective model + process to avoid collapsing different requirement rows.
  const groups = {};
  for (const r of b005) {
    const modelName = modelLookup[r.work_order] || r.model_name;
    const procName = getEffectiveProcessName(r, requirementMatcher.match, processRemap);
    const key = [modelName, procName].join("\u0000");
    if (!groups[key]) groups[key] = { key, modelName, procName, rows: [] };
    groups[key].rows.push(r);
  }

  // Data.DEFECT_QTY follows MES Daily behavior: count unique defective units from B006 per process.
// B006 can contain multiple defect/repair rows for the same SN at the same process; those rows must count as 1 unit.
// If B006 is unavailable, fallback to B005 refail_qty.
const useB006Defects = Array.isArray(b006) && b006.length > 0;
const defectsByGroup = new Map();
if (useB006Defects) {
for (const r of b006) {
if (isPassStatus(r.rstatus)) continue;
const modelName = modelLookup[r.work_order] || r.model_name || "";
const procName = getEffectiveProcessName(r, requirementMatcher.match, processRemap);
const key = [modelName, procName].join("\u0000");
if (!defectsByGroup.has(key)) defectsByGroup.set(key, new Set());
defectsByGroup.get(key).add(getB006DefectUnitKey(r));
}
}
return Object.values(groups)
    .map(({ key, modelName, procName, rows: grp }) => {
      const outputQty = grp.reduce((s, r) => s + (parseInt(r.output_qty,  10) || 0), 0);
      const failQty   = grp.reduce((s, r) => s + (parseInt(r.fail_qty,    10) || 0), 0);
      const repassQty = grp.reduce((s, r) => s + (parseInt(r.repass_qty,  10) || 0), 0);
      const refailQty = grp.reduce((s, r) => s + (parseInt(r.refail_qty,  10) || 0), 0);

      const defectQty = useB006Defects ? ((defectsByGroup.get(key) || new Set()).size) : refailQty;

      // INPUT = unique boards that entered = OUTPUT + FAIL - REPASS (B005 fields)
      // repass_qty counts retested boards already included in output_qty — subtract to avoid double-counting
      const inputQty  = outputQty + failQty - repassQty;

      const failP = inputQty > 0 ? failQty   / inputQty : 0;
      const passP = inputQty > 0 ? 1 - failP : 0;
      const failD = inputQty > 0 ? defectQty / inputQty : 0;
      const passD = inputQty > 0 ? 1 - failD : 0;

      return {
        PLANT_CODE:   PLANT_CODE,
        MODEL_NAME:   modelName,
        PROCESS_NAME: procName,
        INPUT_QTY:    inputQty,
        FAIL_QTY:     failQty,
        FAIL_P:       failP,
        PASS_P:       passP,
        DEFECT_QTY:   defectQty,
        FAIL_D:       failD,
        PASS_D:       passD,
        OUTPUT_QTY:   outputQty,
      };
    })
    .sort((a, b) =>
      a.PROCESS_NAME.localeCompare(b.PROCESS_NAME) ||
      a.MODEL_NAME.localeCompare(b.MODEL_NAME)
    );
}

/**
 * Build Detail sheet rows — one row per B006 record.
 * @param {object[]} b006
 * @param {object}   modelLookup  - { work_order: model_name }
 * @returns {object[]}
 */
function buildDetailRows(b006, modelLookup = {}, processRemap = {}, requirements = []) {
  const requirementMatcher = createRequirementMatcher(requirements);

  const normalized = b006.map((r) => {
    const processName = getEffectiveProcessName(r, requirementMatcher.match, processRemap);
    const recTime = recTimeToDate(r.rec_time);
    return {
      source: r,
      processName,
      recTime,
      recTimeMs: recTime ? recTime.getTime() : 0,
    };
  });

  // Sort by effective process_name ASC, then serial_number ASC.
  normalized.sort((a, b) => {
    if (a.processName < b.processName) return -1;
    if (a.processName > b.processName) return  1;
    if (a.source.serial_number < b.source.serial_number) return -1;
    if (a.source.serial_number > b.source.serial_number) return  1;
    return a.recTimeMs - b.recTimeMs;
  });

  return normalized.map(({ source, processName, recTime }) => ({
    PLANT_CODE:    PLANT_CODE,
    MODEL_NAME:    modelLookup[source.work_order] || source.model_name || "",
    PART_NO:       source.part_no       || "",
    WORK_ORDER:    source.work_order    || "",
    WO_TYPE:       source.wo_type || "",
    SERIAL_NUMBER: source.serial_number || "",
    PROCESS_NAME:  processName,
    TERMINAL_NAME: source.terminal_name || "",
    DEFECT_CODE:   source.defect_code   || "",
    DEFECT_DESC:   source.defect_desc   || "",
    TIME:          recTime,  // store as UTC Date for Excel date serial
    EMP:           "",
    STATUS:        (STATUS_MAP[source.rstatus] ?? source.rstatus) ?? "",
    MAC:           "",
    CUSTOMER_SN:   "",
  }));
}

// -------------------------------------------------------
// Excel export — fills in Sample.xlsx template format
// -------------------------------------------------------

const DATA_HEADERS = [
  "PLANT_CODE", "MODEL_NAME", "PROCESS_NAME",
  "INPUT_QTY", "FAIL_QTY", "FAIL_P", "PASS_P",
  "DEFECT_QTY", "FAIL_D", "PASS_D", "OUTPUT_QTY",
];

const DETAIL_HEADERS = [
  "PLANT_CODE", "MODEL_NAME", "PART_NO", "WORK_ORDER", "WO_TYPE",
  "SERIAL_NUMBER", "PROCESS_NAME", "TERMINAL_NAME",
  "DEFECT_CODE", "DEFECT_DESC", "TIME", "EMP", "STATUS", "MAC", "CUSTOMER_SN",
];

// Columns in Data sheet that are percentages (0-indexed)
const PCT_COLS_DATA = [5, 6, 8, 9]; // FAIL_P, PASS_P, FAIL_D, PASS_D

/**
 * Write Data + Detail sheets to an Excel file.
 * If templatePath exists, loads it as base (preserving header formatting).
 * Otherwise creates a new workbook from scratch.
 *
 * @param {string}   filePath      - full output .xlsx path
 * @param {object[]} dataRows
 * @param {object[]} detailRows
 * @param {string}   [templatePath] - optional path to Sample.xlsx template
 */
async function exportToExcel(filePath, dataRows, detailRows, templatePath) {
  const wb = new ExcelJS.Workbook();

  if (templatePath && fs.existsSync(templatePath)) {
    // Load the template so header row formatting is preserved
    await wb.xlsx.readFile(templatePath);

    // Clear any existing data rows (keep row 1 = header)
    for (const sheetName of ["Data", "Detail"]) {
      const ws = wb.getWorksheet(sheetName);
      if (!ws) continue;
      // Remove rows from bottom up so splice indices stay valid
      for (let r = ws.rowCount; r >= 2; r--) {
        ws.spliceRows(r, 1);
      }
    }
  } else {
    // No template — create fresh sheets with bold headers
    const wsData   = wb.addWorksheet("Data");
    const wsDetail = wb.addWorksheet("Detail");

    const hData = wsData.addRow(DATA_HEADERS);
    hData.font = { bold: true };
    wsData.columns.forEach((col) => { col.width = 18; });

    const hDet = wsDetail.addRow(DETAIL_HEADERS);
    hDet.font = { bold: true };
    wsDetail.columns.forEach((col) => { col.width = 20; });
  }

  // --- Fill Data sheet ---
  const wsData = wb.getWorksheet("Data");
  // Apply numeric formatting once per column instead of once per cell.
  for (const colIdx of PCT_COLS_DATA) {
    wsData.getColumn(colIdx + 1).numFmt = "0.00%";
  }
  wsData.addRows(dataRows.map((row) => [
      row.PLANT_CODE, row.MODEL_NAME, row.PROCESS_NAME,
      row.INPUT_QTY,  row.FAIL_QTY,
      row.FAIL_P,     row.PASS_P,
      row.DEFECT_QTY,
      row.FAIL_D,     row.PASS_D,
      row.OUTPUT_QTY,
    ]));

  // --- Fill Detail sheet ---
  const wsDetail = wb.getWorksheet("Detail");
  wsDetail.getColumn(11).numFmt = 'yyyy/mm/dd hh:mm:ss';
  wsDetail.addRows(detailRows.map((row) => [
      row.PLANT_CODE, row.MODEL_NAME, row.PART_NO,   row.WORK_ORDER,
      row.WO_TYPE,    row.SERIAL_NUMBER, row.PROCESS_NAME,
      row.TERMINAL_NAME, row.DEFECT_CODE, row.DEFECT_DESC, row.TIME,
      row.EMP,        row.STATUS,   row.MAC,         row.CUSTOMER_SN,
    ]));

  await wb.xlsx.writeFile(filePath);
  console.log(`[SAVED] ${filePath}`);
}

function getWorkOrdersWithoutData(selectedWorkOrders = [], b005 = [], b006 = []) {
  const requested = [...new Set(
    (Array.isArray(selectedWorkOrders) ? selectedWorkOrders : [])
      .map((wo) => String(wo || "").trim())
      .filter(Boolean)
  )];

  if (!requested.length) return [];

  const withData = new Set();
  const collect = (rows) => {
    for (const row of rows || []) {
      const wo = String(row?.work_order || "").trim();
      if (wo) withData.add(wo);
    }
  };

  collect(b005);
  collect(b006);

  return requested.filter((wo) => !withData.has(wo));
}

function buildCoverageTableByWorkOrder(selectedWorkOrders = [], b005 = [], b006 = []) {
  const requested = [...new Set(
    (Array.isArray(selectedWorkOrders) ? selectedWorkOrders : [])
      .map((wo) => String(wo || "").trim())
      .filter(Boolean)
  )];

  const counts = new Map();
  const ensure = (workOrder) => {
    if (!counts.has(workOrder)) {
      counts.set(workOrder, { B005_ROWS: 0, B006_ROWS: 0 });
    }
    return counts.get(workOrder);
  };

  requested.forEach((wo) => ensure(wo));

  for (const row of b005 || []) {
    const wo = String(row?.work_order || "").trim();
    if (!wo) continue;
    ensure(wo).B005_ROWS += 1;
  }

  for (const row of b006 || []) {
    const wo = String(row?.work_order || "").trim();
    if (!wo) continue;
    ensure(wo).B006_ROWS += 1;
  }

  return [...counts.entries()]
    .map(([workOrder, stat]) => {
      const totalRows = stat.B005_ROWS + stat.B006_ROWS;
      return {
        WORK_ORDER: workOrder,
        B005_ROWS: stat.B005_ROWS,
        B006_ROWS: stat.B006_ROWS,
        TOTAL_ROWS: totalRows,
        HAS_DATA: totalRows > 0 ? "YES" : "NO",
      };
    })
    .sort((a, b) => a.WORK_ORDER.localeCompare(b.WORK_ORDER));
}

function buildCoverageTableByProcess(selectedProcesses = [], b005 = [], b006 = []) {
  const requested = [...new Set(
    (Array.isArray(selectedProcesses) ? selectedProcesses : [])
      .map((processName) => String(processName || "").trim())
      .filter(Boolean)
  )];

  const counts = new Map();
  const ensure = (processName) => {
    if (!counts.has(processName)) {
      counts.set(processName, { B005_ROWS: 0, B006_ROWS: 0 });
    }
    return counts.get(processName);
  };

  requested.forEach((processName) => ensure(processName));

  for (const row of b005 || []) {
    const processName = String(row?.process_name || "").trim();
    if (!processName) continue;
    ensure(processName).B005_ROWS += 1;
  }

  for (const row of b006 || []) {
    const processName = String(row?.process_name || "").trim();
    if (!processName) continue;
    ensure(processName).B006_ROWS += 1;
  }

  return [...counts.entries()]
    .map(([processName, stat]) => {
      const totalRows = stat.B005_ROWS + stat.B006_ROWS;
      return {
        PROCESS_NAME: processName,
        B005_ROWS: stat.B005_ROWS,
        B006_ROWS: stat.B006_ROWS,
        TOTAL_ROWS: totalRows,
        HAS_DATA: totalRows > 0 ? "YES" : "NO",
      };
    })
    .sort((a, b) => a.PROCESS_NAME.localeCompare(b.PROCESS_NAME));
}

function logCoverageTables(selectedWorkOrders = [], selectedProcesses = [], b005 = [], b006 = []) {
  const byWorkOrder = buildCoverageTableByWorkOrder(selectedWorkOrders, b005, b006);
  if (byWorkOrder.length > 0) {
    console.log("\nCoverage by WO:");
    console.table(byWorkOrder);
  }

  const byProcess = buildCoverageTableByProcess(selectedProcesses, b005, b006);
  if (byProcess.length > 0) {
    console.log("\nCoverage by Process:");
    console.table(byProcess);
  }
}

// -------------------------------------------------------
// Main orchestrator
// -------------------------------------------------------

/**
 * Full pipeline: fetch → filter → aggregate → export.
 *
 * @param {object} config
 * @param {string}   config.outputFile    - full path for output .xlsx
 * @param {string[]} config.workOrders    - WO filter (empty = any)
 * @param {string[]} config.processes     - process name filter (empty = any)
 * @param {string}   config.fromDate      - "yyyyMMdd"
 * @param {number}   config.fromHour      - 0–23
 * @param {string}   config.toDate        - "yyyyMMdd"
 * @param {number}   config.toHour        - 0–23
 * @param {string}   [config.templatePath] - path to Sample.xlsx template (optional)
 */
async function run(config) {
  const {
    outputFile, workOrders = [], processes = [],
    fromDate, fromHour, toDate, toHour,
    fromMinute = 0, toMinute = 0,
    templatePath, processRemap = {}, requirements = [],
  } = config;

  const normalizedRequirements = normalizeRequirements(requirements);
  const effectiveWorkOrders = normalizedRequirements.length > 0
    ? [...new Set(normalizedRequirements.map((req) => req.workOrder))]
    : workOrders;

  console.log("=== MES Export ===");
  console.log(`WOs      : ${effectiveWorkOrders.join(", ") || "(any)"}`);
  console.log(`Processes: ${processes.join(", ")  || "(any)"}`);
  console.log(`Time     : ${fromDate} ${String(fromHour).padStart(2,"0")}:${String(fromMinute).padStart(2,"0")} -> ${toDate} ${String(toHour).padStart(2,"0")}:${String(toMinute).padStart(2,"0")}`);
  console.log(`Output   : ${outputFile}`);
  console.log("");
  if (normalizedRequirements.length > 0) {
    console.log("Requirements:");
    normalizedRequirements.forEach((req) => {
      console.log(`  ${req.workOrder}`);
    });
    console.log("");
  }

  // Build fromDT/toDT as UTC to match recTimeToDate() which also treats times as UTC
  const fromDT = new Date(`${isoDate(fromDate)}T${String(fromHour).padStart(2,"0")}:${String(fromMinute).padStart(2,"0")}:00Z`);
  const toDT   = new Date(`${isoDate(toDate)}T${String(toHour).padStart(2,"0")}:${String(toMinute).padStart(2,"0")}:00Z`);

  const chunks = getDailyDateChunks(fromDate, toDate);
console.log(`Fetching ${chunks.length} non-overlapping 2-day window chunk(s) with incremental filtering...`);

const filtOpts = {
workOrders: effectiveWorkOrders,
processes,
fromDate,
fromHour,
toDate,
toHour,
requirements: normalizedRequirements,
};

// Fetch by non-overlapping day->nextDay windows and filter immediately.
// MES Daily requires BOTH B005 and B006, so both commands are always queried.
const b005 = [];
const b006 = [];
let rawB005Count = 0;
let rawB006Count = 0;

for (const chunk of chunks) {
process.stdout.write(`  [B005] ${chunk.from}~${chunk.to} ... `);
const raw = await queryMES("B005", chunk.from, chunk.to);
rawB005Count += raw.length;
const filtered = filterB005(raw, filtOpts);
b005.push(...filtered);
console.log(`${raw.length} raw -> ${filtered.length} kept`);
}

for (const chunk of chunks) {
process.stdout.write(`  [B006] ${chunk.from}~${chunk.to} ... `);
const raw = await queryMES("B006", chunk.from, chunk.to);
rawB006Count += raw.length;
const filtered = filterB006(raw, { ...filtOpts, fromDT, toDT });
b006.push(...filtered);
console.log(`${raw.length} raw -> ${filtered.length} kept`);
}

console.log(`
Raw B005: ${rawB005Count}  Raw B006: ${rawB006Count}`);
console.log(`Filtered B005: ${b005.length}  B006: ${b006.length}`);

const b006DedupeResult = dedupeB006Rows(b006);
const b006BeforeDedupe = b006.length;
b006.length = 0;
b006.push(...b006DedupeResult.rows);
if (b006DedupeResult.duplicateCount > 0) {
console.log(`B006 duplicate rows removed: ${b006DedupeResult.duplicateCount} (${b006BeforeDedupe} -> ${b006.length})`);
console.table(b006DedupeResult.duplicateStats);
} else {
console.log('B006 duplicate rows removed: 0');
}

logCoverageTables(effectiveWorkOrders, processes, b005, b006);

const noDataWorkOrders = getWorkOrdersWithoutData(effectiveWorkOrders, b005, b006);
  if (noDataWorkOrders.length > 0) {
    const noDataSet = new Set(noDataWorkOrders);
    const workOrdersWithData = effectiveWorkOrders.filter((wo) => !noDataSet.has(wo));

    if (workOrdersWithData.length > 0) {
      console.warn(
        `WARNING: No MES data for WO(s): ${noDataWorkOrders.join(", ")}. Continue with WO(s): ${workOrdersWithData.join(", ")}.`
      );
    } else {
      console.warn(
        `WARNING: No MES data for WO(s): ${noDataWorkOrders.join(", ")}. Export will be canceled.`
      );
    }
  }

  if (b005.length === 0) {
    console.warn("WARNING: No B005 data after filtering. Check WO / date range.");
  }

  // Build model lookup
  const modelLookup = {};
  for (const r of b005) {
    if (!modelLookup[r.work_order]) modelLookup[r.work_order] = r.model_name;
  }

  const dataRows   = buildDataRows(b005, processRemap, normalizedRequirements, b006);
  const detailRows = buildDetailRows(b006, modelLookup, processRemap, normalizedRequirements);

  console.log(`\nData rows: ${dataRows.length}  Detail rows: ${detailRows.length}`);
  if (dataRows.length === 0 && detailRows.length === 0) {
    const noDataError = new Error("No MES data found for selected WO / station / time range. Export canceled.");
    noDataError.code = "NO_MES_DATA";
    console.error(`[NO DATA] ${noDataError.message}`);
    throw noDataError;
  }

  for (const row of dataRows) {
    console.log(
      `  ${row.PROCESS_NAME.padEnd(22)} IN:${row.INPUT_QTY} FAIL:${row.FAIL_QTY} DEF:${row.DEFECT_QTY}`
    );
  }

  await exportToExcel(outputFile, dataRows, detailRows, templatePath);
  console.log("\nDone.");
}

// -------------------------------------------------------
// Date utilities
// -------------------------------------------------------

/**
 * Parse a MES rec_time string ("yyyy/mm/dd HH:MM:SS") as a UTC Date.
 * ExcelJS writes Date objects as Excel date serials (UTC-based).
 * Golden files were created by Excel COM which stores the literal time as
 * a date serial; ExcelJS reads those back as a UTC Date → toISOString().
 * Treating rec_time as UTC preserves the same literal datetime in both.
 */
function recTimeToDate(timeStr) {
  if (!timeStr) return null;
  // "2026/04/14 14:12:38" → "2026-04-14T14:12:38Z"
  const iso = String(timeStr).replace(/\//g, '-').replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function parseDate(yyyyMMdd) {
  const y = parseInt(yyyyMMdd.slice(0, 4), 10);
  const m = parseInt(yyyyMMdd.slice(4, 6), 10) - 1;
  const d = parseInt(yyyyMMdd.slice(6, 8), 10);
  return new Date(y, m, d);
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function fmtDate(date) {
  const y  = date.getFullYear();
  const m  = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}
function isoDate(yyyyMMdd) {
  return `${yyyyMMdd.slice(0,4)}-${yyyyMMdd.slice(4,6)}-${yyyyMMdd.slice(6,8)}`;
}

// -------------------------------------------------------
// Exports (library use)
// -------------------------------------------------------
module.exports = { queryMES, queryMESInput, filterB005, filterB006, buildDataRows, buildDetailRows, exportToExcel, run, getDailyDateChunks, dedupeB006Rows };

// ================================================================
//  CẤU HÌNH — chỉnh sửa tại đây rồi chạy: node logic.js
// ================================================================
if (require.main === module) {

  const OUTPUT_DIR = "C:\\Users\\HarrisonLe\\Desktop\\New folder";
  const TEMPLATE   = path.join(OUTPUT_DIR, "Sample.xlsx");

  // ---------------------------------------------------------------
  // DANH SÁCH CA CẦN XUẤT
  // Mỗi dòng là 1 ca: { name, workOrders, pdLine, processes, fromDate, fromHour }
  // toDate / toHour tự tính = fromDate+1 ngày, cùng giờ
  // ---------------------------------------------------------------
  const CASES = [
    {
      name:       "MB 04.15",
      workOrders: ["8641872"],
      pdLine:     "BT04",
      processes:  ["DIP_PCBA_01", "DIP_PCBA Test02", "DIP_PCBA Test03"],
      fromDate:   "20260414", fromHour: 15,
    },
    {
      name:       "MB 04.19",
      workOrders: ["8641872"],
      pdLine:     "BT04",
      processes:  ["DIP_PCBA_01", "DIP_PCBA Test02", "DIP_PCBA Test03"],
      fromDate:   "20260418", fromHour: 15,
    },
    {
      name:       "FPC02 04.16",
      workOrders: ["8641088"],
      pdLine:     "BT04",
      processes:  ["DIP_PCBA_01", "DIP_PCBA Test02", "DIP_PCBA Test03"],
      fromDate:   "20260415", fromHour: 15,
    },
    {
      name:       "FPC02 04.15",
      workOrders: ["8641088"],
      pdLine:     "BT04",
      processes:  ["DIP_PCBA_01"],
      fromDate:   "20260414", fromHour: 15,
    },
    {
      name:       "FPC01 04.14",
      workOrders: ["8641089"],
      pdLine:     "",
      processes:  ["DIP_PCBA_01"],
      fromDate:   "20260413", fromHour: 15,
    },
  ];

  async function main() {
    for (const c of CASES) {
      const toDate = fmtDate(addDays(parseDate(c.fromDate), 1));
      await run({
        outputFile:   path.join(OUTPUT_DIR, `${c.name}.xlsx`),
        workOrders:   c.workOrders,
        processes:    c.processes,
        pdLine:       c.pdLine,
        fromDate:     c.fromDate,
        fromHour:     c.fromHour,
        toDate:       toDate,
        toHour:       c.fromHour,
        templatePath: TEMPLATE,
      });
      console.log("");
    }
    console.log("=== TẤT CẢ HOÀN THÀNH ===");
  }

  main().catch((err) => {
    console.error("FATAL:", err.message);
    process.exit(1);
  });
}

