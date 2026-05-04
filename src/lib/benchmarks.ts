// Industry & internal benchmark mock data
export type DimKey = "Connect" | "Develop" | "Inspire" | "Overall";

export const INDUSTRY: Record<DimKey, number> = {
  Connect: 70,
  Develop: 65,
  Inspire: 72,
  Overall: 69,
};

export const INTERNAL: Record<DimKey, number> = {
  Connect: 68,
  Develop: 58,
  Inspire: 74,
  Overall: 67,
};

export const INDUSTRY_SOURCE = "GMI Industry Index 2026 (n=412 orgs)";
export const INTERNAL_SOURCE = "Your org — 12-cycle rolling avg";

export function deltaTone(d: number) {
  if (d > 0) return "text-success";
  if (d < 0) return "text-danger";
  return "text-muted-foreground";
}

// Industry sentiment for Comments page
export const INDUSTRY_SENTIMENT = { pos: 48, neu: 32, neg: 20 };
