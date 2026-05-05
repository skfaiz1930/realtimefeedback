import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";
import { PageShell } from "@/components/pulse/PageShell";
import { usePeriod } from "@/lib/periodContext";
import { cycleNoise } from "@/lib/cycleData";
import { getManagersForCycle } from "@/lib/managerPool";

type FilterGroup = { title: string; key: string; options: string[]; defaults: string[] };

const groups: FilterGroup[] = [
  { title: "Department", key: "dept",   options: ["Engineering", "Sales", "Product", "Operations", "HR", "Finance"], defaults: ["Engineering", "Sales", "Product", "Operations", "HR", "Finance"] },
  { title: "Level",      key: "level",  options: ["Individual Contributor", "Team Lead", "Manager", "Senior Manager"], defaults: ["Individual Contributor", "Team Lead", "Manager", "Senior Manager"] },
  { title: "Tenure",     key: "tenure", options: ["0–1 year", "1–3 years", "3–5 years", "5+ years"], defaults: ["0–1 year", "1–3 years", "3–5 years", "5+ years"] },
  { title: "Gender",     key: "gender", options: ["Male", "Female", "Non-binary / Other"], defaults: ["Male", "Female", "Non-binary / Other"] },
];

const baseDept   = [["Engineering", 74], ["Sales", 58], ["Product", 71], ["Operations", 63], ["HR", 82], ["Finance", 77]] as [string, number][];
const baseLevel  = [["Individual Contributor", 67], ["Team Lead", 72], ["Manager", 74], ["Senior Manager", 81]] as [string, number][];
const baseTenure = [["0–1 year", 59], ["1–3 years", 68], ["3–5 years", 76], ["5+ years", 80]] as [string, number][];
const baseGender = [["Male", 72], ["Female", 70], ["Non-binary / Other", 68]] as [string, number][];

const INDUSTRY_AVG = 69;
function BarRow({ label, score }: { label: string; score: number }) {
  const flag = score < 65;
  const dInd = score - INDUSTRY_AVG;
  return (
    <div className="grid grid-cols-[180px_1fr_60px_70px] items-center gap-3 py-1.5">
      <div className="flex items-center gap-1.5 text-[13px] text-foreground">
        {flag && <AlertTriangle size={13} className="text-[#D97706]" />}
        <span className="truncate">{label}</span>
      </div>
      <div className="relative h-8 w-full rounded-md overflow-hidden" style={{ background: "#F0F0EE" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full rounded-md"
          style={{ background: "#C8102E" }}
        />
        {/* Industry benchmark marker */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-foreground/60"
          style={{ left: `${INDUSTRY_AVG}%` }}
          title={`Industry ${INDUSTRY_AVG}`}
        />
      </div>
      <div className="text-[13px] font-semibold text-right tabular-nums">{score}<span className="text-muted-foreground font-normal">/100</span></div>
      <div className={`text-[11px] text-right tabular-nums font-medium ${dInd > 0 ? "text-success" : dInd < 0 ? "text-danger" : "text-muted-foreground"}`}>
        {dInd > 0 ? "+" : ""}{dInd} vs ind
      </div>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <section className="bg-card border border-border rounded-lg shadow-card p-5 mb-4">
      <h3 className="text-[14px] font-medium mb-3">{title}</h3>
      <div>{rows.map(([l, s]) => <BarRow key={l} label={l} score={s} />)}</div>
    </section>
  );
}

const Demographics = () => {
  const { period, snapshot: periodSnap } = usePeriod();
  const adj = (rows: [string, number][], salt: string): [string, number][] =>
    rows.map(([l, s]) => [l, Math.max(20, Math.min(98, Math.round(s + cycleNoise(period, salt + ":" + l, 10))))] as [string, number]);
  const dataDept   = useMemo(() => adj(baseDept,   "dept"),   [period]);
  const dataLevel  = useMemo(() => adj(baseLevel,  "level"),  [period]);
  const dataTenure = useMemo(() => adj(baseTenure, "tenure"), [period]);
  const dataGender = useMemo(() => adj(baseGender, "gender"), [period]);
  const managerCount = useMemo(() => getManagersForCycle(period, periodSnap.delta).length, [period, periodSnap.delta]);

  const [open, setOpen] = useState<Record<string, boolean>>({ dept: true, level: true, tenure: true, gender: true });
  const [selected, setSelected] = useState<Record<string, string[]>>(
    Object.fromEntries(groups.map((g) => [g.key, g.defaults]))
  );

  const toggle = (key: string, opt: string) => {
    setSelected((s) => {
      const list = s[key];
      return { ...s, [key]: list.includes(opt) ? list.filter((o) => o !== opt) : [...list, opt] };
    });
  };

  const clearAll = () => setSelected(Object.fromEntries(groups.map((g) => [g.key, []])));

  // Problem cluster: when Sales + 0–1 year both selected
  const cluster = useMemo(() => {
    const has = selected.dept?.includes("Sales") && selected.tenure?.includes("0–1 year");
    return has ? { score: 54, segment: "Sales + 0–1 year tenure" } : null;
  }, [selected]);

  // Problem Snapshot: auto-find worst combination across active filters
  const orgAvg = 72;
  const snapshot = useMemo(() => {
    const allRows: { label: string; score: number; cut: string; key: string }[] = [
      ...dataDept.map(([l, s]) => ({ label: l, score: s, cut: "dept", key: "dept" })),
      ...dataLevel.map(([l, s]) => ({ label: l, score: s, cut: "level", key: "level" })),
      ...dataTenure.map(([l, s]) => ({ label: l, score: s, cut: "tenure", key: "tenure" })),
      ...dataGender.map(([l, s]) => ({ label: l, score: s, cut: "gender", key: "gender" })),
    ].filter((r) => selected[r.key]?.includes(r.label));

    if (!allRows.length) return null;
    const worstSingle = allRows.reduce((a, b) => (b.score < a.score ? b : a));
    const combo = selected.dept?.includes("Sales") && selected.tenure?.includes("0–1 year")
      ? { label: "Sales dept + 0–1 year tenure", score: 54 }
      : null;
    const best = combo && combo.score < worstSingle.score ? combo : { label: worstSingle.label, score: worstSingle.score };
    return { ...best, gap: orgAvg - best.score };
  }, [selected, dataDept, dataLevel, dataTenure, dataGender]);

  return (
    <PageShell>
      {/* Problem Snapshot — always visible at top */}
      {snapshot && (
        <motion.section
          data-tour="problem-snapshot-card"
          key={`${snapshot.label}-${snapshot.score}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-5 rounded-[12px] flex items-start gap-3 px-5 py-4 shadow-card"
          style={{ background: "#FFF8F8", border: "1px solid #F4D4D9", borderLeft: "3px solid #C8102E" }}
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <AlertTriangle size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Problem Snapshot</div>
            <p className="text-[14px] mt-1 text-foreground leading-relaxed">
              <span className="font-medium">Lowest scoring segment:</span>{" "}
              <span className="font-semibold">{snapshot.label}</span>{" "}
              → <span className="font-semibold tabular-nums">{snapshot.score}/100</span>{" "}
              <span className="text-muted-foreground">({snapshot.gap > 0 ? snapshot.gap : 0} pts below org average)</span>
            </p>
          </div>
        </motion.section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Main */}
        <div>
          {cluster ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
              className="mb-4 rounded-[12px] flex items-start gap-2.5 px-4 py-3"
              style={{ background: "#FEF2F2", borderLeft: "3px solid #C8102E" }}
            >
              <span className="text-[14px]">🔴</span>
              <p className="text-[13px] text-foreground/85 leading-relaxed">
                <span className="font-semibold">Problem cluster detected:</span> {cluster.segment} employees score {cluster.score}/100 — significantly below org average of 72.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
              className="mb-4 rounded-[12px] flex items-start gap-2.5 px-4 py-3"
              style={{ background: "#F0FDF4", borderLeft: "3px solid #16A34A" }}
            >
              <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
              <p className="text-[13px] text-foreground/85 leading-relaxed">
                <span className="font-semibold">No critical clusters detected</span> in current filter selection.
              </p>
            </motion.div>
          )}

          <div className="text-[11px] text-muted-foreground mb-2">Cycle: <span className="font-medium text-foreground">{period}</span> · {managerCount} managers</div>
          <div data-tour="dept-score-bars"><Section title="Score by Department" rows={dataDept} /></div>
          <Section title="Score by Level"      rows={dataLevel} />
          <div data-tour="tenure-score-bars"><Section title="Score by Tenure"     rows={dataTenure} /></div>
          <Section title="Score by Gender"     rows={dataGender} />
        </div>

        {/* Filter panel */}
        <aside data-tour="demographic-filter-panel" className="bg-card border border-border rounded-lg shadow-card p-5 self-start lg:sticky lg:top-5">
          <div className="text-[13px] font-medium text-muted-foreground mb-4">Filter by</div>
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.key} className="border-b border-border pb-3 last:border-b-0">
                <button
                  onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}
                  className="w-full flex items-center justify-between text-[13px] font-medium mb-2"
                >
                  {g.title}
                  <ChevronDown size={14} className={`transition-transform ${open[g.key] ? "" : "-rotate-90"}`} />
                </button>
                {open[g.key] && (
                  <div className="space-y-1.5">
                    {g.options.map((o) => {
                      const checked = selected[g.key]?.includes(o);
                      return (
                        <label key={o} className="flex items-center gap-2 text-[12px] cursor-pointer text-foreground/85">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(g.key, o)}
                            className="w-3.5 h-3.5 rounded border-border accent-[#C8102E]"
                          />
                          {o}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={clearAll} className="mt-4 text-[12px] text-primary/80 hover:text-primary transition-colors">
            Clear all
          </button>
          <button className="mt-3 w-full h-10 rounded-[10px] bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-95 transition-opacity">
            Apply
          </button>
        </aside>
      </div>
    </PageShell>
  );
};

export default Demographics;
