import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ChevronRight, HelpCircle, PanelRightOpen } from "lucide-react";
import { Sidebar } from "@/components/pulse/Sidebar";
import { Header } from "@/components/pulse/Header";
import { MetricCard } from "@/components/pulse/MetricCard";
import { CDIBar } from "@/components/pulse/CDIBar";
import { ManagerCard } from "@/components/pulse/ManagerCard";
import { AIPanel } from "@/components/pulse/AIPanel";
import { Drawer } from "@/components/pulse/Drawer";
import { MobileNav } from "@/components/pulse/MobileNav";
import { dimensions, managers, type Dimension, type Manager } from "@/lib/data";

const Index = () => {
  const [active, setActive] = useState("overview");
  const [compare, setCompare] = useState(false);
  const [period] = useState("Apr 2026 Cycle");
  const [refreshKey, setRefreshKey] = useState(0);
  const [dimDrawer, setDimDrawer] = useState<Dimension | null>(null);
  const [mgrDrawer, setMgrDrawer] = useState<Manager | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const mgrScrollRef = useRef<HTMLDivElement | null>(null);

  const sortedManagers = useMemo(() => {
    const order = { "at-risk": 0, "watch": 1, "healthy": 2 } as const;
    return [...managers].sort((a, b) => order[a.risk] - order[b.risk]);
  }, []);

  const handleCompare = () => {
    setCompare((c) => !c);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar active={active} onChange={setActive} />
      <AIPanel />

      <main className="md:pl-[220px] lg:pr-[300px] pb-20 md:pb-8">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8 pt-7">
          <Header period={period} compare={compare} onToggleCompare={handleCompare} />

          {/* Metric cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Org Health Score"
              value={72}
              suffix="/100"
              trend={{ dir: "up", text: "+3 pts vs last cycle", tone: "success" }}
              delay={200}
              duration={1000}
              refreshKey={refreshKey}
              belowValue={
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
              }
            />
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
            <MetricCard
              label="Response Rate"
              value={76}
              suffix="%"
              trend={{ dir: "up", text: "+4% vs last cycle", tone: "success" }}
              delay={360}
              duration={900}
              refreshKey={refreshKey}
            />
            <MetricCard
              label="At-Risk Teams"
              value={6}
              trend={{ dir: "down", text: "2 resolved since last cycle", tone: "success" }}
              delay={440}
              duration={600}
              refreshKey={refreshKey}
              extra={<AlertCircle size={16} className="text-primary ml-1" />}
            />
          </section>

          {/* CDI Bars */}
          <motion.section
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
            </div>
            <div className="relative">
              <div
                ref={mgrScrollRef}
                className="flex gap-3 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1 scroll-smooth"
              >
                {sortedManagers.map((m, i) => (
                  <ManagerCard key={m.id} manager={m} index={i} onClick={() => setMgrDrawer(m)} />
                ))}
              </div>
              {/* right fade */}
              <div
                className="pointer-events-none absolute right-0 top-0 bottom-3 w-[60px]"
                style={{ background: "linear-gradient(to right, rgba(247,247,245,0), rgba(247,247,245,1))" }}
              />
              {/* scroll arrow */}
              <button
                aria-label="Scroll right"
                onClick={() => mgrScrollRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card border border-border shadow-card flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.section>
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

      <MobileNav active={active} onChange={setActive} />

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
            <p className="mt-5 text-[13px] text-muted-foreground leading-relaxed">
              Detailed manager profile, score breakdown by dimension, and recommended next steps will appear here.
            </p>
          </div>
        )}
      </Drawer>

      {/* AI mobile drawer */}
      <Drawer open={aiOpen} onClose={() => setAiOpen(false)} title="AI Insights">
        <p className="text-[13px] leading-relaxed text-foreground/85">
          Open the desktop view for the full AI summary panel, recommended actions, and respondent breakdown.
        </p>
      </Drawer>
    </div>
  );
};

export default Index;
