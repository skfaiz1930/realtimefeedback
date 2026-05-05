import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CHAPTER_COLORS, CHAPTER_TO_ROUTE, ROUTE_TO_CHAPTER, useTour } from "@/lib/tourState";

const TIP_W = 320;
const TIP_W_TABLET = 280;
const TIP_GAP = 14;
const PAD = 8;

interface Rect { top: number; left: number; width: number; height: number; }

function useTargetRect(selector?: string, dep?: number): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  useLayoutEffect(() => {
    if (!selector) { setRect(null); return; }
    let raf = 0;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(selector);
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

function tipWidthFor(vw: number) {
  if (vw < 768) return Math.min(vw - 32, 360);
  if (vw < 1280) return TIP_W_TABLET;
  return TIP_W;
}

function computeTipPosition(rect: Rect | null, preferred?: string, vw = window.innerWidth, vh = window.innerHeight) {
  const tipW = tipWidthFor(vw);
  const tipH = 220;
  if (vw < 768) {
    return { top: vh - tipH - 16, left: 16, arrow: null as null | string, width: vw - 32 };
  }
  if (!rect || preferred === "center") {
    return { top: vh / 2 - tipH / 2, left: vw / 2 - tipW / 2, arrow: null as null | string, width: tipW };
  }
  const fits: Record<string, boolean> = {
    bottom: vh - (rect.top + rect.height) > tipH + 30,
    top: rect.top > tipH + 30,
    right: vw - (rect.left + rect.width) > tipW + 30,
    left: rect.left > tipW + 30,
  };
  let side = preferred ?? "bottom";
  if (!fits[side]) side = (["bottom", "top", "right", "left"] as const).find((s) => fits[s]) ?? "bottom";

  let top = 0, left = 0;
  if (side === "bottom") { top = rect.top + rect.height + TIP_GAP; left = rect.left + rect.width / 2 - tipW / 2; }
  else if (side === "top") { top = rect.top - tipH - TIP_GAP; left = rect.left + rect.width / 2 - tipW / 2; }
  else if (side === "right") { top = rect.top + rect.height / 2 - tipH / 2; left = rect.left + rect.width + TIP_GAP; }
  else { top = rect.top + rect.height / 2 - tipH / 2; left = rect.left - tipW - TIP_GAP; }
  left = Math.max(12, Math.min(vw - tipW - 12, left));
  top = Math.max(12, Math.min(vh - tipH - 12, top));
  return { top, left, arrow: side, width: tipW };
}

export function Tour() {
  const { isActive, mode, steps, index, current, next, back, skip, bridge, clearBridge } = useTour();
  const navigate = useNavigate();
  const location = useLocation();
  const [tipVisible, setTipVisible] = useState(false);
  const [settled, setSettled] = useState(false);
  const rect = useTargetRect(isActive && !bridge && current?.target ? current.target : undefined, index);

  // Navigate when step's route differs from current location
  useEffect(() => {
    if (!isActive || !current || bridge) return;
    if (location.pathname !== current.route) {
      const t = setTimeout(() => navigate(current.route), 50);
      return () => clearTimeout(t);
    }
  }, [isActive, current, bridge, location.pathname, navigate]);

  // Bridge auto-advance
  useEffect(() => {
    if (!bridge) return;
    const t = setTimeout(() => {
      navigate(bridge.to);
      setTimeout(() => clearBridge(), 500);
    }, 1500);
    return () => clearTimeout(t);
  }, [bridge, navigate, clearBridge]);

  // Settle delay before showing tooltip
  useEffect(() => {
    if (bridge) { setTipVisible(false); setSettled(false); return; }
    setTipVisible(false);
    setSettled(false);
    const t1 = setTimeout(() => setSettled(true), 350);
    const t2 = setTimeout(() => setTipVisible(true), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [index, bridge, location.pathname]);

  if (!isActive || !current) return null;

  const isLast = index === steps.length - 1;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const tip = computeTipPosition(rect, current.preferred, vw);
  const chapterColor = CHAPTER_COLORS[current.chapter] ?? "#C8102E";

  const spotlight = rect && !bridge
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;

  // Bridge card
  if (bridge) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" aria-modal="true" role="dialog">
        <div className="absolute inset-0 bg-black/55" />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white rounded-[14px] shadow-2xl px-7 py-6"
          style={{ width: 360, boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
        >
          <div className="text-[14px] font-medium text-foreground">→ Moving to {bridge.chapter}</div>
          <div className="text-[12px] text-muted-foreground mt-1">Chapter {bridge.chapterIndex} of 7</div>
          <div className="mt-4 h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#F0F0EE" }}>
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "linear" }}
              className="h-full"
              style={{ background: chapterColor }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100]" aria-modal="true" role="dialog" aria-label={current.title}>
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <motion.rect
                animate={{ x: spotlight.left, y: spotlight.top, width: spotlight.width, height: spotlight.height }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                rx={10} ry={10}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#tour-mask)" />
      </svg>

      {spotlight && (
        <motion.div
          className="absolute pointer-events-none rounded-[10px]"
          animate={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{ boxShadow: `0 0 0 2px ${chapterColor}55` }}
        />
      )}

      <AnimatePresence mode="wait">
        {tipVisible && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute bg-white text-[#1A1A1A]"
            style={{
              top: tip.top, left: tip.left, width: tip.width,
              borderRadius: 14, padding: "20px 24px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-pill"
                style={{ background: `${chapterColor}1A`, color: chapterColor }}
              >
                {current.chapter}
              </span>
              <span className="text-[11px] text-[#9CA3AF]">
                {current.stepInChapter} of {current.totalInChapter}
              </span>
            </div>

            <div className="text-[15px] font-medium leading-snug mb-1.5" style={{ color: "#1A1A1A" }}>
              {current.title}
            </div>
            <div className="text-[13px] text-[#6B7280]" style={{ lineHeight: 1.65 }}>
              {current.body}
            </div>

            {mode === "full" && (
              <div className="mt-4 flex items-center justify-center gap-1.5">
                {Object.keys(CHAPTER_COLORS).map((c, i) => {
                  const active = i + 1 === current.chapterIndex;
                  return (
                    <span
                      key={c}
                      className="inline-block rounded-full"
                      style={{
                        width: active ? 8 : 6,
                        height: active ? 8 : 6,
                        background: active ? CHAPTER_COLORS[c] : "#E5E7EB",
                      }}
                    />
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button onClick={skip} className="text-[12px] text-[#9CA3AF] hover:text-foreground">
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button
                    onClick={back}
                    className="h-8 px-3 rounded-md border border-[#E5E7EB] text-[12px] font-medium text-[#6B7280] hover:bg-[#F9FAFB]"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="h-8 px-3.5 rounded-md text-[12px] font-medium text-white"
                  style={{ background: isLast ? "#16A34A" : "#C8102E" }}
                >
                  {isLast ? "Done ✓" : (current.ctaLabel ?? "Next →")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----- Page tour completion toast handler -----
export function PageTourCompletionWatcher() {
  const { mode } = useTour();
  const [prevMode, setPrevMode] = useState(mode);
  const [prevRoute, setPrevRoute] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (prevMode === "page" && mode === null && prevRoute) {
      const chapter = ROUTE_TO_CHAPTER[prevRoute];
      if (chapter) toast.success(`✓ ${chapter} tour complete`);
    }
    setPrevMode(mode);
    if (mode) setPrevRoute(location.pathname);
  }, [mode, location.pathname]);

  return null;
}

export function TourCompletionModal() {
  const { showCompletion, closeCompletion } = useTour();
  const navigate = useNavigate();
  if (!showCompletion) return null;

  const goOverview = () => {
    closeCompletion();
    navigate("/");
  };

  const dots = Array.from({ length: 20 });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative bg-white rounded-[20px] p-9 max-w-[420px] w-full pointer-events-auto"
        style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.12)" }}
      >
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {dots.map((_, i) => {
            const colors = ["#C8102E", "#D97706", "#16A34A", "#7F77DD"];
            const c = colors[i % colors.length];
            const xJitter = (Math.random() - 0.5) * 200;
            return (
              <motion.span
                key={i}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], x: xJitter, y: -120 - Math.random() * 80 }}
                transition={{ duration: 1, delay: 0.1 + (i % 6) * 0.04 }}
                className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full"
                style={{ background: c }}
              />
            );
          })}
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.1, 1] }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "#DCFCE7" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </motion.div>

        <div className="text-[24px] font-medium text-center mt-4" style={{ color: "#1A1A1A" }}>
          Tour complete! 🎉
        </div>
        <div className="text-[14px] text-[#6B7280] mt-2 text-center" style={{ lineHeight: 1.6 }}>
          You've seen all 7 pages of GMI Pulse. Here's your recommended first action:
        </div>

        <div className="mt-5 rounded-[12px] p-4" style={{ background: "#FFF5F5" }}>
          <div className="text-[13px] text-[#1A1A1A]" style={{ lineHeight: 1.55 }}>
            Click <span className="font-semibold">Rahul Mehta's</span> card on Overview → Generate his Coaching Brief → Copy it and send him a nudge. That's the full Pulse workflow in 3 clicks.
          </div>
        </div>

        <button
          onClick={goOverview}
          className="mt-5 w-full h-11 rounded-md text-white text-[13.5px] font-medium"
          style={{ background: "#C8102E" }}
        >
          Go to Overview →
        </button>
        <button
          onClick={closeCompletion}
          className="w-full mt-2.5 text-[12px] text-[#9CA3AF] hover:text-foreground"
        >
          Explore on my own
        </button>
      </motion.div>
    </div>
  );
}

// ----- Per-page header button -----
export function PageTourButton() {
  const { startPageTour } = useTour();
  const location = useLocation();
  const chapter = ROUTE_TO_CHAPTER[location.pathname];
  if (!chapter) return null;
  return (
    <button
      onClick={() => startPageTour(location.pathname)}
      className="group inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white border border-[#EEEEEC] text-[13px] text-[#6B7280] transition-colors hover:border-[#C8102E] hover:text-[#C8102E]"
      title={`Tour ${chapter}`}
    >
      <span className="text-[13px]">?</span>
      <span>Tour this page</span>
    </button>
  );
}
