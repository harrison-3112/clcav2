# MES Daily Guided Empty-State UI Design

Date: 2026-07-02
Project: CloudMetrics
Area: MES Daily frontend UI

## Goal

Redesign the MES Daily UI states so the module no longer hides most result areas before the user presses Fetch Dashboard. The screen should show a lightweight, consistent preview of the result structure before query, then expand into the complete dashboard after a successful search.

The redesign must preserve CloudMetrics' current visual language and keep the MES Daily workflow clear:

- Fetch Dashboard means query and review data.
- Export RTY Excel means generate the Excel report.
- RTY Preview and Defect Records should be visible in a minimal state before query.
- Defect Analytics should remain hidden until usable data exists.

Backend routes, response schemas, and MES data processing are out of scope.

## Current UX Issue

MES Daily currently has two major actions that feel too similar:

- Fetch Dashboard, inside the MES Daily query panel.
- Generate, the app-level generation action used by MES Daily to export RTY Excel.

Both actions consume the same practical inputs: WO, time range, and selected stations. This makes the module feel ambiguous: users may not know whether they need to fetch first, generate directly, or treat the two actions as equal.

The result sections also appear abruptly because RTY Preview and Defect Records are hidden until a successful query. This makes the first view feel incomplete and gives users less confidence about what the query will produce.

## Approved UX Direction

Use a guided minimal state before query.

Before the user presses Fetch Dashboard:

- Data Query remains fully interactive.
- RTY Preview is visible as a compact shell.
- Defect Records is visible as a compact shell.
- Defect Analytics is hidden.
- RTY Export remains available as the report export area.

After a query with data:

- RTY Preview fills with KPI values and station yield rows.
- Defect Records fills with defect rows.
- Defect Analytics appears and renders charts, alerts, and the per-WO dashboard.

After a query with no data:

- RTY Preview and Defect Records remain in their minimal shells.
- Empty messages change to "No data found for this query."
- Defect Analytics remains hidden.

## UI States

MES Daily should have a small explicit state model:

- `idle`: module loaded or cleared; no query has been run.
- `loading`: Fetch Dashboard is in progress.
- `empty`: query completed successfully but there is no usable data.
- `ready`: query completed successfully and dashboard data exists.

The state should be represented on the MES panel or an equivalent local module container, for example with `data-dashboard-state="idle|loading|empty|ready"`. The implementation should avoid deleting or recreating global DOM elements that other scripts bind to.

## Section Behavior

### Data Query

Always visible.

It keeps the existing controls:

- WO textarea.
- WO history chips.
- From/To date and time.
- Fetch Dashboard button.
- Auto-refresh toggle and interval select.

Fetch Dashboard is the primary call to action for the query and review step.

### RTY Preview

Visible in all states except if the MES Daily module itself is inactive.

In `idle`:

- Show the section header.
- Show KPI cards using placeholder values such as `-`.
- Show a compact empty message such as "Enter WO and fetch dashboard."
- Keep the table shell lightweight, with no real rows.

In `loading`:

- Keep the section visible.
- Show a loading message or subtle spinner using existing app patterns.
- Avoid heavy skeleton effects that imply background loading before the user acts.

In `empty`:

- Keep placeholder KPI values.
- Show "No data found for this query."
- Keep the table empty.

In `ready`:

- Render KPI cards from `kpis`.
- Render station rows from `stationYield`.
- Preserve existing yield coloring behavior: critical below 90, warning below 95.

### Defect Records

Visible in all states except if the MES Daily module itself is inactive.

In `idle`:

- Show the section header and action buttons in a subdued/disabled-safe state where appropriate.
- Show summary as `Input: 0 | Found: 0 | Rows: 0`.
- Show the table header and a compact empty row/message.
- No row should be selected.

In `loading`:

- Clear any previous selected row.
- Show a loading row/message.
- Disable actions that require rows, such as Open Log and FAIL Logs, or make them no-op with a warning.

In `empty`:

- Show summary with the queried input count if available and `Rows: 0`.
- Show "No data found for this query."
- Keep Open Log and FAIL Logs unavailable because there are no rows.

In `ready`:

- Render rows from `defectRows`.
- Keep client-side search/filter behavior.
- Row selection updates the selected-row label.
- Open Log and FAIL Logs operate on available rows.

### Defect Analytics

Hidden in `idle`, `loading`, and `empty`.

Visible only in `ready`, after there is usable data.

When leaving `ready`, existing Chart.js instances and the per-WO dashboard should be destroyed or cleared to avoid stale charts and memory leaks.

### RTY Export

Remain in the MES Daily flow, after the review/result sections.

The export action should be reframed visually and textually as report export, not a second ambiguous query action.

Preferred button label for MES Daily:

- "Export RTY Excel"

The UI should communicate:

- Fetch Dashboard is for preview/review.
- Export RTY Excel is for creating the report.

If the app-level Generate button must remain because of shared architecture, it should become context-aware for MES Daily through label, placement, or supporting text. It should not look like an equal alternative to Fetch Dashboard.

Export remains allowed before preview if the required WO/time/output conditions are valid, but the UI should make this feel like direct export rather than dashboard review.

## Visual Style Requirements

The redesign must match the existing CloudMetrics style:

- Reuse `glass-card`.
- Reuse `section-header-gradient`.
- Reuse existing border, dark mode, muted text, and primary/secondary color tokens.
- Keep spacing density close to the current MES Daily module.
- Avoid introducing a new palette.
- Avoid large hero-style empty states.
- Avoid heavy decorative backgrounds or unrelated visual motifs.
- Use existing icon style, preferably lucide where already used.
- Use existing transition and loading patterns.

Empty states should feel like part of the app, not a newly pasted design system.

## Technical Scope

Expected frontend files:

- `ui/index.html`
- `ui/js/modules/mesdaily.js`
- `ui/js/modules/defectDashboard.js`

Do not modify backend routes or MES logic.

Do not change API response schema.

Do not remove or rename existing IDs relied on by global bindings, especially the IDs documented in `AGENT.md` and currently used by `ui/js/main.js`, `ui/js/core/globals.js`, and MES Daily scripts.

The implementation should prefer small state helpers over large template rewrites. A likely shape is:

- Add or reuse empty-state DOM within existing RTY Preview and Defect Records sections.
- Add a MES Daily state helper such as `setMesDailyDashboardState(state, message)`.
- Update `searchMesDashboard()` to set `loading`, then `ready` or `empty`.
- Update `clearMesR001Panel()` to return to `idle`.
- Ensure analytics cleanup runs when transitioning away from `ready`.
- Keep render functions tolerant of zero rows.

## Error Handling

If Fetch Dashboard fails:

- Do not show Analytics.
- Do not leave stale rows/charts visible as if they belong to the failed query.
- Show the existing toast/log error behavior.
- Prefer returning to `idle` or the last stable non-ready state unless preserving prior results is intentionally implemented.

If a query succeeds but produces no usable data:

- Use `empty`, not `ready`.
- RTY Preview and Defect Records should remain visible with no-data messaging.
- Analytics should remain hidden.

## Verification Criteria

Before completion, verify:

- MES Daily initial view shows Data Query, minimal RTY Preview, minimal Defect Records, Export controls, and no Analytics.
- Fetch Dashboard loading state keeps result shells visible.
- Successful query with data shows full RTY Preview, Defect Records, and Analytics.
- Successful query with no rows shows no-data messages and keeps Analytics hidden.
- Clear returns the module to `idle`.
- Open Log and FAIL Logs do not behave as available actions when there are no rows.
- Export RTY Excel behavior is unchanged at the payload/API level.
- No required global element IDs are removed.
- `node -c` passes for edited JavaScript files.

Recommended syntax checks:

```powershell
node -c ui/js/modules/mesdaily.js
node -c ui/js/modules/defectDashboard.js
node -c ui/js/main.js
```

If other JS files are edited, run `node -c` on those files as well.
