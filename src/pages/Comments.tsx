import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PageShell } from "@/components/pulse/PageShell";
import { usePeriod } from "@/lib/periodContext";
import { getManagersForCycle } from "@/lib/managerPool";
import { getComments, THEMES, type Comment, type Sent } from "@/lib/commentsData";

type DimFilter = "All" | "Connect" | "Develop" | "Inspire";
type RespFilter = "All" | "Manager Self" | "Team Member" | "Peer" | "RM";
type DemoType = "department" | "manager" | "age";

const DEPTS = ["All", "Sales", "Engineering", "Product", "Marketing", "Operations", "Customer Success", "Finance", "HR", "Design", "Data"];
const AGES = ["All", "18-24", "25-34", "35-44", "45-54", "55+"];

const sentLabel: Record<Sent, string> = { pos: "Positive", neu: "Neutral", neg: "Negative" };
const dotColor = { pos: "#16A34A", neu: "#9CA3AF", neg: "#DC2626" } as const;

function classifyTheme(pos: number, neu: number, neg: number): "Mostly Positive" | "Mostly Negative" | "Mixed" {
  if (pos >= 50) return "Mostly Positive";
  if (neg >= 45) return "Mostly Negative";
  return "Mixed";
}
const sentMeta = {
  "Mostly Negative": "bg-primary/10 text-primary",
  "Mixed":           "bg-warning/10 text-warning",
  "Mostly Positive": "bg-success/10 text-success",
} as const;

function Donut({ pos, neu, neg, total }: { pos: number; neu: number; neg: number; total: number }) {
  const segs = total > 0 ? [
    { v: (pos / total) * 100, color: "#16A34A" },
    { v: (neu / total) * 100, color: "#9CA3AF" },
    { v: (neg / total) * 100, color: "#DC2626" },
  ] : [{ v: 100, color: "#F0F0EE" }];
  const r = 50, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative w-[160px] h-[160px] mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F0F0EE" strokeWidth="14" />
        {segs.map((s, i) => {
          const len = (s.v / 100) * c;
          const el = (
            <motion.circle
              key={i}
              cx="60" cy="60" r={r} fill="none"
              stroke={s.color} strokeWidth="14"
              strokeDasharray={`${len} ${c}`}
              strokeDashoffset={-offset}
              initial={{ strokeDasharray: `0 ${c}` }}
              animate={{ strokeDasharray: `${len} ${c}` }}
              transition={{ duration: 0.5, delay: 0.05 * i }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[18px] font-semibold leading-none">{total}</div>
        <div className="text-[11px] text-muted-foreground mt-1">comments</div>
      </div>
    </div>
  );
}

function ThemeCard({ theme, items }: { theme: string; items: Comment[] }) {
  const [expanded, setExpanded] = useState(false);
  const pos = items.filter((c) => c.sent === "pos").length;
  const neu = items.filter((c) => c.sent === "neu").length;
  const neg = items.filter((c) => c.sent === "neg").length;
  const total = items.length;
  const pct = (n: number) => total ? Math.round((n / total) * 100) : 0;
  const sentiment = classifyTheme(pct(pos), pct(neu), pct(neg));
  const visible = expanded ? items : items.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-[14px] shadow-card p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-[15px] font-medium">{theme}</h4>
          <span className="text-[11px] px-2 py-0.5 rounded-pill bg-muted text-muted-foreground">{total} comments</span>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-pill font-medium shrink-0 ${sentMeta[sentiment]}`}>{sentiment}</span>
      </div>

      <div className="h-1.5 w-full rounded-[3px] overflow-hidden flex mb-4" style={{ background: "#F0F0EE" }}>
        <div style={{ width: `${pct(neg)}%`, background: "#DC2626" }} />
        <div style={{ width: `${pct(neu)}%`, background: "#9CA3AF" }} />
        <div style={{ width: `${pct(pos)}%`, background: "#16A34A" }} />
      </div>

      <div className="space-y-3">
        {visible.map((c) => (
          <div key={c.id} className="flex gap-2">
            <span className="text-[24px] leading-none text-muted-foreground/60 font-serif select-none">"</span>
            <div>
              <p className="text-[13px] italic text-foreground/85 leading-relaxed">{c.text}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                <span className="w-1 h-1 rounded-full inline-block" style={{ background: dotColor[c.sent] }} />
                {c.respondent} · {c.department} · {c.ageGroup} · {c.tenure}
              </div>
            </div>
          </div>
        ))}
        {total === 0 && <div className="text-[12px] text-muted-foreground italic">No comments match the current filters.</div>}
      </div>

      {total > 2 && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[12px] text-primary/80 hover:text-primary transition-colors"
          >
            {expanded ? "Show less" : `See all ${total} quotes →`}
          </button>
        </div>
      )}
    </motion.div>
  );
}

const Comments = () => {
  const [dim, setDim] = useState<DimFilter>("All");
  const [resp, setResp] = useState<RespFilter>("All");
  const [demoType, setDemoType] = useState<DemoType>("department");
  const [demoValue, setDemoValue] = useState<string>("All");
  const { period, snapshot } = usePeriod();
  const allManagers = useMemo(() => getManagersForCycle(period, snapshot.delta), [period, snapshot.delta]);

  const allComments = useMemo(() => getComments(period), [period]);

  const filtered = useMemo(() => {
    return allComments.filter((c) => {
      if (dim !== "All" && c.dim !== dim) return false;
      if (resp !== "All" && c.respondent !== resp) return false;
      if (demoValue !== "All") {
        if (demoType === "department" && c.department !== demoValue) return false;
        if (demoType === "manager" && c.managerName !== demoValue) return false;
        if (demoType === "age" && c.ageGroup !== demoValue) return false;
      }
      return true;
    });
  }, [allComments, dim, resp, demoType, demoValue]);

  const byTheme = useMemo(() => {
    const m = new Map<string, Comment[]>();
    THEMES.forEach((t) => m.set(t, []));
    filtered.forEach((c) => m.get(c.theme)!.push(c));
    return m;
  }, [filtered]);

  const totals = useMemo(() => {
    const pos = filtered.filter((c) => c.sent === "pos").length;
    const neu = filtered.filter((c) => c.sent === "neu").length;
    const neg = filtered.filter((c) => c.sent === "neg").length;
    return { pos, neu, neg, total: filtered.length };
  }, [filtered]);

  const dims: DimFilter[] = ["All", "Connect", "Develop", "Inspire"];
  const respOpts: RespFilter[] = ["All", "Manager Self", "Team Member", "Peer", "RM"];
  const demoOptions = demoType === "department" ? DEPTS
    : demoType === "age" ? AGES
    : ["All", ...allManagers.map((m) => m.name)];

  const activeFilters = [
    dim !== "All" && `Dimension: ${dim}`,
    resp !== "All" && `Respondent: ${resp}`,
    demoValue !== "All" && `${demoType}: ${demoValue}`,
  ].filter(Boolean) as string[];

  const pct = (n: number) => totals.total ? Math.round((n / totals.total) * 100) : 0;

  return (
    <PageShell>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div>
          <div
            data-tour="comments-ai-banner"
            className="mb-5 rounded-lg flex items-start gap-2.5 px-4 py-3.5"
            style={{ background: "#F5F3FF", borderLeft: "3px solid #7F77DD" }}
          >
            <Sparkles size={16} className="text-[#7F77DD] mt-0.5 shrink-0" />
            <p className="text-[13px] text-foreground/85 leading-relaxed">
              <span className="font-semibold">AI Summary:</span> Across {totals.total} filtered comments, {pct(totals.neg)}% are negative. The most common negative themes are Growth & Development and Workload — aligned with the Develop dimension scoring lowest.
            </p>
          </div>

          <div className="mb-3 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-[16px] font-medium tracking-tight">Top Themes This Cycle</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                AI-clustered from {totals.total} responses across {allManagers.length} managers · {period}. Names removed.
              </p>
            </div>
            {activeFilters.length > 0 && (
              <button
                onClick={() => { setDim("All"); setResp("All"); setDemoValue("All"); }}
                className="text-[11px] text-primary hover:underline"
              >Clear filters</button>
            )}
          </div>

          {activeFilters.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {activeFilters.map((f) => (
                <span key={f} className="text-[11px] px-2 py-0.5 rounded-pill bg-primary/10 text-primary">{f}</span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THEMES.map((t) => <ThemeCard key={t} theme={t} items={byTheme.get(t) ?? []} />)}
          </div>
        </div>

        <aside className="bg-card border border-border rounded-lg shadow-card p-5 self-start lg:sticky lg:top-5">
          <div className="text-[13px] font-medium mb-3">Sentiment Overview</div>
          <Donut pos={totals.pos} neu={totals.neu} neg={totals.neg} total={totals.total} />
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2"><span>✅</span>Positive</span>
              <span className="font-medium tabular-nums">{totals.pos} <span className="text-muted-foreground">({pct(totals.pos)}%)</span></span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2"><span>➖</span>Neutral</span>
              <span className="font-medium tabular-nums">{totals.neu} <span className="text-muted-foreground">({pct(totals.neu)}%)</span></span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2"><span>❌</span>Negative</span>
              <span className="font-medium tabular-nums">{totals.neg} <span className="text-muted-foreground">({pct(totals.neg)}%)</span></span>
            </div>
          </div>

          <div className="border-t border-border my-5" />

          <div className="text-[13px] font-medium mb-2">Dimension</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dims.map((d) => (
              <button
                key={d}
                onClick={() => setDim(d)}
                className={`h-7 px-3 rounded-pill text-[11px] font-medium border transition-colors ${
                  dim === d ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                }`}
              >{d}</button>
            ))}
          </div>

          <div className="text-[13px] font-medium mb-2">Respondent</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {respOpts.map((r) => (
              <button
                key={r}
                onClick={() => setResp(r)}
                className={`h-7 px-3 rounded-pill text-[11px] font-medium border transition-colors ${
                  resp === r ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                }`}
              >{r}</button>
            ))}
          </div>

          <div className="text-[13px] font-medium mb-2">Filter by demographics</div>
          <div className="inline-flex rounded-md border border-border overflow-hidden mb-2">
            {(["department", "manager", "age"] as DemoType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setDemoType(t); setDemoValue("All"); }}
                className={`px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${demoType === t ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >{t}</button>
            ))}
          </div>
          <select
            value={demoValue}
            onChange={(e) => setDemoValue(e.target.value)}
            className="w-full text-[12px] px-2.5 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {demoOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </aside>
      </div>
    </PageShell>
  );
};

export default Comments;
