// CLCA routes
'use strict';

const { getStationConfig } = require('../modules/clca/stationConfig');
const { getBuildReport, getBuildMergedReport, FIXED_TEMPLATE, enginePath } = require('../modules/clca/reportEngine');
const { spawn } = require('child_process');



const fs = require('fs');
const path = require('path');
const { inspectClcaFile } = require('../services/clcaPrecheck.service');

module.exports = function createClcaRoutes(context) {
  const router = require('express').Router();
  const { upload, cleanupFiles, UPLOAD_DIR } = context;
  const GRR_PREP_SCRIPT = path.resolve(context.rootDir || process.cwd(), 'GRR prep module', 'grr-prepare.js');

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
    const separateNdf = String(req.body.separate_ndf || '').toLowerCase() !== 'false';
    const preparedBy = String(req.body.prepared_by || '').trim();
    const stage = String(req.body.stage || '').trim();
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
      reportPromise = getBuildMergedReport()(dataPaths, FIXED_TEMPLATE, outputPath, { selectedStations, useCustomerSnMapping, sheetPrefixes, originalFileNames: dataFiles.map((file) => file.originalname), separateNdf, preparedBy, stage });
    } else {
      const sheetPrefix = sheetPrefixes && sheetPrefixes[0] && typeof sheetPrefixes[0] === 'object' ? String(sheetPrefixes[0].prefix || '').trim() : '';
      reportPromise = getBuildReport()(dataPaths[0], FIXED_TEMPLATE, mappingPath, outputPath, { selectedStations, useCustomerSnMapping, sheetPrefix, sheetPrefixes, separateNdf, preparedBy, stage });
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

    // Use strict, case-insensitive string match
    const { stations: masterStations } = getStationConfig();

    const matched = new Set();
    const unmatched = [];

    for (const pn of processNames) {
      const pnLower = String(pn || '').trim().toLowerCase();
      let found = false;
      for (const ms of masterStations) {
        if (String(ms || '').trim().toLowerCase() === pnLower) {
          matched.add(ms);
          found = true;
          break;
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


// ---- GET /api/stations (overridden from duplicate) ----
router.get('/api/stations', (_req, res) => {
  try {
    const cfg = getStationConfig();
    res.json({ success: true, stations: cfg.stations, presets: cfg.presets });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/api/stations', (req, res) => {
  try {
    const { stations } = req.body;
    if (!Array.isArray(stations)) return res.status(400).json({ success: false, error: 'stations must be an array' });
    const cleanStations = stations.map(s => String(s || '').trim()).filter(Boolean);
    
    const { STATIONS_JSON_PATH, clearStationConfigCache } = require('../modules/clca/stationConfig');
    
    let existingPresets = {};
    try {
      if (fs.existsSync(STATIONS_JSON_PATH)) {
        const existing = JSON.parse(fs.readFileSync(STATIONS_JSON_PATH, 'utf8'));
        existingPresets = existing.presets || {};
      }
    } catch (_) {}
    
    const stationSet = new Set(cleanStations);
    const filteredPresets = {};
    for (const [k, v] of Object.entries(existingPresets)) {
      if (Array.isArray(v)) filteredPresets[k] = v.filter(s => stationSet.has(s));
    }
    
    const newConfig = { stations: cleanStations, presets: filteredPresets };
    fs.writeFileSync(STATIONS_JSON_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
    clearStationConfigCache(); // invalidate cache
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function buildGrrFinalOutputPath(rawOutputPath, originalInputName) {
  const inputBase = path.basename(String(originalInputName || '').trim() || 'input.csv');
  const inputNameNoExt = path.parse(inputBase).name || 'input';
  const safeInputName = inputNameNoExt.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'input';
  const finalFileName = `${safeInputName} Final.csv`;
  const requested = String(rawOutputPath || '').trim();
  if (!requested) return path.join(UPLOAD_DIR, finalFileName);
  const outputHasExt = Boolean(path.parse(requested).ext);
  const outputDir = outputHasExt ? path.dirname(requested) : requested;
  return path.join(outputDir || UPLOAD_DIR, finalFileName);
}

function moveFileOverwrite(sourcePath, targetPath) {
  if (path.resolve(sourcePath) === path.resolve(targetPath)) return;
  if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
  try { fs.renameSync(sourcePath, targetPath); } 
  catch (error) {
    if (error && error.code === 'EXDEV') {
      fs.copyFileSync(sourcePath, targetPath);
      fs.unlinkSync(sourcePath);
      return;
    }
    throw error;
  }
}

router.post('/api/generate/grrprep', upload.fields([
  { name: 'data', maxCount: 1 },
]), async (req, res) => {
  const tempPaths = [];
  let generatedTempPath = '';
  try {
    if (!req.files || !req.files.data || !req.files.data[0]) return res.status(400).json({ success: false, error: 'Missing Data file.' });
    if (!fs.existsSync(GRR_PREP_SCRIPT)) return res.status(500).json({ success: false, error: 'GRR prep script not found on server.' });
    const uploadFile = req.files.data[0];
    const dataPath = uploadFile.path;
    tempPaths.push(dataPath);
    const finalOutputPath = buildGrrFinalOutputPath(req.body.output_path, uploadFile.originalname);
    fs.mkdirSync(path.dirname(finalOutputPath), { recursive: true });
    
    const { stdout: stdoutStr, stderr: stderrStr } = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [GRR_PREP_SCRIPT, dataPath], { windowsHide: true });
      let stdout = ''; let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
      child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
      const timer = setTimeout(() => { child.kill(); reject(new Error('GRR prep timed out after 180 seconds.')); }, 180_000);
      child.on('error', (err) => { clearTimeout(timer); reject(new Error(`Failed to run GRR prep script: ${err.message || err}`)); });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) reject(new Error(stderr.trim() || stdout.trim() || `GRR prep exited with code ${code}`));
        else resolve({ stdout, stderr });
      });
    });

    const parsedInput = path.parse(dataPath);
    generatedTempPath = path.join(parsedInput.dir, `${parsedInput.name} Final${parsedInput.ext || '.csv'}`);
    if (!fs.existsSync(generatedTempPath)) throw new Error('GRR prep completed but output file was not found.');
    moveFileOverwrite(generatedTempPath, finalOutputPath);
    cleanupFiles(tempPaths);

    let stats = null;
    const statsLine = stdoutStr.split(/\r?\n/).find((l) => l.startsWith('GRR_STATS:'));
    if (statsLine) { try { stats = JSON.parse(statsLine.slice('GRR_STATS:'.length)); } catch (_) {} }
    return res.json({ success: true, output_path: finalOutputPath, message: 'GRR prep generated successfully!', stats });
  } catch (err) {
    cleanupFiles(tempPaths);
    if (generatedTempPath && fs.existsSync(generatedTempPath)) { try { fs.unlinkSync(generatedTempPath); } catch (_) { } }
    return res.status(500).json({ success: false, error: String(err.message || err) });
  }
});

router.post('/api/browse-save', (req, res) => {
  try {
    const body = req.body || {};
    const defaultFileName = String(body.defaultFileName || '').trim() || 'CLCA_Report.xlsx';
    const psScript = [
      'Add-Type -AssemblyName System.Windows.Forms;',
      'Add-Type -AssemblyName System.Drawing;',
      '$owner = New-Object System.Windows.Forms.Form;',
      '$owner.TopMost = $true;',
      '$owner.ShowInTaskbar = $false;',
      '$owner.Opacity = 0;',
      '$owner.Size = New-Object System.Drawing.Size(1,1);',
      '$owner.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual;',
      '$owner.Location = New-Object System.Drawing.Point(-32000,-32000);',
      '$owner.Show();',
      '$owner.BringToFront() | Out-Null;',
      `$defaultName = '${defaultFileName.replace(/'/g, "''")}';`,
      '$selectedPath = "";',
      '$dlg = New-Object System.Windows.Forms.SaveFileDialog;',
      '$dlg.Title = "Save CLCA Report As...";',
      '$dlg.DefaultExt = "xlsx";',
      '$dlg.Filter = "Excel Workbook (*.xlsx)|*.xlsx|All Files (*.*)|*.*";',
      '$dlg.AddExtension = $true;',
      '$dlg.OverwritePrompt = $true;',
      '$dlg.RestoreDirectory = $true;',
      '$dlg.FileName = $defaultName;',
      '$result = $dlg.ShowDialog($owner);',
      'if ($result -eq [System.Windows.Forms.DialogResult]::OK) { $selectedPath = $dlg.FileName }',
      '$owner.Close();',
      '$owner.Dispose();',
      'if ($selectedPath) { Write-Output $selectedPath } else { Write-Output "" }',
    ].join(' ');

    const proc = spawn('powershell', ['-NoProfile', '-STA', '-Command', psScript], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = ''; let stderr = ''; let settled = false;
    const finish = (statusCode, payload) => { if (settled) return; settled = true; res.status(statusCode).json(payload); };
    const timeoutId = setTimeout(() => { try { proc.kill(); } catch (_) {} finish(504, { error: 'Browse dialog timeout', path: null }); }, 20000);
    proc.stdout.on('data', (chunk) => { stdout += String(chunk || ''); });
    proc.stderr.on('data', (chunk) => { stderr += String(chunk || ''); });
    proc.on('error', (error) => { clearTimeout(timeoutId); finish(500, { error: String(error.message || error), path: null }); });
    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      if (settled) return;
      if (code !== 0) return finish(500, { error: `Browse dialog failed (code ${code}): ${stderr}`, path: null });
      finish(200, { success: true, path: stdout.trim() || null });
    });
  } catch (error) {
    res.status(500).json({ error: String(error.message || error), path: null });
  }
});

  return router;
};
