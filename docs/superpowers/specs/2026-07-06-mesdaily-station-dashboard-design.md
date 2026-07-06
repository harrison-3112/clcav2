# Brainstorming Design: MES Daily Station Dashboard & Summary Table

## 1. Overview
The goal is to enhance the MES Daily module with a comprehensive, per-station dashboard view and a detailed global summary table, while retaining the core Top Defects and Alerts components from the current Bento Dashboard. The focus is strictly on UI/UX presentation; data processing logic is outside the scope of this update.

## 2. UI Layout Architecture
The new dashboard section (`mes-bento-dashboard`) will be structured vertically as follows:

### 2.1. Top Section: Global KPIs & Alerts
*   **Alerts & Config (Updated):** 
    *   The Alert configuration panel (Thresholds, rules) will **no longer be hidden by default**. It will be explicitly visible and interactive on the UI, allowing quick adjustments without needing to click a "Config" button first.
    *   The Alerts list will be displayed alongside or below the config.
*   **Top Defects Pareto:** 
    *   The existing Top Defects Bar Chart (Pareto) will be retained here to show the global top defect codes across all stations.

### 2.2. Middle Section: Per-Station Dashboards
*   The system will render a list of "Cards", one for each unique `PROCESS_NAME` (Station).
*   Each Station Card will contain:
    *   **Header:** Displays the `PROCESS_NAME`.
    *   **Left Column (Pie Chart):** Shows the Top Defects specific to this station.
    *   **Right Column (Combo Chart):** A time-series chart (X-axis = Hourly trend). 
        *   Bar series (Y1): `INPUT`, `OUTPUT`, `FAIL`.
        *   Line series (Y2): `FPY` (First Pass Yield).

### 2.3. Bottom Section: Global Summary Table
*   A new, full-width data table positioned below all the charts.
*   It aggregates data for all stations in one place.
*   **Exact Columns:** `MODEL` | `PROCESS_NAME` | `INPUT_QTY` | `FAIL_QTY` | `FAIL_P` (%) | `PASS_P` (%) | `DEFECT_QTY` | `FAIL_D` (%) | `PASS_D` (%) | `OUTPUT_QTY`.
*   **UX Enhancements:** Alternating row colors, sticky headers, and color-coded percentages (e.g., green for high `PASS_P`, red for high `FAIL_D`) for readability.

## 3. Data & Implementation Constraints
*   **UI/UX Only:** The implementation will mock the required data structures (or utilize the local `mesdailyDemoData.js`) to render the charts and tables. Real data binding and complex calculations are excluded from this scope.
*   **Libraries:** We will continue using Chart.js for all new Pie and Combo charts.

## 4. Next Steps
Once this design is approved, an Implementation Plan will be drafted detailing the specific HTML, CSS (Tailwind), and Javascript UI changes needed to achieve this layout.
