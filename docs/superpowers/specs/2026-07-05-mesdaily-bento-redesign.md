# MES Daily Bento Command Center - Design Spec

## 1. Context & Goals
**Goal:** Redesign the MES Daily dashboard to solve specific pain points (small KPIs, hidden charts, overflowing wide table, lack of micro-interactions) while strictly adhering to the existing Aurora Glassmorphism design system.
**Audience:** Production Engineers who need data density and immediate oversight.
**Aesthetic:** Aurora Glassmorphism (preserve), Tailwind Utilities, General Sans + Outfit fonts, `DESIGN_VARIANCE: 5`, `MOTION_INTENSITY: 4`, `VISUAL_DENSITY: 6`.

## 2. Structural Architecture (The 3-Tier Layout)
The current stacked layout will be overhauled into a full-width 3-tier architecture to maximize screen real estate and prevent unnecessary scrolling.

### Tier 1: The Compact Control Bar
- **Current:** Large textarea and chunky date pickers occupying significant vertical space.
- **New:** A single horizontal `glass-card` pinned near the top.
  - **Search Input:** Single-line input that expands elegantly or offers a dropdown for multi-WO pasting.
  - **Date Pickers:** Condensed into a tight inline layout.
  - **Fetch Button:** Interactive with tactile feedback (`active:scale-95`).

### Tier 2: Bento Dashboard (Grid)
- **Current:** Hidden behind a section that requires scrolling down.
- **New:** A 12-column CSS grid that places KPIs and Charts side-by-side immediately below the control bar.
  - **KPI Cards (col-span-12 md:col-span-3):** 4 key metrics (Yield, Output, Defects, FPY) stacked in a 2x2 grid. Rendered with large `font-display` (Outfit) typography.
  - **Analytics (col-span-12 md:col-span-9):** The 3 charts (Pareto, Trend, Station Yield) elegantly fit into the remaining grid space.

### Tier 3: Condensed Expandable Tables
- **Current:** A 7-column table forced to `min-width: 1000px`, breaking mobile/tablet views and looking cluttered.
- **New:** 
  - Reduced to 5 critical columns: `SN`, `Terminal`, `Result`, `DefectCode`, `Time`.
  - **Accordion Details:** Clicking any row smoothly slides out a secondary panel directly beneath it to reveal the lengthy `Description` and `WO` fields.

## 3. Micro-Interactions & States
- **Loading (Skeletal):** Instead of wiping the screen blank and showing a tiny spinner, the layout transitions to a "Skeletal Loading" state (shimmer effect matching the Bento shapes) to reduce Cumulative Layout Shift (CLS) and feel premium.
- **Hover Physics:** Table rows gain a soft Aurora highlight (`hover:bg-white/10`) with a color-coded left border (e.g., subtle red tint for Fail rows, green for Pass) to guide the engineer's eyes across data rows.
- **Empty States:** Guided, localized empty states with subtle iconography instead of blank tables.

## 4. Implementation Phasing
As requested, the implementation will begin with a **static HTML mockup** to ensure the visual layout is approved before any JavaScript logic is rewritten.

1. **Phase 1:** Build `ui/mesdaily-bento-mockup.html` (Static preview of the new 3-tier layout, Bento grid, and condensed table).
2. **Phase 2:** Integrate approved HTML into `ui/index.html`.
3. **Phase 3:** Update `mesdaily.js` and `defectDashboard.js` to target the new DOM structures and implement the skeletal loading/accordion logic.
