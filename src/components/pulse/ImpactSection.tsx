import { motion } from "framer-motion";
import { TrendingUp, Sparkles } from "lucide-react";
import { type DevelopmentTrack, type ManagerNudge, managerById, weakestFor, weeksElapsed } from "@/lib/tracks";

interface Props {
  tracks: DevelopmentTrack[];
  nudges: ManagerNudge[];
}

/** Demo-only projection: each delivered nudge nudges the focus score up ~1.4 pts (capped). */
function projectImpact(track: DevelopmentTrack, deliveredNudgeCount: number) {
  const m = managerById(track.manager_id);
  if (!m) return null;
  const weak = weakestFor(m);
  const baseline = weak.score;
  const lift = Math.min(14, Math.round(deliveredNudgeCount * 1.4 * 10) / 10);
  const projected = Math.min(95, baseline + Math.round(lift));
  const weeks = Math.min(weeksElapsed(track.start_date) + 1, track.weeks_total);
  return { manager: m, dim: weak.label, baseline, projected, lift, weeks };
}

export function ImpactSection({ tracks, nudges }: Props) {
  const rows = tracks
    .map((t) => {
      const delivered = nudges.filter((n) => n.track_id === t.id && n.status !== "scheduled").length;
      const p = projectImpact(t, delivered);
      return p && delivered > 0 ? { track: t, delivered, ...p } : null;
    })
    .filter(Boolean) as Array<{ track: DevelopmentTrack; delivered: number; manager: ReturnType<typeof managerById>; dim: string; baseline: number; projected: number; lift: number; weeks: number }>;

  if (rows.length === 0) return null;

  const totalLift = rows.reduce((s, r) => s + r.lift, 0);
  const avgLift = Math.round((totalLift / rows.length) * 10) / 10;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[15px] font-medium tracking-tight">Track Impact</h2>
        <span className="text-[11px] text-muted-foreground">— projected lift on focus dimension after nudges delivered</span>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 flex items-center gap-3 border-b border-border" style={{ background: "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)" }}>
          <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center"><TrendingUp size={14} /></div>
          <div>
            <div className="text-[12.5px] font-semibold">+{avgLift} pts average lift across {rows.length} active track{rows.length > 1 ? "s" : ""}</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Sparkles size={10} /> Modelled from delivered nudges and dimension weakness</div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {rows.map((r, i) => (
            <motion.div
              key={r.track.id}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="px-5 py-3 flex items-center gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold">{r.manager!.initials}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate">{r.manager!.name}</div>
                <div className="text-[11px] text-muted-foreground">{r.dim} focus · week {r.weeks} of {r.track.weeks_total} · {r.delivered} nudges delivered</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] tabular-nums text-muted-foreground">{r.baseline}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-[14px] font-semibold tabular-nums text-success">{r.projected}</span>
                <span className="text-[11px] font-medium text-success ml-1">+{r.lift}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
