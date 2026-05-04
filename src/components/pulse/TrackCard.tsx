import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Send, Eye } from "lucide-react";
import { type DevelopmentTrack, type ManagerNudge, managerById, weakestFor, weeksElapsed, trackStatusLabel } from "@/lib/tracks";

interface Props {
  track: DevelopmentTrack;
  nudges: ManagerNudge[];
  index: number;
  onView: () => void;
  onSend: () => void;
}

const toneClasses: Record<string, string> = {
  info: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  muted: "bg-muted text-muted-foreground",
};

export function TrackCard({ track, nudges, index, onView, onSend }: Props) {
  const manager = managerById(track.manager_id);
  if (!manager) return null;
  const weak = weakestFor(manager);
  const trackNudges = nudges.filter((n) => n.track_id === track.id);
  const status = trackStatusLabel(track, trackNudges.length);
  const weeks = weeksElapsed(track.start_date);
  const pct = Math.min(100, ((weeks + (trackNudges.length > 0 ? 0.5 : 0)) / track.weeks_total) * 100);
  const up = manager.delta > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="bg-card border border-border rounded-lg p-5 shadow-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-semibold">{manager.initials}</div>
          <div>
            <div className="text-[14px] font-medium leading-tight">{manager.name}</div>
            <div className="text-[11.5px] text-muted-foreground">Team of {manager.teamSize} · {manager.score}/100</div>
          </div>
        </div>
        <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-pill ${toneClasses[status.tone]}`}>{status.label}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">Focus</span>
        <span className="text-[11.5px] font-medium px-2 py-0.5 rounded-pill bg-warning/10 text-warning">{weak.label} · {weak.score}/100</span>
        <span className={`text-[11px] font-medium ml-auto flex items-center gap-0.5 ${up ? "text-success" : "text-danger"}`}>
          {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{up ? "+" : ""}{manager.delta}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[10.5px] text-muted-foreground mb-1">
          <span>Week {Math.min(weeks + 1, track.weeks_total)} of {track.weeks_total}</span>
          <span>{trackNudges.filter((n) => n.status !== "scheduled").length} sent · {trackNudges.filter((n) => n.status === "scheduled").length} scheduled</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-muted">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.1 + index * 0.05 }} className="h-full bg-primary rounded-full" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button onClick={onView} className="flex-1 h-8 rounded-pill border border-border text-[12px] font-medium hover:bg-muted/50 flex items-center justify-center gap-1.5">
          <Eye size={12} /> View plan & schedule
        </button>
      </div>
    </motion.div>
  );
}
