// QuickLog routes
'use strict';

const fs = require('fs');
const path = require('path');
const {
  getQuickLogCore,
  getQuickLogLocalStationsConfig,
  resolveQuickLogLocalStationForServer,
  getQuickLogModelsDict,
  getQuickLogModel,
  reloadQuickLogModelsFromConfig,
  resolveQuickLogConfig,
  openQuickLogFile,
  QUICKLOG_MODELS_CONFIG_PATH,
  getQuickLogGlobalRoot,
  getQuickLogPrograms
} = require('../modules/quicklog/configReader');

module.exports = function createQuickLogRoutes(context) {
  const router = require('express').Router();
  const { rootDir } = context;

  function quickLogModelRootName(value) { const raw = String(value || '').trim(); return raw.includes('_') ? raw.split('_')[0] : raw; }
  function getQuickLogMesRowStation(row) { return String(row && (row.terminal || row.process || row.Station || row.TerminalName || row.ProcessName) || '').trim(); }
  function getQuickLogMesRowModel(row) { return quickLogModelRootName(row && (row.modelRoot || row.modelNo || row.Model || row._QuickLogModel) || 'VO0301') || 'VO0301'; }
  function getQuickLogLocalStationMissingMessage() {
    const cfg = getQuickLogLocalStationsConfig();
    const message = (cfg && cfg.message) || {};
    return message.en || 'Log file dont exist on local folder';
  }

  // ---- Config APIs ----
  router.get('/api/config/quicklog', (_req, res) => {
    try {
      let data = {};
      if (fs.existsSync(QUICKLOG_MODELS_CONFIG_PATH)) {
        data = JSON.parse(fs.readFileSync(QUICKLOG_MODELS_CONFIG_PATH, 'utf8'));
      }
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error.message || error) });
    }
  });

  router.post('/api/config/quicklog', (req, res) => {
    try {
      const newData = req.body || {};
      fs.mkdirSync(path.dirname(QUICKLOG_MODELS_CONFIG_PATH), { recursive: true });
      fs.writeFileSync(QUICKLOG_MODELS_CONFIG_PATH, JSON.stringify(newData, null, 2), 'utf8');
      
      reloadQuickLogModelsFromConfig();
      
      res.json({ success: true, message: 'Settings saved successfully.' });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error.message || error) });
    }
  });

  router.post('/api/quicklog/open-log-folder', async (req, res) => {
    try {
      const { modelName } = req.body || {};
      if (!modelName) return res.status(400).json({ success: false, error: 'Missing modelName' });
      let globalRoot = getQuickLogGlobalRoot();
      if (fs.existsSync(QUICKLOG_MODELS_CONFIG_PATH)) {
          const config = JSON.parse(fs.readFileSync(QUICKLOG_MODELS_CONFIG_PATH, 'utf8'));
          if (config.mesTrace && config.mesTrace.logRoot) {
              globalRoot = String(config.mesTrace.logRoot).trim();
          }
      }
      const folderPath = path.join(globalRoot, modelName, 'SYNC LOCAL DATA');
      if (!fs.existsSync(folderPath)) {
          return res.status(404).json({ success: false, error: 'Folder does not exist on network:\n' + folderPath });
      }
      await openQuickLogFile(folderPath);
      res.json({ success: true, opened: true, path: folderPath });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error.message || error) });
    }
  });


  // ---- QuickLog APIs (pure JS core) ----
  router.get('/api/quicklog/local-stations', (_req, res) => {
    try { res.json(getQuickLogLocalStationsConfig()); }
    catch (err) { res.status(500).json({ success: false, error: String(err.message || err) }); }
  });

  router.get('/api/quicklog/models', (_req, res) => {
    res.json({ success: true, models: Object.values(getQuickLogModelsDict()) });
  });

  router.get('/api/quicklog/programs', (_req, res) => {
    res.json({ success: true, programs: getQuickLogPrograms() });
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
      const data = getQuickLogCore().searchSn(cfg.base, body.snText || body.sn || '', body.mode || 'PROD', cfg.project, cfg.fixture, cfg.program);
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
      const data = getQuickLogCore().findLogFileForRow(cfg.base, body.row || {}, cfg.project, cfg.fixture, cfg.program);
      if (!data.success) return res.status(404).json(data);
      await openQuickLogFile(data.path);
      res.json({ ...data, opened: true });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err.message || err) });
    }
  });

  // ---- MES Trace APIs ----
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
      const programName = body.program || 'MFGX';
      const programs = getQuickLogPrograms();
      const program = programs.find(p => p.name === programName) || programs[0];
      const model = getQuickLogMesRowModel(row);
      const sourceStation = getQuickLogMesRowStation(row);
      const resolved = resolveQuickLogLocalStationForServer(model, sourceStation);
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
      const found = core.findMesTraceLogFile(rowForOpen, { ...(body.options || {}), localStationCandidates, program });
      if (!found.success) return res.status(404).json(found);
      await core.openMesTraceLogFile(found.path);
      res.json({ ...found, opened: true });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err.message || err) });
    }
  });

  return router;
};
