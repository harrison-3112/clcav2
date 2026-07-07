'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  normalizeMesKeys,
  toMesNumber,
  buildMesCommandPayloads,
  aggregateMesDailyData,
} = require('../app/backend/modules/mesdaily/mesDailyAggregator');

const root = path.resolve(__dirname, '..');
const summaryFixture = JSON.parse(fs.readFileSync(path.join(root, 'scratch/fixtures/mesdaily/VNPTH09.json'), 'utf8'));
const detailFixture = JSON.parse(fs.readFileSync(path.join(root, 'scratch/fixtures/mesdaily/VNPTH09DT.json'), 'utf8'));

const normalized = normalizeMesKeys(summaryFixture.Data[0]);
assert.ok(Object.prototype.hasOwnProperty.call(normalized, 'MODEL_NAME'), 'normalizeMesKeys trims leading-space keys');
assert.strictEqual(toMesNumber('100.00%'), 100, 'toMesNumber parses percentage strings');

const payloads = buildMesCommandPayloads({
  woList: ['8655145'],
  from: '2026060100',
  to: '2026070600',
  stations: ['FATP_PCBA_01'],
});
assert.deepStrictEqual(payloads.summary[0], {
  command: 'VNPTH09',
  wo: '8655145',
  station: 'FATP_PCBA_01',
  payload: { Data: [{ Command: 'VNPTH09', InputData: '8655145,2026060100,2026070600,FATP_PCBA_01' }] },
});
assert.deepStrictEqual(payloads.detail[0].payload, {
  Data: [{ Command: 'VNPTH09DT', InputData: '8655145,2026060100,2026070600,FATP_PCBA_01' }],
});

const aggregated = aggregateMesDailyData({
  summaryResponses: [{ wo: '8655145', station: 'FATP_PCBA_01', response: summaryFixture }],
  detailResponses: [{ wo: '8655145', station: 'FATP_PCBA_01', response: detailFixture }],
});

assert.ok(aggregated.kpis.input > 0, 'input KPI is aggregated');
assert.ok(aggregated.kpis.output >= 0, 'output KPI is aggregated');
assert.ok(aggregated.kpis.fail >= 0, 'fail KPI is aggregated');
assert.ok(Number.isFinite(aggregated.kpis.fpy), 'fpy KPI is numeric');
assert.ok(aggregated.summaryRows.length > 0, 'summaryRows are present');
assert.ok(aggregated.defectRows.length > 0, 'defectRows are present');
assert.ok(aggregated.topDefects.length > 0, 'topDefects are present');
assert.ok(aggregated.topDefects[0].woBreakdown, 'topDefects preserve woBreakdown');
assert.ok(aggregated.stationYield.length > 0, 'stationYield is present');
assert.ok(Array.isArray(aggregated.stationHourlyTrend[aggregated.stationYield[0].station]), 'stationHourlyTrend is present');
assert.ok(Object.prototype.hasOwnProperty.call(aggregated.stationHourlyTrend[aggregated.stationYield[0].station][0], 'fail'), 'hourly trend uses fail');
assert.ok(!Object.prototype.hasOwnProperty.call(aggregated.stationHourlyTrend[aggregated.stationYield[0].station][0], 'input'), 'hourly trend does not invent input');

console.log('MES Daily aggregator fixture test passed.');
