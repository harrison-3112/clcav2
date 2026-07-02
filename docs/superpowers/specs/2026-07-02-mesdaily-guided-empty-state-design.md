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
- Defect Analytics should stay visually lightweight until usable data exists.

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
- Defect Analytics is represented by a compact disabled anchor row, not the full chart panel.
- RTY Export remains available as the report export area.

After a query with data:

- RTY Preview fills with KPI values and station yield rows.
- Defect Records fills with defect rows.
- Defect Analytics appears and renders charts, alerts, and the per-WO dashboard.

After a query with no data:

- RTY Preview and Defect Records remain in their minimal shells.
- Empty messages change to "No data found for this query."
- Defect Analytics remains a compact disabled anchor row.

## UI States

MES Daily should have a small explicit state model:

- `idle`: module loaded or cleared; no query has been run.
- `loading`: Fetch Dashboard is in progress.
- `empty`: query completed successfully but there is no usable data.
- `ready`: query completed successfully and dashboard data exists.

The state should be represented on the MES panel or an equivalent local module container, for example with `data-dashboard-state="idle|loading|empty|ready"`. The implementation should avoid deleting or recreating global DOM elements that other scripts bind to.

`ready` may carry freshness metadata without becoming a separate top-level state:

- `lastSuccessfulQueryAt`: timestamp of the last successful dashboard payload.
- `lastRefreshError`: message from the most recent failed refresh, if any.
- `data-stale="true"` or equivalent UI flag when a refresh fails after a previous `ready` result.

This keeps the successful dashboard visible while making stale data explicit.

RTY export should have a separate state model because export is a report-generation job, not a dashboard query:

- `exportIdle`: no export is running.
- `exporting`: RTY Excel generation is in progress.
- `exportDone`: the last export completed successfully.
- `exportError`: the last export failed.

Dashboard state and export state must not overwrite each other. Starting an export should not force the dashboard into `loading`; it should keep the current dashboard view visible while the export panel reports export progress.

Auto-refresh is part of the dashboard fetch pathway. It must respect the same export lock as the Fetch Dashboard button. Programmatic calls to `searchMesDashboard()` should bail out while `exporting`, not only UI button clicks.

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
- Show an indeterminate progress bar using existing app progress styling where possible.
- Show elapsed time so the user can tell the app is still working.
- Use only frontend-truthful status text:
  - "Querying MES server..." while the fetch request is pending.
  - "Processing response..." after the response resolves and before rendering completes.
- Avoid guessed staged text such as chunk counts or backend phases unless the backend later exposes real progress events.
- Avoid heavy skeleton effects that imply background loading before the user acts.
- Clear the elapsed timer from the dashboard state helper whenever leaving `loading`, including success, empty, clear, and error paths.

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

In `idle`, `loading`, and `empty`, show only a compact disabled analytics anchor row, roughly 48-64px high, using existing card/header styling. This row should communicate that Analytics will appear after dashboard data is available without reserving the full chart footprint.

In `ready`, expand the anchor into the full analytics panel after usable data exists.

When leaving `ready`, existing Chart.js instances and the per-WO dashboard should be destroyed or cleared to avoid stale charts and memory leaks.

To reduce layout jump when Analytics expands:

- Use a lightweight reveal transition.
- After charts render, smooth-scroll only when helpful.
- Keep the scroll rule simple for v1: auto-scroll to Analytics only if the user is still near the top of the result flow, such as within the upper part of RTY Preview.
- Do not auto-scroll if the Analytics header is already in or near the viewport.
- Do not auto-scroll if the user has already scrolled down into Defect Records or near the Analytics area while the query was running.

### RTY Export

Remain in the MES Daily flow, after the review/result sections.

The export action should be reframed visually and textually as report export, not a second ambiguous query action.

Preferred button label for MES Daily:

- "Export RTY Excel"

The UI should communicate:

- Fetch Dashboard is for preview/review.
- Export RTY Excel is for creating the report.

Button hierarchy:

- Fetch Dashboard is the primary action in Data Query.
- Export RTY Excel is a secondary or outline action in the export panel.
- In `ready`, Export RTY Excel may become a stronger secondary action, such as a subtle border glow or filled secondary style, to indicate the reviewed data is ready to export.
- Export RTY Excel should not share the same visual weight as Fetch Dashboard.

If the app-level Generate button must remain because of shared architecture, it should become context-aware for MES Daily through label, placement, styling, or supporting text. It should not look like an equal alternative to Fetch Dashboard.

Export remains allowed before preview if the required WO/time/output conditions are valid, but the UI should make this feel like direct export rather than dashboard review.

Export helper copy should change by dashboard state:

- `idle` or `empty`: "Export directly without preview."
- `ready`: "Export reviewed RTY report."

When export starts:

- Set export state to `exporting`.
- Disable the Export RTY Excel button and show a spinner/loading label.
- Show an export-panel status such as "Creating RTY Excel..."
- Keep the current dashboard view visible.
- Do not show Analytics if the dashboard is not already `ready`.

Fetch while export is running:

- For this implementation, keep Fetch Dashboard disabled during `exporting`.
- Reason: the current MES Daily export route captures `process.stdout.write` and `process.stderr.write` globally while running. Until backend concurrency is made explicit and safe, parallel MES jobs can produce mixed logs or unstable behavior.
- A future enhancement may replace the hard lock with a confirmation modal if the backend is verified to handle concurrent MES dashboard and export requests safely.
- Auto-refresh must also skip while `exporting`. The guard belongs inside `searchMesDashboard()` as well as any timer callback, because auto-refresh calls the function directly and bypasses disabled button UI.

## i18n Requirements

All new user-facing strings should use i18n keys in `ui/js/core/globals.js` for English, Chinese, and Vietnamese. Do not hard-code English text in the new UI.

Expected keys:

| Key | English | Chinese | Vietnamese |
|---|---|---|---|
| `mesDashboardIdleHint` | Enter WO and fetch dashboard. | 输入工单并获取看板。 | Nhập WO và tải dashboard. |
| `mesDashboardNoData` | No data found for this query. | 本次查询未找到数据。 | Không tìm thấy dữ liệu cho truy vấn này. |
| `mesAnalyticsLockedHint` | Analytics will appear after dashboard data is available. | 看板数据可用后将显示分析。 | Phân tích sẽ hiển thị khi có dữ liệu dashboard. |
| `mesDashboardQuerying` | Querying MES server... | 正在查询 MES 服务器... | Đang truy vấn máy chủ MES... |
| `mesDashboardProcessing` | Processing response... | 正在处理响应... | Đang xử lý phản hồi... |
| `mesExportRtyExcel` | Export RTY Excel | 导出 RTY Excel | Xuất RTY Excel |
| `mesExportCreating` | Creating RTY Excel... | 正在创建 RTY Excel... | Đang tạo RTY Excel... |
| `mesExportDirectHint` | Export directly without preview. | 不预览，直接导出。 | Xuất trực tiếp không cần xem trước. |
| `mesExportReviewedHint` | Export reviewed RTY report. | 导出已检查的 RTY 报告。 | Xuất báo cáo RTY đã xem lại. |
| `mesFetchSkippedExporting` | Fetch skipped: export in progress. | 已跳过查询：正在导出。 | Đã bỏ qua tải dữ liệu: đang xuất báo cáo. |
| `mesDashboardRefreshFailedStale` | Refresh failed. Showing last successful data from {time}. | 刷新失败。正在显示 {time} 的上次成功数据。 | Làm mới thất bại. Đang hiển thị dữ liệu thành công gần nhất lúc {time}. |

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
- Use only modest contextual emphasis for Export RTY Excel in `ready`; avoid turning both Fetch and Export into primary buttons.

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
- Add an export state helper such as `setMesDailyExportState(state, message)`.
- Refactor `applyMesDailyFeatureVisibility()` so it defers to the dashboard state model instead of using `mesR001Rows.length > 0` as the source of truth for RTY Preview and Defect Records visibility.
- Update `searchMesDashboard()` to set `loading`, then `ready` or `empty`.
- Add an export-state guard at the top of `searchMesDashboard()` so button clicks, keyboard shortcuts, and auto-refresh all skip while `exporting`.
- Update auto-refresh to skip or pause during `exporting` and log `mesFetchSkippedExporting` instead of launching a concurrent dashboard request.
- Update `clearMesR001Panel()` to return to `idle`.
- Update the MES Daily generate/export path to set `exporting`, then `exportDone` or `exportError`.
- Store and clear the dashboard loading elapsed-timer interval inside the state helper so every transition out of `loading` clears it.
- Ensure analytics cleanup runs when transitioning away from `ready`.
- Keep render functions tolerant of zero rows.
- Add all new i18n keys listed in this spec to `ui/js/core/globals.js` for English, Chinese, and Vietnamese.

## Error Handling

If Fetch Dashboard fails:

- Do not show Analytics.
- Show the existing toast/log error behavior.
- If there was no previous `ready` dashboard, return to `idle` with the error toast/log.
- If there was previous `ready` data, keep that data visible, set the stale flag, and show an inline warning such as `mesDashboardRefreshFailedStale` with the `lastSuccessfulQueryAt` time.
- Do not silently clear data that the user may be reviewing.
- Do not leave stale rows/charts visible without labeling them as stale.

If a query succeeds but produces no usable data:

- Use `empty`, not `ready`.
- RTY Preview and Defect Records should remain visible with no-data messaging.
- Analytics should remain a compact disabled anchor row.

If Export RTY Excel fails:

- Keep the current dashboard state unchanged.
- Set export state to `exportError`.
- Re-enable Export RTY Excel.
- Show the existing toast/log error behavior and an export-panel failure message.

## Verification Criteria

Before completion, verify:

- MES Daily initial view shows Data Query, minimal RTY Preview, minimal Defect Records, Export controls, and a compact disabled Analytics anchor row.
- Fetch Dashboard loading state keeps result shells visible, shows an indeterminate progress bar, and shows elapsed time.
- Fetch Dashboard loading text uses only the two frontend-truthful phases: querying request, then processing response.
- The elapsed timer stops on success, empty, clear, and error.
- Successful query with data shows full RTY Preview, Defect Records, and Analytics.
- Analytics reveal does not auto-scroll when the user is already near Analytics or reading Defect Records.
- Successful query with no rows shows no-data messages and keeps Analytics as a compact disabled anchor row.
- Fetch error from `idle` returns to idle shell with error toast/log.
- Fetch error after previous `ready` data keeps the last successful dashboard visible and labels it stale.
- Clear returns the module to `idle`.
- Open Log and FAIL Logs do not behave as available actions when there are no rows.
- Export RTY Excel uses secondary/outline hierarchy, with stronger secondary emphasis allowed in `ready`.
- Export RTY Excel has a distinct loading state and does not force dashboard state to `loading`.
- Fetch Dashboard, keyboard-triggered fetch, and auto-refresh are unavailable during export for the current implementation.
- Export RTY Excel behavior is unchanged at the payload/API level.
- All new visible text uses i18n keys in `ui/js/core/globals.js`.
- `applyMesDailyFeatureVisibility()` does not re-hide RTY Preview or Defect Records in `idle`, `loading`, or `empty`.
- No required global element IDs are removed.
- `node -c` passes for edited JavaScript files.

Recommended syntax checks:

```powershell
node -c ui/js/modules/mesdaily.js
node -c ui/js/modules/defectDashboard.js
node -c ui/js/main.js
```

If other JS files are edited, run `node -c` on those files as well.
