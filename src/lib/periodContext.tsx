import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { toast } from "sonner";

export type CycleType = "month" | "quarter" | "date";

export const MONTH_PERIODS = [
  "Apr 2026", "Mar 2026", "Feb 2026", "Jan 2026",
  "Dec 2025", "Nov 2025", "Oct 2025", "Sep 2025",
  "Aug 2025", "Jul 2025", "Jun 2025", "May 2025",
] as const;

export const QUARTER_PERIODS = [
  "Q2 2026", "Q1 2026", "Q4 2025", "Q3 2025",
  "Q2 2025", "Q1 2025", "Q4 2024", "Q3 2024",
] as const;

export const DATE_PRESETS = [
  "Last 30 days",
  "Last 90 days",
  "Year to date",
  "Last 12 months",
] as const;

export type Period = string;

interface PeriodSnapshot {
  org: number;
  delta: number;
  best: { name: string; score: number };
  worst: { name: string; score: number };
  atRisk: number;
  Connect: number;
  Develop: number;
  Inspire: number;
}

const mk = (org: number, delta: number, c: number, d: number, i: number, atRisk: number): PeriodSnapshot => {
  const arr: [string, number][] = [["Connect", c], ["Develop", d], ["Inspire", i]];
  const best = arr.reduce((a, b) => (b[1] > a[1] ? b : a));
  const worst = arr.reduce((a, b) => (b[1] < a[1] ? b : a));
  return { org, delta, atRisk, Connect: c, Develop: d, Inspire: i,
    best: { name: best[0], score: best[1] }, worst: { name: worst[0], score: worst[1] } };
};

const snapshots: Record<string, PeriodSnapshot> = {
  // Months
  "Apr 2026": mk(72, 3,  74, 61, 78, 6),
  "Mar 2026": mk(69, 0,  71, 64, 76, 7),
  "Feb 2026": mk(69, 2,  70, 63, 75, 7),
  "Jan 2026": mk(67, -2, 70, 58, 73, 8),
  "Dec 2025": mk(69, 1,  72, 60, 75, 7),
  "Nov 2025": mk(68, 3,  71, 59, 74, 7),
  "Oct 2025": mk(65, -2, 69, 55, 71, 9),
  "Sep 2025": mk(67, 1,  70, 57, 73, 8),
  "Aug 2025": mk(66, 0,  68, 58, 72, 8),
  "Jul 2025": mk(66, 1,  68, 57, 72, 8),
  "Jun 2025": mk(65, 1,  67, 56, 71, 9),
  "May 2025": mk(64, 0,  66, 55, 70, 9),
  // Quarters
  "Q2 2026": mk(71, 2,  73, 62, 77, 6),
  "Q1 2026": mk(68, -1, 70, 61, 74, 8),
  "Q4 2025": mk(67, 2,  71, 58, 73, 8),
  "Q3 2025": mk(66, 1,  69, 57, 72, 8),
  "Q2 2025": mk(64, 1,  67, 55, 70, 9),
  "Q1 2025": mk(63, 0,  66, 54, 69, 9),
  "Q4 2024": mk(62, 1,  65, 53, 68, 10),
  "Q3 2024": mk(61, 0,  64, 52, 67, 10),
  // Date presets
  "Last 30 days":   mk(72, 3,  74, 61, 78, 6),
  "Last 90 days":   mk(70, 1,  72, 62, 76, 7),
  "Year to date":   mk(69, 2,  71, 60, 75, 7),
  "Last 12 months": mk(67, 1,  69, 58, 73, 8),
};

interface PeriodCtx {
  period: Period;
  cycleType: CycleType;
  setPeriod: (p: Period) => void;
  setCycleType: (t: CycleType) => void;
  snapshot: PeriodSnapshot;
  periodsForType: (t: CycleType) => readonly string[];
  historicalRows: () => Array<{ cycle: string; Connect: number; Develop: number; Inspire: number; Overall: number }>;
}

const Ctx = createContext<PeriodCtx | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [cycleType, setCycleTypeState] = useState<CycleType>("month");
  const [period, setPeriodState] = useState<Period>("Apr 2026");

  const setPeriod = useCallback((p: Period) => {
    setPeriodState(p);
    toast(`Data updated for ${p}`, { duration: 2000, position: "bottom-right" });
  }, []);

  const setCycleType = useCallback((t: CycleType) => {
    setCycleTypeState(t);
    const first = t === "month" ? MONTH_PERIODS[0] : t === "quarter" ? QUARTER_PERIODS[0] : DATE_PRESETS[0];
    setPeriodState(first);
  }, []);

  const periodsForType = useCallback((t: CycleType): readonly string[] => {
    return t === "month" ? MONTH_PERIODS : t === "quarter" ? QUARTER_PERIODS : DATE_PRESETS;
  }, []);

  const historicalRows = useCallback(() => {
    const list = (cycleType === "quarter" ? [...QUARTER_PERIODS] : cycleType === "date" ? [...DATE_PRESETS] : [...MONTH_PERIODS]).reverse();
    return list.map((c) => {
      const s = snapshots[c];
      return { cycle: c, Connect: s.Connect, Develop: s.Develop, Inspire: s.Inspire, Overall: s.org };
    });
  }, [cycleType]);

  const value = useMemo<PeriodCtx>(
    () => ({
      period, cycleType, setPeriod, setCycleType,
      snapshot: snapshots[period] ?? snapshots["Apr 2026"],
      periodsForType, historicalRows,
    }),
    [period, cycleType, setPeriod, setCycleType, periodsForType, historicalRows],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePeriod() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePeriod must be used within PeriodProvider");
  return ctx;
}

// Backwards compat
export const PERIODS = MONTH_PERIODS;
