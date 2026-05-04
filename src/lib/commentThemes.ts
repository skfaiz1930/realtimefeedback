// Shared comment-theme summary used by AI prompts (CoachingBrief, HeatmapDiagnostic).
// Mirrors the static themes shown on the Comments page so the loop is closed.

export type ThemeDim = "Connect" | "Develop" | "Inspire" | "Cross-cutting";

export interface CommentTheme {
  name: string;
  dim: ThemeDim;
  count: number;
  sentimentLabel: "Mostly Negative" | "Mixed" | "Mostly Positive";
  topQuote: string;
}

export const commentThemes: CommentTheme[] = [
  { name: "Growth & Development", dim: "Develop", count: 67, sentimentLabel: "Mostly Negative",
    topQuote: "We talked about a learning plan in January but nothing happened." },
  { name: "Manager Accessibility", dim: "Connect", count: 54, sentimentLabel: "Mixed",
    topQuote: "Hard to get 1:1 time. Meetings always get rescheduled." },
  { name: "Recognition Gap", dim: "Connect", count: 48, sentimentLabel: "Mostly Negative",
    topQuote: "I completed the entire migration alone and it wasn't mentioned once." },
  { name: "Team Culture", dim: "Inspire", count: 52, sentimentLabel: "Mostly Positive",
    topQuote: "Best team I've been on. My manager sets the tone." },
  { name: "Workload & Burnout", dim: "Cross-cutting", count: 43, sentimentLabel: "Mostly Negative",
    topQuote: "Deadlines are unrealistic and my manager doesn't push back with leadership." },
  { name: "Career Clarity", dim: "Develop", count: 48, sentimentLabel: "Mixed",
    topQuote: "I genuinely don't know what promotion looks like for me." },
];

/** Compact serialisable form for prompt context */
export function themesForPrompt(filterDim?: ThemeDim) {
  const list = filterDim ? commentThemes.filter((t) => t.dim === filterDim || t.dim === "Cross-cutting") : commentThemes;
  return list.map((t) => ({
    theme: t.name, dim: t.dim, count: t.count, sentiment: t.sentimentLabel, quote: t.topQuote,
  }));
}
