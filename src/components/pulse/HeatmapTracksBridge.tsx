import { useMemo } from "react";
import { motion } from "framer-motion";
import { Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { managers } from "@/lib/data";
import { useTracksState } from "@/lib/useTracksState";
import { startTrack } from "@/lib/tracks";
import { toast } from "sonner";
import type { DiagnosticFinding } from "@/components/pulse/HeatmapDiagnosticGuide";

const QID_TO_DIM: Record<string, "connect" | "develop" | "inspire"> = {};
for (let i = 1; i <= 9; i++) QID_TO_DIM[`Q${i}`] = "connect";
for (let i = 10; i <= 17; i++) QID_TO_DIM[`Q${i}`] = "develop";
for (let i = 18; i <= 25; i++) QID_TO_DIM[`Q${i}`] = "inspire";

const DIM_LABEL = { connect: "Connect", develop: "Develop", inspire: "Inspire" } as const;

interface Props { findings: DiagnosticFinding[]; }

export function HeatmapTracksBridge({ findings }: Props) {
  const { byManager, refresh } = useTracksState();

  const { dim, candidates } = useMemo(() => {
    if (findings.length === 0) return { dim: null as null | "connect" | "develop" | "inspire", candidates: [] as typeof managers };
    // Pick the dimension implicated by the highest-urgency finding
    const counts: Record<string, number> = { connect: 0, develop: 0, inspire: 0 };
    findings.forEach((f) => { const d = QID_TO_DIM[f.questionId]; if (d) counts[d] += f.urgency === "high" ? 2 : 1; });
    const dim = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as "connect" | "develop" | "inspire");
    const candidates = managers
      .filter((m) => (m.risk === "at-risk" || m.risk === "watch") && !byManager[m.id])
      .slice(0, 3);
    return { dim, candidates };
  }, [findings, byManager]);

  if (!dim || candidates.length === 0) return null;

  const handleStartAll = async () => {
    try {
      await Promise.all(candidates.map((m) => startTrack(m.id, dim)));
      toast.success(`${candidates.length} ${DIM_LABEL[dim]}-focused tracks started — 6 weeks of nudges scheduled`);
      refresh();
    } catch { toast.error("Failed to start tracks"); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="mb-5 rounded-[14px] px-5 py-4 bg-card flex flex-wrap items-center gap-3"
      style={{ borderLeft: "3px solid #16A34A", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
    >
      <div className="w-9 h-9 rounded-full bg-success/10 text-success flex items-center justify-center"><Target size={15} /></div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold">
          Turn diagnostic into action — {candidates.length} flagged manager{candidates.length > 1 ? "s" : ""} would benefit from a <span className="text-foreground">{DIM_LABEL[dim]}</span>-focused track
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
          Suggested: {candidates.map((m) => m.name).join(" · ")}
        </div>
      </div>
      <button
        onClick={handleStartAll}
        className="h-8 px-3 rounded-pill bg-success text-white text-[12px] font-medium hover:opacity-95"
      >
        Start {candidates.length} track{candidates.length > 1 ? "s" : ""}
      </button>
      <Link to="/development-tracks" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        Manage <ArrowRight size={11} />
      </Link>
    </motion.div>
  );
}
