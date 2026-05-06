import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ChevronRight, HelpCircle, MousePointerClick, PanelRightOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sidebar } from "@/components/pulse/Sidebar";
import { Header } from "@/components/pulse/Header";
import { MetricCard } from "@/components/pulse/MetricCard";
import { CDIBar } from "@/components/pulse/CDIBar";
import { ManagerCard } from "@/components/pulse/ManagerCard";
import { AIPanel } from "@/components/pulse/AIPanel";
import { Drawer } from "@/components/pulse/Drawer";
import { MobileNav } from "@/components/pulse/MobileNav";
import { PeriodSummaryAI } from "@/components/pulse/PeriodSummaryAI";
import { CoachingBrief } from "@/components/pulse/CoachingBrief";
import { CommentSynthesizer } from "@/components/pulse/CommentSynthesizer";
import { getComments } from "@/lib/commentsData";
import { useNavigate } from "react-router-dom";
import { ManagerTrackPanel } from "@/components/pulse/ManagerTrackPanel";
import { dimensions, type Dimension, type Manager } from "@/lib/data";
import { usePeriod } from "@/lib/periodContext";
import { BenchmarkChips } from "@/components/pulse/BenchmarkChips";
import { getManagersForCycle } from "@/lib/managerPool";
import { TopPerformingTeams } from "@/components/pulse/TopPerformingTeams";
import { ResponseRateBreakdown } from "@/components/pulse/ResponseRateBreakdown";
import { CycleComparisonSection } from "@/components/pulse/CycleComparisonSection";
import { TrialCountdown } from "@/components/pulse/TrialCountdown";
import { TeamDrilldown } from "@/components/pulse/TeamDrilldown";
import { DimensionDrilldown } from "@/components/pulse/DimensionDrilldown";

const Index = () => {
  const [compare, setCompare] = useState(false);
  const { period, snapshot } = usePeriod();
  const [refreshKey, setRefreshKey] = useState(0);
  const [dimDrawer, setDimDrawer] = useState<Dimension | null>(null);
  const [mgrDrawer, setMgrDrawer] = useState<Manager | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [rrOpen, setRrOpen] = useState(false);
  const mgrScrollRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const mgrComments = useMemo(
    () => mgrDrawer ? getComments(period).filter((c) => c.managerId === mgrDrawer.id) : [],
    [mgrDrawer, period]
  );

  const attentionManagers = useMemo(() => {
    const order = { "at-risk": 0, "watch": 1, "healthy": 2 } as const;
    const all = getManagersForCycle(period, snapshot.delta);
    return all
      .filter((m) => m.risk !== "healthy")
      .sort((a, b) => order[a.risk] - order[b.risk] || a.score - b.score)
      .slice(0, 14);
  }, [period, snapshot.delta]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id?: string } | undefined;
      const all = getManagersForCycle(period, snapshot.delta);
      const target = all.find((m) => m.id === (detail?.id ?? "1")) ?? all[0];
      if (target) setMgrDrawer(target);
    };
    window.addEventListener("pulse:open-manager", handler);
    return () => window.removeEventListener("pulse:open-manager", handler);
  }, [period, snapshot.delta]);

  const handleCompare = () => {
    setCompare((c) => !c);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <AIPanel />

      <main className="md:pl-[var(--sidebar-w,220px)] lg:pr-[300px] pb-20 md:pb-8 transition-[padding] duration-200">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8 pt-7">
          <Header compare={compare} onToggleCompare={handleCompare} />

          <TrialCountdown />

          {/* AI-generated period summary */}
          <PeriodSummaryAI />

          {/* Metric cards */}
          <section data-tour="kpi-cards-row" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div data-tour="org-health">
            <MetricCard
              label="Org Health Score"
              value={72}
              suffix="/100"
              trend={{ dir: "up", text: "+3 pts vs last cycle", tone: "success" }}
              delay={200}
              duration={1000}
              refreshKey={refreshKey}
              belowValue={
                <>
                  <div className="w-full h-[6px] rounded-[3px] overflow-hidden" style={{ background: "#F0F0EE" }}>
                    <motion.div
                      key={refreshKey}
                      initial={{ width: 0 }}
                      animate={{ width: "72%" }}
                      transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
                      className="h-full rounded-[3px]"
                      style={{ background: "#C8102E" }}
                    />
                  </div>
                  <div className="mt-2">
                    <BenchmarkChips dimension="Overall" value={72} size="xs" />
                  </div>
                </>
              }
            />
            </div>
            <MetricCard
              label="Managers Active"
              value={48}
              trend={{ dir: "neutral", text: "of 52 total", tone: "muted" }}
              delay={280}
              duration={800}
              refreshKey={refreshKey}
              extra={
                (() => {
                  const size = 40;
                  const stroke = 4;
                  const r = (size - stroke) / 2;
                  const c = 2 * Math.PI * r;
                  const pct = 48 / 52;
                  return (
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ml-auto">
                      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F0EE" strokeWidth={stroke} />
                      <motion.circle
                        cx={size / 2} cy={size / 2} r={r} fill="none"
                        stroke="#C8102E" strokeWidth={stroke} strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        strokeDasharray={c}
                        initial={{ strokeDashoffset: c }}
                        animate={{ strokeDashoffset: c * (1 - pct) }}
                        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                      />
                    </svg>
                  );
                })()
              }
              belowValue={<div className="text-[11px] text-muted-foreground font-medium">92%</div>}
            />
            <div data-tour="response-rate" onClick={() => setRrOpen(true)} className="relative group" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setRrOpen(true); }}>
              <MetricCard
                label="Response Rate"
                value={76}
                suffix="%"
                trend={{ dir: "up", text: "+4% vs last cycle", tone: "success" }}
                delay={360}
                duration={900}
                refreshKey={refreshKey}
                belowValue={
                  <div className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-primary font-medium animate-pulse">
                    <MousePointerClick size={11} /> Click for breakdown
                  </div>
                }
              />
            </div>
            <div data-tour="at-risk-kpi">
            <MetricCard
              label="At-Risk Teams"
              value={6}
              trend={{ dir: "down", text: "2 resolved since last cycle", tone: "success" }}
              delay={440}
              duration={600}
              refreshKey={refreshKey}
              extra={<AlertCircle size={16} className="text-primary ml-1" />}
            />
            </div>
          </section>

          {/* CDI Bars */}
          <motion.section
            data-tour="cdi-bars"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="bg-card border border-border rounded-lg p-6 shadow-card mb-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-[16px] font-medium tracking-tight">Manager Effectiveness by Dimension</h2>
              <button aria-label="Help" className="text-muted-foreground hover:text-foreground">
                <HelpCircle size={14} />
              </button>
            </div>
            <p className="text-[12px] text-muted-foreground mb-3">
              Click a dimension to see the questions behind the score.
            </p>
            <div className="divide-y divide-border">
              {dimensions.map((d, i) => (
                <CDIBar key={d.key} dim={d} index={i} compare={compare} onClick={() => setDimDrawer(d)} />
              ))}
            </div>
          </motion.section>

          {/* Flight risk strip */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[16px] font-medium tracking-tight">Teams Needing Attention</h2>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[11px] text-muted-foreground">{attentionManagers.length} managers</span>
            </div>
            <div data-tour="attention-strip" className="relative">
              <div
                ref={mgrScrollRef}
                className="flex gap-3 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1 scroll-smooth"
              >
                {attentionManagers.map((m, i) => (
                  <ManagerCard key={m.id} manager={m} index={i} onClick={() => setMgrDrawer(m)} />
                ))}
              </div>
              <div
                className="pointer-events-none absolute right-0 top-0 bottom-3 w-[60px]"
                style={{ background: "linear-gradient(to right, rgba(247,247,245,0), rgba(247,247,245,1))" }}
              />
              <button
                aria-label="Scroll right"
                onClick={() => mgrScrollRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card border border-border shadow-card flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.section>

          

          <TopPerformingTeams onClick={(m) => setMgrDrawer(m)} />

          <CycleComparisonSection />
        </div>
      </main>

      {/* AI panel toggle for tablet */}
      <button
        onClick={() => setAiOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-cardHover flex items-center justify-center"
        aria-label="Open AI insights"
      >
        <PanelRightOpen size={18} />
      </button>

      <MobileNav />

      {/* Dimension drawer */}
      <Drawer open={!!dimDrawer} onClose={() => setDimDrawer(null)} title={dimDrawer ? `${dimDrawer.label} — Sub-questions` : ""}>
        {dimDrawer && (
          <div>
            <p className="text-[13px] text-muted-foreground mb-4">{dimDrawer.sub}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-[28px] font-semibold">{dimDrawer.score}</span>
              <span className="text-[13px] text-muted-foreground">/100 · prev {dimDrawer.prev}</span>
            </div>
            <div className="space-y-3">
              {dimDrawer.questions.map((q, idx) => (
                <div key={idx} className="p-3 rounded-md bg-background border border-border">
                  <div className="text-[12px] text-muted-foreground mb-1">Question {idx + 1}</div>
                  <div className="text-[13px] leading-snug">{q}</div>
                </div>
              ))}
            </div>
            <DimensionDrilldown dim={dimDrawer} />
          </div>
        )}
      </Drawer>

      {/* Manager drawer */}
      <Drawer open={!!mgrDrawer} onClose={() => setMgrDrawer(null)} title={mgrDrawer?.name ?? ""}>
        {mgrDrawer && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[14px] font-semibold">
                {mgrDrawer.initials}
              </div>
              <div>
                <div className="text-[14px] font-medium">{mgrDrawer.name}</div>
                <div className="text-[12px] text-muted-foreground">Team of {mgrDrawer.teamSize}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md border border-border">
                <div className="text-[11px] uppercase text-muted-foreground tracking-wide">CDI Score</div>
                <div className="text-[22px] font-semibold mt-1">{mgrDrawer.score}<span className="text-[12px] text-muted-foreground">/100</span></div>
              </div>
              <div className="p-3 rounded-md border border-border">
                <div className="text-[11px] uppercase text-muted-foreground tracking-wide">Trend</div>
                <div className={`text-[22px] font-semibold mt-1 ${mgrDrawer.delta > 0 ? "text-success" : "text-danger"}`}>
                  {mgrDrawer.delta > 0 ? "+" : ""}{mgrDrawer.delta}
                  <span className="text-[12px] text-muted-foreground"> pts</span>
                </div>
              </div>
            </div>
            <TeamDrilldown manager={mgrDrawer} />
            <ManagerTrackPanel manager={mgrDrawer} />
            <CoachingBrief manager={mgrDrawer} />
          </div>
        )}
      </Drawer>

      {/* AI mobile drawer */}
      <Drawer open={aiOpen} onClose={() => setAiOpen(false)} title="AI Insights">
        <p className="text-[13px] leading-relaxed text-foreground/85">
          Open the desktop view for the full AI summary panel, recommended actions, and respondent breakdown.
        </p>
      </Drawer>

      <Dialog open={rrOpen} onOpenChange={setRrOpen}>
        <DialogContent className="max-w-[920px] max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Response Rate Breakdown</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4">
            <ResponseRateBreakdown />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
