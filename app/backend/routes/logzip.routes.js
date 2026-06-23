// Log ZIP download routes
'use strict';

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const {
  getQuickLogCore,
  resolveQuickLogLocalStationForServer,
} = require('../modules/quicklog/configReader');

module.exports = function createLogZipRoutes(context = {}) {
  const router = require('express').Router();

  function quickLogModelRootName(value) {
    const raw = String(value || '').trim();
    return raw.includes('_') ? raw.split('_')[0] : raw;
  }

  function getRowStation(row) {
    return String(
      (row && (row.terminal || row.process || row.Station || row.Terminal ||
        row.TerminalName || row.ProcessName)) || ''
    ).trim();
  }

  function getRowModel(row) {
    return quickLogModelRootName(
      (row && (row.modelRoot || row.modelNo || row.Model || row.ModelName ||
        row._QuickLogModel)) || 'VO0301'
    ) || 'VO0301';
  }

  function getRowSn(row) {
    return String(
      (row && (row.serialNumber || row.SN || row.SerialNumber ||
        row.customerSN || row.CSN)) || ''
    ).trim();
  }

  /**
   * Normalize a Defect Daily R001 row to the format expected by findMesTraceLogFile.
   * R001 fields:  SerialNumber, Terminal, defectTime, ModelName, WorkOrder, DefectCode, etc.
   * MES Trace fields: serialNumber, terminal, time, modelNo, result, etc.
   */
  function normalizeR001Row(row) {
    if (!row) return row;
    return {
      ...row,
      serialNumber: row.SerialNumber || row.serialNumber || row.SN || '',
      terminal: row.Terminal || row.terminal || row.Station || '',
      process: row.Process || row.process || '',
      time: row.defectTime || row.time || row.Time || '',
      modelNo: row.ModelName || row.modelNo || row.Model || '',
      modelRoot: quickLogModelRootName(row.ModelName || row.modelNo || row.Model || ''),
      result: 'FAIL',
      workOrder: row.WorkOrder || row.workOrder || row.WO || '',
    };
  }

  /**
   * Try to find the log file path for a single row.
   * Returns { found: true, filePath, fileName } or { found: false, sn, station, reason }.
   */
  function resolveLogFileForRow(row, source) {
    const normalized = source === 'defectDaily' ? normalizeR001Row(row) : row;
    const sn = getRowSn(normalized);
    const station = getRowStation(normalized);
    const model = getRowModel(normalized);

    if (!sn) return { found: false, sn: '(empty)', station, reason: 'Missing SN' };

    try {
      const resolved = resolveQuickLogLocalStationForServer(model, station);
      if (!resolved.allowed) {
        return { found: false, sn, station, reason: `Station not configured: ${resolved.reason || 'unknown'}` };
      }

      const localStationCandidates = Array.isArray(resolved.localStations) && resolved.localStations.length
        ? resolved.localStations
        : [resolved.localStation || station];

      const core = getQuickLogCore();
      const rowForFind = {
        ...normalized,
        _QuickLogLocalStation: localStationCandidates[0],
        _QuickLogLocalStationCandidates: localStationCandidates,
      };

      const found = core.findMesTraceLogFile(rowForFind, { localStationCandidates });

      if (!found.success) {
        return { found: false, sn, station, reason: found.error || 'Log file not found on server' };
      }

      // Build a clean filename for inside the ZIP
      const safeStation = station.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${sn}_${safeStation}.txt`;

      return { found: true, filePath: found.path, fileName, sn, station };
    } catch (err) {
      return { found: false, sn, station, reason: String(err.message || err) };
    }
  }

  // ---- POST /api/logs/download-zip ----
  router.post('/api/logs/download-zip', async (req, res) => {
    try {
      const body = req.body || {};
      const rows = Array.isArray(body.rows) ? body.rows : [];
      const source = String(body.source || 'mesTrace').trim();

      if (!rows.length) {
        return res.status(400).json({ success: false, error: 'No rows provided.' });
      }

      // Resolve log files for all rows
      const foundFiles = [];
      const missingFiles = [];

      for (const row of rows) {
        const result = resolveLogFileForRow(row, source);
        if (result.found) {
          // Verify file actually exists on disk
          if (fs.existsSync(result.filePath)) {
            foundFiles.push(result);
          } else {
            missingFiles.push({ sn: result.sn, station: result.station, reason: 'File path resolved but file does not exist on disk' });
          }
        } else {
          missingFiles.push(result);
        }
      }

      if (!foundFiles.length && missingFiles.length) {
        return res.status(404).json({
          success: false,
          error: 'No log files found for any of the provided rows.',
          found: [],
          missing: missingFiles.map(m => ({ sn: m.sn, station: m.station, reason: m.reason })),
        });
      }

      // Build ZIP filename: "FAIL Log MM.DD.zip"
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const zipFileName = `FAIL Log ${mm}.${dd}.zip`;

      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
      res.setHeader('Access-Control-Expose-Headers', 'X-Download-Report');

      // Build report data and attach as header (base64)
      const report = {
        timestamp: now.toISOString(),
        totalRequested: rows.length,
        foundCount: foundFiles.length,
        missingCount: missingFiles.length,
        found: foundFiles.map(f => ({ sn: f.sn, station: f.station, fileName: f.fileName })),
        missing: missingFiles.map(m => ({ sn: m.sn, station: m.station, reason: m.reason })),
      };
      const reportBase64 = Buffer.from(JSON.stringify(report), 'utf8').toString('base64');
      res.setHeader('X-Download-Report', reportBase64);

      // Create ZIP archive stream
      const archive = archiver('zip', { zlib: { level: 6 } });
      archive.on('error', (err) => {
        console.error('[LOG ZIP ERROR]', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: String(err.message || err) });
        }
      });

      // Pipe archive to response
      archive.pipe(res);

      // Deduplicate file names in case multiple rows point to the same SN+Station
      const usedNames = new Set();
      for (const file of foundFiles) {
        let name = file.fileName;
        if (usedNames.has(name)) {
          const ext = path.extname(name);
          const base = path.basename(name, ext);
          let counter = 2;
          while (usedNames.has(`${base}_${counter}${ext}`)) counter++;
          name = `${base}_${counter}${ext}`;
        }
        usedNames.add(name);
        archive.file(file.filePath, { name });
      }

      // Add _download_report.txt summarizing found/missing
      const reportLines = [
        `FAIL Log Download Report`,
        `========================`,
        `Date: ${now.toISOString()}`,
        `Total Requested: ${rows.length}`,
        `Found: ${foundFiles.length}`,
        `Missing: ${missingFiles.length}`,
        ``,
        `--- Found Files ---`,
        ...foundFiles.map(f => `  ✓ ${f.sn} | ${f.station} → ${f.fileName}`),
        ``,
        `--- Missing Files ---`,
        ...(missingFiles.length
          ? missingFiles.map(m => `  ✗ ${m.sn} | ${m.station} | Reason: ${m.reason}`)
          : ['  (none)']),
      ];
      archive.append(reportLines.join('\n'), { name: '_download_report.txt' });

      await archive.finalize();
    } catch (err) {
      console.error('[LOG ZIP ROUTE ERROR]', err && err.stack ? err.stack : err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: String(err.message || err) });
      }
    }
  });

  return router;
};
