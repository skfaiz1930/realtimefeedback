// Sub-themes per CDI dimension with deterministic per-cycle scoring.
import type { DimKey } from "@/lib/benchmarks";

export interface SubTheme {
  key: string;
  label: string;
  desc: string;
  base: number; // baseline score
}

export const SUB_THEMES: Record<Exclude<DimKey, "Overall">, SubTheme[]> = {
  Connect: [
    { key: "trust",        label: "Trust",            desc: "Psychological safety & reliability", base: 76 },
    { key: "communication",label: "Communication",    desc: "Clarity, context, frequency",        base: 72 },
    { key: "listening",    label: "Active Listening", desc: "Attention to team voice",            base: 70 },
    { key: "empathy",      label: "Empathy",          desc: "Care for individuals",               base: 74 },
    { key: "recognition",  label: "Recognition",      desc: "Acknowledging contributions",        base: 68 },
    { key: "approach",     label: "Approachability",  desc: "Open door behaviours",               base: 78 },
    { key: "fairness",     label: "Fairness",         desc: "Equitable decisions",                base: 73 },
  ],
  Develop: [
    { key: "growth",       label: "Growth Planning",  desc: "Career path conversations",          base: 58 },
    { key: "feedback",     label: "Feedback Quality", desc: "Specific, timely, useful",           base: 62 },
    { key: "stretch",      label: "Stretch Work",     desc: "Challenging assignments",            base: 55 },
    { key: "coaching",     label: "Coaching",         desc: "Hands-on guidance",                  base: 64 },
    { key: "learning",     label: "Learning Access",  desc: "Programs & opportunities",           base: 60 },
    { key: "ownership",    label: "Ownership",        desc: "Autonomy on outcomes",               base: 67 },
    { key: "skills",       label: "Skill Building",   desc: "Capability progression",             base: 63 },
  ],
  Inspire: [
    { key: "purpose",      label: "Purpose",          desc: "Connection to mission",              base: 82 },
    { key: "vision",       label: "Vision Clarity",   desc: "Where we're going",                  base: 76 },
    { key: "leadByEx",     label: "Lead by Example",  desc: "Walks the talk",                     base: 84 },
    { key: "energy",       label: "Energy",           desc: "Positivity & momentum",              base: 78 },
    { key: "wellbeing",    label: "Wellbeing",        desc: "Sustainable pace",                   base: 74 },
    { key: "innovation",   label: "Innovation",       desc: "Space for new ideas",                base: 71 },
    { key: "consistency",  label: "Consistency",      desc: "Dependable behaviour",               base: 80 },
  ],
};

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function subThemeScores(dim: Exclude<DimKey, "Overall">, cycle: string, dimScore?: number): Array<SubTheme & { score: number; delta: number }> {
  const themes = SUB_THEMES[dim];
  const r = rng(hash(cycle + ":" + dim));
  const rPrev = rng(hash(cycle + ":prev:" + dim));
  // pull toward provided dimScore so subthemes average near it
  const baseAvg = themes.reduce((s, t) => s + t.base, 0) / themes.length;
  const pull = dimScore != null ? (dimScore - baseAvg) : 0;
  return themes.map((t) => {
    const noise = (r() - 0.5) * 12;
    const score = Math.max(30, Math.min(98, Math.round(t.base + pull + noise)));
    const prevNoise = (rPrev() - 0.5) * 12;
    const prev = Math.max(30, Math.min(98, Math.round(t.base + pull + prevNoise)));
    return { ...t, score, delta: score - prev };
  });
}
