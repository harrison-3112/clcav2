'use strict';

const fs = require('fs');
const path = require('path');

let mesLogicCached = null;

function getMesLogic() {
  if (mesLogicCached) return mesLogicCached;
  const logicPath = path.resolve(process.cwd(), 'MES API', 'logic.js');
  if (!fs.existsSync(logicPath)) {
    throw new Error('MES logic module not found.');
  }
  const loaded = require(logicPath);
  if (!loaded || typeof loaded.run !== 'function') {
    throw new Error('MES logic module is invalid (missing run function).');
  }
  mesLogicCached = loaded;
  return mesLogicCached;
}

function parseMesDateTime(dtStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(dtStr || '').trim());
  if (!m) return null;
  return {
    date: m[1] + m[2] + m[3],
    hour: parseInt(m[4], 10),
    minute: parseInt(m[5], 10),
  };
}

module.exports = {
  getMesLogic,
  parseMesDateTime
};
