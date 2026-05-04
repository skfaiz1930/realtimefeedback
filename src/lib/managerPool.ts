// Deterministic pool of 120+ managers across seniority levels with per-cycle scores.
import type { Manager, RiskLevel } from "@/lib/data";

export type Seniority = "First-time Manager" | "Middle Manager" | "Senior Manager" | "CEO/CXO";

export interface PoolManager extends Manager {
  seniority: Seniority;
  department: string;
}

const FIRST = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Reyansh","Krishna","Ishaan","Kabir","Anaya","Diya","Saanvi","Aadhya","Aaradhya","Pari","Anika","Navya","Myra","Sara","Riya","Rohan","Karan","Neha","Pooja","Priya","Rahul","Sneha","Deepa","Vikram","Ananya","Tanvi","Yash","Nikhil","Meera","Kavya","Aditi","Ritika","Aakash","Manav","Siddharth","Tara","Isha","Nisha","Amit","Suresh","Ravi","Divya","Sonia","Pranav","Rajesh"];
const LAST = ["Mehta","Kulkarni","Nair","Sharma","Rao","Iyer","Patel","Reddy","Gupta","Singh","Verma","Joshi","Das","Bose","Banerjee","Chatterjee","Shah","Pillai","Menon","Khan","Kapoor","Malhotra","Chopra","Bhat","Sinha","Ghosh","Saxena","Tiwari","Pandey","Trivedi"];
const DEPTS = ["Sales","Engineering","Product","Marketing","Operations","Customer Success","Finance","HR","Design","Data"];

const SEN_ORDER: Seniority[] = ["First-time Manager","Middle Manager","Senior Manager","CEO/CXO"];
const SEN_BASE: Record<Seniority, number> = {
  "First-time Manager": 64,
  "Middle Manager": 70,
  "Senior Manager": 75,
  "CEO/CXO": 79,
};
const SEN_TEAM: Record<Seniority, [number, number]> = {
  "First-time Manager": [4, 8],
  "Middle Manager": [6, 14],
  "Senior Manager": [12, 28],
  "CEO/CXO": [40, 220],
};

// Mulberry32 PRNG for determinism
function rng(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

const COUNTS: Record<Seniority, number> = {
  "First-time Manager": 56,
  "Middle Manager": 38,
  "Senior Manager": 22,
  "CEO/CXO": 8,
};

function buildPool(): PoolManager[] {
  const r = rng(424242);
  const out: PoolManager[] = [];
  let id = 1000;
  for (const sen of SEN_ORDER) {
    for (let i = 0; i < COUNTS[sen]; i++) {
      const f = FIRST[Math.floor(r() * FIRST.length)];
      const l = LAST[Math.floor(r() * LAST.length)];
      const name = `${f} ${l}`;
      const initials = (f[0] + l[0]).toUpperCase();
      const [tmin, tmax] = SEN_TEAM[sen];
      const teamSize = Math.round(tmin + r() * (tmax - tmin));
      out.push({
        id: `p${id++}`,
        name,
        initials,
        teamSize,
        score: SEN_BASE[sen],
        delta: 0,
        risk: "healthy",
        seniority: sen,
        department: DEPTS[Math.floor(r() * DEPTS.length)],
      });
    }
  }
  return out;
}

export const POOL: PoolManager[] = buildPool();

function riskOf(score: number): RiskLevel {
  if (score < 60) return "at-risk";
  if (score < 70) return "watch";
  return "healthy";
}

// Per-cycle deterministic adjustment of score & delta.
export function getManagersForCycle(cycle: string, orgDelta = 0): PoolManager[] {
  const cs = hash(cycle);
  return POOL.map((m, idx) => {
    const r = rng(cs ^ hash(m.id));
    const noise = (r() - 0.5) * 22; // ±11
    const orgPull = orgDelta * 0.6;
    const raw = Math.round(SEN_BASE[m.seniority] + noise + orgPull);
    const score = Math.max(28, Math.min(98, raw));
    const prevR = rng(hash(prevCycleKey(cycle)) ^ hash(m.id));
    const prevNoise = (prevR() - 0.5) * 22;
    const prev = Math.max(28, Math.min(98, Math.round(SEN_BASE[m.seniority] + prevNoise)));
    const delta = score - prev;
    return { ...m, score, delta, risk: riskOf(score) };
  });
}

// Heuristic prev-cycle key for delta (just deterministic salt)
function prevCycleKey(cycle: string) { return cycle + "::prev"; }

export function topPerformers(cycle: string, orgDelta = 0, n = 10): PoolManager[] {
  return [...getManagersForCycle(cycle, orgDelta)]
    .sort((a, b) => (b.score + b.delta * 0.5) - (a.score + a.delta * 0.5))
    .slice(0, n);
}

export function bySeniorityAvg(cycle: string, orgDelta = 0) {
  const list = getManagersForCycle(cycle, orgDelta);
  return SEN_ORDER.map((sen) => {
    const items = list.filter((m) => m.seniority === sen);
    const avg = Math.round(items.reduce((s, m) => s + m.score, 0) / items.length);
    const growth = +(items.reduce((s, m) => s + m.delta, 0) / items.length).toFixed(1);
    return { seniority: sen, avg, growth, count: items.length };
  });
}

export function topMovers(cycle: string, orgDelta = 0, n = 6) {
  return [...getManagersForCycle(cycle, orgDelta)]
    .sort((a, b) => b.delta - a.delta)
    .slice(0, n);
}
