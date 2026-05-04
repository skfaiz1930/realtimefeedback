## Goals

1. **Benchmarks everywhere**: show Industry benchmark + Internal benchmark (org / prior-cycle baseline) on every key visual.
2. **Cycle granularity**: support Monthly, Quarterly, and custom Date cycles, with full mock data for each.
3. **Collapsible sidebar**: let users collapse the left nav to a narrow icon rail and reopen it.

---

## 1. Benchmarks (Industry + Internal)

Create `src/lib/benchmarks.ts` with shared mock benchmarks:
- **Industry**: Connect 70, Develop 65, Inspire 72, Overall 69 (source: "GMI Industry Index 2026")
- **Internal**: org 12-cycle rolling avg per dimension (computed from period mock data)

Add a small reusable `<BenchmarkChips dimension="Connect" value={74} />` component that shows two pills: `Industry 70 (+4)` and `Internal 68 (+6)` with green/red delta colors and a tooltip explaining each source.

Apply it to:
- **Overview (`Index.tsx`)**: under "Org Health Score" MetricCard (belowValue) and inside each `CDIBar` row.
- **Heatmap**: extra column "vs Industry" + colored chip per question; bottom average row also shows internal & industry deltas.
- **Trends line chart**: two `ReferenceLine`s — dashed gray "Industry 69" and dotted blue "Internal avg 68"; legend entries; YoY chart gets a third bar group "Industry 2026".
- **Demographics**: each `BarRow` gets a thin marker tick on the bar at the industry score for that cut, with tooltip.
- **Culture Map**: crosshair lines move from fixed 70 to dynamic Industry (70) lines; quadrant labels reflect "above/below industry".
- **Development Tracks → Impact**: projected uplift compared against industry benchmark line.
- **Comments**: sentiment donut shows "Industry positive avg 48%" reference arc.

Color convention: industry = neutral gray dashed; internal = primary red dashed.

---

## 2. Cycle types (Month / Quarter / Date) + mock data

Refactor `src/lib/periodContext.tsx`:
- Add `cycleType: "month" | "quarter" | "date"` and `setCycleType`.
- Replace `PERIODS` with three lists:
  - **Monthly** (12 entries: May 2025 → Apr 2026)
  - **Quarterly** (Q3 2024 → Q2 2026, 8 entries)
  - **Date range** (custom start/end picker using shadcn Calendar; 4 preset ranges seeded with mock snapshots)
- Expand `snapshots` map with mock data for every new period (org, delta, best, worst, atRisk, plus per-dimension Connect/Develop/Inspire scores).
- Add `historicalRows()` helper that returns the right time series for the active `cycleType` (used by Trends + Heatmap deltas).

Update `Header.tsx` cycle dropdown:
- Top row: 3 segmented tabs `Month | Quarter | Date`.
- Below: list of periods for the chosen type. For "Date", show a shadcn Popover + Calendar (range mode) with `pointer-events-auto`.
- Selecting any option calls `setPeriod` + `setCycleType`, toasts "Data updated for {label}".

Wire `Trends.tsx` and `Index.tsx` MetricCards to `historicalRows()` so charts + deltas re-render on cycle-type change.

---

## 3. Collapsible sidebar

Refactor `src/components/pulse/Sidebar.tsx`:
- Add local state `collapsed` (persisted to `localStorage` key `pulse.sidebar.collapsed`).
- Width animates between `220px` (expanded) and `64px` (collapsed) via framer-motion.
- When collapsed: hide labels, user name/role, "Free Trial" pill, and "Logout" text — keep icons + initials avatar centered. Use shadcn `Tooltip` on each NavLink for the label.
- Add a chevron toggle button at the top-right edge of the sidebar (`ChevronsLeft` / `ChevronsRight`).
- Update `PageShell.tsx` and `Index.tsx` main padding: replace hardcoded `md:pl-[220px]` with a CSS variable `--sidebar-w` set on `<body>` (or a context value). Main uses `md:pl-[var(--sidebar-w)]`.
- Mobile (`MobileNav`) unchanged.

---

## Files to create
- `src/lib/benchmarks.ts`
- `src/components/pulse/BenchmarkChips.tsx`
- `src/components/pulse/CycleTypeTabs.tsx` (used inside Header dropdown)

## Files to edit
- `src/lib/periodContext.tsx` — cycle types, expanded snapshots, helpers
- `src/components/pulse/Header.tsx` — new dropdown UI with tabs + date picker
- `src/components/pulse/Sidebar.tsx` — collapsible
- `src/components/pulse/PageShell.tsx` — dynamic left padding
- `src/pages/Index.tsx` — benchmarks under metric & CDI bars; dynamic padding
- `src/components/pulse/CDIBar.tsx` — render `BenchmarkChips`
- `src/pages/Heatmap.tsx` — vs-industry column + benchmarks in avg row
- `src/pages/Trends.tsx` — benchmark reference lines, YoY industry bar, cycle-type aware data
- `src/pages/Demographics.tsx` — benchmark tick on each bar
- `src/pages/CultureMap.tsx` — dynamic benchmark crosshairs
- `src/pages/DevelopmentTracks.tsx` — benchmark in `ImpactSection`
- `src/components/pulse/ImpactSection.tsx` — projected vs industry
- `src/pages/Comments.tsx` — industry sentiment reference

No DB or edge-function changes required (all mock data is client-side).
