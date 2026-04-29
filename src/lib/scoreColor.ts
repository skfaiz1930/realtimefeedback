export interface ScoreColor { bg: string; text: string; }

export function scoreColor(score: number): ScoreColor {
  if (score >= 90) return { bg: "#DCFCE7", text: "#16A34A" };
  if (score >= 75) return { bg: "#FEF9C3", text: "#CA8A04" };
  if (score >= 60) return { bg: "#FEF3C7", text: "#D97706" };
  if (score >= 45) return { bg: "#FEE2E2", text: "#DC2626" };
  return { bg: "#FCA5A5", text: "#991B1B" };
}
