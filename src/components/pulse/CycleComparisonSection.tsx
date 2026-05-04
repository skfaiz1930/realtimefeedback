import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { usePeriod } from "@/lib/periodContext";
import { bySeniorityAvg, topMovers } from "@/lib/managerPool";

const SEN_COLORS: Record<string, string> = {
  "First-time Manager": "#C8102E",
  "Middle Manager": "#D97706",
  "Senior Manager": "#16A34A",
  "CEO/CXO": "#6366F1",
};

export function CycleComparisonSection() {
  const { period, snapshot, historicalRows, cycleType } = usePeriod();
  const cycleLabel = cycleType === "quarter" ? "Quarter" : cycleType === "date" ? "Range" : "Month";

  const seniorityRows = useMemo(() => bySeniorityAvg(period, snapshot.delta), [period, snapshot.delta]);
  const movers = useMemo(() => topMovers(period, snapshot.delta, 6), [period, snapshot.delta]);
  const trend = useMemo(() => {
    const rows = historicalRows();
    return rows.map((r) => {
      const sens = bySeniorityAvg(r.cycle, 0);
      const obj: Record<string, number | string> = { cycle: r.cycle };
      sens.forEach((s) => { obj[s.seniority] = s.avg; });
      return obj;
    });
  }, [historicalRows]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.65 }}
      className="mb-10 bg-card border border-border rounded-lg shadow-card p-6"
    >
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={16} className="text-primary" />
        <h2 className="text-[16px] font-medium tracking-tight">Cycle Comparison & Growth</h2>
      </div>
      <p className="text-[12px] text-muted-foreground mb-5">
        How each seniority cohort is trending across {cycleLabel.toLowerCase()}s, and the biggest movers this cycle.
      </p>

      {/* Seniority cohort cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {seniorityRows.map((s) => {
          const up = s.growth >= 0;
          return (
            <div key={s.seniority} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ background: SEN_COLORS[s.seniority] }} />
                <div className="text-[11px] text-muted-foreground font-medium">{s.seniority}</div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-[22px] font-semibold tabular-nums">{s.avg}</div>
                <div className={`text-[12px] font-medium flex items-center gap-0.5 ${up ? "text-success" : "text-danger"}`}>
                  {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                  {up ? "+" : ""}{s.growth}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{s.count} managers</div>
            </div>
          );
        })}
      </div>

      {/* Trend chart */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
            <CartesianGrid stroke="#F0F0EE" vertical={false} />
            <XAxis dataKey="cycle" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={{ stroke: "#EEEEEC" }} tickLine={false} />
            <YAxis domain={[40, 100]} tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #EEEEEC" }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="plainline" />
            {Object.keys(SEN_COLORS).map((k) => (
              <Line key={k} type="monotone" dataKey={k} stroke={SEN_COLORS[k]} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} isAnimationActive animationDuration={500} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top movers */}
      <div className="mt-6">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Biggest Movers — {period}
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={movers} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
              <CartesianGrid stroke="#F0F0EE" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#374151", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #EEEEEC" }}
                formatter={(v: number, _n, p: any) => [`${v} (Δ ${p.payload.delta > 0 ? "+" : ""}${p.payload.delta})`, p.payload.seniority]} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={500}
                fill="#16A34A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.section>
  );
}
