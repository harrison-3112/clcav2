'use strict';

const fs = require('fs');
const path = require('path');

const FIXED_TEMPLATE = path.resolve(process.cwd(), 'config', 'sample.xlsx');
const ROOT_ENGINE = path.resolve(__dirname, 'clca_vo0301_report_v13v2.js');
const CONFIG_ENGINE = path.resolve(process.cwd(), 'config', 'clca_vo0301_report_v13v2.js');
const enginePath = fs.existsSync(ROOT_ENGINE) ? ROOT_ENGINE : CONFIG_ENGINE;

let buildReportCached = null;
let buildMergedReportCached = null;

function getBuildReport() {
  if (buildReportCached) return buildReportCached;
  const engineModule = require(enginePath);
  buildReportCached = engineModule.buildReport;
  return buildReportCached;
}

function getBuildMergedReport() {
  if (buildMergedReportCached) return buildMergedReportCached;
  const engineModule = require(enginePath);
  if (typeof engineModule.buildMergedReport !== 'function') {
    throw new Error('CLCA engine does not support merged WO export (missing buildMergedReport). Loaded engine: ' + enginePath);
  }
  buildMergedReportCached = engineModule.buildMergedReport;
  return buildMergedReportCached;
}

module.exports = {
  FIXED_TEMPLATE,
  enginePath,
  getBuildReport,
  getBuildMergedReport
};
