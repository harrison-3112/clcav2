const express = require('express');
const cors = require('cors');
const path = require('path');
const setupErrorHandlers = require('./errorMiddleware');
const { LOGGING_CONFIG } = require('./config');
const { logBackend } = require('./logger');

function createApp() {
  const app = express();
  
  setupErrorHandlers(app);

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request timing logger
  app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
      if (!LOGGING_CONFIG.includeRequestTiming) return;
      const elapsedMs = Date.now() - startTime;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warning' : 'info';
      logBackend(level, 'HTTP request completed', { method: req.method, url: req.originalUrl || req.url, statusCode: res.statusCode, elapsedMs });
    });
    next();
  });

  // Serve static UI files from ui directory (index.html, app.js, css folder)
  app.use(express.static(path.join(__dirname, '../../../ui')));

  return app;
}

module.exports = createApp;
