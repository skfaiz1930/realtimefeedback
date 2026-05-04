import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp, Users } from "lucide-react";
import type { Manager } from "@/lib/data";
import { getTeamBreakdown } from "@/lib/managerBreakdown";
import { usePeriod } from "@/lib/periodContext";
import { scoreColor } from "@/lib/scoreColor";

interface Props { manager: Manager }

const dimColor: Record<string, string> = {
  Connect: "#C8102E",
  Develop: "#D97706",
  Inspire: "#16A34A",
};

export function TeamDrilldown({ manager }: Props) {
  const { period } = usePeriod();
  const data = getTeamBreakdown(manager, period);

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-lg border border-border p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Team Health · {period}</div>
          <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Users size={11} /> {data.participation.responded}/{data.participation.invited} responded · {data.responseRate}%
          </div>
        </div>

        <div className="space-y-3">
          {data.dimensions.map((d, i) => (
            <motion.div
              key={d.dim}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="font-medium" style={{ color: dimColor[d.dim] }}>{d.dim}</span>
                <span className="tabular-nums">
                  <span className="font-semibold">{d.score}</span>
                  <span className={`ml-2 text-[11px] ${d.delta > 0 ? "text-success" : d.delta < 0 ? "text-danger" : "text-muted-foreground"}`}>
                    {d.delta > 0 ? "+" : ""}{d.delta}
                  </span>
                </span>
              </div>
              <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "#F0F0EE" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${d.score}%` }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: dimColor[d.dim] }}
                />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                {d.subthemes.map((s) => {
                  const c = scoreColor(s.score);
                  return (
                    <div key={s.key} className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground truncate">{s.label}</span>
                      <span className="px-1.5 rounded font-semibold tabular-nums" style={{ background: c.bg, color: c.text }}>{s.score}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 bg-card">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Key Drivers</div>
        <div className="space-y-2">
          {data.drivers.map((dr) => (
            <div key={dr.label + dr.impact} className="flex items-center justify-between text-[12px]">
              <span className="inline-flex items-center gap-2">
                {dr.impact === "boost"
                  ? <TrendingUp size={13} className="text-success" />
                  : <TrendingDown size={13} className="text-danger" />}
                <span className="font-medium">{dr.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-pill" style={{ background: dimColor[dr.dim] + "1a", color: dimColor[dr.dim] }}>{dr.dim}</span>
              </span>
              <span className="tabular-nums font-semibold">{dr.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 bg-card grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <div className="text-muted-foreground">Self vs Team gap</div>
          <div className={`text-[18px] font-semibold mt-0.5 ${data.selfVsTeamGap > 8 ? "text-warning" : "text-foreground"}`}>
            {data.selfVsTeamGap > 0 ? "+" : ""}{data.selfVsTeamGap} pts
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Cycle delta</div>
          <div className={`text-[18px] font-semibold mt-0.5 inline-flex items-center gap-1 ${manager.delta >= 0 ? "text-success" : "text-danger"}`}>
            {manager.delta >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {manager.delta >= 0 ? "+" : ""}{manager.delta}
          </div>
        </div>
      </div>
    </div>
  );
}
