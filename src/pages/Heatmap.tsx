import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Sparkles } from "lucide-react";
import { PageShell } from "@/components/pulse/PageShell";
import { scoreColor } from "@/lib/scoreColor";
import { HeatmapDiagnosticGuide, type DiagnosticFinding } from "@/components/pulse/HeatmapDiagnosticGuide";
import { HeatmapTracksBridge } from "@/components/pulse/HeatmapTracksBridge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Dim = "Connect" | "Develop" | "Inspire";
type Resp = "self" | "team" | "peer" | "rm";

interface Q {
  id: string;
  text: string;
  theme: string;
  dim: Dim;
  self: number; team: number; peer: number; rm: number;
}

const questions: Q[] = [
  // Connect
  { id: "Q1",  dim: "Connect", theme: "Trust",         text: "My manager takes time to understand my personal goals", self: 82, team: 68, peer: 74, rm: 79 },
  { id: "Q2",  dim: "Connect", theme: "Clarity",       text: "My manager communicates expectations clearly",          self: 88, team: 71, peer: 76, rm: 83 },
  { id: "Q3",  dim: "Connect", theme: "Trust",         text: "My manager is approachable when I have concerns",       self: 79, team: 65, peer: 70, rm: 77 },
  { id: "Q4",  dim: "Connect", theme: "Communication", text: "My manager gives me regular feedback",                  self: 74, team: 59, peer: 63, rm: 71 },
  { id: "Q5",  dim: "Connect", theme: "Recognition",   text: "My manager acknowledges my contributions",              self: 83, team: 72, peer: 69, rm: 80 },
  { id: "Q6",  dim: "Connect", theme: "Trust",         text: "My manager resolves conflicts fairly",                  self: 76, team: 61, peer: 66, rm: 74 },
  { id: "Q7",  dim: "Connect", theme: "Autonomy",      text: "My manager involves me in decisions that affect my work", self: 71, team: 58, peer: 64, rm: 69 },
  { id: "Q8",  dim: "Connect", theme: "Communication", text: "My manager shares context from leadership",             self: 80, team: 67, peer: 72, rm: 78 },
  { id: "Q9",  dim: "Connect", theme: "Recognition",   text: "My manager celebrates team wins",                       self: 85, team: 73, peer: 70, rm: 82 },
  // Develop
  { id: "Q10", dim: "Develop", theme: "Growth",        text: "My manager actively helps me grow my skills",           self: 77, team: 54, peer: 61, rm: 72 },
  { id: "Q11", dim: "Develop", theme: "Growth",        text: "My manager gives me stretch assignments",               self: 69, team: 51, peer: 58, rm: 65 },
  { id: "Q12", dim: "Develop", theme: "Communication", text: "My manager provides constructive feedback",             self: 80, team: 62, peer: 68, rm: 76 },
  { id: "Q13", dim: "Develop", theme: "Growth",        text: "My manager supports my career goals",                   self: 73, team: 55, peer: 60, rm: 70 },
  { id: "Q14", dim: "Develop", theme: "Growth",        text: "My manager connects me with learning opportunities",    self: 65, team: 48, peer: 55, rm: 62 },
  { id: "Q15", dim: "Develop", theme: "Growth",        text: "My manager has a development plan with me",             self: 60, team: 44, peer: 51, rm: 58 },
  { id: "Q16", dim: "Develop", theme: "Support",       text: "My manager coaches me through challenges",              self: 74, team: 57, peer: 63, rm: 71 },
  { id: "Q17", dim: "Develop", theme: "Support",       text: "My manager tracks my progress and adjusts support",     self: 68, team: 52, peer: 59, rm: 66 },
  // Inspire
  { id: "Q18", dim: "Inspire", theme: "Purpose",       text: "My manager connects our work to a larger purpose",      self: 84, team: 74, peer: 77, rm: 81 },
  { id: "Q19", dim: "Inspire", theme: "Trust",         text: "My manager leads by example",                           self: 88, team: 79, peer: 82, rm: 86 },
  { id: "Q20", dim: "Inspire", theme: "Trust",         text: "My manager creates a positive team culture",            self: 82, team: 71, peer: 75, rm: 80 },
  { id: "Q21", dim: "Inspire", theme: "Support",       text: "My manager handles pressure well",                      self: 79, team: 68, peer: 72, rm: 76 },
  { id: "Q22", dim: "Inspire", theme: "Support",       text: "My manager shows genuine care for team wellbeing",      self: 83, team: 73, peer: 76, rm: 81 },
  { id: "Q23", dim: "Inspire", theme: "Purpose",       text: "My manager motivates me to do my best work",            self: 80, team: 70, peer: 74, rm: 78 },
  { id: "Q24", dim: "Inspire", theme: "Autonomy",      text: "My manager creates space for new ideas",                self: 77, team: 66, peer: 70, rm: 74 },
  { id: "Q25", dim: "Inspire", theme: "Trust",         text: "My manager is consistent and dependable",               self: 85, team: 76, peer: 79, rm: 83 },
];

const dimMeta: Record<Dim, { color: string; }> = {
  Connect: { color: "#C8102E" },
  Develop: { color: "#D97706" },
  Inspire: { color: "#16A34A" },
};

const respCols: { key: Resp; label: string }[] = [
  { key: "self", label: "Manager Self" },
  { key: "team", label: "Team Member" },
  { key: "peer", label: "Peer" },
  { key: "rm",   label: "RM" },
];

const filters: ("All" | Dim)[] = ["All", "Connect", "Develop", "Inspire"];

function ScoreCell({ v }: { v: number }) {
  const c = scoreColor(v);
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.1 }}
      className="mx-auto flex items-center justify-center w-[60px] h-9 rounded-md text-[13px] font-semibold border"
      style={{ background: c.bg, color: c.text, borderColor: "#EEEEEC" }}
    >
      {v}
    </motion.div>
  );
}

const Heatmap = () => {
  const [dimFilter, setDimFilter] = useState<"All" | Dim>("All");
  const [activeResp, setActiveResp] = useState<Record<Resp, boolean>>({
    self: true, team: true, peer: true, rm: true,
  });

  const filtered = useMemo(
    () => (dimFilter === "All" ? questions : questions.filter((q) => q.dim === dimFilter)),
    [dimFilter]
  );

  const colAvgs = useMemo(() => {
    const sum = filtered.reduce(
      (a, q) => ({ self: a.self + q.self, team: a.team + q.team, peer: a.peer + q.peer, rm: a.rm + q.rm }),
      { self: 0, team: 0, peer: 0, rm: 0 }
    );
    const n = filtered.length || 1;
    return {
      self: Math.round(sum.self / n),
      team: Math.round(sum.team / n),
      peer: Math.round(sum.peer / n),
      rm:   Math.round(sum.rm / n),
    };
  }, [filtered]);

  const grouped = useMemo(() => {
    const order: Dim[] = ["Connect", "Develop", "Inspire"];
    return order
      .filter((d) => dimFilter === "All" || dimFilter === d)
      .map((d) => ({ dim: d, rows: filtered.filter((q) => q.dim === d) }));
  }, [filtered, dimFilter]);

  // AI diagnostic findings
  const [findings, setFindings] = useState<DiagnosticFinding[]>([]);
  const findingsByQ = useMemo(() => {
    const m = new Map<string, DiagnosticFinding>();
    findings.forEach((f) => m.set(f.questionId, f));
    return m;
  }, [findings]);

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [pulseQ, setPulseQ] = useState<string | null>(null);

  const handleFindingClick = useCallback((qid: string) => {
    // Ensure dimension filter shows the question
    const q = questions.find((x) => x.id === qid);
    if (q && dimFilter !== "All" && dimFilter !== q.dim) setDimFilter("All");
    setTimeout(() => {
      const row = rowRefs.current[qid];
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        setPulseQ(qid);
        setTimeout(() => setPulseQ(null), 2000);
      }
    }, 50);
  }, [dimFilter]);

  // Pass simplified payload to AI
  const aiPayload = useMemo(
    () => questions.map((q) => ({ id: q.id, text: q.text, self: q.self, team: q.team, peer: q.peer, rm: q.rm })),
    []
  );

  return (
    <PageShell>
      <HeatmapDiagnosticGuide
        questions={aiPayload}
        onFindingClick={handleFindingClick}
        onFindingsLoaded={setFindings}
      />

      <HeatmapTracksBridge findings={findings} />

      {/* Insight callout */}
      <div
        className="mb-5 rounded-lg flex items-start gap-2.5 px-4 py-3"
        style={{ background: "#FFFBEB", borderLeft: "3px solid #D97706" }}
      >
        <AlertTriangle size={16} className="text-[#D97706] mt-0.5 shrink-0" />
        <p className="text-[13px] text-foreground/85 leading-relaxed">
          <span className="font-semibold">Biggest gap:</span> Develop dimension shows a 22-point gap between Manager Self score (70) and Team Member score (52). This is the primary driver of flight risk.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            {filters.map((f) => {
              const active = dimFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setDimFilter(f)}
                  className={`h-8 px-3.5 rounded-pill text-[12px] font-medium border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {respCols.map((r) => {
              const on = activeResp[r.key];
              return (
                <button
                  key={r.key}
                  onClick={() => setActiveResp((s) => ({ ...s, [r.key]: !s[r.key] }))}
                  className={`h-7 px-3 rounded-pill text-[11px] font-medium border transition-colors ${
                    on
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: on ? "#C8102E" : "#D1D5DB" }} />
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[720px]">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-5 py-3 w-[35%]">Question</th>
                <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium py-3 w-[10%]">Theme</th>
                {respCols.map((r) => (
                  activeResp[r.key] && (
                    <th key={r.key} className="text-center text-[11px] uppercase tracking-wide text-muted-foreground font-medium py-3">
                      <div>{r.label}</div>
                      <div className="text-[10px] normal-case tracking-normal text-muted-foreground/70 mt-0.5">
                        {colAvgs[r.key]} avg
                      </div>
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <AnimatePresence mode="wait">
              <motion.tbody
                key={dimFilter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {grouped.map((g) => (
                  <Fragment key={g.dim}>
                    <tr key={`h-${g.dim}`} style={{ background: "#F7F7F5" }}>
                      <td colSpan={2 + respCols.filter((r) => activeResp[r.key]).length}
                        className="px-5 py-2 text-[13px] font-medium"
                        style={{ borderLeft: `3px solid ${dimMeta[g.dim].color}`, color: "#C8102E" }}>
                        {g.dim} <span className="text-muted-foreground font-normal">— {g.rows.length} questions</span>
                      </td>
                    </tr>
                    {g.rows.map((q, idx) => {
                      const flag = findingsByQ.get(q.id);
                      const isPulsing = pulseQ === q.id;
                      return (
                      <motion.tr
                        key={q.id}
                        ref={(el) => { rowRefs.current[q.id] = el; }}
                        initial={{ opacity: 0 }}
                        animate={
                          isPulsing
                            ? { opacity: 1, backgroundColor: ["#FEF3C7", "#FFFFFF", "#FEF3C7", "#FFFFFF"] }
                            : { opacity: 1 }
                        }
                        transition={
                          isPulsing
                            ? { duration: 2, times: [0, 0.25, 0.5, 1] }
                            : { duration: 0.2, delay: idx * 0.02 }
                        }
                        className="border-b border-border hover:bg-[#FFF5F5] transition-colors"
                        style={{ height: 48 }}
                      >
                        <td className="px-5 text-[13px] text-foreground truncate max-w-0" title={q.text}>
                          <div className="truncate flex items-center gap-1.5">
                            {flag && (
                              <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="shrink-0 cursor-help" style={{ color: "#7C3AED" }}>
                                      <Sparkles size={12} />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[280px] text-[12px]">
                                    AI flagged: {flag.finding}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <span className="truncate">{q.text}</span>
                          </div>
                        </td>
                        <td>
                          <span className="inline-block px-2 py-0.5 rounded-pill text-[11px] bg-muted text-muted-foreground">{q.theme}</span>
                        </td>
                        {respCols.map((r) => activeResp[r.key] && (
                          <td key={r.key} className="text-center"><ScoreCell v={q[r.key]} /></td>
                        ))}
                      </motion.tr>
                      );
                    })}
                  </Fragment>
                ))}

                {/* Bottom average */}
                <tr style={{ background: "#FAFAF9" }}>
                  <td className="px-5 py-3 text-[13px] font-semibold">Avg across all questions</td>
                  <td />
                  {respCols.map((r) => activeResp[r.key] && (
                    <td key={r.key} className="text-center py-3">
                      <div className="mx-auto inline-flex items-center justify-center w-[60px] h-9 rounded-md text-[13px] font-bold border"
                        style={{ background: scoreColor(colAvgs[r.key]).bg, color: scoreColor(colAvgs[r.key]).text, borderColor: "#EEEEEC" }}>
                        {colAvgs[r.key]}
                      </div>
                    </td>
                  ))}
                </tr>
              </motion.tbody>
            </AnimatePresence>
          </table>
        </div>
      </div>
    </PageShell>
  );
};

export default Heatmap;
