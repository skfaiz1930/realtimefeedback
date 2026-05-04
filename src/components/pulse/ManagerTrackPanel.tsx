import { Link } from "react-router-dom";
import { Target, ArrowRight } from "lucide-react";
import type { Manager } from "@/lib/data";
import { useTracksState } from "@/lib/useTracksState";
import { weakestFor } from "@/lib/tracks";

interface Props { manager: Manager; }

export function ManagerTrackPanel({ manager }: Props) {
  const { byManager, nudges, start } = useTracksState();
  const track = byManager[manager.id];
  const eligible = manager.risk === "at-risk" || manager.risk === "watch";

  if (!track) {
    if (!eligible) return null;
    const weak = weakestFor(manager);
    return (
      <div className="mt-5 rounded-lg border border-dashed border-border p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Target size={14} /></div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium">Not on a development track</div>
          <div className="text-[11px] text-muted-foreground">Suggested focus: {weak.label} · 6-week auto-nudge journey</div>
        </div>
        <button
          onClick={() => start(manager.id)}
          className="h-8 px-3 rounded-pill bg-primary text-primary-foreground text-[11.5px] font-medium hover:opacity-95"
        >
          Start track
        </button>
      </div>
    );
  }

  const trackNudges = nudges.filter((n) => n.track_id === track.id);
  const sent = trackNudges.filter((n) => n.status !== "scheduled").length;

  return (
    <div className="mt-5 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-success/10 text-success flex items-center justify-center"><Target size={13} /></div>
        <div className="text-[12.5px] font-semibold">On Development Track</div>
        <span className="ml-auto text-[10.5px] font-semibold px-2 py-0.5 rounded-pill bg-success/15 text-success">Active</span>
      </div>
      <div className="text-[12px] text-muted-foreground">
        Focus: <span className="font-medium text-foreground/85">{track.focus_dimension}</span> · {sent} of {trackNudges.length} nudges delivered
      </div>
      <Link
        to="/development-tracks"
        className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
      >
        View full plan <ArrowRight size={12} />
      </Link>
    </div>
  );
}
