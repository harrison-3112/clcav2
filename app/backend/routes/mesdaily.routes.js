'use strict';

const express = require('express');
const { getMesDailyApiConfig } = require('../server/config');
const { postMesCommand } = require('../modules/mesdaily/mesCommandClient');
const {
  buildMesCommandPayloads,
  aggregateMesDailyData,
} = require('../modules/mesdaily/mesDailyAggregator');

async function runLimited(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

function createMesDailyRoutes() {
  const router = express.Router();

  router.post('/api/mesdaily/query', async (req, res) => {
    try {
      const config = getMesDailyApiConfig();
      const commandGroups = buildMesCommandPayloads(req.body || {});
      const maxConcurrent = Number(config.maxConcurrent) > 0 ? Number(config.maxConcurrent) : 3;

      const summaryResponses = await runLimited(commandGroups.summary, maxConcurrent, async (item) => ({
        wo: item.wo,
        station: item.station,
        response: await postMesCommand(config, item.payload),
      }));

      const detailResponses = await runLimited(commandGroups.detail, maxConcurrent, async (item) => ({
        wo: item.wo,
        station: item.station,
        response: await postMesCommand(config, item.payload),
      }));

      res.json(aggregateMesDailyData({ summaryResponses, detailResponses }));
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error && error.message ? error.message : String(error),
      });
    }
  });

  return router;
}

module.exports = createMesDailyRoutes;
