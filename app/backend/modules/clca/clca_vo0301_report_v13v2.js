#!/usr/bin/env node
/*
CLCA – VO0301 FATP FT Test Report Builder (v1.4.1) - JavaScript port
JavaScript implementation used by the Node.js backend
*/

'use strict';

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');

const FONT_NAME = 'Arial';
const FONT_SIZE = 11;
const NDF_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC4D79B' } };

function clonePlain(value) {
  // ExcelJS Workbook/Worksheet/Row/Cell objects contain circular references.
  // Use this only for plain style/model-like objects, and strip back references.
  if (value === null || value === undefined) return value;
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(value, (key, val) => {
    if (key === '_workbook' || key === 'workbook' || key === 'worksheet' || key === '_worksheet' || key === '_rows' || key === '_columns' || key === '_cells') {
      return undefined;
    }
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) return undefined;
      seen.add(val);
    }
    return val;
  }));
}

function normText(input) {
  if (input === null || input === undefined) return '';
  let s = String(input).trim().toLowerCase();
  s = s.replace(/[\s\t\r\n]+/g, ' ');
  s = s.replace(/[\-_/\\:()\*'\[\],.]+/g, '');
  return s;
}

function headerMatch(cellVal, keywords) {
  const nt = normText(cellVal);
  return keywords.some((k) => nt.includes(normText(k)));
}

function getCol(normMap, candidates) {
  for (const cand of candidates) {
    const key = normText(cand);
    if (Object.prototype.hasOwnProperty.call(normMap, key)) {
      return normMap[key];
    }
  }
  return null;
}

function normalizeStation(name) {
  let s = name == null ? '' : String(name);
  s = s.trim();
  s = s.replace(/Leak\s*Test/gi, 'Leak Test');
  s = s.replace(/LeakTest/gi, 'Leak Test');
  s = s.replace(/FT-/gi, 'FT_');
  return s;
}

function hasFatpPrefix(stationName) {
  return String(stationName || '').trim().toUpperCase().startsWith('FATP');
}

function hasDipPrefix(stationName) {
  return String(stationName || '').trim().toUpperCase().startsWith('DIP');
}

function extractBaseName(stationName) {
  return String(stationName || '').trim().replace(/^FATP[_\s]*/i, '');
}

function normalizeBaseForMatching(baseName) {
  return String(baseName || '').trim().toUpperCase().replace(/[_\-\s]+/g, '').toLowerCase();
}

function buildStationMatcher(templateStations) {
  // Not needed since we match by exact base name now.
  return {};
}

function findTemplateStationMatch(dataStation, templateStations, matcher) {
  if (!dataStation || typeof dataStation !== 'string') return null;

  const station = dataStation.trim();
  const baseName = extractBaseName(station);
  const dataBaseNorm = normalizeBaseForMatching(baseName);

  // Match the data station to one of the template stations using normalized base names.
  for (const ts of templateStations) {
    if (normalizeBaseForMatching(ts) === dataBaseNorm) {
      return ts;
    }
  }

  // Fallback for Leak Test variants
  const dataLower = station.toLowerCase();
  const leakNorm = dataLower.replace(/[ _]/g, '');
  if (leakNorm.includes('leaktest')) {
    const dataMatch = leakNorm.match(/leaktest(\d*)/);
    const dataNum = dataMatch ? dataMatch[1] : '';

    for (const ts of templateStations) {
      const tsNorm = String(ts).toLowerCase().replace(/[ _]/g, '');
      if (!tsNorm.includes('leaktest')) continue;
      const tsMatch = tsNorm.match(/leaktest(\d*)/);
      const tsNum = tsMatch ? tsMatch[1] : '';

      if (tsNum === dataNum) return ts;
      if (dataNum === '' && tsNum === '01') return ts;
      if (tsNum === '' && dataNum === '01') return ts;
    }
  }

  return null;
}

function cleanStatus(input) {
  if (input === null || input === undefined || input === '') return null;
  let s = String(input);
  try {
    s = s.normalize('NFKC');
  } catch (_) {
  }
  s = s.replace(/\r|\n|\t/g, ' ').trim();
  return s.length ? s : null;
}

function toRatio(val) {
  if (val === null || val === undefined) return null;

  if (typeof val === 'string') {
    let s = val.trim();
    if (!s) return null;
    s = s.replace(',', '.');
    if (s.endsWith('%')) {
      const num = Number(s.slice(0, -1).trim());
      if (Number.isFinite(num)) return num / 100;
      return null;
    }
    const num = Number(s);
    if (Number.isFinite(num)) val = num;
    else return null;
  }

  if (typeof val === 'number' && Number.isFinite(val)) {
    if (val > 1 && val <= 100) return val / 100;
    return val;
  }

  return null;
}

function getCellValue(ws, row, col) {
  return ws.getRow(row).getCell(col).value;
}

function getCellText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, 'result')) return String(value.result ?? '');
    if (Object.prototype.hasOwnProperty.call(value, 'text')) return String(value.text ?? '');
    if (Array.isArray(value.richText)) return value.richText.map((x) => x.text || '').join('');
  }
  return String(value);
}

function findTableSheetAndHeader(wsList) {
  for (const ws of wsList) {
    const maxRow = Math.min(ws.rowCount || ws.actualRowCount || 0, 60);
    const maxCol = ws.columnCount || ws.actualColumnCount || 50;
    for (let r = 1; r <= maxRow; r += 1) {
      const values = [];
      for (let c = 1; c <= maxCol; c += 1) values.push(getCellText(getCellValue(ws, r, c)));
      const stationHit = values.some((v) => headerMatch(v, ['Station', '制程别']));
      const snHit = values.some((v) => headerMatch(v, ['SN', 'SN码']));
      const descHit = values.some((v) => headerMatch(v, ['Description', '描述现象']));
      const failpHit = values.some((v) => headerMatch(v, ['一次不良率']));
      if (stationHit && snHit && descHit && failpHit) return [ws, r];
    }
  }
  return [wsList[0], 1];
}

function buildCompositeHeaders(ws, headerRowIdx, depth = 3) {
  const comp = {};
  const maxRow = ws.rowCount || ws.actualRowCount || headerRowIdx;
  const maxCol = ws.columnCount || ws.actualColumnCount || 1;
  for (let c = 1; c <= maxCol; c += 1) {
    const pieces = [];
    for (let rr = headerRowIdx; rr <= Math.min(headerRowIdx + depth - 1, maxRow); rr += 1) {
      const v = getCellValue(ws, rr, c);
      const t = getCellText(v);
      if (t) pieces.push(t);
    }
    comp[c] = pieces.join(' ');
  }
  return comp;
}

function mapKpiColumnsFromComposite(comp) {
  const colIndex = {};
  const defectQtyCandidates = [];
  const failQtyCandidates = [];

  for (const [cKey, txt] of Object.entries(comp)) {
    const c = Number(cKey);
    const nt = normText(txt);

    if (headerMatch(txt, ['Station', '制程别'])) colIndex.station = c;
    else if (headerMatch(txt, ['Input', '投入'])) colIndex.input = c;
    else if (nt.includes('一次不良率') || nt.includes('failp')) colIndex.failp = c;
    else if (nt.includes('一次不良') && !nt.includes('率') && !nt.includes('rate')) failQtyCandidates.push([c, txt]);
    else if (nt.includes('fpy') || nt.includes('firstpassyield')) colIndex.fpy = c;
    else if ((nt.includes('defect') || nt.includes('不良')) && !nt.includes('rate') && !nt.includes('率')) defectQtyCandidates.push([c, txt]);
    else if (nt.includes('defectrate') || nt.includes('不良率')) colIndex.defectrate = c;
    else if (nt.includes('rpy') || nt.includes('retestpassyield')) colIndex.rpy = c;
    else if (nt.includes('output')) colIndex.output = c;
    else if (headerMatch(txt, ['SN', 'SN码'])) colIndex.sn = c;
    else if (headerMatch(txt, ['Description', '描述现象'])) colIndex.desc = c;
    else if (headerMatch(txt, ['Remark', '备注'])) colIndex.remark = c;
    else if (headerMatch(txt, ['No.'])) colIndex.no = c;
  }

  if (failQtyCandidates.length && !colIndex.failqty) {
    failQtyCandidates.sort((a, b) => {
      const nta = normText(a[1]);
      const ntb = normText(b[1]);
      let sa = 0;
      let sb = 0;
      if (nta.includes('mes')) sa += 2;
      if (ntb.includes('mes')) sb += 2;
      if (nta.includes('一次不良数') || nta.includes('一次不良數')) sa += 3;
      if (ntb.includes('一次不良数') || ntb.includes('一次不良數')) sb += 3;
      if (sb !== sa) return sb - sa;
      return a[0] - b[0];
    });
    colIndex.failqty = failQtyCandidates[0][0];
  }

  if (defectQtyCandidates.length && !colIndex.defectqty) {
    defectQtyCandidates.sort((a, b) => {
      const nta = normText(a[1]);
      const ntb = normText(b[1]);
      let sa = 0;
      let sb = 0;
      if (nta.includes('mes')) sa += 2;
      if (ntb.includes('mes')) sb += 2;
      if (nta.includes('不良数')) sa += 3;
      if (ntb.includes('不良数')) sb += 3;
      if (nta.includes('defect')) sa += 1;
      if (ntb.includes('defect')) sb += 1;
      if (sb !== sa) return sb - sa;
      return a[0] - b[0];
    });
    colIndex.defectqty = defectQtyCandidates[0][0];
  }

  return colIndex;
}

function findLabelCell(ws, labelTargets, searchRows = null, searchCols = 30) {
  const targets = labelTargets.map((t) => t.toLowerCase());
  const maxRow = searchRows == null ? (ws.rowCount || ws.actualRowCount || 1) : Math.min(ws.rowCount || ws.actualRowCount || 1, searchRows);
  const maxCol = Math.min(ws.columnCount || ws.actualColumnCount || 1, searchCols);

  for (let r = 1; r <= maxRow; r += 1) {
    for (let c = 1; c <= maxCol; c += 1) {
      const t = getCellText(getCellValue(ws, r, c)).trim();
      if (!t) continue;
      const nt = normText(t);
      const nts = nt.replace(/ /g, '');
      if (targets.some((x) => nt.includes(x) || nts.includes(x))) return { row: r, col: c };
    }
  }
  return null;
}

function getTableBoundsFromComp(ws, comp) {
  const keys = Object.keys(comp).map(Number);
  if (!keys.length) return [1, ws.columnCount || ws.actualColumnCount || 1];
  return [Math.min(...keys), Math.max(...keys)];
}

function clearBorder() {
  return {};
}

function thinBorder() {
  return {
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
  };
}

function borderWith({ left, right, top, bottom }) {
  const b = {};
  if (left) b.left = { style: 'thin', color: { argb: 'FF000000' } };
  if (right) b.right = { style: 'thin', color: { argb: 'FF000000' } };
  if (top) b.top = { style: 'thin', color: { argb: 'FF000000' } };
  if (bottom) b.bottom = { style: 'thin', color: { argb: 'FF000000' } };
  return b;
}

function colLettersToNumber(letters) {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n;
}

function parseRef(ref) {
  const m = /^([A-Z]+)(\d+)$/i.exec(ref);
  if (!m) return null;
  return { col: colLettersToNumber(m[1]), row: Number(m[2]) };
}

function getMergedRanges(ws) {
  const ranges = [];

  if (ws && ws._merges) {
    for (const mr of Object.values(ws._merges)) {
      const model = mr && mr.model ? mr.model : null;
      if (!model) continue;
      ranges.push({ min_row: model.top, min_col: model.left, max_row: model.bottom, max_col: model.right });
    }
  }

  if (!ranges.length && ws && ws.model && Array.isArray(ws.model.merges)) {
    for (const mergeRef of ws.model.merges) {
      if (!mergeRef.includes(':')) {
        const p = parseRef(mergeRef);
        if (p) ranges.push({ min_row: p.row, min_col: p.col, max_row: p.row, max_col: p.col });
        continue;
      }
      const [a, b] = mergeRef.split(':');
      const p1 = parseRef(a);
      const p2 = parseRef(b);
      if (p1 && p2) {
        ranges.push({
          min_row: Math.min(p1.row, p2.row),
          min_col: Math.min(p1.col, p2.col),
          max_row: Math.max(p1.row, p2.row),
          max_col: Math.max(p1.col, p2.col),
        });
      }
    }
  }

  return ranges;
}

function applyTableGridRespectingMerges(ws, minRow, maxRow, minCol, maxCol) {
  for (let r = minRow; r <= maxRow; r += 1) {
    for (let c = minCol; c <= maxCol; c += 1) {
      ws.getRow(r).getCell(c).border = thinBorder();
    }
  }

  const mergedRanges = getMergedRanges(ws);

  for (const mr of mergedRanges) {
    const r1 = mr.min_row;
    const c1 = mr.min_col;
    const r2 = mr.max_row;
    const c2 = mr.max_col;

    if (r2 < minRow || r1 > maxRow || c2 < minCol || c1 > maxCol) continue;

    const r1c = Math.max(r1, minRow);
    const r2c = Math.min(r2, maxRow);
    const c1c = Math.max(c1, minCol);
    const c2c = Math.min(c2, maxCol);

    for (let r = r1c; r <= r2c; r += 1) {
      for (let c = c1c; c <= c2c; c += 1) {
        const cell = ws.getRow(r).getCell(c);
        const interior = !(r === r1c || r === r2c || c === c1c || c === c2c);
        if (interior) {
          cell.border = clearBorder();
        } else {
          cell.border = borderWith({
            left: c === c1c,
            right: c === c2c,
            top: r === r1c,
            bottom: r === r2c,
          });
        }
      }
    }

    // ExcelJS quirk: in a merged range, only the LAST-set cell's border survives
    // when writing. Re-set the master cell (top-left) with all outer-edge borders
    // so the merged region renders correctly in Excel.
    if (r2c > r1c || c2c > c1c) {
      ws.getRow(r1c).getCell(c1c).border = thinBorder();
    }
  }
}

function unifyFontTable(ws, minRow, maxRow, minCol, maxCol, fontName, fontSize) {
  for (let r = minRow; r <= maxRow; r += 1) {
    for (let c = minCol; c <= maxCol; c += 1) {
      ws.getRow(r).getCell(c).font = { name: fontName, size: fontSize };
    }
  }
}

function isNdfDescription(text) {
  if (text === null || text === undefined) return false;
  const s = getCellText(text).trim().toLowerCase();
  if (!s) return false;
  return s.startsWith('[ndf') || s.startsWith('ndf');
}

// Apply fill using full style assignment to avoid ExcelJS internal style
// sharing between cells in the same row (which causes fill to leak to
// adjacent columns after insertRows).
function applyCellFill(cell, fill) {
  cell.style = Object.assign({}, cell.style, { fill });
}

function mergeIdenticalInColumn(ws, startRow, endRow, col) {
  if (startRow >= endRow) {
    const cell = ws.getRow(startRow).getCell(col);
    if (isNdfDescription(cell.value)) applyCellFill(cell, NDF_FILL);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    return;
  }

  let r = startRow;
  while (r <= endRow) {
    const top = r;
    const baseVal = ws.getRow(r).getCell(col).value;
    r += 1;

    while (
      r <= endRow
      && getCellText(ws.getRow(r).getCell(col).value) === getCellText(baseVal)
      && baseVal !== null
      && String(baseVal).trim() !== ''
    ) {
      r += 1;
    }

    const bottom = r - 1;
    const nonEmpty = baseVal !== null && String(baseVal).trim() !== '';

    if (nonEmpty && bottom > top) {
      ws.mergeCells(top, col, bottom, col);
      const topCell = ws.getRow(top).getCell(col);
      if (isNdfDescription(baseVal)) applyCellFill(topCell, NDF_FILL);
      topCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    } else {
      const cell = ws.getRow(top).getCell(col);
      if (isNdfDescription(baseVal)) applyCellFill(cell, NDF_FILL);
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    }
  }
}


function cloneWorksheet(workbook, sourceWs, newName) {
  const targetWs = workbook.addWorksheet(newName);

  // Copy worksheet-level settings that affect report appearance.
  targetWs.properties = clonePlain(sourceWs.properties || {});
  targetWs.pageSetup = clonePlain(sourceWs.pageSetup || {});
  targetWs.views = clonePlain(sourceWs.views || []);
  targetWs.state = sourceWs.state;

  // Copy columns: width / hidden / outline etc.
  sourceWs.columns.forEach((col, idx) => {
    const tCol = targetWs.getColumn(idx + 1);
    tCol.width = col.width;
    tCol.hidden = col.hidden;
    tCol.outlineLevel = col.outlineLevel;
    if (col.style) tCol.style = clonePlain(col.style);
  });

  // Copy rows, cells, values and styles.
  sourceWs.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const tRow = targetWs.getRow(rowNumber);
    tRow.height = row.height;
    tRow.hidden = row.hidden;
    tRow.outlineLevel = row.outlineLevel;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const tCell = tRow.getCell(colNumber);
      tCell.value = cell.value;
      if (cell.style) tCell.style = clonePlain(cell.style);
      if (cell.numFmt) tCell.numFmt = cell.numFmt;
      if (cell.alignment) tCell.alignment = clonePlain(cell.alignment);
      if (cell.font) tCell.font = clonePlain(cell.font);
      if (cell.fill) tCell.fill = clonePlain(cell.fill);
      if (cell.border) tCell.border = clonePlain(cell.border);
      if (cell.protection) tCell.protection = clonePlain(cell.protection);
      if (cell.note) tCell.note = cell.note;
    });
    tRow.commit && tRow.commit();
  });

  // Copy merged ranges.
  for (const mr of getMergedRanges(sourceWs)) {
    targetWs.mergeCells(mr.min_row, mr.min_col, mr.max_row, mr.max_col);
  }

  // IMAGE FIX FOR MERGED WORKBOOK:
  // Do NOT copy worksheet images by reusing source imageId.
  // ExcelJS image IDs are scoped to their original workbook. Reusing them in finalWb points
  // to missing media and can make xlsx.writeFile fail with:
  // "Cannot read properties of undefined (reading 'name')".
return targetWs;
}

function setCellBlankWithStyle(cell) {
  cell.value = null;
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.font = { name: FONT_NAME, size: FONT_SIZE };
}

function safeMergeCells(ws, startRow, startCol, endRow, endCol) {
  if (endRow > startRow || endCol > startCol) {
    ws.mergeCells(startRow, startCol, endRow, endCol);
  }
}

function readSheetRows(filePath, sheetName) {
  const wb = XLSX.readFile(filePath, { cellDates: true, raw: false });
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Missing sheet ${sheetName}.`);
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  return rows.map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) out[String(k).trim()] = v;
    return out;
  });
}

function readFirstSheetRows(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true, raw: false });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  return rows.map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) out[String(k).trim()] = v;
    return out;
  });
}

function parseDateYmd(val) {
  if (val == null) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function todayYmd() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function productFromKpis(kpiByStation, key) {
  let prod = 1;
  let count = 0;
  for (const kp of Object.values(kpiByStation)) {
    const v = toRatio(kp[key]);
    if (typeof v === 'number' && Number.isFinite(v)) {
      prod *= v;
      count += 1;
    }
  }
  return count > 0 ? prod : null;
}

function rebuildLine1(text, model, wo, line, build) {
  const s = String(text);
  const labelModel = s.match(/(Model[^:]*:)/);
  const labelWo = s.match(/(WO（工单）:|WO\(.*?\):)/);
  const labelStage = s.match(/(Stage[^:]*:)/);
  const labelLine = s.match(/(Line[^:]*:)/);
  const labelBuild = s.match(/(Build Q'ty[^:]*:)/);

  const parts = [];
  if (labelModel) parts.push(`${labelModel[1]} ${model || ''}`);
  if (labelWo) parts.push(`${labelWo[1]} ${wo || ''}`);
  if (labelStage) {
    let val = '';
    const m = s.match(new RegExp(`${labelStage[1]}\\s*([^\\s].*?)(\\s{2,}|$)`));
    if (m) val = m[1];
    parts.push(`${labelStage[1]} ${val}`);
  }
  if (labelLine) parts.push(`${labelLine[1]} ${line || ''}`);
  if (labelBuild) parts.push(`${labelBuild[1]} ${build !== null && build !== undefined ? build : ''}`);

  return parts.length ? parts.join('    ') : s;
}

function rebuildLine2(text, dateStr, startStr, endStr) {
  const s = String(text);
  const labelDate = s.match(/(Date[^:]*:)/);
  const labelStart = s.match(/(Start time[^:]*:)/);
  const labelEnd = s.match(/(End time[^:]*:)/);
  const parts = [];
  if (labelDate) parts.push(`${labelDate[1]} ${dateStr || ''}`);
  if (labelStart) parts.push(`${labelStart[1]} ${startStr || ''}`);
  if (labelEnd) parts.push(`${labelEnd[1]} ${endStr || ''}`);
  return parts.length ? parts.join('    ') : s;
}


async function buildReport(dataPath, templatePath, mappingPathOrOutputPath, outputPathOrOptions, maybeOptions) {
  // Backward compatible signature support:
  //   old app/backend: buildReport(dataPath, templatePath, mappingPath, outputPath, options)
  //   new direct use:   buildReport(dataPath, templatePath, outputPath, options)
  // The mappingPath argument is intentionally ignored because CUSTOMER_SN now comes from Detail sheet.
  let outputPath;
  let options;
  if (typeof outputPathOrOptions === 'string' || outputPathOrOptions instanceof Buffer || outputPathOrOptions instanceof URL) {
    outputPath = outputPathOrOptions;
    options = maybeOptions;
  } else {
    outputPath = mappingPathOrOutputPath;
    options = outputPathOrOptions;
  }
  if (!(typeof outputPath === 'string' || outputPath instanceof Buffer || outputPath instanceof URL)) {
    throw new Error('Invalid outputPath: buildReport requires a valid output file path string/Buffer/URL. Check caller arguments: buildReport(dataPath, templatePath, outputPath, options) or buildReport(dataPath, templatePath, mappingPath, outputPath, options).');
  }
  const selectedStations = (options && Array.isArray(options.selectedStations))
    ? options.selectedStations
    : null; // null = keep all (backward compatibility)
  const useCustomerSnMapping = !!(options && (options.useCustomerSnMapping || options.use_customer_sn_mapping));
  console.log(`[CLCA] useCustomerSnMapping=${useCustomerSnMapping}`);
  // --- Read Data file (XLSX) ---
  let dataRows, detailRows;
  try {
    dataRows = readSheetRows(dataPath, 'Data');
  } catch (e) {
    throw new Error(`Cannot read "Data" sheet from data file: ${e.message}`);
  }
  try {
    detailRows = readSheetRows(dataPath, 'Detail');
  } catch (e) {
    throw new Error(`Cannot read "Detail" sheet from data file: ${e.message}`);
  }

  if (!dataRows.length) throw new Error('Missing rows in Data sheet.');
  if (!detailRows.length) throw new Error('Missing rows in Detail sheet.');

  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(templatePath);
  } catch (e) {
    throw new Error(`Cannot read template/sample file: ${e.message}`);
  }

  if (!wb.worksheets || !wb.worksheets.length) {
    throw new Error('Template file has no worksheets.');
  }

  const [ws, headerRowIdx] = findTableSheetAndHeader(wb.worksheets);
  const comp = buildCompositeHeaders(ws, headerRowIdx, 3);
  const colIndex = mapKpiColumnsFromComposite(comp);

  const requiredKpi = ['station', 'input', 'failqty', 'failp', 'fpy', 'defectqty', 'defectrate', 'rpy', 'output'];
  const missingKpi = requiredKpi.filter((k) => !(k in colIndex));
  if (missingKpi.length) throw new Error(`Missing template KPI columns: ${missingKpi.join(', ')}.`);

  const stationRows = [];
  let blankRun = 0;
  let rowPtr = headerRowIdx + 1;
  const maxRow = ws.rowCount || ws.actualRowCount || headerRowIdx;

  while (rowPtr <= maxRow) {
    const val = getCellText(getCellValue(ws, rowPtr, colIndex.station)).trim();
    if (!val) {
      blankRun += 1;
      if (blankRun >= 10) break;
    } else {
      blankRun = 0;
      stationRows.push([rowPtr, val]);
    }
    rowPtr += 1;
  }

  const templateStations = stationRows.map((x) => x[1]);

  // ---- Station handling: insert or filter based on template content ----
  if (selectedStations && selectedStations.length > 0) {
    if (stationRows.length === 0) {
      // === EMPTY TEMPLATE: insert rows for each selected station ===
      // Convert selected station config names to display labels:
      //   "FATP_FT_01" -> "FT_01"
      //   "DIP_PCBA Test01" -> "DIP_PCBA Test01"
      const insertAt = headerRowIdx + 1; // right after header
      const labels = selectedStations.map((s) => extractBaseName(s));

      // Insert blank rows for all stations
      if (labels.length > 0) {
        const blankRows = new Array(labels.length).fill([]);
        ws.insertRows(insertAt, blankRows, 'n');
      }

      for (let i = 0; i < labels.length; i++) {
        const rowIdx = insertAt + i;
        const row = ws.getRow(rowIdx);
        if (colIndex.no) row.getCell(colIndex.no).value = i + 1;
        row.getCell(colIndex.station).value = labels[i];
        stationRows.push([rowIdx, labels[i]]);
      }

      // Rebuild templateStations
      templateStations.length = 0;
      for (const sr of stationRows) templateStations.push(sr[1]);
    }
  }

  const stationMatcher = buildStationMatcher(templateStations);

  const isLeakTestVariant = (s) => /leak\s*test\s*[01]{1,2}/i.test(String(s).trim().toLowerCase());
  const hasLeakTestVar = templateStations.some((s) => isLeakTestVariant(s));
  const hasLeakPlain = templateStations.some((s) => String(s).trim().toLowerCase() === 'leak test');
  const leakTestVarName = hasLeakTestVar ? templateStations.find((s) => isLeakTestVariant(s)).trim() : null;

  function mapToTemplateStation(s) {
    const normalized = normalizeStation(s);
    const matched = findTemplateStationMatch(String(s || ''), templateStations, stationMatcher);
    if (matched) return matched;
    if (normalized === 'Leak Test' && hasLeakTestVar && !hasLeakPlain && leakTestVarName) return leakTestVarName;
    return normalized;
  }

  const dataColsNorm = {};
  if (dataRows.length) for (const c of Object.keys(dataRows[0])) dataColsNorm[normText(c)] = c;

  const colInput = getCol(dataColsNorm, ['INPUT_QTY']);
  const colFailq = getCol(dataColsNorm, ['一次不良數', 'FAIL_QTY']);
  const colFailp = getCol(dataColsNorm, ['FAIL_P']);
  const colFpy = getCol(dataColsNorm, ['FPY', 'PASS_P']);
  const colDefq = getCol(dataColsNorm, ['DEFECT_QTY']);
  const colDefr = getCol(dataColsNorm, ['FAIL_D']);
  const colRpy = getCol(dataColsNorm, ['PASS_D']);
  const colOutput = getCol(dataColsNorm, ['OUTPUT_QTY']);
  const colProc = getCol(dataColsNorm, ['PROCESS_NAME']);
  const colModel = getCol(dataColsNorm, ['MODEL_NAME']);

  const missingDataCols = [];
  if (!colProc) missingDataCols.push('PROCESS_NAME');
  if (!colInput) missingDataCols.push('INPUT_QTY');
  if (!colFailq) missingDataCols.push('FAIL_QTY/一次不良數');
  if (!colFailp) missingDataCols.push('FAIL_P');
  if (!colFpy) missingDataCols.push('FPY/PASS_P');
  if (!colDefq) missingDataCols.push('DEFECT_QTY');
  if (!colDefr) missingDataCols.push('FAIL_D');
  if (!colRpy) missingDataCols.push('PASS_D');
  if (!colOutput) missingDataCols.push('OUTPUT_QTY');
  if (missingDataCols.length) {
    throw new Error(`Missing Data columns: ${missingDataCols.join(', ')}.`);
  }

  const kpiByStation = {};
  for (const row of dataRows) {
    const proc = colProc && row[colProc] != null ? String(row[colProc]).trim() : '';
    const tStation = mapToTemplateStation(proc);
    if (templateStations.includes(tStation)) {
      kpiByStation[tStation] = {
        input: colInput ? row[colInput] : null,
        failqty: colFailq ? row[colFailq] : null,
        failp: colFailp ? row[colFailp] : null,
        fpy: colFpy ? row[colFpy] : null,
        defectqty: colDefq ? row[colDefq] : null,
        defectrate: colDefr ? row[colDefr] : null,
        rpy: colRpy ? row[colRpy] : null,
        output: colOutput ? row[colOutput] : null,
      };
    }
  }

  function hasKpiValue(v) {
    return v !== null && v !== undefined && String(v).trim() !== '';
  }

  function kpiCompleteness(kpi) {
    if (!kpi) return 0;
    let score = 0;
    for (const key of ['input', 'failqty', 'failp', 'fpy', 'defectqty', 'defectrate', 'rpy', 'output']) {
      if (hasKpiValue(kpi[key])) score += 1;
    }
    return score;
  }

  function buildKpiFromRow(row) {
    return {
      input: colInput ? row[colInput] : null,
      failqty: colFailq ? row[colFailq] : null,
      failp: colFailp ? row[colFailp] : null,
      fpy: colFpy ? row[colFpy] : null,
      defectqty: colDefq ? row[colDefq] : null,
      defectrate: colDefr ? row[colDefr] : null,
      rpy: colRpy ? row[colRpy] : null,
      output: colOutput ? row[colOutput] : null,
    };
  }

  const detailColsNorm = {};
  if (detailRows.length) for (const c of Object.keys(detailRows[0])) detailColsNorm[normText(c)] = c;

  const colSn = getCol(detailColsNorm, ['SERIAL_NUMBER', 'SERIALNUMBER', 'SN']);
  const colCustomerSn = getCol(detailColsNorm, ['CUSTOMER_SN', 'Customer SN', 'CUSTOMERSN']);
  const colPn = getCol(detailColsNorm, ['PROCESS_NAME']);
  const colDesc = getCol(detailColsNorm, ['DEFECT_DESC']);
  const colCode = getCol(detailColsNorm, ['DEFECT_CODE']);
  const colStatus = getCol(detailColsNorm, ['STATUS']);
  const colTime = getCol(detailColsNorm, ['TIME']);
  const colWo = getCol(detailColsNorm, ['WORK_ORDER', 'WORKORDER']);
  const colLine = getCol(detailColsNorm, ['PDLINE_NAME', 'PDLINE']);

  const missingDetailCols = [];
  if (!colSn) missingDetailCols.push('SERIAL_NUMBER');
  if (!colPn) missingDetailCols.push('PROCESS_NAME');
  if (missingDetailCols.length) {
    throw new Error(`Missing Detail columns: ${missingDetailCols.join(', ')}.`);
  }

  const detail = detailRows.map((row) => ({
    ...row,
    _station_template: row[colPn] != null ? mapToTemplateStation(row[colPn]) : '',
    _sn: String(row[colSn] ?? '').trim(),
    _customer_sn: colCustomerSn ? String(row[colCustomerSn] ?? '').trim() : '',
    _desc_raw: colDesc ? row[colDesc] : null,
    _code: colCode ? row[colCode] : null,
    _status: colStatus ? cleanStatus(row[colStatus]) : null,
  }));

  const statusGroups = {};
  if (colStatus) {
    for (const r of detail) {
      const key = `${r._station_template}||${r._sn}`;
      statusGroups[key] = statusGroups[key] || [];
      statusGroups[key].push(r._status);
    }
  }

  function isNdf(statusList) {
    if (!statusList || !statusList.length) return false;
    const normalized = statusList.map((s) => cleanStatus(s));
    const nonNull = normalized.filter((s) => s !== null && s !== undefined);
    if (!nonNull.length) return false;
    const allRetestPass = nonNull.every((s) => s === '重測通過');
    const noRepair = !nonNull.some((s) => s === '已維修' || s === '未維修');
    const noneEmpty = normalized.every((s) => s !== null && s !== undefined);
    return allRetestPass && noRepair && noneEmpty;
  }

  const ndfFlags = {};
  for (const [k, v] of Object.entries(statusGroups)) ndfFlags[k] = isNdf(v);

  const stationToGroups = {};
  const ndfByMapped = {};

  for (const station of templateStations) {
    const sub = detail.filter((r) => r._station_template === station);
    if (!sub.length) {
      stationToGroups[station] = [];
      continue;
    }

    const seenSn = new Set();
    const groups = new Map();

    for (const row of sub) {
      const rawSn = row._sn;
      if (seenSn.has(rawSn)) continue;
      seenSn.add(rawSn);

      let d = '';
      if (colDesc && row._desc_raw != null && String(row._desc_raw).trim() !== '') d = String(row._desc_raw).trim();
      else if (colCode && row._code != null) d = String(row._code).trim();

      const k = `${station}||${rawSn}`;
      const descFinal = ndfFlags[k] ? (d ? `[NDF] - ${d}` : '[NDF]') : d;
      let mappedSn = rawSn;
      if (useCustomerSnMapping) {
        mappedSn = row._customer_sn;
        if (mappedSn == null || String(mappedSn).trim() === '' || String(mappedSn).trim().toUpperCase() === 'N/A') {
          mappedSn = rawSn;
        }
      }

      ndfByMapped[`${station}||${String(mappedSn).trim()}`] = !!ndfFlags[k];
      if (!groups.has(descFinal)) groups.set(descFinal, []);
      groups.get(descFinal).push(mappedSn);
    }

    stationToGroups[station] = Array.from(groups.entries());
  }

  let modelVal = null;
  if (colModel) {
    const vals = dataRows.map((r) => r[colModel]).filter((v) => v != null).map((v) => String(v));
    if (vals.length) modelVal = vals[0].split('_')[0];
  }

  let woVal = null;
  if (colWo) {
    const freq = new Map();
    for (const row of detail) {
      const v = row[colWo];
      if (v == null) continue;
      const t = String(v).trim();
      freq.set(t, (freq.get(t) || 0) + 1);
    }
    if (freq.size) woVal = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  let lineVal = null;
  if (colLine) {
    const freq = new Map();
    for (const row of detail) {
      const v = row[colLine];
      if (v == null) continue;
      const t = String(v).trim();
      freq.set(t, (freq.get(t) || 0) + 1);
    }
    if (freq.size) lineVal = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  let buildQty = null;
  if (colInput && colProc) {
    const vals = [];
    for (const row of dataRows) {
      const ts = mapToTemplateStation(row[colProc]);
      if (templateStations.includes(ts) && row[colInput] != null) vals.push(Number(row[colInput]));
    }
    const valid = vals.filter((x) => Number.isFinite(x));
    if (valid.length) buildQty = Math.trunc(Math.max(...valid));
  }

  let startDate = '';
  let endDate = '';
  if (colTime) {
    const dates = [];
    for (const row of detail) {
      const d = parseDateYmd(row[colTime]);
      if (d) dates.push(d);
    }
    if (dates.length) {
      dates.sort();
      startDate = dates[0];
      endDate = dates[dates.length - 1];
    }
  }

  const percentKeys = ['failp', 'fpy', 'defectrate', 'rpy'];
  const [firstCol, lastCol] = getTableBoundsFromComp(ws, comp);

  function collectEntriesForStation(stationLabel, mode) {
    const entries = [];
    const groups = stationToGroups[stationLabel] || [];
    for (const [desc, sns] of groups) {
      const groupEntries = [];
      for (const sn of sns) {
        const key = `${stationLabel}||${String(sn).trim()}`;
        const isNdf = !!ndfByMapped[key];
        if ((mode === 'ndf' && isNdf) || (mode === 'real' && !isNdf)) {
          groupEntries.push({ sn, desc, is_ndf: isNdf });
        }
      }
      if (groupEntries.length) entries.push({ desc, items: groupEntries });
    }
    return entries;
  }

  function countEntriesByMode(mode) {
    let total = 0;
    for (const stationLabel of templateStations) {
      const groups = collectEntriesForStation(stationLabel, mode);
      for (const g of groups) total += g.items.length;
    }
    return total;
  }

  function lastRowCoveringNo(worksheet, headerRow, noCol) {
    let last = headerRow;
    const rowMax = worksheet.rowCount || worksheet.actualRowCount || headerRow;
    for (let r = headerRow + 1; r <= rowMax; r += 1) {
      const value = worksheet.getRow(r).getCell(noCol).value;
      if (value === null || value === undefined) continue;
      const text = String(getCellText(value)).trim();
      if (text === '') break;
      const num = Number(text);
      if (Number.isFinite(num) && num > 0) last = Math.max(last, r);
      else if (Number.isFinite(num)) continue;
      else break;
    }
    const mergedRanges = getMergedRanges(worksheet);
    for (const mr of mergedRanges) {
      if (mr.min_row <= last && last <= mr.max_row) last = Math.max(last, mr.max_row);
    }
    return last;
  }

  function writeHeaderAndYield(targetWs) {
    const rtyVal = productFromKpis(kpiByStation, 'fpy');
    const oayVal = productFromKpis(kpiByStation, 'rpy');
    const rtyCell = findLabelCell(targetWs, ['rty']);
    const oayCell = findLabelCell(targetWs, ['output accepted yield']);

    function writeLabelValue(labelCell, value) {
      if (!labelCell) return;
      const target = targetWs.getRow(labelCell.row).getCell(labelCell.col + 1);
      if (typeof value === 'number' && Number.isFinite(value)) {
        target.value = value;
        target.numFmt = '0.00%';
      } else {
        target.value = null;
      }
      target.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    writeLabelValue(rtyCell, rtyVal);
    writeLabelValue(oayCell, oayVal);

    let row1Cell = null;
    let row2Cell = null;
    const scanMaxCol = targetWs.columnCount || targetWs.actualColumnCount || 1;
    for (let r = 1; r <= 5; r += 1) {
      for (let c = 1; c <= scanMaxCol; c += 1) {
        const v = getCellText(getCellValue(targetWs, r, c));
        if (!row1Cell && v.includes('Model') && v.includes('Build')) row1Cell = { row: r, col: c };
        if (!row2Cell && v.includes('Date') && v.includes('Start') && v.includes('End')) row2Cell = { row: r, col: c };
      }
      if (row1Cell && row2Cell) break;
    }

    const reportDate = todayYmd();
    if (row1Cell) {
      const cell = targetWs.getRow(row1Cell.row).getCell(row1Cell.col);
      cell.value = rebuildLine1(cell.value, modelVal, woVal, lineVal, buildQty);
    }
    if (row2Cell) {
      const cell = targetWs.getRow(row2Cell.row).getCell(row2Cell.col);
      cell.value = rebuildLine2(cell.value, reportDate, startDate, endDate);
    }
  }

  function buildWorksheetByMode(targetWs, targetStationRows, mode) {
    const snCol = colIndex.sn;
    const descCol = colIndex.desc;
    const qtyCol = snCol ? snCol - 1 : null;
    const repairedCol = qtyCol ? qtyCol - 1 : null;
    const noCol = colIndex.no || firstCol;
    const remarkCol = colIndex.remark || lastCol;
    const stationMergeEndCol = colIndex.output || (repairedCol ? repairedCol - 1 : lastCol);
    const detailMergeStartCol = repairedCol || (colIndex.output ? colIndex.output + 1 : firstCol);
    const detailMergeEndCol = remarkCol;

    let offset = 0;

    for (const [baseRowIdx, stationLabel] of targetStationRows) {
      const rowIdx = baseRowIdx + offset;
      const kpi = kpiByStation[stationLabel];
      const descGroups = collectEntriesForStation(stationLabel, mode);
      const totalRowsNeeded = descGroups.reduce((sum, g) => sum + g.items.length, 0);
      const rowsNeeded = Math.max(1, totalRowsNeeded);

      if (rowsNeeded > 1) {
        const blankRows = new Array(rowsNeeded - 1).fill([]);
        targetWs.insertRows(rowIdx + 1, blankRows, 'n');
        offset += rowsNeeded - 1;
      }

      const noStart = rowIdx;
      const noEnd = rowIdx + rowsNeeded - 1;

      // KPI / station columns keep old behavior: merge by station block.
      for (let c = firstCol; c <= stationMergeEndCol; c += 1) {
        const topCell = targetWs.getRow(noStart).getCell(c);
        let wrote = false;
        if (c === colIndex.station) {
          topCell.value = stationLabel;
          wrote = true;
        }
        if (!wrote && kpi) {
          for (const key of ['input', 'failqty', 'failp', 'fpy', 'defectqty', 'defectrate', 'rpy', 'output']) {
            if (c !== colIndex[key]) continue;
            let val = kpi[key];
            if (percentKeys.includes(key)) val = toRatio(val);
            topCell.value = val;
            if (percentKeys.includes(key) && typeof val === 'number' && Number.isFinite(val)) topCell.numFmt = '0.00%';
            wrote = true;
            break;
          }
        }
        if (noEnd > noStart) safeMergeCells(targetWs, noStart, c, noEnd, c);
        topCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }

      if (!snCol || !descCol) continue;

      if (!totalRowsNeeded) {
        for (let c = detailMergeStartCol; c <= detailMergeEndCol; c += 1) {
          setCellBlankWithStyle(targetWs.getRow(noStart).getCell(c));
        }
        continue;
      }

      let curr = noStart;
      for (const group of descGroups) {
        const groupStart = curr;
        const groupEnd = curr + group.items.length - 1;

        for (const it of group.items) {
          const snCell = targetWs.getRow(curr).getCell(snCol);
          snCell.value = String(it.sn);
          snCell.alignment = { wrapText: true, vertical: 'top' };
          snCell.font = { name: FONT_NAME, size: FONT_SIZE };
          curr += 1;
        }

        for (let c = detailMergeStartCol; c <= detailMergeEndCol; c += 1) {
          if (c === snCol) continue; // SN码 must never be merged.
          const topCell = targetWs.getRow(groupStart).getCell(c);

          if (c === qtyCol) {
            topCell.value = group.items.length;
          } else if (c === repairedCol) {
            topCell.value = null;
          } else if (c === descCol) {
            topCell.value = String(group.desc);
            if (isNdfDescription(group.desc)) applyCellFill(topCell, NDF_FILL);
          } else {
            topCell.value = null;
          }

          topCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          topCell.font = { name: FONT_NAME, size: FONT_SIZE };
          if (groupEnd > groupStart) safeMergeCells(targetWs, groupStart, c, groupEnd, c);
        }
      }
    }

    writeHeaderAndYield(targetWs);

    const minRow = headerRowIdx;
    const maxTableRow = lastRowCoveringNo(targetWs, headerRowIdx, noCol);

    applyTableGridRespectingMerges(targetWs, minRow, maxTableRow, noCol, remarkCol);
    unifyFontTable(targetWs, minRow, maxTableRow, noCol, remarkCol, FONT_NAME, FONT_SIZE);
  }

  const ndfWs = cloneWorksheet(wb, ws, '__NDF_TEMP__');
  const mainStationRows = stationRows.map(([r, station]) => [r, station]);
  const ndfStationRows = stationRows.map(([r, station]) => [r, station]);

  buildWorksheetByMode(ws, mainStationRows, 'real');
  buildWorksheetByMode(ndfWs, ndfStationRows, 'ndf');

  for (const w of wb.worksheets) w.state = 'visible';

  let woEff = woVal || 'WO';
  let buildEff = buildQty == null ? '' : String(buildQty);
  const ndfQty = countEntriesByMode('ndf');
  const mainSheetBaseName = buildEff.trim() ? `${woEff} (${buildEff}pieces)` : woEff;
  const ndfSheetBaseName = `${woEff} NDF (${ndfQty}pieces)`;
  const singleSheetPrefix = getSingleSheetPrefix(options);
  const mainSheetName = buildPrefixedSheetName(singleSheetPrefix, mainSheetBaseName);
  const ndfSheetName = buildPrefixedSheetName(singleSheetPrefix, ndfSheetBaseName);

  const keepIds = new Set([ws.id, ndfWs.id]);
  for (const w of [...wb.worksheets]) {
    if (!keepIds.has(w.id)) wb.removeWorksheet(w.id);
  }

  ws.name = mainSheetName;
  ndfWs.name = ndfSheetName;

  try {
    await wb.xlsx.writeFile(outputPath);
  } catch (e) {
    throw new Error(`Cannot write output file: ${e.message}`);
  }
  return [outputPath, ws.name, ndfWs.name];
}


function sanitizeExcelSheetName(name, fallback = 'Sheet') {
  let s = String(name || fallback).trim();
  s = s.replace(/[:\\/?*\[\]]/g, '_');
  s = s.replace(/\s+/g, ' ').trim();
  if (!s) s = fallback;
  if (s.length > 31) {
    const withoutPieces = s.replace(/\s*\(\s*\d+\s*pieces\s*\)/ig, '').trim();
    if (withoutPieces) s = withoutPieces;
  }
  if (s.length > 31) s = s.slice(0, 31).trim();
  return s || fallback;
}

function makeUniqueSheetName(workbook, desiredName) {
  const existing = new Set(workbook.worksheets.map((ws) => String(ws.name).toLowerCase()));
  let base = sanitizeExcelSheetName(desiredName, 'Sheet');
  let name = base;
  let idx = 2;
  while (existing.has(name.toLowerCase())) {
    const suffix = `_${idx}`;
    const cut = Math.max(1, 31 - suffix.length);
    name = `${base.slice(0, cut).trim()}${suffix}`;
    idx += 1;
  }
  return name;
}

function buildPrefixedSheetName(prefix, originalName) {
  const p = String(prefix || '').trim();
  const base = String(originalName || '').trim();
  return sanitizeExcelSheetName(p ? `${p} ${base}` : base, base || 'Sheet');
}

function getSingleSheetPrefix(options) {
  if (!options || typeof options !== 'object') return '';
  if (typeof options.sheetPrefix === 'string') return options.sheetPrefix.trim();
  if (Array.isArray(options.sheetPrefixes) && options.sheetPrefixes[0] && typeof options.sheetPrefixes[0] === 'object') {
    return String(options.sheetPrefixes[0].prefix || '').trim();
  }
  return '';
}

function stationNormForMerge(value) {
  return normalizeBaseForMatching(extractBaseName(normalizeStation(String(value || '').trim())));
}

function stationMatchesProcessForMerge(selectedStation, processName) {
  const a = stationNormForMerge(selectedStation);
  const b = stationNormForMerge(processName);
  return !!a && !!b && a === b;
}

function getProcessNamesFromDataFile(dataPath) {
  try {
    const rows = readSheetRows(dataPath, 'Data');
    if (!rows.length) return [];
    const norm = {};
    for (const c of Object.keys(rows[0])) norm[normText(c)] = c;
    const colProc = getCol(norm, ['PROCESS_NAME']);
    if (!colProc) return [];
    return [...new Set(rows.map((row) => String(row[colProc] || '').trim()).filter(Boolean))];
  } catch (_) {
    return [];
  }
}

function filterSelectedStationsForDataFile(dataPath, selectedStations) {
  const selected = Array.isArray(selectedStations) ? selectedStations : [];
  if (!selected.length) return selected;
  const processNames = getProcessNamesFromDataFile(dataPath);
  if (!processNames.length) return selected;
  const matched = selected.filter((station) => processNames.some((proc) => stationMatchesProcessForMerge(station, proc)));
  return matched.length ? matched : selected;
}

async function buildMergedReport(dataPaths, templatePath, outputPath, options = {}) {
  if (!Array.isArray(dataPaths) || dataPaths.length === 0) {
    throw new Error('buildMergedReport requires at least one data file.');
  }
  if (!(typeof outputPath === 'string' || outputPath instanceof Buffer || outputPath instanceof URL)) {
    throw new Error('Invalid outputPath: buildMergedReport requires a valid output file path.');
  }

  const finalWb = new ExcelJS.Workbook();
  finalWb.creator = 'CloudMetrics';
  finalWb.created = new Date();
  finalWb.modified = new Date();

  const sheetPrefixes = Array.isArray(options.sheetPrefixes) ? options.sheetPrefixes : [];
  const originalFileNames = Array.isArray(options.originalFileNames) ? options.originalFileNames : [];
  const outputDir = path.dirname(String(outputPath));
  const tempDir = fs.mkdtempSync(path.join(outputDir || process.cwd(), '.clca_merge_'));
  const tempOutputs = [];
  const finalSheetNames = [];

  try {
    for (let i = 0; i < dataPaths.length; i += 1) {
      const dataPath = dataPaths[i];
      const tempOutput = path.join(tempDir, `clca_part_${i}_${Date.now()}.xlsx`);
      tempOutputs.push(tempOutput);

      const prefixEntry = sheetPrefixes[i] || {};
      const originalName = originalFileNames[i] || path.basename(String(dataPath));
      const prefix = (prefixEntry && typeof prefixEntry === 'object') ? String(prefixEntry.prefix || '').trim() : '';
      const perFileStations = filterSelectedStationsForDataFile(dataPath, options.selectedStations);

      await buildReport(dataPath, templatePath, tempOutput, {
        selectedStations: perFileStations,
        useCustomerSnMapping: !!options.useCustomerSnMapping,
        use_customer_sn_mapping: !!options.useCustomerSnMapping,
      });

      const partWb = new ExcelJS.Workbook();
      await partWb.xlsx.readFile(tempOutput);
      if (!partWb.worksheets.length) {
        throw new Error(`Generated workbook has no sheets: ${originalName}`);
      }

      const mainSource = partWb.worksheets[0];
      if (!mainSource || !mainSource.name) {
        throw new Error(`Generated main sheet is invalid for: ${originalName}`);
      }
      const ndfSource = partWb.worksheets[1] || null;

      const mainName = makeUniqueSheetName(finalWb, buildPrefixedSheetName(prefix, mainSource.name));
      const mainTarget = cloneWorksheet(finalWb, mainSource, mainName);
      if (!mainTarget) throw new Error(`Failed to clone main sheet for: ${originalName}`);
      mainTarget.properties = Object.assign({}, mainTarget.properties || {}, { tabColor: { argb: 'FFFFFF00' } });
      finalSheetNames.push(mainName);

      if (ndfSource && ndfSource.name) {
        const ndfName = makeUniqueSheetName(finalWb, buildPrefixedSheetName(prefix, ndfSource.name));
        cloneWorksheet(finalWb, ndfSource, ndfName);
        finalSheetNames.push(ndfName);
      }
    }

    await finalWb.xlsx.writeFile(outputPath);
    return [outputPath, finalSheetNames];
  } finally {
    for (const fp of tempOutputs) {
      try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch (_) {}
    }
    try { if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir); } catch (_) {}
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
    args[name] = value;
    if (value !== true) i += 1;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.data || !args.template || !args.output) {
    console.error('Usage: node clca_vo0301_report_v13v2.js --data <clca test WO.xls> --template <template.xlsx> --output <report.xlsx>');
    process.exit(1);
  }

  const dataPath = path.resolve(String(args.data));
  const templatePath = path.resolve(String(args.template));
  const outputPath = path.resolve(String(args.output));

  for (const p of [dataPath, templatePath]) {
    if (!fs.existsSync(p)) throw new Error(`Input file not found: ${p}`);
  }

  const [outPath, sheetName] = await buildReport(dataPath, templatePath, outputPath);
  console.log(`Done. Output: ${outPath}\n Sheet: ${sheetName}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  });
}

module.exports = { buildReport, buildMergedReport };
