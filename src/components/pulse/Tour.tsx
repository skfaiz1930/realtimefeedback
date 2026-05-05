import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TOUR_STEPS, useTour } from "@/lib/tourState";

const PAD = 8;
const TIP_W = 320;
const TIP_GAP = 14;

interface Rect { top: number; left: number; width: number; height: number; }

function useTargetRect(selector?: string, dep?: number): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!selector) { setRect(null); return; }
    let raf = 0;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
      if (!el) { setRect(null); return; }
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      });
    };
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const interval = setInterval(measure, 400);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      clearInterval(interval);
    };
  }, [selector, dep]);

  return rect;
}

function computeTipPosition(rect: Rect | null, preferred?: string) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tipH = 200;
  if (!rect) {
    return { top: vh / 2 - tipH / 2, left: vw / 2 - TIP_W / 2, arrow: null as null | string };
  }
  const spaceBelow = vh - (rect.top + rect.height);
  const spaceAbove = rect.top;
  const spaceRight = vw - (rect.left + rect.width);
  const spaceLeft = rect.left;
  let side = preferred ?? "bottom";
  const fits: Record<string, boolean> = {
    bottom: spaceBelow > tipH + 30,
    top: spaceAbove > tipH + 30,
    right: spaceRight > TIP_W + 30,
    left: spaceLeft > TIP_W + 30,
  };
  if (!fits[side]) {
    side = (["bottom", "top", "right", "left"] as const).find((s) => fits[s]) ?? "bottom";
  }
  let top = 0, left = 0;
  if (side === "bottom") { top = rect.top + rect.height + TIP_GAP; left = rect.left + rect.width / 2 - TIP_W / 2; }
  else if (side === "top") { top = rect.top - tipH - TIP_GAP; left = rect.left + rect.width / 2 - TIP_W / 2; }
  else if (side === "right") { top = rect.top + rect.height / 2 - tipH / 2; left = rect.left + rect.width + TIP_GAP; }
  else { top = rect.top + rect.height / 2 - tipH / 2; left = rect.left - TIP_W - TIP_GAP; }
  left = Math.max(12, Math.min(vw - TIP_W - 12, left));
  top = Math.max(12, Math.min(vh - tipH - 12, top));
  return { top, left, arrow: side };
}

export function Tour() {
  const { open, step, next, back, skip } = useTour();
  const current = TOUR_STEPS[step];
  const rect = useTargetRect(open ? current?.target : undefined, step);
  const [tipVisible, setTipVisible] = useState(false);

  useEffect(() => {
    setTipVisible(false);
    const t = setTimeout(() => setTipVisible(true), current?.target ? 320 : 100);
    return () => clearTimeout(t);
  }, [step, open]);

  if (!open || !current) return null;

  const isLast = step === TOUR_STEPS.length - 1;
  const tip = computeTipPosition(rect, current.preferred);

  // Spotlight rect (pad)
  const spotlight = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;

  return (
    <div className="fixed inset-0 z-[100]" aria-modal="true" role="dialog">
      {/* Overlay with cutout via SVG mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={skip}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <motion.rect
                animate={{ x: spotlight.left, y: spotlight.top, width: spotlight.width, height: spotlight.height }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                rx={8}
                ry={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#tour-mask)" />
      </svg>

      {/* Spotlight border ring */}
      {spotlight && (
        <motion.div
          className="absolute pointer-events-none rounded-lg ring-2 ring-primary/60"
          animate={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        {tipVisible && (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="absolute bg-card text-foreground"
            style={{
              top: tip.top,
              left: tip.left,
              width: TIP_W,
              borderRadius: 14,
              padding: "20px 24px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Arrow */}
            {tip.arrow && rect && (
              <div
                className="absolute w-3 h-3 bg-card rotate-45"
                style={{
                  ...(tip.arrow === "bottom" && { top: -6, left: Math.min(TIP_W - 24, Math.max(12, rect.left + rect.width / 2 - tip.left - 6)) }),
                  ...(tip.arrow === "top" && { bottom: -6, left: Math.min(TIP_W - 24, Math.max(12, rect.left + rect.width / 2 - tip.left - 6)) }),
                  ...(tip.arrow === "right" && { left: -6, top: 24 }),
                  ...(tip.arrow === "left" && { right: -6, top: 24 }),
                  boxShadow: "0 0 0 transparent",
                }}
              />
            )}

            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] text-primary/80 font-medium">
                <span className="mr-1">●</span> Step {step + 1} of {TOUR_STEPS.length}
              </div>
            </div>
            <div className="text-[15px] font-medium leading-snug mb-1.5">{current.title}</div>
            <div className="text-[13px] text-muted-foreground" style={{ lineHeight: 1.6 }}>{current.body}</div>

            <div className="mt-5 flex items-center justify-between">
              <button onClick={skip} className="text-[12px] text-muted-foreground hover:text-foreground">Skip tour</button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={back}
                    className="h-8 px-3 rounded-md border border-border text-[12px] font-medium hover:bg-muted/50"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={next}
                  className={`h-8 px-3.5 rounded-md text-[12px] font-medium text-white ${isLast ? "bg-success hover:bg-success/90" : "bg-primary hover:bg-primary/90"}`}
                  style={isLast ? { background: "#16A34A" } : undefined}
                >
                  {isLast ? "Done" : "Next"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TourCompletionModal() {
  const { showCompletion, closeCompletion } = useTour();
  if (!showCompletion) return null;

  const goToRahul = () => {
    closeCompletion();
    window.dispatchEvent(new CustomEvent("pulse:open-manager", { detail: { id: "1", tab: "coaching" } }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-card rounded-2xl shadow-2xl p-7 max-w-[420px] w-full pointer-events-auto"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.20)" }}
      >
        <div className="text-[20px] font-medium mb-2">You're all set, Priya 👋</div>
        <div className="text-[13.5px] text-muted-foreground leading-relaxed mb-6">
          Start with the At-Risk strip — click Rahul Mehta's card and generate his Coaching Brief. That's the fastest way to see the value of Pulse in under 5 minutes.
        </div>
        <button
          onClick={goToRahul}
          className="w-full h-10 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90"
        >
          Go to Rahul's profile →
        </button>
        <button
          onClick={closeCompletion}
          className="w-full mt-3 text-[12px] text-muted-foreground hover:text-foreground"
        >
          Explore on my own
        </button>
      </motion.div>
    </div>
  );
}
