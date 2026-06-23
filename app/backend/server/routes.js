'use strict';

const {
  getPublicAppSettings,
  getPublicModuleConfig,
  getPublicClcaSettings,
  getPublicMesDailySettings
} = require('./config');

const createClcaRoutes = require('../routes/clca.routes');
const createMesDailyRoutes = require('../routes/mesdaily.routes');
const createQuickLogRoutes = require('../routes/quicklog.routes');
const createLogZipRoutes = require('../routes/logzip.routes');

function setupRoutes(app, routeContext) {
  // Config/Settings APIs
  app.get('/api/app/settings', (_req, res) => { res.json({ success: true, settings: getPublicAppSettings() }); });
  app.post('/api/app/settings', (req, res) => {
    const { saveAppSettings } = require('./config');
    const success = saveAppSettings(req.body);
    res.json({ success, message: success ? 'Settings saved' : 'Failed to save settings' });
  });

  app.get('/api/app/modules', (_req, res) => { res.json({ success: true, ...getPublicModuleConfig() }); });
  app.post('/api/app/modules', (req, res) => {
    const { saveModulesConfig } = require('./config');
    const success = saveModulesConfig(req.body);
    res.json({ success, message: success ? 'Modules saved' : 'Failed to save modules' });
  });

  app.get('/api/app/clca-settings', (_req, res) => { res.json({ success: true, settings: getPublicClcaSettings() }); });
  app.post('/api/app/clca-settings', (req, res) => {
    const { saveClcaSettings } = require('./config');
    const success = saveClcaSettings(req.body);
    res.json({ success, message: success ? 'CLCA Settings saved' : 'Failed to save CLCA settings' });
  });

  app.get('/api/app/mesdaily-settings', (_req, res) => { res.json({ success: true, settings: getPublicMesDailySettings() }); });
  app.post('/api/app/mesdaily-settings', (req, res) => {
    const { saveMesDailySettings } = require('./config');
    const success = saveMesDailySettings(req.body);
    res.json({ success, message: success ? 'MES Daily Settings saved' : 'Failed to save MES Daily settings' });
  });

  // Modular routing
  app.use(createClcaRoutes(routeContext));
  app.use(createMesDailyRoutes(routeContext));
  app.use(createQuickLogRoutes(routeContext));
  app.use(createLogZipRoutes(routeContext));
}

module.exports = setupRoutes;
