// CLCA routes
'use strict';

const fs = require('fs');
const path = require('path');
const { inspectClcaFile } = require('../services/clcaPrecheck.service');

module.exports = function createClcaRoutes(context) {
  const router = require('express').Router();
  const { upload, cleanupFiles, getStationConfig, getBuildReport, getBuildMergedReport, FIXED_TEMPLATE, UPLOAD_DIR, enginePath } = context;

// ---- POST /api/generate ----
router.post('/api/generate', upload.fields([
  { name: 'data',     maxCount: 20 },
  { name: 'mapping',  maxCount: 1 },
]), async (req, res) => {
  const tempPaths = [];
  try {
    if (!req.files || !req.files.data || !req.files.data.length) return res.status(400).json({ success: false, error: 'Missing Data file.' });
    if (!fs.existsSync(FIXED_TEMPLATE)) return res.status(500).json({ success: false, error: 'Built-in template file not found on server.' });
    const dataFiles = req.files.data || [];
    const dataPaths = dataFiles.map((file) => file.path);
    dataPaths.forEach((fp) => tempPaths.push(fp));
    const mappingPath = req.files.mapping ? req.files.mapping[0].path : null;
    if (mappingPath) tempPaths.push(mappingPath);
    const mergeAllWo = String(req.body.merge_all_wo || req.body.mergeAllWo || '').toLowerCase() === 'true';
    if (!mergeAllWo && dataPaths.length > 1) {
      cleanupFiles(tempPaths);
      return res.status(400).json({ success: false, error: 'Multiple files require "Export merged file".' });
    }
    let selectedStations = [];
    try {
      const raw = req.body.selected_stations;
      if (typeof raw === 'string') selectedStations = JSON.parse(raw);
      else if (Array.isArray(raw)) selectedStations = raw;
    } catch (_) {}
    if (!Array.isArray(selectedStations) || selectedStations.length === 0) {
      cleanupFiles(tempPaths);
      return res.status(400).json({ success: false, error: 'No stations selected.' });
    }
    const { stations: masterStations } = getStationConfig();
    const invalid = selectedStations.filter((s) => !masterStations.includes(s));
    if (invalid.length) console.warn(`[Generate] Unknown stations ignored: ${invalid.join(', ')}`);
    selectedStations = selectedStations.filter((s) => masterStations.includes(s));
    if (!selectedStations.length) {
      cleanupFiles(tempPaths);
      return res.status(400).json({ success: false, error: 'None of the selected stations are valid.' });
    }
    const useCustomerSnMapping = String(req.body.use_customer_sn_mapping || req.body.useCsnMapping || '').toLowerCase() === 'true';
    let outputPath = String(req.body.output_path || '').trim();
    const returnFile = !outputPath;
    if (!outputPath) outputPath = path.join(UPLOAD_DIR, `CLCA_Report_${Date.now()}.xlsx`);
    if (!outputPath.toLowerCase().endsWith('.xlsx')) outputPath += '.xlsx';
    const outputDir = path.dirname(outputPath);
    if (outputDir) fs.mkdirSync(outputDir, { recursive: true });
    let sheetPrefixes = [];
    try {
      const rawPrefixes = req.body.sheet_prefixes;
      if (typeof rawPrefixes === 'string' && rawPrefixes.trim()) sheetPrefixes = JSON.parse(rawPrefixes);
      else if (Array.isArray(rawPrefixes)) sheetPrefixes = rawPrefixes;
    } catch (_) { sheetPrefixes = []; }
    console.log(`[Generate] data_count=${dataPaths.length}, merge_all_wo=${mergeAllWo}, output=${outputPath}`);
    const REPORT_TIMEOUT = 120_000;
    let reportPromise;
    if (mergeAllWo) {
      reportPromise = getBuildMergedReport()(dataPaths, FIXED_TEMPLATE, outputPath, { selectedStations, useCustomerSnMapping, sheetPrefixes, originalFileNames: dataFiles.map((file) => file.originalname) });
    } else {
      const sheetPrefix = sheetPrefixes && sheetPrefixes[0] && typeof sheetPrefixes[0] === 'object' ? String(sheetPrefixes[0].prefix || '').trim() : '';
      reportPromise = getBuildReport()(dataPaths[0], FIXED_TEMPLATE, mappingPath, outputPath, { selectedStations, useCustomerSnMapping, sheetPrefix, sheetPrefixes });
    }
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Report generation timed out (>120 s).')), REPORT_TIMEOUT));
    console.log('[Generate][DEBUG] mergeAllWo=', mergeAllWo);
console.log('[Generate][DEBUG] dataPaths=', dataPaths);
console.log('[Generate][DEBUG] sheetPrefixes=', JSON.stringify(sheetPrefixes));
console.log('[Generate][DEBUG] selectedStations=', JSON.stringify(selectedStations));
console.log('[Generate][DEBUG] enginePath=', enginePath);
    const result = await Promise.race([reportPromise, timeoutPromise]);
    const resultPath = Array.isArray(result) ? result[0] : outputPath;
    const sheetName = Array.isArray(result) ? result[1] : '';
    const sheets = mergeAllWo && Array.isArray(result) ? (result[1] || []) : [];
    cleanupFiles(tempPaths);
    if (returnFile) {
      res.set('X-Sheet-Name', Array.isArray(sheetName) ? sheetName.join(', ') : (sheetName || ''));
      res.set('Access-Control-Expose-Headers', 'X-Sheet-Name');
      res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.set('Content-Disposition', `attachment; filename="${path.basename(resultPath)}"`);
      return res.sendFile(path.resolve(resultPath), () => { try { fs.unlinkSync(resultPath); } catch (_) {} });
    }
    return res.json({ success: true, mode: mergeAllWo ? 'merged_clca' : 'single_clca', output_path: resultPath, sheet_name: Array.isArray(sheetName) ? sheetName.join(', ') : sheetName, sheets, message: mergeAllWo ? 'Merged CLCA report generated successfully!' : 'CLCA report generated successfully!' });
  } catch (err) {
    cleanupFiles(tempPaths);
    const stack = err && err.stack ? err.stack : String(err);
    const shortTrace = stack.split('\n').slice(0, 4).join(' | ');
    console.error(`[ERROR] ${stack}`);
    return res.status(500).json({ success: false, error: String(err.message || err), traceback: shortTrace });
  }
});


  // ---- POST /api/clca/precheck – validate uploaded CLCA Data file before Generate ----
  router.post('/api/clca/precheck', upload.fields([{ name: 'data', maxCount: 1 }]), (req, res) => {
    const tempPaths = [];
    try {
      if (!req.files || !req.files.data || !req.files.data[0]) {
        return res.status(400).json({ success: false, error: 'Missing Data file.' });
      }
      const dataPath = req.files.data[0].path;
      tempPaths.push(dataPath);
      let selectedStations = [];
      try {
        const raw = req.body.selected_stations;
        if (typeof raw === 'string' && raw.trim()) selectedStations = JSON.parse(raw);
        else if (Array.isArray(raw)) selectedStations = raw;
      } catch (_) { selectedStations = []; }
      const result = inspectClcaFile(dataPath, selectedStations);
      cleanupFiles(tempPaths);
      return res.json({ success: true, file: req.files.data[0].originalname, ...result });
    } catch (err) {
      cleanupFiles(tempPaths);
      return res.status(500).json({ success: false, error: String(err.message || err) });
    }
  });

// ---- GET /api/stations – return master station list + presets ----
router.get('/api/stations', (_req, res) => {
  const { stations, presets } = getStationConfig();
  res.json({ stations, presets });
});

// ---- POST /api/inspect-model – read MODEL_NAME from uploaded data file ----
router.post('/api/inspect-model', upload.fields([{ name: 'data', maxCount: 1 }]), (req, res) => {
  const tempPaths = [];
  try {
    if (!req.files || !req.files.data) {
      return res.status(400).json({ success: false, error: 'Missing Data file.' });
    }
    const dataPath = req.files.data[0].path;
    tempPaths.push(dataPath);

    const XLSX = require('xlsx');
    const wb = XLSX.readFile(dataPath, { sheetRows: 2, raw: true });
    const ws = wb.Sheets['Data'];
    if (!ws) {
      cleanupFiles(tempPaths);
      return res.status(400).json({ success: false, error: 'Missing "Data" sheet in file.' });
    }
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
    if (!rows.length) {
      cleanupFiles(tempPaths);
      return res.status(400).json({ success: false, error: 'Data sheet is empty.' });
    }
    // Find MODEL_NAME column (case-insensitive, trimmed)
    const firstRow = rows[0];
    const colKey = Object.keys(firstRow).find((k) => k.trim().toUpperCase() === 'MODEL_NAME');
    if (!colKey) {
      cleanupFiles(tempPaths);
      return res.status(400).json({ success: false, error: 'MODEL_NAME column not found in Data sheet.' });
    }
    const modelVal = rows.map((r) => r[colKey]).filter((v) => v != null).map((v) => String(v).trim()).find((v) => v);
    cleanupFiles(tempPaths);
    if (!modelVal) {
      return res.status(400).json({ success: false, error: 'MODEL_NAME column is empty.' });
    }
    return res.json({ success: true, model: modelVal });
  } catch (err) {
    cleanupFiles(tempPaths);
    return res.status(500).json({ success: false, error: String(err.message || err) });
  }
});

// ---- POST /api/inspect-stations – detect which Station.txt entries match the data file ----
router.post('/api/inspect-stations', upload.fields([{ name: 'data', maxCount: 1 }]), (req, res) => {
  const tempPaths = [];
  try {
    if (!req.files || !req.files.data) {
      return res.status(400).json({ success: false, error: 'Missing Data file.' });
    }
    const dataPath = req.files.data[0].path;
    tempPaths.push(dataPath);

    const XLSX = require('xlsx');
    const wb = XLSX.readFile(dataPath, { raw: true });

    // Collect unique PROCESS_NAME values from "data" and "detail" sheets
    const processNames = new Set();
    for (const sheetName of ['data', 'Data', 'detail', 'Detail']) {
      const ws = wb.Sheets[sheetName];
      if (!ws) continue;
      const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
      if (!rows.length) continue;
      const colKey = Object.keys(rows[0]).find((k) => k.trim().toUpperCase() === 'PROCESS_NAME');
      if (!colKey) continue;
      for (const row of rows) {
        const val = row[colKey];
        if (val != null && String(val).trim()) processNames.add(String(val).trim());
      }
    }

    cleanupFiles(tempPaths);

    if (!processNames.size) {
      return res.json({ success: true, matched: [], unmatched: [] });
    }

    // Use the same matching logic as the report engine
    const { stations: masterStations } = getStationConfig();

    function extractBaseName(s) { return String(s || '').trim().replace(/^FATP[_\s]*/i, ''); }
    function normalizeBase(s) { return String(s || '').trim().toUpperCase().replace(/[_\-\s]+/g, '').toLowerCase(); }

    const matched = new Set();
    const unmatched = [];

    for (const pn of processNames) {
      const baseName = extractBaseName(pn);
      const norm = normalizeBase(baseName);
      let found = false;
      for (const ms of masterStations) {
        if (normalizeBase(extractBaseName(ms)) === norm) { matched.add(ms); found = true; break; }
      }
      if (!found) {
        // Leak Test fallback
        const leakNorm = pn.toLowerCase().replace(/[ _]/g, '');
        if (leakNorm.includes('leaktest')) {
          const dm = leakNorm.match(/leaktest(\d*)/);
          const dn = dm ? dm[1] : '';
          for (const ms of masterStations) {
            const tsNorm = ms.toLowerCase().replace(/[ _]/g, '');
            if (!tsNorm.includes('leaktest')) continue;
            const tm = tsNorm.match(/leaktest(\d*)/);
            const tn = tm ? tm[1] : '';
            if (tn === dn || (dn === '' && tn === '01') || (tn === '' && dn === '01')) {
              matched.add(ms); found = true; break;
            }
          }
        }
      }
      if (!found) unmatched.push(pn);
    }

    return res.json({
      success: true,
      matched: masterStations.filter((s) => matched.has(s)),
      unmatched,
    });
  } catch (err) {
    cleanupFiles(tempPaths);
    return res.status(500).json({ success: false, error: String(err.message || err) });
  }
});

  return router;
};
