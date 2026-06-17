// QuickLog routes
'use strict';

module.exports = function createQuickLogRoutes(context) {
  const router = require('express').Router();
  const { QUICKLOG_MODELS, resolveQuickLogConfig, getQuickLogCore, openQuickLogFile, rootDir } = context;


  const fs = require('fs');
  const path = require('path');
  const QUICKLOG_LOCAL_STATIONS_CONFIG_CANDIDATES = [
    path.resolve(rootDir || process.cwd(), 'config', 'quicklog.local-stations.json'),
    path.resolve(rootDir || process.cwd(), 'quicklog.local-stations.json'),
    path.resolve(rootDir || process.cwd(), 'ui', 'quicklog.local-stations.json'),
  ];
  let quickLogLocalStationsConfigCache = null;
  let quickLogLocalStationsConfigMtime = 0;
  function getQuickLogLocalStationsConfig() {
    let selectedPath = '';
    let selectedMtime = 0;
    for (const filePath of QUICKLOG_LOCAL_STATIONS_CONFIG_CANDIDATES) {
      try {
        if (fs.existsSync(filePath)) {
          selectedPath = filePath;
          selectedMtime = fs.statSync(filePath).mtimeMs;
          break;
        }
      } catch (_) {}
    }
    if (quickLogLocalStationsConfigCache && selectedMtime === quickLogLocalStationsConfigMtime) return quickLogLocalStationsConfigCache;
    quickLogLocalStationsConfigMtime = selectedMtime;
    if (!selectedPath) {
      quickLogLocalStationsConfigCache = { enabled: false, models: {}, message: {} };
      return quickLogLocalStationsConfigCache;
    }
    quickLogLocalStationsConfigCache = JSON.parse(fs.readFileSync(selectedPath, 'utf8'));
    quickLogLocalStationsConfigCache._sourcePath = selectedPath;
    return quickLogLocalStationsConfigCache;
  }
  function quickLogNormalizeStationName(value) { return String(value || '').trim().replace(/[\t ]+/g, ' ').toUpperCase(); }
  function quickLogCompactStationName(value) { return quickLogNormalizeStationName(value).replace(/[\s_-]+/g, ''); }
  function quickLogStationMatches(a, b) { return quickLogNormalizeStationName(a) === quickLogNormalizeStationName(b) || quickLogCompactStationName(a) === quickLogCompactStationName(b); }
  function quickLogModelRootName(value) { const raw = String(value || '').trim(); return raw.includes('_') ? raw.split('_')[0] : raw; }
  function getQuickLogLocalStationModelConfig(modelName) {
    const cfg = getQuickLogLocalStationsConfig();
    const models = cfg.models || {};
    const key = quickLogModelRootName(modelName || 'VO0301') || 'VO0301';
    let modelCfg = models[key] || models.VO0301 || null;
    if (modelCfg && modelCfg.inheritFrom && models[modelCfg.inheritFrom]) modelCfg = models[modelCfg.inheritFrom];
    return modelCfg || null;
  }
  function quickLogAliasTargets(value, raw) {
    if (value === null) return null;
    if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
    const single = String(value || raw || '').trim();
    return single ? [single] : [];
  }
  function resolveQuickLogLocalStationForMesTrace(modelName, stationName) {
    const cfg = getQuickLogLocalStationsConfig();
    const raw = String(stationName || '').trim();
    if (cfg.enabled === false) return { allowed: true, localStation: raw, localStations: [raw], configured: false };
    const modelCfg = getQuickLogLocalStationModelConfig(modelName);
    if (!modelCfg) return { allowed: true, localStation: raw, localStations: [raw], configured: false };
    const rawUpper = quickLogNormalizeStationName(raw);
    const rawCompact = quickLogCompactStationName(raw);
    if (!raw) return { allowed: false, localStation: raw, localStations: [], configured: true, reason: 'missing-station' };
    if (rawUpper.includes('REPAIR') || rawCompact.includes('REPAIR')) return { allowed: false, localStation: raw, localStations: [], configured: true, reason: 'repair-has-no-local-log' };
    const allowedStations = Array.isArray(modelCfg.allowedStations) ? modelCfg.allowedStations : [];
    const allowed = !allowedStations.length || allowedStations.some((station) => quickLogStationMatches(station, raw));
    if (!allowed) return { allowed: false, localStation: raw, localStations: [], configured: true, reason: 'station-not-in-local-config' };
    let mapped;
    for (const [key, value] of Object.entries(modelCfg.aliases || {})) {
      if (quickLogNormalizeStationName(key) === rawUpper || quickLogCompactStationName(key) === rawCompact) { mapped = value; break; }
    }
    if (mapped === null) return { allowed: false, localStation: raw, localStations: [], configured: true, reason: 'alias-disabled' };
    const localStations = quickLogAliasTargets(mapped, raw);
    const finalStations = localStations && localStations.length ? localStations : [raw];
    return { allowed: true, localStation: finalStations[0] || raw, localStations: finalStations, configured: true, reason: '' };
  }
  function getQuickLogMesRowStation(row) { return String(row && (row.terminal || row.process || row.Station || row.TerminalName || row.ProcessName) || '').trim(); }
  function getQuickLogMesRowModel(row) { return quickLogModelRootName(row && (row.modelRoot || row.modelNo || row.Model || row._QuickLogModel) || 'VO0301') || 'VO0301'; }
  function getQuickLogLocalStationMissingMessage() {
    const cfg = getQuickLogLocalStationsConfig();
    const message = (cfg && cfg.message) || {};
    return message.en || 'Log file dont exist on local folder';
  }
// ---- QuickLog APIs (pure JS core) ----
router.get('/api/quicklog/local-stations', (_req, res) => {
  try { res.json(getQuickLogLocalStationsConfig()); }
  catch (err) { res.status(500).json({ success: false, error: String(err.message || err) }); }
});

router.get('/api/quicklog/models', (_req, res) => {
  res.json({ success: true, models: Object.values(QUICKLOG_MODELS) });
});

router.get(['/api/quicklog/modes', '/api/sn-search/modes'], (req, res) => {
  try {
    const cfg = resolveQuickLogConfig(req.query || {});
    if (!cfg.base) return res.status(400).json({ success: false, error: 'Model path not configured.', modes: [] });
    const modes = getQuickLogCore().getModes(cfg.base, cfg.project);
    res.json({ success: true, modes });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err.message || err), modes: [] });
  }
});

router.get(['/api/quicklog/stations', '/api/sn-search/stations'], (req, res) => {
  try {
    const cfg = resolveQuickLogConfig(req.query || {});
    if (!cfg.base) return res.status(400).json({ success: false, error: 'Model path not configured.', stations: [] });
    const stations = getQuickLogCore().getStations(cfg.base);
    res.json({ success: true, stations });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err.message || err), stations: [] });
  }
});

router.post(['/api/quicklog/search', '/api/sn-search'], (req, res) => {
  try {
    const body = req.body || {};
    const cfg = resolveQuickLogConfig(body);
    if (!cfg.base) return res.status(400).json({ success: false, error: 'Model path not configured.', rows: [], summary: {} });
    const data = getQuickLogCore().searchSn(cfg.base, body.snText || body.sn || '', body.mode || 'PROD', cfg.project, cfg.fixture);
    res.status(data.success ? 200 : 400).json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: String(err.message || err), rows: [], summary: {} });
  }
});

router.post(['/api/quicklog/open-log', '/api/sn-search/open-log'], async (req, res) => {
  try {
    const body = req.body || {};
    const cfg = resolveQuickLogConfig(body);
    if (!cfg.base) return res.status(400).json({ success: false, error: 'Model path not configured.' });
    const data = getQuickLogCore().findLogFileForRow(cfg.base, body.row || {}, cfg.project, cfg.fixture);
    if (!data.success) return res.status(404).json(data);
    await openQuickLogFile(data.path);
    res.json({ ...data, opened: true });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err.message || err) });
  }
});


// ---- MES Trace APIs merged into QuickLog logic core (logic only, no UI) ----
router.post(['/api/quicklog/mes-trace/search', '/api/sn-search/mes-trace'], async (req, res) => {
  try {
    const body = req.body || {};
    const input = body.input || body.snText || body.sn || '';
    const data = await getQuickLogCore().traceMany(input, { apiUrl: body.apiUrl, timeoutMs: body.timeoutMs });
    res.status(data.success ? 200 : 400).json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: String(err.message || err), rows: [], summary: {} });
  }
});

router.post(['/api/quicklog/mes-trace/open-log', '/api/sn-search/mes-trace/open-log'], async (req, res) => {
  try {
    const body = req.body || {};
    const row = body.row || {};
    const model = getQuickLogMesRowModel(row);
    const sourceStation = getQuickLogMesRowStation(row);
    const resolved = resolveQuickLogLocalStationForMesTrace(model, sourceStation);
    if (!resolved.allowed) {
      return res.status(404).json({
        success: false,
        code: 'LOCAL_LOG_STATION_NOT_CONFIGURED',
        error: getQuickLogLocalStationMissingMessage(),
        resolved: { model, station: sourceStation, reason: resolved.reason }
      });
    }
    const localStationCandidates = Array.isArray(resolved.localStations) && resolved.localStations.length ? resolved.localStations : [resolved.localStation || sourceStation];
    const core = getQuickLogCore();
    const rowForOpen = { ...row, _QuickLogLocalStation: localStationCandidates[0], _QuickLogLocalStationCandidates: localStationCandidates };
    const found = core.findMesTraceLogFile(rowForOpen, { ...(body.options || {}), localStationCandidates });
    if (!found.success) return res.status(404).json(found);
    await core.openMesTraceLogFile(found.path);
    res.json({ ...found, opened: true });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err.message || err) });
  }
});

  return router;
};
