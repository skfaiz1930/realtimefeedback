import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageShell } from "@/components/pulse/PageShell";
import { scoreColor } from "@/lib/scoreColor";
import { INDUSTRY, INTERNAL } from "@/lib/benchmarks";
import { usePeriod } from "@/lib/periodContext";

type Row = { cycle: string; Connect: number; Develop: number; Inspire: number; Overall: number };


type LineKey = "Connect" | "Develop" | "Inspire" | "Overall";
const lineMeta: Record<LineKey, { color: string; dashed?: boolean }> = {
  Connect: { color: "#C8102E" },
  Develop: { color: "#D97706" },
  Inspire: { color: "#16A34A" },
  Overall: { color: "#6B7280", dashed: true },
};

const markers = [
  { x: "Nov 2025", color: "#7F77DD", label: "Manager Training Cohort", body: "24 managers attended a 2-day CDI workshop. Connect score rose 3 pts next cycle." },
  { x: "Mar 2026", color: "#C8102E", label: "Nudge Campaign Launched", body: "Org-wide nudge campaign on Develop & Connect. Connect rose 3 pts in Apr 2026." },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-card p-3">
      <div className="text-[12px] font-medium mb-2">{label}</div>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-[12px]">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-foreground/80 w-16">{p.dataKey}</span>
            <span className="font-semibold tabular-nums">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// YoY data: prior year vs current year per dimension
const yoyData = [
  { dimension: "Connect", "Prev Year": 61, "This Year": 74, "Industry": INDUSTRY.Connect },
  { dimension: "Develop", "Prev Year": 52, "This Year": 61, "Industry": INDUSTRY.Develop },
  { dimension: "Inspire", "Prev Year": 68, "This Year": 78, "Industry": INDUSTRY.Inspire },
  { dimension: "Overall", "Prev Year": 60, "This Year": 71, "Industry": INDUSTRY.Overall },
];

const Trends = () => {
  const { cycleType, historicalRows } = usePeriod();
  const rows: Row[] = historicalRows();
  const [visible, setVisible] = useState<Record<LineKey, boolean>>({
    Connect: true, Develop: true, Inspire: true, Overall: true,
  });
  const [showBenchmarks, setShowBenchmarks] = useState(true);
  const [popover, setPopover] = useState<typeof markers[number] | null>(null);
  const [yoy, setYoy] = useState(false);
  const cycleLabel = cycleType === "quarter" ? "Quarter" : cycleType === "date" ? "Date Range" : "Month";

  return (
    <PageShell>
      <div className="bg-card border border-border rounded-lg shadow-card p-5 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-[16px] font-medium tracking-tight">
            {yoy ? "Year-on-Year" : `Org CDI Score — ${rows.length} ${cycleLabel} Trend`}
          </h2>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              data-tour="trends-yoy-toggle"
              onClick={() => setYoy((y) => !y)}
              className={`h-7 px-3 rounded-pill text-[11px] font-medium border transition-colors ${
                yoy
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              Year-on-Year
            </button>
            <button
              onClick={() => setShowBenchmarks((b) => !b)}
              className={`h-7 px-3 rounded-pill text-[11px] font-medium border transition-colors ${
                showBenchmarks
                  ? "bg-foreground/5 border-foreground/20 text-foreground"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              Benchmarks
            </button>
            {!yoy && (Object.keys(lineMeta) as LineKey[]).map((k) => {
              const on = visible[k];
              return (
                <button
                  key={k}
                  onClick={() => setVisible((v) => ({ ...v, [k]: !v[k] }))}
                  className={`h-7 px-3 rounded-pill text-[11px] font-medium border transition-colors ${
                    on ? "text-white" : "bg-card text-muted-foreground border-border"
                  }`}
                  style={on ? { background: lineMeta[k].color, borderColor: lineMeta[k].color } : undefined}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                    style={{ background: on ? "#fff" : "#D1D5DB" }} />
                  {k}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[360px] relative">
          <ResponsiveContainer width="100%" height="100%">
            {yoy ? (
              <BarChart data={yoyData} margin={{ top: 28, right: 16, bottom: 8, left: -10 }} barCategoryGap="22%">
                <CartesianGrid stroke="#F0F0EE" vertical={false} />
                <XAxis dataKey="dimension" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={{ stroke: "#EEEEEC" }} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #EEEEEC" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="Prev Year" fill="#D1D5DB" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600} />
                <Bar dataKey="This Year" fill="#C8102E" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600}>
                  <LabelList
                    dataKey="This Year"
                    position="top"
                    content={(props: any) => {
                      const { x, y, width, index } = props;
                      const row = yoyData[index];
                      const delta = row["This Year"] - row["Prev Year"];
                      return (
                        <text
                          x={x + width / 2}
                          y={y - 8}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={600}
                          fill="#16A34A"
                        >
                          +{delta} pts
                        </text>
                      );
                    }}
                  />
                </Bar>
                {showBenchmarks && (
                  <Bar dataKey="Industry" fill="#9CA3AF" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600} />
                )}
              </BarChart>
            ) : (
              <LineChart data={rows} margin={{ top: 10, right: 16, bottom: 8, left: -10 }}>
                <CartesianGrid stroke="#F0F0EE" vertical={false} />
                <XAxis dataKey="cycle" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={{ stroke: "#EEEEEC" }} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#EEEEEC" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="plainline" />
                {showBenchmarks && (
                  <ReferenceLine
                    y={INDUSTRY.Overall}
                    stroke="#6B7280"
                    strokeDasharray="6 4"
                    label={{ value: `Industry ${INDUSTRY.Overall}`, fill: "#6B7280", fontSize: 10, position: "insideTopLeft" }}
                  />
                )}
                {showBenchmarks && (
                  <ReferenceLine
                    y={INTERNAL.Overall}
                    stroke="#C8102E"
                    strokeDasharray="2 4"
                    label={{ value: `Internal ${INTERNAL.Overall}`, fill: "#C8102E", fontSize: 10, position: "insideBottomLeft" }}
                  />
                )}
                {(Object.keys(lineMeta) as LineKey[]).map((k) =>
                  visible[k] ? (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={lineMeta[k].color}
                      strokeWidth={lineMeta[k].dashed ? 1.5 : 2.5}
                      strokeDasharray={lineMeta[k].dashed ? "4 4" : undefined}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive
                      animationDuration={600}
                    />
                  ) : null
                )}
                {markers.map((m) => (
                  <ReferenceLine
                    key={m.x}
                    x={m.x}
                    stroke={m.color}
                    strokeDasharray="4 4"
                    label={{ value: m.label, fill: m.color, fontSize: 10, position: "insideTopRight" }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {!yoy && (
          <div className="flex flex-wrap gap-2 mt-3">
            {markers.map((m) => (
              <button
                key={m.x}
                onClick={() => setPopover(m)}
                className="text-[11px] px-2.5 py-1 rounded-pill border hover:bg-muted/40 transition-colors"
                style={{ borderColor: m.color, color: m.color }}
              >
                ▌ {m.x} — {m.label}
              </button>
            ))}
          </div>
        )}

        {popover && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-background border border-border rounded-md p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[12px] font-semibold" style={{ color: popover.color }}>
                  {popover.x} — {popover.label}
                </div>
                <div className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{popover.body}</div>
              </div>
              <button onClick={() => setPopover(null)} className="text-[11px] text-muted-foreground hover:text-foreground">×</button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Cycle table */}
      <div className="bg-card border border-border rounded-lg shadow-card p-5">
        <h3 className="text-[14px] font-medium mb-3">Cycle Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="font-medium py-2 pr-4">Cycle</th>
                <th className="font-medium py-2 px-2 text-center">Connect</th>
                <th className="font-medium py-2 px-2 text-center">Develop</th>
                <th className="font-medium py-2 px-2 text-center">Inspire</th>
                <th className="font-medium py-2 px-2 text-center">Overall</th>
                <th className="font-medium py-2 pl-2 text-center">vs Prev</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const prev = rows[i - 1];
                const delta = prev ? r.Overall - prev.Overall : 0;
                const cells: [LineKey, number][] = [["Connect", r.Connect], ["Develop", r.Develop], ["Inspire", r.Inspire], ["Overall", r.Overall]];
                return (
                  <tr key={r.cycle} className="border-t border-border hover:bg-[#FFF5F5] transition-colors">
                    <td className="py-2 pr-4 text-[13px] font-medium">{r.cycle}</td>
                    {cells.map(([k, v]) => {
                      const c = scoreColor(v);
                      return (
                        <td key={k} className="py-2 px-2 text-center">
                          <span className="inline-block w-12 py-1 rounded-md font-semibold" style={{ background: c.bg, color: c.text }}>{v}</span>
                        </td>
                      );
                    })}
                    <td className="py-2 pl-2 text-center">
                      {prev ? (
                        <span className={`inline-flex items-center gap-1 font-medium ${delta > 0 ? "text-success" : delta < 0 ? "text-danger" : "text-muted-foreground"}`}>
                          {delta > 0 ? <ArrowUp size={12} /> : delta < 0 ? <ArrowDown size={12} /> : null}
                          {delta > 0 ? "+" : ""}{delta}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          className="mt-4 rounded-lg flex items-start gap-2.5 px-4 py-3"
          style={{ background: "#F0FDF4", borderLeft: "3px solid #16A34A" }}
        >
          <TrendingUp size={16} className="text-success mt-0.5 shrink-0" />
          <p className="text-[13px] text-foreground/85 leading-relaxed">
            <span className="font-semibold">Largest single-cycle improvement:</span> Connect score in Apr 2026 (+3 pts from Mar). Possible correlation: Nudge Campaign launched Mar 2026.
          </p>
        </div>
      </div>
    </PageShell>
  );
};

export default Trends;
