const { logBackend } = require('./logger');

function setupErrorHandlers(app) {
  // ---- Global crash guards – keep server alive no matter what ----
  process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION – server stays alive]', err && err.stack ? err.stack : err);
    logBackend('error', '[UNCAUGHT EXCEPTION – server stays alive]', { stack: err && err.stack ? err.stack : err });
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION – server stays alive]', reason && reason.stack ? reason.stack : reason);
    logBackend('error', '[UNHANDLED REJECTION – server stays alive]', { stack: reason && reason.stack ? reason.stack : reason });
  });

  // Basic Express error middleware if needed later
  app.use((err, req, res, next) => {
    console.error('[EXPRESS ERROR]', err.stack);
    logBackend('error', '[EXPRESS ERROR]', { stack: err.stack, url: req.originalUrl });
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  });
}

module.exports = setupErrorHandlers;
