#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * CloudMetrics – Node.js Server (v1.4.0)
 * -----------------------------------------
 * Node/Express backend that calls the JavaScript report engine directly.
 *
 * API:
 *   POST /api/generate    – accept 3 Excel files + output_path, run buildReport
 *   POST /api/browse-save – open native Windows "Save As" dialog
 *
 * Usage:
 *   npm install
 *   node server.js
 *   → http://localhost:5000
 */

'use strict';

const fs            = require('fs');
const os            = require('os');
const path          = require('path');
const http          = require('http');
const { spawnSync, spawn, execFile } = require('child_process');

const express = require('express');
const multer  = require('multer');
const cors    = require('cors');

const setupErrorHandlers = require('./app/backend/server/errorMiddleware');
const { upload, cleanupFiles, UPLOAD_DIR } = require('./app/backend/server/upload');

// Module route bootstrap: active routes are registered from routes/*.routes.js.

const { 
  APP_SETTINGS, 
  LOGGING_CONFIG, 
  MODULES_CONFIG, 
  CLCA_SETTINGS, 
  MESDAILY_SETTINGS, 
  toPositiveInteger,
  getPublicAppSettings,
  getPublicModuleConfig,
  getPublicClcaSettings,
  getPublicMesDailySettings 
} = require('./app/backend/server/config');

const { logBackend } = require('./app/backend/server/logger');

logBackend('info', 'Phase 4 remaining config initialized', {
  modules: Object.keys(MODULES_CONFIG.modules || {}),
  clcaSettings: !!CLCA_SETTINGS,
  mesDailySettings: !!MESDAILY_SETTINGS,
});

const createApp = require('./app/backend/server/createApp');
const setupRoutes = require('./app/backend/server/routes');

// ---- App setup ----
const app = createApp();
const PORT = toPositiveInteger(process.env.PORT || APP_SETTINGS.server?.port, 5000);
const HOST = String(process.env.HOST || APP_SETTINGS.server?.host || '0.0.0.0');

// (Multer and cleanupFiles moved to upload.js)
// ---- Modular routes ----
const routeContext = {
  rootDir: __dirname,
  upload,
  cleanupFiles,
  UPLOAD_DIR,
};

setupRoutes(app, routeContext);




// ---- QuickLog Config API ----


app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

// ---- Start server ----
const server = http.createServer(app);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
      if (res.statusCode === 200) {
        console.log(`Port ${PORT} already in use by another CLCA server instance. Exiting gracefully.`);
        process.exit(0);
      } else {
        console.error(`Port ${PORT} is in use by another application. Close it and try again.`);
        process.exit(1);
      }
    }).on('error', () => {
      console.error(`Port ${PORT} is in use by another application. Close it and try again.`);
      process.exit(1);
    });
  } else {
    throw err;
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log('==================================================');
  console.log('  CloudMetrics Server (Node.js)');
  console.log(`  ${url}`);
  console.log('==================================================');

  // Pre-warm report engines
  setTimeout(() => {
    try { require('./app/backend/modules/clca/reportEngine').getBuildReport(); } catch (_) {}
  }, 8000);
});
