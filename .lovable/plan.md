## Goal
Add a new "Response Rate Breakdown" section to the Overview (Index) page that shows survey participation at two levels: by **Department** and by **Manager**, both deterministic per selected cycle and consistent with existing 100+ manager pool.

Also surface response rate inside the existing Manager drilldown drawer (already shows `responded/invited` — we'll promote it to a clearer breakdown card).

## What gets built

### 1. `src/lib/responseRates.ts` (new)
Pure utility, deterministic per cycle. Reuses `POOL` from `managerPool.ts`.
- `getManagerResponseRates(cycle)` → for each manager: `{ id, name, department, seniority, invited, responded, rate }`. Seeded from `manager.id + cycle` so values match the existing `getTeamBreakdown` style.
- `getDepartmentResponseRates(cycle)` → aggregates managers by `department`: `{ department, invited, responded, rate, managerCount }`, sorted by rate.
- `getOrgResponseRate(cycle)` → org-wide rollup (used to validate the existing "76%" metric card sourcing).

### 2. `src/components/pulse/ResponseRateBreakdown.tsx` (new)
A single section card with a small tab toggle (Department | Manager).

- **Department view**: horizontal bar list (10 departments). Each row: department name, `responded/invited`, % bar colored by `scoreColor(rate)`, manager count chip.
- **Manager view**: searchable, scrollable list (virtualized via simple max-height + overflow). Columns: avatar/initials, name, department, seniority chip, `responded/invited`, % bar. Sort by lowest rate first (action-oriented). Top filter chips: All / At-risk (<60%) / Healthy (≥80%).
- Header shows org-wide rollup and delta vs prev cycle (computed by hashing prev cycle key, same pattern as `managerPool`).

### 3. Wire into `src/pages/Index.tsx`
Insert `<ResponseRateBreakdown />` between "Teams Needing Attention" and `<TopPerformingTeams />`. No other changes.

### 4. Manager drawer (small enhancement)
In `TeamDrilldown.tsx`, add a compact "Response Rate" tile next to "Self vs Team gap" / "Cycle delta" showing `responded/invited (rate%)` with a thin progress bar — reusing `getTeamBreakdown` data already in the drawer (no new fetch).

## Design notes
- Match existing card pattern: `bg-card border border-border rounded-lg p-6 shadow-card mb-8`.
- Reuse `scoreColor` for bar colors and the existing motion entrance pattern (`initial/animate y:12`).
- Cycle-aware: subscribes to `usePeriod()` so values update when the cycle changes (Quarter/Month/Date), matching the rest of the dashboard.
- No backend changes; all data is deterministic mock from the existing pool.
