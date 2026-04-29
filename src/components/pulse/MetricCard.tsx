import { memo, ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  label: string;
  value: number;
  suffix?: string;
  trend?: { dir: "up" | "down" | "neutral"; text: string; tone: "success" | "danger" | "muted" };
  delay: number;
  duration?: number;
  format?: (n: number) => string;
  extra?: ReactNode;
  belowValue?: ReactNode;
  refreshKey?: number;
}

function MetricCardBase({ label, value, suffix, trend, delay, duration = 1000, format, extra, belowValue, refreshKey }: Props) {
  const animated = useCountUp(value, duration, delay);
  const display = format ? format(animated) : Math.round(animated).toString();

  const toneClass =
    trend?.tone === "success" ? "text-success"
    : trend?.tone === "danger" ? "text-danger"
    : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay / 1000, ease: "easeOut" }}
      key={refreshKey}
      whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      style={{ transitionDuration: "150ms" }}
      className="cursor-pointer bg-card border border-border rounded-lg p-5 shadow-card"
    >
      <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
        {label}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[32px] leading-none font-medium tracking-tight">{display}</span>
        {suffix && <span className="text-[14px] text-muted-foreground font-medium">{suffix}</span>}
        {extra}
      </div>

      {belowValue && <div className="mt-1">{belowValue}</div>}

      {trend && (
        <div className={`mt-3 flex items-center gap-1 text-[12px] font-medium ${toneClass}`}>
          {trend.dir === "up" && <ArrowUp size={12} />}
          {trend.dir === "down" && <ArrowDown size={12} />}
          <span>{trend.text}</span>
        </div>
      )}
    </motion.div>
  );
}

export const MetricCard = memo(MetricCardBase);
