// Per-manager dimension breakdown + key drivers, deterministic per cycle.
import type { Manager } from "@/lib/data";
import { SUB_THEMES } from "@/lib/dimensionThemes";

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const DIMS = ["Connect", "Develop", "Inspire"] as const;
type Dim = typeof DIMS[number];

export interface DimBreakdown {
  dim: Dim;
  score: number;
  delta: number;
  subthemes: Array<{ key: string; label: string; score: number }>;
}

export interface TeamBreakdown {
  dimensions: DimBreakdown[];
  drivers: Array<{ label: string; dim: Dim; score: number; impact: "boost" | "drag" }>;
  responseRate: number;
  selfVsTeamGap: number;
  participation: { invited: number; responded: number };
}

export function getTeamBreakdown(m: Manager, cycle: string): TeamBreakdown {
  const seed = hash(m.id + "::" + cycle);
  const r = rng(seed);
  // Build dim scores around the manager's overall score
  const offsets = [r() * 14 - 7, r() * 14 - 7, r() * 14 - 7];
  const dimensions: DimBreakdown[] = DIMS.map((d, i) => {
    const score = Math.max(28, Math.min(98, Math.round(m.score + offsets[i])));
    const delta = Math.round((r() - 0.45) * 16);
    const subs = SUB_THEMES[d];
    const baseAvg = subs.reduce((s, t) => s + t.base, 0) / subs.length;
    const pull = score - baseAvg;
    const subthemes = subs.map((t) => ({
      key: t.key,
      label: t.label,
      score: Math.max(28, Math.min(98, Math.round(t.base + pull + (r() - 0.5) * 10))),
    }));
    return { dim: d, score, delta, subthemes };
  });

  // Top 3 boosts + bottom 3 drags
  const allSubs: Array<{ label: string; dim: Dim; score: number }> = dimensions.flatMap((d) =>
    d.subthemes.map((s) => ({ label: s.label, dim: d.dim, score: s.score })),
  );
  const sorted = [...allSubs].sort((a, b) => b.score - a.score);
  const boosts = sorted.slice(0, 3).map((s) => ({ ...s, impact: "boost" as const }));
  const drags = sorted.slice(-3).reverse().map((s) => ({ ...s, impact: "drag" as const }));

  const responded = Math.max(2, Math.min(m.teamSize, Math.round(m.teamSize * (0.6 + r() * 0.35))));
  return {
    dimensions,
    drivers: [...drags, ...boosts],
    responseRate: Math.round((responded / m.teamSize) * 100),
    selfVsTeamGap: Math.round((r() - 0.3) * 22),
    participation: { invited: m.teamSize, responded },
  };
}
