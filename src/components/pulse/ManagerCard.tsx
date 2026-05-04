import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Plus, Target } from "lucide-react";
import type { Manager } from "@/lib/data";
import { useTracksState } from "@/lib/useTracksState";

const riskMeta = {
  "at-risk": { label: "At Risk",  dot: "🔴", pill: "bg-primary/10 text-primary",       avatar: "bg-primary/15 text-primary" },
  "watch":   { label: "Watch",    dot: "🟡", pill: "bg-warning/10 text-warning",       avatar: "bg-warning/15 text-warning" },
  "healthy": { label: "Healthy",  dot: "🟢", pill: "bg-success/10 text-success",       avatar: "bg-success/15 text-success" },
} as const;

interface Props {
  manager: Manager;
  index: number;
  onClick: () => void;
}

function ManagerCardBase({ manager, index, onClick }: Props) {
  const meta = riskMeta[manager.risk];
  const up = manager.delta > 0;
  const { byManager, start } = useTracksState();
  const onTrack = !!byManager[manager.id];
  const eligible = manager.risk === "at-risk" || manager.risk === "watch";

  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.6 + index * 0.03, ease: "easeOut" }}
      whileHover={{ scale: 1.02, borderLeftColor: "#C8102E", borderLeftWidth: 2 }}
      onClick={onClick}
      className="group relative shrink-0 w-[200px] text-left bg-card border border-border rounded-lg p-4 shadow-card cursor-pointer"
      style={{ transitionDuration: "150ms" }}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold ${meta.avatar}`}>
          {manager.initials}
        </div>
        <div className={`text-[11px] font-semibold px-2 py-0.5 rounded-pill ${meta.pill}`}>
          {manager.score}/100
        </div>
      </div>

      <div className="mt-3">
        <div className="text-[14px] font-medium leading-tight">{manager.name}</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">Team of {manager.teamSize}</div>
      </div>

      <div className={`mt-2 flex items-center gap-1 text-[12px] font-medium ${up ? "text-success" : "text-danger"}`}>
        {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        {up ? "+" : ""}{manager.delta} pts
      </div>

      <div className="mt-3 flex items-center justify-between gap-1">
        <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>{meta.dot}</span>
          <span className="font-medium text-foreground/70">{meta.label}</span>
        </div>
        {onTrack ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-pill bg-success/10 text-success">
            <Target size={10} /> On track
          </span>
        ) : eligible ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); start(manager.id); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); start(manager.id); } }}
            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-pill bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
          >
            <Plus size={10} /> Track
          </span>
        ) : null}
      </div>
    </motion.button>
  );
}

export const ManagerCard = memo(ManagerCardBase);

