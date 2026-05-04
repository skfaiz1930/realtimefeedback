import { motion } from "framer-motion";
import type { Dimension } from "@/lib/data";
import { subThemeScores } from "@/lib/dimensionThemes";
import { usePeriod } from "@/lib/periodContext";
import { scoreColor } from "@/lib/scoreColor";
import type { DimKey } from "@/lib/benchmarks";

interface Props { dim: Dimension }

const KEY_MAP: Record<string, Exclude<DimKey, "Overall">> = {
  connect: "Connect", develop: "Develop", inspire: "Inspire",
};

export function DimensionDrilldown({ dim }: Props) {
  const { period } = usePeriod();
  const dKey = KEY_MAP[dim.key];
  const subs = subThemeScores(dKey, period, dim.score);

  return (
    <div className="mt-5">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Sub-themes ({subs.length}) · {period}
      </div>
      <div className="space-y-2">
        {subs.map((s, i) => {
          const c = scoreColor(s.score);
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-md border border-border p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-[13px] font-medium">{s.label}</div>
                  <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-md text-[12px] font-semibold tabular-nums"
                    style={{ background: c.bg, color: c.text }}>{s.score}</span>
                  <div className={`text-[10px] mt-0.5 ${s.delta > 0 ? "text-success" : s.delta < 0 ? "text-danger" : "text-muted-foreground"}`}>
                    {s.delta > 0 ? "+" : ""}{s.delta} vs prev
                  </div>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F0F0EE" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.score}%` }}
                  transition={{ duration: 0.4, delay: 0.05 + i * 0.03 }}
                  className="h-full rounded-full"
                  style={{ background: dim.color }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
