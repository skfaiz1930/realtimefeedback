import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { toast } from "sonner";

export const PERIODS = [
  "Apr 2026 Cycle",
  "Mar 2026 Cycle",
  "Jan 2026 Cycle",
  "Dec 2025 Cycle",
  "Nov 2025 Cycle",
  "Oct 2025 Cycle",
  "Sep 2025 Cycle",
  "Aug 2025 Cycle",
] as const;

export type Period = (typeof PERIODS)[number];

interface PeriodSnapshot {
  org: number;
  delta: number;
  best: { name: string; score: number };
  worst: { name: string; score: number };
  atRisk: number;
}

const snapshots: Record<Period, PeriodSnapshot> = {
  "Apr 2026 Cycle": { org: 72, delta: 3,  best: { name: "Inspire", score: 78 }, worst: { name: "Develop", score: 61 }, atRisk: 6 },
  "Mar 2026 Cycle": { org: 69, delta: 2,  best: { name: "Inspire", score: 76 }, worst: { name: "Develop", score: 64 }, atRisk: 7 },
  "Jan 2026 Cycle": { org: 67, delta: -2, best: { name: "Inspire", score: 73 }, worst: { name: "Develop", score: 58 }, atRisk: 8 },
  "Dec 2025 Cycle": { org: 69, delta: 1,  best: { name: "Inspire", score: 75 }, worst: { name: "Develop", score: 60 }, atRisk: 7 },
  "Nov 2025 Cycle": { org: 68, delta: 3,  best: { name: "Inspire", score: 74 }, worst: { name: "Develop", score: 59 }, atRisk: 7 },
  "Oct 2025 Cycle": { org: 65, delta: -2, best: { name: "Inspire", score: 71 }, worst: { name: "Develop", score: 55 }, atRisk: 9 },
  "Sep 2025 Cycle": { org: 67, delta: 1,  best: { name: "Inspire", score: 73 }, worst: { name: "Develop", score: 57 }, atRisk: 8 },
  "Aug 2025 Cycle": { org: 66, delta: 0,  best: { name: "Inspire", score: 72 }, worst: { name: "Develop", score: 58 }, atRisk: 8 },
};

interface PeriodCtx {
  period: Period;
  setPeriod: (p: Period) => void;
  snapshot: PeriodSnapshot;
}

const Ctx = createContext<PeriodCtx | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<Period>("Apr 2026 Cycle");

  const setPeriod = useCallback((p: Period) => {
    setPeriodState(p);
    toast(`Data updated for ${p.replace(" Cycle", "")}`, { duration: 2000, position: "bottom-right" });
  }, []);

  const value = useMemo<PeriodCtx>(
    () => ({ period, setPeriod, snapshot: snapshots[period] }),
    [period, setPeriod],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePeriod() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePeriod must be used within PeriodProvider");
  return ctx;
}
