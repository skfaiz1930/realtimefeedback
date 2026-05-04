import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { ManagerCard } from "./ManagerCard";
import type { Manager } from "@/lib/data";
import { topPerformers } from "@/lib/managerPool";
import { usePeriod } from "@/lib/periodContext";

interface Props { onClick: (m: Manager) => void }

export function TopPerformingTeams({ onClick }: Props) {
  const { period, snapshot } = usePeriod();
  const ref = useRef<HTMLDivElement | null>(null);
  const list = useMemo(() => topPerformers(period, snapshot.delta, 12), [period, snapshot.delta]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="mb-10"
    >
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[16px] font-medium tracking-tight">Top Performing Teams</h2>
        <Sparkles size={14} className="text-success" />
        <span className="text-[11px] text-muted-foreground">{list.length} managers · cycle leaders</span>
      </div>
      <div className="relative">
        <div ref={ref} className="flex gap-3 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1 scroll-smooth">
          {list.map((m, i) => (
            <ManagerCard key={m.id} manager={m} index={i} onClick={() => onClick(m)} />
          ))}
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-[60px]"
          style={{ background: "linear-gradient(to right, rgba(247,247,245,0), rgba(247,247,245,1))" }} />
        <button
          aria-label="Scroll right"
          onClick={() => ref.current?.scrollBy({ left: 220, behavior: "smooth" })}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card border border-border shadow-card flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.section>
  );
}
