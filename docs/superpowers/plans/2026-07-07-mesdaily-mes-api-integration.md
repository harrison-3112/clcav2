# MES Daily MES API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect MES Daily to the real MES command API using `VNPTH09` and `VNPTH09DT`, with station selection required and dashboard rendering corrected for multi-WO multi-station data.

**Architecture:** Add a thin backend proxy route for MES commands so the browser never calls the MES API directly. Normalize raw MES responses into the existing frontend dashboard contract, keeping `MOCK` as a local offline path. Move station selection into the main MES Daily workflow and aggregate dashboard data by selected WO and station.

**Tech Stack:** Node.js/Express backend routes, vanilla browser JavaScript, Chart.js, static PowerShell contract tests, Node syntax checks.

---

## File Structure

- Create: `app/backend/modules/mesdaily/mesCommandClient.js`
  - Owns outbound MES command POSTs, timeout handling, and response validation.
- Create: `app/backend/modules/mesdaily/mesDailyAggregator.js`
  - Builds `WO x station` command payloads, normalizes raw keys with leading spaces, aggregates `VNPTH09` summary and `VNPTH09DT` defect rows.
- Create: `app/backend/routes/mesdaily.routes.js`
  - Exposes `POST /api/mesdaily/query` for MES Daily frontend search.
- Modify: `app/backend/server/routes.js`
  - Registers the new MES Daily route.
- Modify: `app/backend/server/config.js`
  - Adds MES API config loaded from existing app settings or environment variables.
- Modify: `config/app.settings.json`
  - Adds non-secret MES API defaults if the file exists and already tracks public app config.
- Create: `ui/js/modules/mesdailyApiData.js`
  - Converts UI date/time/station state into API request payloads and converts backend normalized data into the dashboard contract.
- Modify: `ui/index.html`
  - Moves `#station-panel` directly under `#mes-panel` input controls for the MES Daily workflow.
  - Changes KPI labels/order to `INPUT / FPY / OUTPUT / FAIL`.
  - Removes duplicate summary/list rendering under station charts if present.
- Modify: `ui/js/modules/mesdaily.js`
  - Requires station selection before search.
  - Calls `/api/mesdaily/query` for real WO searches and keeps `MOCK` on local demo data.
  - Sends the selected station list with the query.
- Modify: `ui/js/modules/defectDashboard.js`
  - Renders KPI order and values from `input`, `fpy`, `output`, `fail`.
  - Renders station chart as fail timeline only.
  - Renders one Summary Data table and makes `OUTPUT_QTY` neutral/white.
  - Renders Pareto with total counts plus WO breakdown metadata.
- Modify: `ui/js/modules/stations.js`
  - Ensures station panel state is available before MES Daily search and remains visible immediately below input panel.
- Create: `scratch/test_mesdaily_api_contract.ps1`
  - Static and fixture-based contract test for station-required query, payload shape, KPI order, no duplicate summary, and fail-only timeline chart.
- Create: `scratch/fixtures/mesdaily/VNPTH09.json`
  - Fixture copied from `C:\Users\PC\Downloads\VNPTH09.txt` with keys preserved.
- Create: `scratch/fixtures/mesdaily/VNPTH09DT.json`
  - Fixture copied from `C:\Users\PC\Downloads\VNPTH09DT.txt` with keys preserved.

Do not reintroduce the old deleted backend files as they were. The new backend should be a small proxy plus aggregator, not the previous large MES Daily backend.

---

### Task 1: Lock The MES API Contract

**Files:**
- Create: `scratch/fixtures/mesdaily/VNPTH09.json`
- Create: `scratch/fixtures/mesdaily/VNPTH09DT.json`
- Create: `scratch/test_mesdaily_api_contract.ps1`

- [ ] **Step 1: Create fixture directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path scratch/fixtures/mesdaily | Out-Null
Copy-Item -LiteralPath C:\Users\PC\Downloads\VNPTH09.txt -Destination scratch/fixtures/mesdaily/VNPTH09.json -Force
Copy-Item -LiteralPath C:\Users\PC\Downloads\VNPTH09DT.txt -Destination scratch/fixtures/mesdaily/VNPTH09DT.json -Force
```

Expected: both fixture files exist under `scratch/fixtures/mesdaily/`.

- [ ] **Step 2: Write the failing contract test**

Create `scratch/test_mesdaily_api_contract.ps1`:

```powershell
$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

function Read-Text($relativePath) {
    $path = Join-Path $repoRoot $relativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $relativePath"
    }
    return Get-Content -LiteralPath $path -Raw
}

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

$routes = Read-Text 'app/backend/server/routes.js'
$mesRoute = Read-Text 'app/backend/routes/mesdaily.routes.js'
$client = Read-Text 'app/backend/modules/mesdaily/mesCommandClient.js'
$aggregator = Read-Text 'app/backend/modules/mesdaily/mesDailyAggregator.js'
$adapter = Read-Text 'ui/js/modules/mesdailyApiData.js'
$mes = Read-Text 'ui/js/modules/mesdaily.js'
$dash = Read-Text 'ui/js/modules/defectDashboard.js'
$index = Read-Text 'ui/index.html'

Assert-True ($routes -match "mesdaily\.routes") 'Backend route registry must register mesdaily.routes.'
Assert-True ($mesRoute -match "router\.post\('/api/mesdaily/query'") 'MES route must expose POST /api/mesdaily/query.'
Assert-True ($client -match 'postMesCommand') 'MES command client must expose postMesCommand.'
Assert-True ($aggregator -match 'buildMesCommandPayloads') 'Aggregator must build command payloads.'
Assert-True ($aggregator -match 'normalizeMesKeys') 'Aggregator must normalize MES keys with trim().'
Assert-True ($aggregator -match 'VNPTH09DT') 'Aggregator must call/use VNPTH09DT.'
Assert-True ($aggregator -match 'VNPTH09') 'Aggregator must call/use VNPTH09.'
Assert-True ($aggregator -match 'station') 'Aggregator must require station input.'
Assert-True ($adapter -match 'buildMesDailyApiRequest') 'Frontend adapter must build request payload.'
Assert-True ($adapter -match 'toMesCommandHour') 'Frontend adapter must convert time to YYYYMMDDHH.'
Assert-True ($mes -match '/api/mesdaily/query') 'MES search must call backend query route for real searches.'
Assert-True ($mes -match 'MOCK') 'MES search must keep MOCK offline path.'
Assert-True ($mes -match 'getSelectedStations') 'MES search must read station selection.'
Assert-True ($mes -match 'Select at least one station') 'MES search must block when no station is selected.'
Assert-True ($index.IndexOf('id="station-panel"') -gt $index.IndexOf('id="mes-panel"')) 'station-panel should remain after mes-panel in DOM for existing code.'
Assert-True ($index -match 'INPUT[\s\S]*FPY[\s\S]*OUTPUT[\s\S]*FAIL') 'KPI labels must be ordered INPUT, FPY, OUTPUT, FAIL.'
Assert-True ($dash -match 'failTimeline') 'Station chart must use failTimeline from VNPTH09DT.'
Assert-True ($dash -notmatch "label:\s*'Input'[\s\S]*station-combo") 'Station timeline chart must not render hourly Input bars.'
Assert-True ($dash -notmatch "label:\s*'FPY \(%\)'[\s\S]*station-combo") 'Station timeline chart must not render hourly FPY line.'
Assert-True ($dash -match 'woBreakdown') 'Pareto data must preserve WO breakdown.'
Assert-True ($dash -match 'text-textMain|text-textDark|text-white') 'OUTPUT_QTY should use neutral/white text classes.'

$summarySectionCount = ([regex]::Matches($index, 'dashboard-summary-table-section')).Count
Assert-True ($summarySectionCount -eq 1) 'There must be exactly one Summary Data section.'

$fixtureSummary = Get-Content -LiteralPath (Join-Path $repoRoot 'scratch/fixtures/mesdaily/VNPTH09.json') -Raw | ConvertFrom-Json
$fixtureDetail = Get-Content -LiteralPath (Join-Path $repoRoot 'scratch/fixtures/mesdaily/VNPTH09DT.json') -Raw | ConvertFrom-Json
Assert-True ($fixtureSummary.Data.Count -gt 0) 'VNPTH09 fixture must contain Data rows.'
Assert-True ($fixtureDetail.Data.Count -gt 0) 'VNPTH09DT fixture must contain Data rows.'

Write-Host 'MES Daily API integration contract passed.'
```

- [ ] **Step 3: Run the test to verify it fails**

Run:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scratch/test_mesdaily_api_contract.ps1
```

Expected: FAIL with `Missing required file: app/backend/routes/mesdaily.routes.js` or another first missing integration file.

- [ ] **Step 4: Commit only test and fixtures**

```bash
git add scratch/test_mesdaily_api_contract.ps1 scratch/fixtures/mesdaily/VNPTH09.json scratch/fixtures/mesdaily/VNPTH09DT.json
git commit -m "test: define mesdaily api integration contract"
```

---

### Task 2: Add Backend MES Command Client

**Files:**
- Create: `app/backend/modules/mesdaily/mesCommandClient.js`
- Modify: `app/backend/server/config.js`

- [ ] **Step 1: Add MES API config defaults**

In `app/backend/server/config.js`, add `mesdailyApi` to `DEFAULT_APP_SETTINGS`:

```javascript
const DEFAULT_APP_SETTINGS = {
  server: { host: '0.0.0.0', port: 5000 },
  upload: { maxFileSizeMb: 50, tempFolderName: 'clca_generator_uploads' },
  ui: { defaultLanguage: 'en', defaultTheme: 'system' },
  quicklog: { openLogCacheMax: 500, logTimeToleranceSeconds: 5, returnCheckedPathsOnFail: true, deriveLogPathFromSourceFile: true },
  browseSave: { timeoutMs: 12000 },
  mesdailyApi: {
    url: '',
    timeoutMs: 30000,
    maxConcurrent: 3
  }
};
```

Then add this function before `module.exports`:

```javascript
function getMesDailyApiConfig() {
  const cfg = APP_SETTINGS.mesdailyApi || {};
  return {
    url: String(process.env.MESDAILY_API_URL || cfg.url || '').trim(),
    timeoutMs: toPositiveInteger(process.env.MESDAILY_API_TIMEOUT_MS || cfg.timeoutMs, 30000),
    maxConcurrent: toPositiveInteger(process.env.MESDAILY_API_MAX_CONCURRENT || cfg.maxConcurrent, 3),
  };
}
```

Add `getMesDailyApiConfig` to `module.exports`.

- [ ] **Step 2: Create MES command client**

Create `app/backend/modules/mesdaily/mesCommandClient.js`:

```javascript
'use strict';

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
}

async function postMesCommand(config, payload) {
  const url = String(config && config.url || '').trim();
  if (!url) {
    throw new Error('MES Daily API URL is not configured.');
  }

  const timeoutMs = Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 30000;
  const { controller, timer } = createTimeoutSignal(timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      throw new Error(`MES Daily API returned non-JSON response: ${text.slice(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(`MES Daily API HTTP ${response.status}: ${data && data.Message ? data.Message : response.statusText}`);
    }

    if (!data || data.Result === false) {
      throw new Error(`MES Daily API failed: ${data && data.Message ? data.Message : 'Unknown MES error'}`);
    }

    return data;
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error(`MES Daily API timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  postMesCommand,
};
```

- [ ] **Step 3: Run syntax checks**

Run:

```powershell
node -c app/backend/server/config.js
node -c app/backend/modules/mesdaily/mesCommandClient.js
```

Expected: no output and exit code 0.

- [ ] **Step 4: Commit**

```bash
git add app/backend/server/config.js app/backend/modules/mesdaily/mesCommandClient.js
git commit -m "feat: add mesdaily command client"
```

---

### Task 3: Add Backend Aggregator For VNPTH09 And VNPTH09DT

**Files:**
- Create: `app/backend/modules/mesdaily/mesDailyAggregator.js`
- Create: `scratch/test_mesdaily_aggregator.js`

- [ ] **Step 1: Write Node fixture test**

Create `scratch/test_mesdaily_aggregator.js`:

```javascript
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
```

- [ ] **Step 2: Create aggregator module**

Create `app/backend/modules/mesdaily/mesDailyAggregator.js`:

```javascript
'use strict';

function normalizeMesKeys(row) {
  const out = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    out[String(key || '').trim()] = value;
  });
  return out;
}

function toMesNumber(value) {
  const clean = String(value ?? '').replace('%', '').replace(/,/g, '').trim();
  if (!clean) return 0;
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function normalizeList(values) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)));
}

function validateQueryInput({ woList, from, to, stations }) {
  const cleanWo = normalizeList(woList);
  const cleanStations = normalizeList(stations);
  if (!cleanWo.length) throw new Error('At least one WO is required.');
  if (!cleanStations.length) throw new Error('Select at least one station.');
  if (!/^\d{10}$/.test(String(from || ''))) throw new Error('From time must use YYYYMMDDHH.');
  if (!/^\d{10}$/.test(String(to || ''))) throw new Error('To time must use YYYYMMDDHH.');
  return { woList: cleanWo, from: String(from), to: String(to), stations: cleanStations };
}

function buildCommand(command, inputData) {
  return { Data: [{ Command: command, InputData: inputData }] };
}

function buildMesCommandPayloads(query) {
  const clean = validateQueryInput(query);
  const summary = [];
  const detail = [];
  clean.woList.forEach((wo) => {
    clean.stations.forEach((station) => {
      const inputData = `${wo},${clean.from},${clean.to},${station}`;
      summary.push({ command: 'VNPTH09', wo, station, payload: buildCommand('VNPTH09', inputData) });
      detail.push({ command: 'VNPTH09DT', wo, station, payload: buildCommand('VNPTH09DT', inputData) });
    });
  });
  return { ...clean, summary, detail };
}

function getDataRows(response) {
  return Array.isArray(response && response.Data) ? response.Data.map(normalizeMesKeys) : [];
}

function hourLabel(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/\s(\d{2}):/);
  return match ? `${match[1]}:00` : 'Unknown';
}

function statusToResult(status) {
  const text = String(status || '').trim();
  return text || 'FAIL';
}

function aggregateMesDailyData({ summaryResponses, detailResponses }) {
  const summaryRows = [];
  const stationMap = new Map();
  const detailRows = [];
  const defectMap = new Map();
  const hourlyMap = new Map();

  (Array.isArray(summaryResponses) ? summaryResponses : []).forEach((item) => {
    getDataRows(item.response).forEach((row) => {
      const station = row.PROCESS_NAME || item.station || 'Unknown';
      const input = toMesNumber(row.INPUT_QTY);
      const fail = toMesNumber(row.FAIL_QTY);
      const output = toMesNumber(row.OUTPUT_QTY);
      const defectQty = toMesNumber(row.DEFECT_QTY);
      const current = stationMap.get(station) || {
        station,
        model: row.MODEL_NAME || 'N/A',
        input: 0,
        fail: 0,
        output: 0,
        defectQty: 0,
      };
      current.input += input;
      current.fail += fail;
      current.output += output;
      current.defectQty += defectQty;
      stationMap.set(station, current);
      summaryRows.push({
        wo: item.wo,
        station,
        model: row.MODEL_NAME || 'N/A',
        processName: row.PROCESS_NAME || station,
        input,
        fail,
        failP: toMesNumber(row.FAIL_P),
        passP: toMesNumber(row.PASS_P),
        defectQty,
        failD: toMesNumber(row.FAIL_D),
        passD: toMesNumber(row.PASS_D),
        output,
      });
    });
  });

  (Array.isArray(detailResponses) ? detailResponses : []).forEach((item) => {
    getDataRows(item.response).forEach((row) => {
      const station = row.PROCESS_NAME || item.station || 'Unknown';
      const wo = row.WORK_ORDER || item.wo || '';
      const code = row.DEFECT_CODE || 'UNKNOWN';
      const hour = hourLabel(row.DEFECT_TIME);
      detailRows.push({
        SN: row.SERIAL_NUMBER || '',
        Serial: row.SERIAL_NUMBER || '',
        Terminal: row.TERMINAL_NAME || station,
        Station: station,
        Result: statusToResult(row.STATUS),
        DefectCode: code,
        WO: wo,
        WorkOrder: wo,
        Description: row.DEFECT_DESC || '',
        Time: row.DEFECT_TIME || '',
        Status: row.STATUS || '',
      });

      const defect = defectMap.get(code) || { code, count: 0, woBreakdown: {} };
      defect.count += 1;
      defect.woBreakdown[wo || 'Unknown'] = (defect.woBreakdown[wo || 'Unknown'] || 0) + 1;
      defectMap.set(code, defect);

      const stationHours = hourlyMap.get(station) || {};
      stationHours[hour] = (stationHours[hour] || 0) + 1;
      hourlyMap.set(station, stationHours);
    });
  });

  const stationYield = Array.from(stationMap.values()).map((item) => ({
    ...item,
    yield: item.input ? Number(((item.output / item.input) * 100).toFixed(1)) : 0,
    fpy: item.input ? Number((((item.input - item.fail) / item.input) * 100).toFixed(1)) : 0,
    failP: item.input ? Number(((item.fail / item.input) * 100).toFixed(1)) : 0,
    passP: item.input ? Number(((item.output / item.input) * 100).toFixed(1)) : 0,
    failD: item.input ? Number(((item.defectQty / item.input) * 100).toFixed(1)) : 0,
    passD: item.input ? Number(((item.output / item.input) * 100).toFixed(1)) : 0,
  }));

  const totals = stationYield.reduce((acc, item) => {
    acc.input += item.input;
    acc.output += item.output;
    acc.fail += item.fail;
    return acc;
  }, { input: 0, output: 0, fail: 0 });

  const stationHourlyTrend = {};
  hourlyMap.forEach((hours, station) => {
    stationHourlyTrend[station] = Object.entries(hours)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, fail]) => ({ hour, fail }));
  });

  return {
    success: true,
    kpis: {
      input: totals.input,
      output: totals.output,
      fail: totals.fail,
      fpy: totals.input ? Number((((totals.input - totals.fail) / totals.input) * 100).toFixed(1)) : 0,
    },
    summaryRows,
    defectRows: detailRows,
    topDefects: Array.from(defectMap.values()).sort((a, b) => b.count - a.count).slice(0, 10),
    stationYield,
    stationHourlyTrend,
  };
}

module.exports = {
  normalizeMesKeys,
  toMesNumber,
  validateQueryInput,
  buildMesCommandPayloads,
  aggregateMesDailyData,
};
```

- [ ] **Step 3: Run fixture test**

Run:

```powershell
node scratch/test_mesdaily_aggregator.js
```

Expected: `MES Daily aggregator fixture test passed.`

- [ ] **Step 4: Commit**

```bash
git add app/backend/modules/mesdaily/mesDailyAggregator.js scratch/test_mesdaily_aggregator.js
git commit -m "feat: aggregate mesdaily command responses"
```

---

### Task 4: Add Backend Query Route

**Files:**
- Create: `app/backend/routes/mesdaily.routes.js`
- Modify: `app/backend/server/routes.js`

- [ ] **Step 1: Create route module**

Create `app/backend/routes/mesdaily.routes.js`:

```javascript
'use strict';

const express = require('express');
const { getMesDailyApiConfig } = require('../server/config');
const { postMesCommand } = require('../modules/mesdaily/mesCommandClient');
const { buildMesCommandPayloads, aggregateMesDailyData } = require('../modules/mesdaily/mesDailyAggregator');

async function runLimited(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
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
```

- [ ] **Step 2: Register route**

In `app/backend/server/routes.js`, add import:

```javascript
const createMesDailyRoutes = require('../routes/mesdaily.routes');
```

Then register between CLCA and QuickLog routes:

```javascript
  app.use(createClcaRoutes(routeContext));
  app.use(createMesDailyRoutes(routeContext));
  app.use(createQuickLogRoutes(routeContext));
  app.use(createLogZipRoutes(routeContext));
```

- [ ] **Step 3: Run syntax checks**

Run:

```powershell
node -c app/backend/routes/mesdaily.routes.js
node -c app/backend/server/routes.js
```

Expected: no output and exit code 0.

- [ ] **Step 4: Run contract test**

Run:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scratch/test_mesdaily_api_contract.ps1
```

Expected after Task 4: may still fail on frontend adapter/UI assertions, but backend route/client/aggregator assertions should pass.

- [ ] **Step 5: Commit**

```bash
git add app/backend/routes/mesdaily.routes.js app/backend/server/routes.js
git commit -m "feat: expose mesdaily query route"
```

---

### Task 5: Add Frontend API Adapter And Search Validation

**Files:**
- Create: `ui/js/modules/mesdailyApiData.js`
- Modify: `ui/index.html`
- Modify: `ui/js/modules/mesdaily.js`

- [ ] **Step 1: Load API adapter before `mesdaily.js`**

In `ui/index.html`, add the new script after `mesdailyDemoData.js` and before `defectDashboard.js`:

```html
    <script src="js/modules/mesdailyDemoData.js"></script>
    <script src="js/modules/mesdailyApiData.js"></script>
    <script src="js/modules/defectDashboard.js"></script>
    <script src="js/modules/mesdaily.js"></script>
```

- [ ] **Step 2: Create frontend adapter**

Create `ui/js/modules/mesdailyApiData.js`:

```javascript
'use strict';

function toMesCommandHour(dateText, hourText) {
    const date = String(dateText || '').trim().replace(/-/g, '');
    const hour = String(hourText || '').trim().slice(0, 2).padStart(2, '0');
    if (!/^\d{8}$/.test(date)) throw new Error('Date must use YYYY-MM-DD.');
    if (!/^\d{2}$/.test(hour)) throw new Error('Hour must use HH:mm.');
    return `${date}${hour}`;
}

function buildMesDailyApiRequest({ woList, stations, dateFrom, hourFrom, dateTo, hourTo }) {
    const cleanWo = Array.from(new Set((Array.isArray(woList) ? woList : []).map(v => String(v || '').trim()).filter(Boolean)));
    const cleanStations = Array.from(new Set((Array.isArray(stations) ? stations : []).map(v => String(v || '').trim()).filter(Boolean)));
    if (!cleanWo.length) throw new Error('WO Input is required.');
    if (!cleanStations.length) throw new Error('Select at least one station.');
    return {
        woList: cleanWo,
        stations: cleanStations,
        from: toMesCommandHour(dateFrom, hourFrom),
        to: toMesCommandHour(dateTo, hourTo),
    };
}

function normalizeMesDailyApiDashboard(data) {
    if (!data || data.success === false) throw new Error(data && data.message ? data.message : 'MES Daily query failed.');
    return {
        success: true,
        kpis: data.kpis || { input: 0, fpy: 0, output: 0, fail: 0 },
        summaryRows: Array.isArray(data.summaryRows) ? data.summaryRows : [],
        defectRows: Array.isArray(data.defectRows) ? data.defectRows : [],
        topDefects: Array.isArray(data.topDefects) ? data.topDefects : [],
        stationYield: Array.isArray(data.stationYield) ? data.stationYield : [],
        stationHourlyTrend: data.stationHourlyTrend || {},
        alerts: Array.isArray(data.alerts) ? data.alerts : [],
    };
}
```

- [ ] **Step 3: Replace `searchMesDashboard` real path**

In `ui/js/modules/mesdaily.js`, replace the body of `searchMesDashboard` with:

```javascript
async function searchMesDashboard() {
    ensureMesR001Panel();
    ensureMesR001TimeRange();
    syncMesR001HiddenRange();

    const input = document.getElementById('mes-r001-wo-input');
    const woText = String(input?.value || '').trim();
    const woList = parseMesR001WoInput(woText);
    const isMock = woList.length === 1 && String(woList[0]).toUpperCase() === 'MOCK';

    if (!woList.length) {
        const summary = document.getElementById('mes-r001-summary');
        if (summary) summary.textContent = t('mesR001NeedWo');
        logToConsole(t('mesR001NeedWo'), 'warning');
        showImportantToast('warning', t('reqFailed'), t('mesR001NeedWo'));
        return;
    }

    const stations = typeof getSelectedStations === 'function' ? Array.from(getSelectedStations()) : [];
    if (!isMock && !stations.length) {
        const message = 'Select at least one station.';
        const summary = document.getElementById('mes-r001-summary');
        if (summary) summary.textContent = message;
        logToConsole(message, 'warning');
        showImportantToast('warning', t('reqFailed'), message);
        return;
    }

    try {
        setMesBentoDashboardState('loading');
        setMesR001SearchLoading(true);
        setStatus('generating', isMock ? 'Building frontend demo data...' : 'Querying MES Daily API...');
        showProgress();
        mesR001Rows = [];
        mesR001SelectedIndex = -1;
        renderMesR001Rows([]);

        let dashboardData;
        if (isMock) {
            if (typeof buildMesDailyDemoRows !== 'function') throw new Error('buildMesDailyDemoRows not available');
            mesR001Rows = buildMesDailyDemoRows(woList);
            dashboardData = typeof buildMesDailyDemoDashboardData === 'function'
                ? buildMesDailyDemoDashboardData(mesR001Rows)
                : { success: true, defectRows: mesR001Rows };
        } else {
            if (typeof buildMesDailyApiRequest !== 'function') throw new Error('buildMesDailyApiRequest not available');
            const requestBody = buildMesDailyApiRequest({
                woList,
                stations,
                dateFrom: document.getElementById('mes-r001-datefrom')?.value || '',
                hourFrom: document.getElementById('mes-r001-hourfrom')?.value || '',
                dateTo: document.getElementById('mes-r001-dateto')?.value || '',
                hourTo: document.getElementById('mes-r001-hourto')?.value || '',
            });
            const response = await fetch('/api/mesdaily/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const raw = await response.json();
            if (!response.ok || raw.success === false) throw new Error(raw.message || `MES Daily API HTTP ${response.status}`);
            dashboardData = normalizeMesDailyApiDashboard(raw);
            mesR001Rows = dashboardData.defectRows || [];
        }

        renderMesR001Rows(mesR001Rows);
        completeProgress();
        setStatus('success', isMock ? 'Frontend demo data loaded' : 'MES Daily data loaded');
        logToConsole(`MES Daily loaded. Rows: <b>${mesR001Rows.length}</b>`, 'success');
        saveMesR001History(woText);

        if (typeof renderDashboardOverviewFromData === 'function') {
            renderDashboardOverviewFromData({ ...dashboardData, defectRows: mesR001Rows });
        }

        setMesBentoDashboardState('ready');
        document.getElementById('mes-bento-dashboard')?.classList.remove('hidden');
        document.getElementById('mes-defect-records-section')?.classList.remove('hidden');
    } catch (error) {
        setMesBentoDashboardState('error', error.message || String(error));
        resetProgress();
        const message = error.message || String(error);
        mesR001Rows = [];
        mesR001SelectedIndex = -1;
        renderMesR001Rows([]);
        setStatus('error', t('reqFailed'));
        logToConsole(`Dashboard search failed: ${message}`, 'error');
        showImportantToast('error', t('reqFailed'), message);
    } finally {
        setMesR001SearchLoading(false);
        resetProgress();
    }
}
```

- [ ] **Step 4: Run syntax checks**

Run:

```powershell
node -c ui/js/modules/mesdailyApiData.js
node -c ui/js/modules/mesdaily.js
```

Expected: no output and exit code 0.

- [ ] **Step 5: Commit**

```bash
git add ui/index.html ui/js/modules/mesdailyApiData.js ui/js/modules/mesdaily.js
git commit -m "feat: query mesdaily api from frontend"
```

---

### Task 6: Move Station Panel Into Required Workflow

**Files:**
- Modify: `ui/index.html`
- Modify: `ui/js/modules/stations.js`
- Modify: `ui/js/modules/mesdaily.js`

- [ ] **Step 1: Move station panel under input panel**

In `ui/index.html`, move the whole `<section id="station-panel" ...>` block so it appears immediately after the MES input control section and before `<!-- Tier 2: Bento Dashboard -->`.

The resulting order inside the main content should be:

```html
<div id="mes-panel" class="hidden flex-col gap-5 w-full max-w-[1400px] mx-auto">
    <!-- Tier 1: Control Bar -->
    <section class="glass-card ...">...</section>

    <section id="station-panel" class="glass-card rounded-xl border border-borderLight dark:border-borderDark overflow-hidden">
        ...
    </section>

    <!-- Tier 2: Bento Dashboard -->
    <section id="mes-bento-dashboard" class="grid grid-cols-12 gap-5">
        ...
    </section>
    ...
</div>
```

Remove the original `station-panel` block from its old location outside or below `#mes-panel`.

- [ ] **Step 2: Ensure station panel is visible for MES Daily**

In `ui/js/modules/mesdaily.js`, keep the existing show behavior but remove assumptions that station panel is outside `#mes-panel`. The `showMesDaily` logic should leave this line valid:

```javascript
if (isMesDaily && stationPanel) stationPanel.classList.remove('hidden');
```

Do not add another station panel clone.

- [ ] **Step 3: Run DOM contract grep**

Run:

```powershell
$index = Get-Content ui/index.html -Raw
if (($index | Select-String 'id="station-panel"' -AllMatches).Matches.Count -ne 1) { throw 'station-panel must appear exactly once' }
if ($index.IndexOf('id="station-panel"') -lt $index.IndexOf('id="mes-panel"')) { throw 'station-panel must be inside/after mes-panel start' }
if ($index.IndexOf('id="station-panel"') -gt $index.IndexOf('id="mes-bento-dashboard"')) { throw 'station-panel must be before bento dashboard' }
Write-Host 'Station panel order contract passed.'
```

Expected: `Station panel order contract passed.`

- [ ] **Step 4: Commit**

```bash
git add ui/index.html ui/js/modules/mesdaily.js ui/js/modules/stations.js
git commit -m "refactor: require station selection before mesdaily dashboard"
```

---

### Task 7: Update KPI Labels And Summary Rendering

**Files:**
- Modify: `ui/index.html`
- Modify: `ui/js/modules/defectDashboard.js`

- [ ] **Step 1: Change KPI labels/order in HTML**

In `ui/index.html`, update the four KPI cards so the visible labels and IDs are:

```html
<span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">INPUT</span>
<span id="dashboard-kpi-input" class="text-3xl font-display font-bold text-primary dark:text-secondary">-</span>

<span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">FPY</span>
<span id="dashboard-kpi-fpy" class="text-3xl font-display font-bold text-green-600 dark:text-green-400">-%</span>

<span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">OUTPUT</span>
<span id="dashboard-kpi-output" class="text-3xl font-display font-bold text-textMain dark:text-textDark">-</span>

<span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">FAIL</span>
<span id="dashboard-kpi-fail" class="text-3xl font-display font-bold text-red-600 dark:text-red-400">-</span>
```

Remove or stop using old IDs:

```html
dashboard-kpi-yield
dashboard-kpi-defects
```

- [ ] **Step 2: Update KPI renderer**

In `ui/js/modules/defectDashboard.js`, replace the KPI update block in `_renderOverviewContent` with:

```javascript
    if (k) {
        const elInput = document.getElementById('dashboard-kpi-input');
        const elFpy = document.getElementById('dashboard-kpi-fpy');
        const elOutput = document.getElementById('dashboard-kpi-output');
        const elFail = document.getElementById('dashboard-kpi-fail');
        const input = k.input ?? k.totalInput ?? '-';
        const fpy = k.fpy ?? k.firstPassYield ?? k.totalYield ?? k.yield ?? '-';
        const output = k.output ?? k.totalOutput ?? '-';
        const fail = k.fail ?? k.defects ?? k.totalDefects ?? '-';
        if (elInput) elInput.textContent = String(input);
        if (elFpy) {
            elFpy.textContent = fpy === '-' ? '-%' : `${fpy}%`;
            elFpy.classList.toggle('text-red-600', Number(fpy) < 90);
            elFpy.classList.toggle('dark:text-red-400', Number(fpy) < 90);
            elFpy.classList.toggle('text-yellow-600', Number(fpy) >= 90 && Number(fpy) < 95);
            elFpy.classList.toggle('dark:text-yellow-400', Number(fpy) >= 90 && Number(fpy) < 95);
            elFpy.classList.toggle('text-green-600', Number(fpy) >= 95);
            elFpy.classList.toggle('dark:text-green-400', Number(fpy) >= 95);
        }
        if (elOutput) elOutput.textContent = String(output);
        if (elFail) elFail.textContent = String(fail);
    }
```

- [ ] **Step 3: Render Summary Data from `summaryRows` once**

In `_renderSummaryTable(data)`, replace the full function with:

```javascript
function _renderSummaryTable(data) {
    const tbody = document.getElementById('dashboard-summary-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    const rows = Array.isArray(data.summaryRows) && data.summaryRows.length
        ? data.summaryRows
        : (data.stationYield || []).map(st => ({
            model: st.model || 'N/A',
            processName: st.station,
            input: st.input || 0,
            fail: st.fail || 0,
            failP: st.failP || 0,
            passP: st.passP || st.fpy || st.yield || 0,
            defectQty: st.defectQty || st.fail || 0,
            failD: st.failD || st.failP || 0,
            passD: st.passD || st.passP || 0,
            output: st.output || Math.max(0, (st.input || 0) - (st.fail || 0)),
        }));

    rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-800/50';
        tr.innerHTML = `
            <td class="px-4 py-2">${_dashEscape(row.model || 'N/A')}</td>
            <td class="px-4 py-2 font-semibold">${_dashEscape(row.processName || row.station || 'N/A')}</td>
            <td class="px-4 py-2">${row.input || 0}</td>
            <td class="px-4 py-2 text-red-500">${row.fail || 0}</td>
            <td class="px-4 py-2">${row.failP || 0}%</td>
            <td class="px-4 py-2 text-green-500">${row.passP || 0}%</td>
            <td class="px-4 py-2">${row.defectQty || 0}</td>
            <td class="px-4 py-2">${row.failD || 0}%</td>
            <td class="px-4 py-2">${row.passD || 0}%</td>
            <td class="px-4 py-2 font-semibold text-textMain dark:text-textDark">${row.output || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}
```

- [ ] **Step 4: Run contract test**

Run:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scratch/test_mesdaily_api_contract.ps1
```

Expected after Task 7: KPI and summary assertions pass. Remaining failures may be station chart/Pareto if not done yet.

- [ ] **Step 5: Commit**

```bash
git add ui/index.html ui/js/modules/defectDashboard.js
git commit -m "refactor: update mesdaily kpis and summary table"
```

---

### Task 8: Fix Pareto And Station Charts For Multi-WO Multi-Station

**Files:**
- Modify: `ui/js/modules/defectDashboard.js`

- [ ] **Step 1: Replace station chart renderer with fail-only timeline**

In `_renderStationDashboards(data, isDark)`, replace the combo chart dataset block with fail-only bar data:

```javascript
        const comboCtx = document.getElementById(`station-combo-${idx}`);
        const trend = data.stationHourlyTrend && data.stationHourlyTrend[st.station] ? data.stationHourlyTrend[st.station] : [];
        if (comboCtx && trend.length) {
            const comboChart = new Chart(comboCtx, {
                type: 'bar',
                data: {
                    labels: trend.map(t => t.hour),
                    datasets: [
                        {
                            label: 'Fail',
                            data: trend.map(t => t.fail),
                            backgroundColor: '#ef4444cc',
                            borderColor: '#ef4444',
                            borderWidth: 1,
                            borderRadius: 4,
                            yAxisID: 'y'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: isDark ? '#cbd5e1' : '#475569' } },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `Fail: ${ctx.raw}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            position: 'left',
                            beginAtZero: true,
                            title: { display: true, text: 'Fail count' },
                            ticks: { precision: 0 }
                        }
                    }
                }
            });
            _dashboardOverviewCharts[`st-combo-${idx}`] = comboChart;
        }
```

- [ ] **Step 2: Make station doughnut use defect distribution when available**

In `_renderStationDashboards`, before creating the doughnut, derive station defects:

```javascript
        const stationDefects = (data.defectRows || [])
            .filter(row => String(row.Station || row.Terminal || '') === String(st.station))
            .reduce((acc, row) => {
                const code = row.DefectCode || 'UNKNOWN';
                acc[code] = (acc[code] || 0) + 1;
                return acc;
            }, {});
        const pieLabels = Object.keys(stationDefects).slice(0, 5);
        const pieValues = pieLabels.map(label => stationDefects[label]);
```

Then replace doughnut data:

```javascript
                    labels: pieLabels.length ? pieLabels : ['No defects'],
                    datasets: [{
                        data: pieValues.length ? pieValues : [1],
                        backgroundColor: pieValues.length ? _CHART_COLORS.slice(0, pieValues.length) : ['#94a3b8']
                    }]
```

- [ ] **Step 3: Add WO breakdown to Pareto tooltip**

In `_renderTopDefectsChart(defects, isDark)`, replace tooltip options with:

```javascript
                tooltip: {
                    callbacks: {
                        afterLabel: (context) => {
                            const item = defects[context.dataIndex];
                            if (!item || !item.woBreakdown) return '';
                            return Object.entries(item.woBreakdown)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([wo, count]) => `${wo}: ${count}`)
                                .join('\n');
                        }
                    }
                }
```

Keep total count as the main bar value. Do not average by WO in this task.

- [ ] **Step 4: Run syntax and contract tests**

Run:

```powershell
node -c ui/js/modules/defectDashboard.js
powershell.exe -ExecutionPolicy Bypass -File scratch/test_mesdaily_api_contract.ps1
```

Expected: chart and Pareto assertions pass.

- [ ] **Step 5: Commit**

```bash
git add ui/js/modules/defectDashboard.js
git commit -m "fix: render mesdaily station fail timeline"
```

---

### Task 9: Full Verification And Startup Smoke

**Files:**
- Test only

- [ ] **Step 1: Run all MES Daily integration tests**

Run:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scratch/test_mesdaily_api_contract.ps1
node scratch/test_mesdaily_aggregator.js
```

Expected:

```text
MES Daily API integration contract passed.
MES Daily aggregator fixture test passed.
```

- [ ] **Step 2: Run syntax checks**

Run:

```powershell
node -c app/backend/modules/mesdaily/mesCommandClient.js
node -c app/backend/modules/mesdaily/mesDailyAggregator.js
node -c app/backend/routes/mesdaily.routes.js
node -c app/backend/server/config.js
node -c app/backend/server/routes.js
node -c server.js
node -c ui/js/modules/mesdailyApiData.js
node -c ui/js/modules/mesdaily.js
node -c ui/js/modules/defectDashboard.js
node -c ui/js/modules/stations.js
```

Expected: no output and exit code 0 for every command.

- [ ] **Step 3: Run backend startup smoke**

Run:

```powershell
$env:PORT = "5056"
$proc = Start-Process -FilePath node -ArgumentList "server.js" -WorkingDirectory "C:\Users\PC\Downloads\clca" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3
if ($proc.HasExited) { throw "server.js exited early with code $($proc.ExitCode)" }
try {
    Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:5056/api/health" -TimeoutSec 5 | Select-Object -ExpandProperty StatusCode
} finally {
    Stop-Process -Id $proc.Id -Force
    Remove-Item Env:\PORT -ErrorAction SilentlyContinue
}
```

Expected: prints `200`.

- [ ] **Step 4: Manual browser checks**

Open the app and verify:

```text
http://127.0.0.1:5000
```

Manual expectations:
- Station panel appears directly under MES Daily input panel.
- Search with real WO and no station shows `Select at least one station.`
- Search with `MOCK` still loads demo data without station requirement.
- Search with real WO and selected station sends `POST /api/mesdaily/query`.
- KPI order is `INPUT / FPY / OUTPUT / FAIL`.
- Only one Summary Data table appears.
- `OUTPUT_QTY` text is neutral/white, not blue.
- Station chart timeline shows Fail only.
- Pareto tooltip shows WO breakdown for defect codes.

- [ ] **Step 5: Run diff check**

Run:

```powershell
git diff --check
```

Expected: no whitespace errors. CRLF warnings are acceptable if they are the only output.

- [ ] **Step 6: Commit verification notes if docs were updated**

If you update any manual test docs, commit them:

```bash
git add scratch/test_bento_browser_manual.md
git commit -m "test: document mesdaily api browser checks"
```

If no docs changed, skip this commit.

---

## Self-Review

**Spec coverage:**
- Station-required command input: Tasks 1, 3, 5, 6 validate and enforce station selection.
- Command format `WO,YYYYMMDDHH,YYYYMMDDHH,STATION`: Tasks 3 and 5 build this format on backend/frontend.
- Use `VNPTH09` for total Input/Output/Fail/FPY: Task 3 aggregation and Task 7 KPI rendering.
- Use `VNPTH09DT` for defect distribution and fail timeline: Task 3 aggregation and Task 8 chart rendering.
- KPI order `INPUT / FPY / OUTPUT / FAIL`: Task 7.
- Station panel under input panel: Task 6.
- Summary duplicate removal and one table only: Task 7 contract and renderer.
- `OUTPUT_QTY` neutral/white: Task 7 renderer.
- Pareto multi-WO imbalance handling with total count plus WO breakdown: Task 8.
- Chart by total time only with fail timeline, no hourly input/output: Task 8.

**Placeholder scan:**
- No step uses incomplete placeholder wording.
- Every code-writing step includes concrete code or exact replacement snippets.
- Every test step includes exact command and expected result.

**Type consistency:**
- Backend normalized response uses `kpis.input`, `kpis.output`, `kpis.fail`, `kpis.fpy`, `summaryRows`, `defectRows`, `topDefects`, `stationYield`, and `stationHourlyTrend`.
- Frontend adapter preserves the same names.
- Dashboard renderer reads the same names and keeps old demo fallback aliases where useful.
