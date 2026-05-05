// Deterministic response-rate breakdown by manager and department, per cycle.
import { POOL, type PoolManager } from "@/lib/managerPool";

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export interface ManagerResponseRate {
  id: string;
  name: string;
  initials: string;
  department: string;
  seniority: PoolManager["seniority"];
  invited: number;
  responded: number;
  rate: number; // 0-100
  delta: number; // vs prev cycle
}

export interface DepartmentResponseRate {
  department: string;
  invited: number;
  responded: number;
  rate: number;
  managerCount: number;
  delta: number;
}

function rateFor(m: PoolManager, cycle: string): number {
  const r = rng(hash(m.id + "::rr::" + cycle));
  // Base by seniority — senior cohorts tend to pull higher participation
  const base = m.seniority === "CEO/CXO" ? 82
    : m.seniority === "Senior Manager" ? 78
    : m.seniority === "Middle Manager" ? 74
    : 68;
  const v = base + (r() - 0.5) * 36; // ±18
  return Math.max(28, Math.min(100, Math.round(v)));
}

function prevCycleKey(cycle: string) { return cycle + "::prev"; }

export function getManagerResponseRates(cycle: string): ManagerResponseRate[] {
  return POOL.map((m) => {
    const rate = rateFor(m, cycle);
    const prev = rateFor(m, prevCycleKey(cycle));
    const responded = Math.max(0, Math.min(m.teamSize, Math.round((rate / 100) * m.teamSize)));
    return {
      id: m.id,
      name: m.name,
      initials: m.initials,
      department: m.department,
      seniority: m.seniority,
      invited: m.teamSize,
      responded,
      rate,
      delta: rate - prev,
    };
  });
}

export function getDepartmentResponseRates(cycle: string): DepartmentResponseRate[] {
  const list = getManagerResponseRates(cycle);
  const map = new Map<string, DepartmentResponseRate>();
  for (const m of list) {
    const cur = map.get(m.department) ?? { department: m.department, invited: 0, responded: 0, rate: 0, managerCount: 0, delta: 0 };
    cur.invited += m.invited;
    cur.responded += m.responded;
    cur.managerCount += 1;
    cur.delta += m.delta;
    map.set(m.department, cur);
  }
  return [...map.values()].map((d) => ({
    ...d,
    rate: d.invited ? Math.round((d.responded / d.invited) * 100) : 0,
    delta: Math.round(d.delta / Math.max(1, d.managerCount)),
  })).sort((a, b) => b.rate - a.rate);
}

export function getOrgResponseRate(cycle: string) {
  const list = getManagerResponseRates(cycle);
  const invited = list.reduce((s, m) => s + m.invited, 0);
  const responded = list.reduce((s, m) => s + m.responded, 0);
  const rate = invited ? Math.round((responded / invited) * 100) : 0;
  const delta = Math.round(list.reduce((s, m) => s + m.delta, 0) / Math.max(1, list.length));
  return { invited, responded, rate, delta };
}
