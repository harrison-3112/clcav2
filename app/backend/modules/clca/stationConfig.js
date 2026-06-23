'use strict';

const fs = require('fs');
const path = require('path');

const STATIONS_JSON_PATH = path.resolve(process.cwd(), 'config', 'stations.json');
const STATIONS_TXT_CANDIDATES = [
  path.resolve(process.cwd(), 'Station.txt'),
  path.resolve(process.cwd(), 'station.txt'),
  path.resolve(process.cwd(), 'config', 'Station.txt'),
  path.resolve(process.cwd(), 'config', 'station.txt'),
];

function uniqueKeepOrder(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function readStationsFromTxt() {
  const txtPath = STATIONS_TXT_CANDIDATES.find((p) => fs.existsSync(p));
  if (!txtPath) return [];

  const txt = fs.readFileSync(txtPath, 'utf8');
  const stations = txt
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return uniqueKeepOrder(stations);
}

function readPresetsFromJson() {
  if (!fs.existsSync(STATIONS_JSON_PATH)) return {};
  try {
    const cfg = JSON.parse(fs.readFileSync(STATIONS_JSON_PATH, 'utf8'));
    if (!cfg || typeof cfg !== 'object' || typeof cfg.presets !== 'object' || !cfg.presets) {
      return {};
    }
    return cfg.presets;
  } catch (error) {
    console.warn(`[Stations] Failed to parse stations.json presets: ${error.message || error}`);
    return {};
  }
}

let _stationConfigCache = null;
let _stationConfigMtime = 0;

function getStationConfig() {
  const jsonMtime = fs.existsSync(STATIONS_JSON_PATH) ? fs.statSync(STATIONS_JSON_PATH).mtimeMs : 0;
  const txtPath = STATIONS_TXT_CANDIDATES.find((p) => fs.existsSync(p));
  const txtMtime = txtPath ? fs.statSync(txtPath).mtimeMs : 0;
  const combinedMtime = jsonMtime + txtMtime;
  if (_stationConfigCache && combinedMtime === _stationConfigMtime) return _stationConfigCache;
  _stationConfigMtime = combinedMtime;

  const txtStations = readStationsFromTxt();
  let stations = txtStations;

  if (!stations.length) {
    try {
      const cfg = JSON.parse(fs.readFileSync(STATIONS_JSON_PATH, 'utf8'));
      stations = Array.isArray(cfg.stations)
        ? uniqueKeepOrder(cfg.stations.map((s) => String(s || '').trim()).filter(Boolean))
        : [];
      if (stations.length) {
        console.warn('[Stations] Station.txt is empty or missing, fallback to config/stations.json');
      }
    } catch (error) {
      console.warn(`[Stations] No valid station source found: ${error.message || error}`);
      stations = [];
    }
  }

  const presetsRaw = readPresetsFromJson();
  const stationSet = new Set(stations);
  const presets = {};
  for (const [presetName, presetStations] of Object.entries(presetsRaw)) {
    if (!Array.isArray(presetStations)) continue;
    presets[presetName] = uniqueKeepOrder(
      presetStations.map((s) => String(s || '').trim()).filter((s) => stationSet.has(s))
    );
  }

  _stationConfigCache = { stations, presets };
  return _stationConfigCache;
}

function clearStationConfigCache() {
  _stationConfigCache = null;
}

module.exports = {
  STATIONS_JSON_PATH,
  getStationConfig,
  clearStationConfigCache
};
