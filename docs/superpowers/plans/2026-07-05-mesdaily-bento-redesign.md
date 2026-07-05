# MES Daily Bento Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the MES Daily dashboard into a 3-tier Bento layout (Control Bar, Bento Grid, Toggleable Table) with glassmorphism and micro-interactions.

**Architecture:** 
1. Build a static HTML mockup (`ui/mesdaily-bento-mockup.html`) for visual review.
2. Integrate the approved mockup into `ui/index.html`.
3. Refactor `ui/js/modules/mesdaily.js` to render the 7-column table with a global column toggle.
4. Ensure charts in `ui/js/modules/defectDashboard.js` render correctly in the new grid.

**Tech Stack:** Vanilla HTML, Tailwind CSS, Vanilla JS, Chart.js.

## Global Constraints
- `DESIGN_VARIANCE: 5`
- `MOTION_INTENSITY: 4`
- `VISUAL_DENSITY: 6`
- Aesthetic: Aurora Glassmorphism (preserve), General Sans + Outfit fonts.

---

### Task 1: Create HTML Mockup

**Files:**
- Create: `ui/mesdaily-bento-mockup.html`
- Test: `scratch/test_task1.ps1`

**Interfaces:**
- Produces: `ui/mesdaily-bento-mockup.html`

- [ ] **Step 1: Write the failing test**

Create `scratch/test_task1.ps1`:
```powershell
$html = Get-Content -Path "ui/mesdaily-bento-mockup.html" -ErrorAction SilentlyContinue
if ($null -eq $html) { throw "File not found" }
if ($html -notmatch "id=`"mes-panel`"") { throw "Missing mes-panel" }
if ($html -notmatch "id=`"mes-bento-dashboard`"") { throw "Missing bento dashboard" }
Write-Output "PASS"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `powershell.exe -ExecutionPolicy Bypass -File scratch/test_task1.ps1`
Expected: FAIL with "File not found"

- [ ] **Step 3: Write minimal implementation**

Create `ui/mesdaily-bento-mockup.html`:
```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MES Daily Bento Mockup</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: { sans: ['General Sans', 'sans-serif'], display: ['Outfit', 'sans-serif'] },
                    colors: { primary: '#0076B6', secondary: '#38BDF8', borderLight: '#C7DFF0', borderDark: '#1E3A4F', textMain: '#1e293b', textDark: '#f8fafc', textMuted: '#64748b' }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'General Sans', sans-serif; background-color: #0f172a; }
        .glass-card { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; }
        .section-header-gradient { background: linear-gradient(135deg, #0076B6 0%, #38BDF8 40%, #818CF8 100%); color: white; padding: 0.5rem 1rem; border-radius: 0.75rem 0.75rem 0 0; }
        .hover-highlight:hover { background-color: rgba(255,255,255,0.05); }
    </style>
</head>
<body class="p-8 text-textDark">
    <div id="mes-panel" class="flex flex-col gap-5 w-full max-w-[1400px] mx-auto">
        <!-- Tier 1: Control Bar -->
        <section class="glass-card flex items-center justify-between p-3">
            <div class="flex items-center gap-3 w-full">
                <input type="text" id="mes-r001-wo-input" placeholder="Enter WO..." class="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                <div class="flex items-center gap-2">
                    <input type="date" id="mes-r001-datefrom" class="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-textDark">
                    <span>-</span>
                    <input type="date" id="mes-r001-dateto" class="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-textDark">
                </div>
                <button id="mes-r001-search" class="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    Fetch Dashboard
                </button>
            </div>
        </section>

        <!-- Tier 2: Bento Dashboard -->
        <section id="mes-bento-dashboard" class="grid grid-cols-12 gap-5">
            <!-- KPIs (col-span-3) -->
            <div class="col-span-12 md:col-span-3 grid grid-cols-2 gap-4">
                <div class="glass-card p-4 flex flex-col justify-center">
                    <span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">Yield</span>
                    <span class="text-3xl font-display font-bold text-green-400">98.5%</span>
                </div>
                <div class="glass-card p-4 flex flex-col justify-center">
                    <span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">Output</span>
                    <span class="text-3xl font-display font-bold text-secondary">1,204</span>
                </div>
                <div class="glass-card p-4 flex flex-col justify-center">
                    <span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">Defects</span>
                    <span class="text-3xl font-display font-bold text-red-400">18</span>
                </div>
                <div class="glass-card p-4 flex flex-col justify-center">
                    <span class="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">FPY</span>
                    <span class="text-3xl font-display font-bold text-blue-400">95.2%</span>
                </div>
            </div>
            <!-- Analytics (col-span-9) -->
            <div class="col-span-12 md:col-span-9 grid grid-cols-2 gap-4">
                <div class="glass-card p-4 col-span-2 min-h-[160px] flex items-center justify-center border-l-2 border-l-primary/50">
                    <span class="text-textMuted">Yield Trend Chart Area</span>
                </div>
                <div class="glass-card p-4 min-h-[160px] flex items-center justify-center">
                    <span class="text-textMuted">Top Defects Pareto Area</span>
                </div>
                <div class="glass-card p-4 min-h-[160px] flex items-center justify-center">
                    <span class="text-textMuted">Station Yield Area</span>
                </div>
            </div>
        </section>

        <!-- Tier 3: Condensed Table -->
        <section class="glass-card overflow-hidden">
            <div class="section-header-gradient flex justify-between items-center">
                <span class="text-sm font-semibold flex items-center gap-2">📋 Defect Records</span>
            </div>
            <div class="p-0 overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-white/5 text-textMuted text-xs">
                        <tr>
                            <th class="p-3 font-semibold">SN</th>
                            <th class="p-3 font-semibold">Terminal</th>
                            <th class="p-3 font-semibold">Result</th>
                            <th class="p-3 font-semibold">Defect Code</th>
                            <th class="p-3 font-semibold">Time</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        <tr class="hover-highlight cursor-pointer border-l-2 border-l-red-500/50 group">
                            <td class="p-3">SN123456789</td>
                            <td class="p-3">FATP_TEST_01</td>
                            <td class="p-3 text-red-400">FAIL</td>
                            <td class="p-3">ERR_001</td>
                            <td class="p-3 text-textMuted">10:45:00</td>
                        </tr>
                        <!-- Accordion Row -->
                        <tr class="bg-black/20 text-xs hidden">
                            <td colspan="5" class="p-4 border-l-2 border-l-red-500/50">
                                <div class="flex flex-col gap-2 text-textMuted">
                                    <p><strong class="text-textDark">Description:</strong> Display panel scratch detected during visual inspection.</p>
                                    <p><strong class="text-textDark">WO:</strong> WO987654321</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `powershell.exe -ExecutionPolicy Bypass -File scratch/test_task1.ps1`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/mesdaily-bento-mockup.html scratch/test_task1.ps1
git commit -m "feat: add mesdaily bento static html mockup"
```

---

### Task 2: Integrate HTML into Main UI

**Files:**
- Modify: `ui/index.html` (Lines containing `<div id="mes-panel"`)
- Test: `scratch/test_task2.ps1`

**Interfaces:**
- Consumes: The HTML structure from Task 1.
- Produces: Updated `ui/index.html` with new DOM structure for `#mes-panel`.

- [ ] **Step 1: Write the failing test**

Create `scratch/test_task2.ps1`:
```powershell
$html = Get-Content -Path "ui/index.html" -Raw
if ($html -notmatch 'id="mes-bento-dashboard"') { throw "Missing bento dashboard in index.html" }
Write-Output "PASS"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `powershell.exe -ExecutionPolicy Bypass -File scratch/test_task2.ps1`
Expected: FAIL with "Missing bento dashboard in index.html"

- [ ] **Step 3: Write minimal implementation**

Replace the existing `<div id="mes-panel"...>` in `ui/index.html` with the new structure. 
*Note: Retain existing IDs for elements like `#mes-dashboard-stale-banner`, `#mes-dashboard-loading-panel`, `#dashboard-top-defects`, `#dashboard-yield-trend`, `#dashboard-station-yield`, `#mes-r001-head`, `#mes-r001-body`.*

*Due to length, use tools to replace the section in `ui/index.html` carefully.*
Update the structure to match Task 1's `mes-panel`, ensuring data-attributes `data-dashboard-state="idle"` etc are preserved on `#mes-panel`.

- [ ] **Step 4: Run test to verify it passes**

Run: `powershell.exe -ExecutionPolicy Bypass -File scratch/test_task2.ps1`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/index.html scratch/test_task2.ps1
git commit -m "feat: integrate bento layout into index.html"
```

---

### Task 3: Implement Toggleable Table Logic

**Files:**
- Modify: `ui/js/modules/mesdaily.js`
- Test: `scratch/test_task3.ps1`

**Interfaces:**
- Consumes: `#mes-r001-body` and `#mes-r001-toggle-details` elements in `ui/index.html`.
- Produces: 7-column rows and toggle event listener for `hide-details` class on the table.

- [ ] **Step 1: Write the failing test**

Create `scratch/test_task3.ps1`:
```powershell
$js = Get-Content -Path "ui/js/modules/mesdaily.js" -Raw
if ($js -notmatch "hide-details") { throw "Missing toggle logic" }
Write-Output "PASS"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `powershell.exe -ExecutionPolicy Bypass -File scratch/test_task3.ps1`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

In `ui/js/modules/mesdaily.js`:
1. Bind click listener to `#mes-r001-toggle-details` during initialization to toggle `hide-details` class on `#mes-r001-table`.
2. Update `renderMesR001Rows` to output 7 columns (including WO and Description with `.detail-col`).

```javascript
// Example logic to add to initialization
document.getElementById('mes-r001-toggle-details')?.addEventListener('click', function() {
    const table = document.getElementById('mes-r001-table');
    table.classList.toggle('hide-details');
    const isHidden = table.classList.contains('hide-details');
    this.innerHTML = isHidden 
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> Show Details`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg> Hide Details`;
});

// Update renderMesR001Rows inner loop to output 7 columns
function renderMesR001Rows(rows) {
    // ... setup ...
    let html = '';
    for (let i = startIndex; i < endIndex; i++) {
        const row = displayRows[i];
        const isSelected = i === mesR001SelectedIndex;
        const bgClass = isSelected ? 'bg-primary/20 dark:bg-secondary/20' : 'hover-highlight';
        const resultColor = row.result === 'PASS' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        const borderClass = row.result === 'PASS' ? 'border-l-green-500/50' : 'border-l-red-500';
        
        html += `<tr class="${bgClass} border-l-2 ${borderClass} transition-colors">
            <td class="p-3 font-medium text-secondary break-all">${quickLogEscape(row.sn)}</td>
            <td class="p-3">${quickLogEscape(row.terminal)}</td>
            <td class="p-3 font-bold ${resultColor}">${quickLogEscape(row.result)}</td>
            <td class="p-3 ${resultColor}">${quickLogEscape(row.defectCode)}</td>
            <td class="p-3 text-textMuted font-mono text-[11px] detail-col">${quickLogEscape(row.wo)}</td>
            <td class="p-3 text-textMuted font-mono text-[11px] max-w-xs truncate detail-col" title="${quickLogEscape(row.description)}">${quickLogEscape(row.description)}</td>
            <td class="p-3 text-textMuted text-right">${quickLogEscape(row.time)}</td>
        </tr>`;
    }
    body.innerHTML = html;
    // ... rest of function ...
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `powershell.exe -ExecutionPolicy Bypass -File scratch/test_task3.ps1`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/js/modules/mesdaily.js scratch/test_task3.ps1
git commit -m "feat: implement toggleable table in mesdaily.js"
```
