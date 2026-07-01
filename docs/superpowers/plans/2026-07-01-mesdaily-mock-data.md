# MES Daily Mock Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Defect Analytics always visible and add a mock data endpoint for MES Daily dashboard testing.

**Architecture:** We will inject a `mock: true` flag from the frontend search request. The backend will intercept this flag at the `/api/mesdaily/dashboard` endpoint and return a pre-built static data object `buildMockDashboardData` containing realistic KPI, yield, and defect data. The frontend will also be updated to ensure the `mes-defect-analytics-section` is always visible in the DOM.

**Tech Stack:** Node.js, Express, Vanilla JS, HTML

## Global Constraints

- No changes to the existing type system or database schema.
- The mock data must conform exactly to the current `buildDashboardData` return schema.
- Track all files modified for mock purposes in a text file so they can be easily reverted later.

---

### Task 1: Add Mock Data Endpoint Logic

**Files:**
- Modify: `routes/mesdaily.routes.js`

**Interfaces:**
- Consumes: JSON body with `mock: true` and `woText`.
- Produces: JSON response matching the `buildDashboardData` schema.

- [ ] **Step 1: Add `buildMockDashboardData` function**

Inject this function before the `/api/mesdaily/dashboard` route definition.

```javascript
  function buildMockDashboardData(woText) {
    const wos = woText ? woText.split(/[\s,]+/).filter(Boolean) : ['WO1', 'WO2', 'WO3'];
    return {
      success: true,
      summary: { workOrders: wos, recordCount: 150 },
      kpis: { totalYield: 95.5, output: 1500, defects: 45, fpy: 92.1, passCount: 1455, failCount: 45, inputCount: 1500 },
      yieldTrend: [
        { date: '2026-07-01', yield: 95.0 },
        { date: '2026-07-02', yield: 96.2 },
        { date: '2026-07-03', yield: 94.8 }
      ],
      topDefects: [
        { code: 'D001', desc: 'Scratch', count: 20, pct: 44.4 },
        { code: 'D002', desc: 'Dent', count: 15, pct: 33.3 },
        { code: 'D003', desc: 'No Power', count: 10, pct: 22.2 }
      ],
      stationYield: [
        { station: 'SMT', yield: 98.5, input: 1500, fail: 22 },
        { station: 'FATP', yield: 97.0, input: 1478, fail: 23 }
      ],
      defectRows: [
        { SerialNumber: 'SN001', WorkOrder: wos[0] || 'WO1', Station: 'SMT', Terminal: 'T1', DefectCode: 'D001', DefectDesc: 'Scratch', Time: '2026-07-01 10:00:00', Status: 'FAIL' },
        { SerialNumber: 'SN002', WorkOrder: wos[0] || 'WO1', Station: 'FATP', Terminal: 'T2', DefectCode: 'D002', DefectDesc: 'Dent', Time: '2026-07-01 10:05:00', Status: 'FAIL' },
        { SerialNumber: 'SN003', WorkOrder: wos[1] || 'WO2', Station: 'SMT', Terminal: 'T1', DefectCode: 'D003', DefectDesc: 'No Power', Time: '2026-07-01 10:10:00', Status: 'FAIL' }
      ],
      alerts: [
        { level: 'warning', message: 'High defect rate at SMT', station: 'SMT' }
      ]
    };
  }
```

- [ ] **Step 2: Update `/api/mesdaily/dashboard` to use mock data**

Modify the route handler to check for `body.mock`:

```javascript
  router.post('/api/mesdaily/dashboard', async (req, res) => {
    try {
      const body = req.body || {};
      if (body.mock) {
        return res.json(buildMockDashboardData(body.woText || body.wo || body.workOrders || ''));
      }
      
      const result = await buildDashboardData({
        woText: body.woText || body.wo || body.workOrders || '',
        // ... rest of existing code ...
```

- [ ] **Step 3: Syntax check**

Run: `node -c routes/mesdaily.routes.js`
Expected: PASS

---

### Task 2: Frontend JS Updates

**Files:**
- Modify: `ui/js/modules/mesdaily.js`

**Interfaces:**
- Consumes: User click on Fetch Dashboard.
- Produces: POST request with `mock: true`.

- [ ] **Step 1: Update `searchMesDashboard()` payload**

Add `mock: true` to the fetch body:

```javascript
        const response = await fetchRetry('/api/mesdaily/dashboard', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                mock: true, 
                woText, 
                timefrom: document.getElementById('mes-r001-timefrom')?.value || '', 
                timeto: document.getElementById('mes-r001-timeto')?.value || '', 
                selected_stations: selectedStations 
            }) 
        }, MAX_RETRIES);
```

- [ ] **Step 2: Stop toggling `analyticsSection` visibility in `applyMesDailyFeatureVisibility()`**

Remove or comment out the toggle line for `analyticsSection`:
```javascript
    // if (analyticsSection) analyticsSection.classList.toggle('hidden', !isMesDaily || !hasData);
    if (analyticsSection) analyticsSection.classList.toggle('hidden', !isMesDaily);
```

- [ ] **Step 3: Stop removing/adding `hidden` on clear and search**

In `clearMesR001Panel()`:
Remove: `document.getElementById('mes-defect-analytics-section')?.classList.add('hidden');`

In `searchMesDashboard()`:
Remove: `document.getElementById('mes-defect-analytics-section')?.classList.remove('hidden');`

- [ ] **Step 4: Syntax check**

Run: `node -c ui/js/modules/mesdaily.js`
Expected: PASS

---

### Task 3: HTML Updates

**Files:**
- Modify: `ui/index.html`

- [ ] **Step 1: Remove `hidden` class from Analytics Section**

Find `<section id="mes-defect-analytics-section"` and remove the `hidden` class so it is visible by default when navigating to the module.

---

### Task 4: Documentation

**Files:**
- Create: `scratch/mock_data_files.txt`

- [ ] **Step 1: Write tracking file**

Create the file with this exact content:
```text
# MES Daily Mock Data Tracking
These files contain mock data or mock flags and should be reverted later:
1. routes/mesdaily.routes.js (added buildMockDashboardData and body.mock check)
2. ui/js/modules/mesdaily.js (added mock: true to fetch payload in searchMesDashboard)
```
