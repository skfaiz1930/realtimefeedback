// Deterministic per-cycle adjusters for Heatmap, Demographics, CultureMap, Comments.
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function cycleSeed(cycle: string, salt = "") { return hash(cycle + "::" + salt); }

export function cycleNoise(cycle: string, key: string, range = 8) {
  const r = rng(hash(cycle + "::" + key));
  return (r() - 0.5) * range;
}

export function adjustScore(base: number, cycle: string, key: string, range = 8) {
  return Math.max(20, Math.min(98, Math.round(base + cycleNoise(cycle, key, range))));
}
