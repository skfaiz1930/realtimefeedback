import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

export interface TourStep {
  key: string;
  target?: string; // data-tour value; omit for centered
  title: string;
  body: string;
  preferred?: "top" | "bottom" | "left" | "right";
}

export const TOUR_STEPS: TourStep[] = [
  {
    key: "welcome",
    title: "Welcome to GMI Pulse",
    body: "This 2-minute tour shows you exactly what to look at and what to do with it. You can skip anytime and come back via Take a tour in the sidebar.",
  },
  {
    key: "period",
    target: "period-selector",
    title: "Choose your survey cycle",
    body: "Switch between monthly, quarterly, or custom date ranges. Every chart and score on every page updates for the selected cycle.",
    preferred: "bottom",
  },
  {
    key: "org-health",
    target: "org-health",
    title: "Your org at a glance",
    body: "This is your organisation-wide manager effectiveness score. Above 75 is strong. The trend arrow shows change from last cycle.",
    preferred: "bottom",
  },
  {
    key: "at-risk",
    target: "at-risk-kpi",
    title: "Who needs attention right now",
    body: "Teams flagged here have dropped 10+ points or show a large self-vs-team gap. This is where to focus first.",
    preferred: "bottom",
  },
  {
    key: "ai-summary",
    target: "ai-summary",
    title: "Your AI analyst",
    body: "This is generated fresh every cycle. It reads your data and tells you what changed, who to watch, and what to do next. No manual analysis needed.",
    preferred: "left",
  },
  {
    key: "cdi",
    target: "cdi-bars",
    title: "The three levers of manager effectiveness",
    body: "Connect, Develop, Inspire — GMI's framework validated across 4,000+ managers. Click any dimension to see the underlying questions and sub-themes.",
    preferred: "top",
  },
  {
    key: "attention",
    target: "attention-strip",
    title: "Your priority managers",
    body: "These managers are ordered by urgency. Click any card to see their full CDI breakdown, self-team gap, and an AI-written coaching brief.",
    preferred: "top",
  },
  {
    key: "actions",
    target: "ai-actions",
    title: "What to do this week",
    body: "AI generates these actions every cycle based on your actual data — named managers, specific dimensions, real scores. Check them off as you complete them.",
    preferred: "left",
  },
  {
    key: "response-rate",
    target: "response-rate",
    title: "Participation matters",
    body: "Below 60% response rate reduces score confidence. Click this card to see which departments and managers need a participation nudge.",
    preferred: "bottom",
  },
  {
    key: "sidebar-nav",
    target: "sidebar-nav",
    title: "Go deeper on any dimension",
    body: "Each page adds a new lens. Heatmap: question-level. Demographics: segment cuts. Trends: historical view. Comments: what people actually said.",
    preferred: "right",
  },
  {
    key: "ask-pulse",
    target: "ask-pulse",
    title: "Ask anything in plain English",
    body: "Try: Which managers in Sales declined most this cycle? or Compare Develop scores by tenure. Pulse navigates to the right page and pre-applies your filters.",
    preferred: "bottom",
  },
  {
    key: "trial",
    target: "trial-countdown",
    title: "Your trial clock is running",
    body: "You have full access to all features during your trial. Book a call with our team to convert before it ends — your data and settings carry over instantly.",
    preferred: "right",
  },
];

export const TOUR_DONE_KEY = "pulse_tour_completed";

interface TourCtx {
  open: boolean;
  step: number;
  showCompletion: boolean;
  start: () => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  finish: () => void;
  closeCompletion: () => void;
}

const Ctx = createContext<TourCtx | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_DONE_KEY)) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const start = useCallback(() => {
    setStep(0);
    setShowCompletion(false);
    setOpen(true);
  }, []);

  const next = useCallback(() => {
    setStep((s) => {
      if (s >= TOUR_STEPS.length - 1) {
        setOpen(false);
        setShowCompletion(true);
        return s;
      }
      return s + 1;
    });
  }, []);

  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  const skip = useCallback(() => {
    localStorage.setItem(TOUR_DONE_KEY, "1");
    setOpen(false);
    setShowCompletion(false);
  }, []);

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_DONE_KEY, "1");
    setOpen(false);
    setShowCompletion(false);
  }, []);

  const closeCompletion = useCallback(() => {
    localStorage.setItem(TOUR_DONE_KEY, "1");
    setShowCompletion(false);
  }, []);

  return (
    <Ctx.Provider value={{ open, step, showCompletion, start, next, back, skip, finish, closeCompletion }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTour() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTour outside provider");
  return v;
}
