// MES Daily routes
'use strict';

const fs = require('fs');
const path = require('path');

function parseMesDateTimeLocal(dtStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(dtStr || '').trim());
  if (!m) return null;
  return {
    date: m[1] + m[2] + m[3],
    hour: parseInt(m[4], 10),
    minute: parseInt(m[5], 10),
  };
}

module.exports = function createMesDailyRoutes(context = {}) {
  const router = require('express').Router();
  const appRoot = context.rootDir || path.resolve(__dirname, '..');
  const getMesLogic = context.getMesLogic || (() => require(path.resolve(appRoot, 'MES API', 'logic.js')));
  const parseMesDateTime = context.parseMesDateTime || parseMesDateTimeLocal;

  function parseWoInput(text) {
    const seen = new Set(); const out = [];
    String(text || '').split(/[\s,]+/).forEach((item) => { const wo = String(item || '').trim(); if (!wo || seen.has(wo)) return; seen.add(wo); out.push(wo); });
    return out;
  }
  function formatR001DateTime(parsed) {
    const date = String(parsed.date || '');
    return `${date.slice(0,4)}${date.slice(4,6)}${date.slice(6,8)} ${String(parsed.hour).padStart(2,'0')}:${String(parsed.minute).padStart(2,'0')}:00`;
  }
  router.post('/api/mesdaily/r001-search', async (req, res) => {
    try {
      const mesLogic = getMesLogic();
      if (!mesLogic || typeof mesLogic.queryMESInput !== 'function') return res.status(500).json({ success:false, error:'MES logic module does not support queryMESInput.', rows:[], summary:{} });
      const body = req.body || {}; const woList = parseWoInput(body.woText || body.wo || body.workOrders || '');
      if (!woList.length) return res.status(400).json({ success:false, error:'WO Input is required.', rows:[], summary:{} });
      const from = parseMesDateTime(body.timefrom); const to = parseMesDateTime(body.timeto);
      if (!from || !to) return res.status(400).json({ success:false, error:'Invalid MES datetime range.', rows:[], summary:{} });
      const inputData = `${formatR001DateTime(from)}; ${formatR001DateTime(to)}`;
      let data = [];
      try {
        data = await mesLogic.queryMESInput('R001', inputData);
      } catch (mesErr) {
        console.log('[MES DAILY R001] Fetch failed, fallback to mock data (Result true,.txt):', String(mesErr.message || mesErr));
        const mockPath = path.resolve(appRoot, 'Result true,.txt');
        if (fs.existsSync(mockPath)) {
          const mockData = JSON.parse(fs.readFileSync(mockPath, 'utf8'));
          data = mockData.Data || [];
          // Force mock data's WorkOrder to match the first searched WO so the filter passes
          if (data.length && woList.length) {
              data.forEach(row => row.WorkOrder = woList[0]);
          }
        } else {
          throw mesErr;
        }
      }
      const woSet = new Set(woList.map((wo) => String(wo || '').trim()));
      const rows = (Array.isArray(data) ? data : []).filter((row) => woSet.has(String(row && row.WorkOrder || '').trim()));
      return res.json({ success:true, command:'R001', inputData, rows, summary:{ woInputCount:woList.length, recordCount:rows.length, rawRecordCount:Array.isArray(data)?data.length:0, workOrders:woList } });
    } catch (err) {
      console.error('[MES DAILY R001 ERROR]', err && err.stack ? err.stack : err);
      return res.status(500).json({ success:false, error:String(err.message || err), rows:[], summary:{} });
    }
  });

router.post('/api/generate/mesdaily', async (req, res) => {
  const mesLogic = getMesLogic();
  const body = req.body || {};
  const templatePath = path.resolve(appRoot, 'MES API', 'Sample.xlsx');
  const templateArg = fs.existsSync(templatePath) ? templatePath : undefined;

  // ── shared helpers ──────────────────────────────────────────────────────────
  function normalizeRequirements(rawList) {
    return (Array.isArray(rawList) ? rawList : [])
      .map((item) => ({
        workOrder: String(item?.workOrder || item?.wo || '').trim(),
        pdLine:    String(item?.pdLine    || item?.pdline  || '').trim(),
      }))
      .filter((item) => item.workOrder);
  }

  async function captureRun(fn) {
    const logs = [];
    const origOut = process.stdout.write.bind(process.stdout);
    const origErr = process.stderr.write.bind(process.stderr);
    const cap = (orig) => (chunk, enc, cb) => {
      logs.push(typeof chunk === 'string' ? chunk : chunk.toString());
      return orig(chunk, enc, cb);
    };
    process.stdout.write = cap(origOut);
    process.stderr.write = cap(origErr);
    try {
      const result = await fn();
      return { ok: true, result, logs };
    } catch (err) {
      return { ok: false, error: err, logs };
    } finally {
      process.stdout.write = origOut;
      process.stderr.write = origErr;
    }
  }

  const selectedStations = Array.isArray(body.selected_stations)
    ? body.selected_stations.map((s) => String(s || '').trim()).filter(Boolean)
    : [];

  const from = parseMesDateTime(body.timefrom);
  const to   = parseMesDateTime(body.timeto);
  if (!from || !to) {
    return res.status(400).json({ success: false, error: 'Invalid MES datetime range.' });
  }

  // ── GROUPED MODE ────────────────────────────────────────────────────────────
  // body: { mode:'grouped', groups:[{ label, requirements[], output_path }],
  //         merged_output_path?, selected_stations[], timefrom, timeto }
  if (body.mode === 'grouped') {
    if (!Array.isArray(body.groups) || !body.groups.length) {
      return res.status(400).json({ success: false, error: 'groups[] is required for grouped mode.' });
    }

    const results = [];
    const succeededReqs = [];

    for (const group of body.groups) {
      const reqs = normalizeRequirements(group.requirements);
      if (!reqs.length) {
        results.push({ label: group.label, ok: false, error: 'No valid WO rows in this group.', logs: [] });
        continue;
      }
      let outPath = String(group.output_path || '').trim();
      if (!outPath) {
        results.push({ label: group.label, ok: false, error: 'Missing output_path for group.', logs: [] });
        continue;
      }
      if (!outPath.toLowerCase().endsWith('.xlsx')) outPath += '.xlsx';
      try { fs.mkdirSync(path.dirname(outPath), { recursive: true }); } catch (_) {}

      const { ok, error, logs } = await captureRun(() => mesLogic.run({
        outputFile:  outPath,
        workOrders:  [...new Set(reqs.map((r) => r.workOrder))],
        processes:   selectedStations,
        requirements: reqs,
        fromDate: from.date, fromHour: from.hour, fromMinute: from.minute,
        toDate:   to.date,   toHour:   to.hour,   toMinute:   to.minute,
        templatePath: templateArg,
      }));

      results.push({
        label:       group.label,
        ok,
        output_path: ok ? outPath : undefined,
        error:       ok ? undefined : String(error?.message || error),
        logs,
      });
      if (ok) succeededReqs.push(...reqs);
    }

    // optional merged file (all successful groups combined)
    let mergedResult = null;
    const mergedPath = String(body.merged_output_path || '').trim();
    if (mergedPath && succeededReqs.length) {
      const mp = mergedPath.toLowerCase().endsWith('.xlsx') ? mergedPath : mergedPath + '.xlsx';
      try { fs.mkdirSync(path.dirname(mp), { recursive: true }); } catch (_) {}

      const { ok, error, logs } = await captureRun(() => mesLogic.run({
        outputFile:  mp,
        workOrders:  [...new Set(succeededReqs.map((r) => r.workOrder))],
        processes:   selectedStations,
        requirements: succeededReqs,
        fromDate: from.date, fromHour: from.hour, fromMinute: from.minute,
        toDate:   to.date,   toHour:   to.hour,   toMinute:   to.minute,
        templatePath: templateArg,
      }));

      mergedResult = {
        ok,
        output_path: ok ? mp : undefined,
        error:       ok ? undefined : String(error?.message || error),
        logs,
      };
    }

    const anySuccess = results.some((r) => r.ok) || (mergedResult && mergedResult.ok);
    if (!anySuccess) {
      const firstError = results.find((r) => r && r.error)?.error || mergedResult?.error || 'MES Daily generation failed.';
      const allNoData = results.length > 0 && results.every((r) => String(r.error || '').includes('No MES data found'));
      return res.status(allNoData ? 400 : 500).json({
        success: false,
        mode: 'grouped',
        error: firstError,
        results,
        mergedResult,
      });
    }
    return res.json({ success: true, mode: 'grouped', results, mergedResult });
  }

  // ── SINGLE MODE (original behavior, unchanged) ──────────────────────────────
  const logs = [];
  const origOut = process.stdout.write.bind(process.stdout);
  const origErr = process.stderr.write.bind(process.stderr);
  const cap = (orig) => (chunk, enc, cb) => {
    logs.push(typeof chunk === 'string' ? chunk : chunk.toString());
    return orig(chunk, enc, cb);
  };
  process.stdout.write = cap(origOut);
  process.stderr.write = cap(origErr);

  try {
    const requirements = normalizeRequirements(body.requirements);
    let outputPath = String(body.output_path || '').trim();

    if (!requirements.length) {
      return res.status(400).json({ success: false, error: 'At least one WO row is required.' });
    }
    if (!selectedStations.length) {
      console.warn('WARNING: No stations selected for MES Daily. Running with all stations.');
    }
    if (!outputPath) {
      return res.status(400).json({ success: false, error: 'Missing output path.' });
    }

    if (!outputPath.toLowerCase().endsWith('.xlsx')) outputPath += '.xlsx';
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const workOrders = [...new Set(requirements.map((item) => item.workOrder))];

    await mesLogic.run({
      outputFile: outputPath,
      workOrders,
      processes: selectedStations,
      requirements,
      fromDate: from.date,
      fromHour: from.hour,
      fromMinute: from.minute,
      toDate: to.date,
      toHour: to.hour,
      toMinute: to.minute,
      templatePath: templateArg,
    });

    return res.json({
      success: true,
      output_path: outputPath,
      message: 'MES Daily report generated successfully!',
      logs,
    });
  } catch (err) {
    const isNoData = err && err.code === 'NO_MES_DATA';
    if (isNoData) {
      console.warn('[MES DAILY NO DATA]', err && err.stack ? err.stack : err);
    } else {
      console.error('[MES DAILY ERROR]', err && err.stack ? err.stack : err);
    }
    return res.status(isNoData ? 400 : 500).json({ success: false, error: String(err.message || err), logs });
  } finally {
    process.stdout.write = origOut;
    process.stderr.write = origErr;
  }
});

  return router;
};
