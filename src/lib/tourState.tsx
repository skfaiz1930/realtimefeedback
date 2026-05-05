import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type TourMode = "full" | "page";

export interface TourStep {
  id: string;
  chapter: string;            // e.g. "Overview"
  chapterIndex: number;       // 1..7
  stepInChapter: number;      // 1..n
  totalInChapter: number;
  route: string;              // page route this step belongs to
  target?: string;            // CSS selector (querySelector). Omit for centered.
  preferred?: "top" | "bottom" | "left" | "right" | "center";
  title: string;
  body: string;
  ctaLabel?: string;
}

export const CHAPTER_COLORS: Record<string, string> = {
  Overview:        "#C8102E",
  Heatmap:         "#D97706",
  Demographics:    "#16A34A",
  "Culture Map":   "#7F77DD",
  Trends:          "#0EA5E9",
  Comments:        "#EC4899",
  "Dev Tracks":    "#F59E0B",
};

export const ROUTE_TO_CHAPTER: Record<string, string> = {
  "/": "Overview",
  "/heatmap": "Heatmap",
  "/demographics": "Demographics",
  "/culture-map": "Culture Map",
  "/trends": "Trends",
  "/comments": "Comments",
  "/development-tracks": "Dev Tracks",
};

export const CHAPTER_TO_ROUTE: Record<string, string> = Object.fromEntries(
  Object.entries(ROUTE_TO_CHAPTER).map(([r, c]) => [c, r])
);

// Helper to build step lists per chapter
function build(chapter: string, chapterIndex: number, route: string,
  steps: Array<Omit<TourStep, "chapter" | "chapterIndex" | "stepInChapter" | "totalInChapter" | "route">>) {
  return steps.map((s, i) => ({
    ...s,
    chapter,
    chapterIndex,
    stepInChapter: i + 1,
    totalInChapter: steps.length,
    route,
  })) as TourStep[];
}

const overviewSteps = build("Overview", 1, "/", [
  { id: "ov-1", target: '[data-tour="greeting-header"]', preferred: "bottom",
    title: "Welcome to GMI Pulse",
    body: "This is your people analytics command centre. We'll walk you through all 7 pages in about 4 minutes. You can skip anytime — or revisit any page tour from the header." },
  { id: "ov-2", target: '[data-tour="kpi-cards-row"]', preferred: "bottom",
    title: "Your org at a glance",
    body: "Four numbers tell you if today is a good day: Org Health Score, active managers, response rate, and at-risk teams. Start here every morning." },
  { id: "ov-3", target: '[data-tour="cdi-bars"]', preferred: "top",
    title: "The three levers",
    body: "Connect, Develop, Inspire — GMI's framework across 4,000+ managers. The bar that's lowest tells you where to focus your coaching energy this cycle." },
  { id: "ov-4", target: '[data-tour="attention-strip"]', preferred: "top",
    title: "Who needs attention right now",
    body: "Ordered by urgency. The first card is your biggest risk. Click any manager to see their full breakdown, self-vs-team gap, and an AI-written coaching brief." },
  { id: "ov-5", target: '[data-tour="ai-summary"]', preferred: "left",
    title: "Your AI analyst",
    body: "The AI reads your data every cycle and writes the summary, actions, and nudges for you. No spreadsheets. No manual analysis." },
  { id: "ov-6", target: '[data-tour="ai-actions"]', preferred: "left",
    title: "What to do this week",
    body: "These actions are generated from your actual data — named managers, specific dimensions. Check them off as you act on them.",
    ctaLabel: "Next: Heatmap →" },
]);

const heatmapSteps = build("Heatmap", 2, "/heatmap", [
  { id: "hm-1", target: '[data-tour="heatmap-ai-guide"]', preferred: "bottom",
    title: "Your AI diagnostic guide",
    body: "AI flags the 3 most important cells to look at — not just the lowest scores. Self-awareness gaps, unexpected drops, systemic lows. Start here." },
  { id: "hm-2", target: '[data-tour="heatmap-filter-pills"]', preferred: "bottom",
    title: "Filter by dimension",
    body: "Click Connect, Develop, or Inspire to isolate that dimension's questions. Combine with the respondent type toggles to pinpoint exactly where the gap lives." },
  { id: "hm-3", target: '[data-tour="heatmap-table-header"]', preferred: "bottom",
    title: "Four perspectives on every question",
    body: "Manager Self, Team Member, Peer, RM. A question where the manager scores themselves 20 points above their team is a self-awareness issue — not a performance one." },
  { id: "hm-4", target: '[data-tour="heatmap-color-legend"]', preferred: "top",
    title: "Reading the colors",
    body: "Green = strong (90+). Yellow = acceptable (75–89). Amber = needs attention (60–74). Red = critical gap (below 60). Red + high Manager Self = blind spot." },
  { id: "hm-5", target: '[data-tour="heatmap-summary-row"]', preferred: "top",
    title: "The gap that matters most",
    body: "Compare the Team Member average to the Manager Self average. That gap — across all 25 questions — is your organisation's collective self-awareness score.",
    ctaLabel: "Next: Demographics →" },
]);

const demographicsSteps = build("Demographics", 3, "/demographics", [
  { id: "dm-1", target: '[data-tour="problem-snapshot-card"]', preferred: "bottom",
    title: "Problem clusters, auto-detected",
    body: "When any demographic combination scores below 65, Pulse flags it here automatically. No manual cross-tabulation needed. This card updates live as you apply filters." },
  { id: "dm-2", target: '[data-tour="demographic-filter-panel"]', preferred: "left",
    title: "Slice in any direction",
    body: "Department, level, tenure, gender — apply any combination. Every chart on this page updates instantly. The problem snapshot recalculates with each change." },
  { id: "dm-3", target: '[data-tour="dept-score-bars"]', preferred: "top",
    title: "Score by department",
    body: "Departments flagged with ⚠ are scoring below 65. These are your highest attrition-risk segments. The bar length reflects the score — shorter bar = more urgent." },
  { id: "dm-4", target: '[data-tour="tenure-score-bars"]', preferred: "top",
    title: "Tenure is your leading indicator",
    body: "Employees in their first year almost always score lower. If 0–1yr AND a specific department are both low — that's a flight risk cluster forming right now." },
  { id: "dm-5", target: '[data-tour="problem-snapshot-card"]', preferred: "bottom",
    title: "Why it matters — AI explained",
    body: "The AI explains the retention risk of the detected cluster and suggests three interventions that have worked for similar cohorts in GMI's research base.",
    ctaLabel: "Next: Culture Map →" },
]);

const cultureSteps = build("Culture Map", 4, "/culture-map", [
  { id: "cm-1", target: '[data-tour="culture-map-container"]', preferred: "bottom",
    title: "Your organisation's manager landscape",
    body: "Every dot is a manager. Position shows their Self score (X axis) vs Team score (Y axis). The quadrant they're in tells you more than their number alone." },
  { id: "cm-2", target: '[data-tour="quadrant-champions"]', preferred: "bottom",
    title: "Champions — protect these managers",
    body: "High self-score AND high team score. These managers are your culture carriers. Know who they are. Recognise them. Don't overload them." },
  { id: "cm-3", target: '[data-tour="quadrant-blindspots"]', preferred: "top",
    title: "Blind spots — most urgent coaching need",
    body: "Manager thinks they're doing well. Team disagrees. This gap is the most common cause of unexpected resignations. These managers need a direct, data-backed 1:1." },
  { id: "cm-4", target: '[data-tour="quadrant-atrisk"]', preferred: "top",
    title: "At risk — immediate intervention",
    body: "Low self-score AND low team score. The manager knows something is wrong. Their team knows it too. This needs HR involvement this week — not next cycle." },
  { id: "cm-5", target: '[data-tour="culture-map-dot-first"]', preferred: "right",
    title: "Click any manager",
    body: "Hover to see name, team size, and CDI score. Click to open their full drilldown drawer — CDI breakdown, self-vs-team gap, coaching brief, and nudge composer.",
    ctaLabel: "Next: Trends →" },
]);

const trendsSteps = build("Trends", 5, "/trends", [
  { id: "tr-1", target: '[data-tour="trends-line-chart"]', preferred: "bottom",
    title: "8 cycles of org history",
    body: "Connect, Develop, Inspire, and Overall — plotted across every survey cycle. A rising line means your managers are getting better. A dip means something happened." },
  { id: "tr-2", target: '[data-tour="trends-intervention-markers"]', preferred: "bottom",
    title: "Interventions that moved the needle",
    body: "Purple dashed lines mark when something changed — a training cohort, a nudge campaign, a reorg. Click any marker to see what happened and what the score did next." },
  { id: "tr-3", target: '[data-tour="trends-anomaly-section"]', preferred: "top",
    title: "AI root cause analysis",
    body: "When a score drops or spikes, AI explains why — which department drove it, what event correlates, and how confident the analysis is. Not just what happened — why." },
  { id: "tr-4", target: '[data-tour="trends-yoy-toggle"]', preferred: "bottom",
    title: "Year-on-year comparison",
    body: "Toggle this to compare the same cycle across two years. The grouped bars show exactly how much each dimension has improved — this is your board slide." },
  { id: "tr-5", target: '[data-tour="trends-cycle-table"]', preferred: "top",
    title: "The changelog at a glance",
    body: "Every cycle in one table. Each score color-coded. Delta column shows change from previous cycle. Sort by any column to find the best or worst cycle in your history.",
    ctaLabel: "Next: Comments →" },
]);

const commentsSteps = build("Comments", 6, "/comments", [
  { id: "co-1", target: '[data-tour="comments-ai-banner"]', preferred: "bottom",
    title: "What 312 people said — in 3 sentences",
    body: "AI reads every comment and writes the executive summary before you look at anything. The most critical theme, its sentiment, and its link to your CDI scores — right here." },
  { id: "co-2", target: '[data-tour="comments-sentiment-donut"]', preferred: "left",
    title: "Sentiment at a glance",
    body: "The donut updates live with every filter you apply. If you filter for Sales + Team Member and the donut turns mostly red — you have a Sales manager problem, not an org problem." },
  { id: "co-3", target: '[data-tour="comments-filter-bar"]', preferred: "left",
    title: "Filter to the signal",
    body: "Dimension, respondent type, department, manager, age group — combine any of these. The donut, themes, and quotes all update together. This is how you validate a hypothesis in 30 seconds." },
  { id: "co-4", target: '[data-tour="comments-theme-grid"]', preferred: "top",
    title: "AI-clustered themes",
    body: "AI groups similar comments into themes automatically each cycle — names them, scores sentiment, and picks the single most representative quote. No manual reading required." },
  { id: "co-5", target: '[data-tour="comments-theme-grid"]', preferred: "top",
    title: "Go deeper on any theme",
    body: "Click 'See all quotes' to expand the full comment list for that theme. Each quote shows respondent type, department, and tenure — so you can see exactly who's saying what.",
    ctaLabel: "Next: Dev Tracks →" },
]);

const tracksSteps = build("Dev Tracks", 7, "/development-tracks", [
  { id: "dt-1", target: '[data-tour="dev-tracks-manager-list"]', preferred: "bottom",
    title: "Every manager's coaching plan",
    body: "Each manager has a development track — their coaching focus, recommended actions, and progress across cycles. This is where insight becomes behaviour change." },
  { id: "dt-2", target: '[data-tour="dev-tracks-cdi-focus"]', preferred: "bottom",
    title: "Dimension-specific coaching",
    body: "Each track is anchored to the manager's lowest CDI dimension. Not generic 'be a better manager' — specific to whether they need to work on Connect, Develop, or Inspire." },
  { id: "dt-3", target: '[data-tour="dev-tracks-nudge-section"]', preferred: "top",
    title: "Nudges that reach managers where they are",
    body: "Compose a nudge directly from the coaching plan. AI writes it for you — channel-aware for email, Slack, or WhatsApp. One click to copy and send." },
  { id: "dt-4", target: '[data-tour="dev-tracks-progress-chart"]', preferred: "top",
    title: "Is the coaching working?",
    body: "Track score movement across cycles for each manager on a development plan. A rising line here is the evidence you need to show the CHRO that your interventions work.",
    ctaLabel: "Finish tour ✓" },
]);

export const FULL_TOUR_STEPS: TourStep[] = [
  ...overviewSteps, ...heatmapSteps, ...demographicsSteps,
  ...cultureSteps, ...trendsSteps, ...commentsSteps, ...tracksSteps,
];

export const CHAPTER_STEPS: Record<string, TourStep[]> = {
  Overview: overviewSteps,
  Heatmap: heatmapSteps,
  Demographics: demographicsSteps,
  "Culture Map": cultureSteps,
  Trends: trendsSteps,
  Comments: commentsSteps,
  "Dev Tracks": tracksSteps,
};

export const TOUR_DONE_KEY = "pulse_full_tour_completed";

interface TourCtx {
  isActive: boolean;
  mode: TourMode | null;
  steps: TourStep[];
  index: number;
  current: TourStep | null;
  showCompletion: boolean;
  bridge: { to: string; chapter: string; chapterIndex: number } | null;
  startFullTour: () => void;
  startPageTour: (route: string) => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  finish: () => void;
  closeCompletion: () => void;
  fullCompleted: boolean;
}

const Ctx = createContext<TourCtx | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TourMode | null>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [bridge, setBridge] = useState<{ to: string; chapter: string; chapterIndex: number } | null>(null);
  const [fullCompleted, setFullCompleted] = useState<boolean>(() => !!localStorage.getItem(TOUR_DONE_KEY));

  // Auto-start on first visit
  useEffect(() => {
    if (!fullCompleted && !mode) {
      const t = setTimeout(() => {
        setMode("full");
        setSteps(FULL_TOUR_STEPS);
        setIndex(0);
      }, 700);
      return () => clearTimeout(t);
    }
  }, []);

  const startFullTour = useCallback(() => {
    setShowCompletion(false);
    setBridge(null);
    setSteps(FULL_TOUR_STEPS);
    setIndex(0);
    setMode("full");
  }, []);

  const startPageTour = useCallback((route: string) => {
    const chapter = ROUTE_TO_CHAPTER[route];
    if (!chapter) return;
    const s = CHAPTER_STEPS[chapter];
    if (!s?.length) return;
    setShowCompletion(false);
    setBridge(null);
    setSteps(s);
    setIndex(0);
    setMode("page");
  }, []);

  const skip = useCallback(() => {
    setMode(null);
    setBridge(null);
    setShowCompletion(false);
  }, []);

  const finish = useCallback(() => {
    if (mode === "full") {
      localStorage.setItem(TOUR_DONE_KEY, "1");
      setFullCompleted(true);
      setShowCompletion(true);
    }
    setMode(null);
    setBridge(null);
  }, [mode]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) {
        // finish
        if (mode === "full") {
          localStorage.setItem(TOUR_DONE_KEY, "1");
          setFullCompleted(true);
          setShowCompletion(true);
        }
        setMode(null);
        return i;
      }
      const cur = steps[i];
      const nxt = steps[i + 1];
      if (mode === "full" && cur && nxt && cur.route !== nxt.route) {
        setBridge({ to: nxt.route, chapter: nxt.chapter, chapterIndex: nxt.chapterIndex });
      }
      return i + 1;
    });
  }, [steps, mode]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  const closeCompletion = useCallback(() => setShowCompletion(false), []);

  const current = steps[index] ?? null;

  // Escape key skip
  useEffect(() => {
    if (!mode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, skip]);

  const value = useMemo<TourCtx>(() => ({
    isActive: mode !== null,
    mode,
    steps,
    index,
    current,
    showCompletion,
    bridge,
    startFullTour,
    startPageTour,
    next,
    back,
    skip,
    finish,
    closeCompletion,
    fullCompleted,
  }), [mode, steps, index, current, showCompletion, bridge, startFullTour, startPageTour, next, back, skip, finish, closeCompletion, fullCompleted]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTour() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTour outside provider");
  return v;
}

// Backward compat: expose clearBridge via separate hook for Tour engine
export function useTourBridge() {
  const v = useContext(Ctx) as any;
  return {
    bridge: v?.bridge ?? null,
    clear: () => { /* set via internal */ },
  };
}
