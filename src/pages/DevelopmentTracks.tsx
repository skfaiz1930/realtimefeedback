import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/pulse/PageShell";
import { TrackCard } from "@/components/pulse/TrackCard";
import { TrackDrawer } from "@/components/pulse/TrackDrawer";
import { ImpactSection } from "@/components/pulse/ImpactSection";
import { managers } from "@/lib/data";
import {
  type DevelopmentTrack, type ManagerNudge,
  listTracks, listNudges, startTrack, weakestFor, managerById, deliverDueNudges,
} from "@/lib/tracks";

export default function DevelopmentTracks() {
  const [tracks, setTracks] = useState<DevelopmentTrack[]>([]);
  const [nudges, setNudges] = useState<ManagerNudge[]>([]);
  const [drawerTrack, setDrawerTrack] = useState<DevelopmentTrack | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      await deliverDueNudges();
      const [t, n] = await Promise.all([listTracks(), listNudges()]);
      setTracks(t.filter((x) => x.status !== "completed"));
      setNudges(n);
    } catch { toast.error("Failed to load tracks"); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const handleStart = async (managerId: string) => {
    const m = managerById(managerId);
    if (!m) return;
    const focus = weakestFor(m).key;
    try {
      await startTrack(managerId, focus);
      toast.success(`${m.name} added — 6 weeks of nudges scheduled automatically`);
      refresh();
    } catch { toast.error("Failed to start track"); }
  };

  const trackedIds = useMemo(() => new Set(tracks.map((t) => t.manager_id)), [tracks]);
  const eligible = managers.filter((m) => (m.risk === "at-risk" || m.risk === "watch") && !trackedIds.has(m.id));
  const cycleNudges = nudges.length;
  const improving = tracks.filter((t) => nudges.filter((n) => n.track_id === t.id).length >= 3).length;


  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-[22px] font-medium tracking-tight">Development Tracks</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Focused 6-week journeys built around each manager's weakest area, powered by AI-generated plans and nudges.
        </p>
      </div>

      {/* Header strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border bg-card px-5 py-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-2"
      >
        <Stat label="On active tracks" value={tracks.length} />
        <Divider />
        <Stat label="Nudges sent" value={cycleNudges} />
        <Divider />
        <Stat label="Showing improvement" value={improving} tone="success" />
      </motion.div>

      {/* Track cards */}
      {loading ? (
        <div className="text-[13px] text-muted-foreground">Loading…</div>
      ) : tracks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Target className="mx-auto text-muted-foreground" size={28} />
          <div className="text-[14px] font-medium mt-3">No active development tracks</div>
          <div className="text-[12px] text-muted-foreground mt-1">Start a track for an at-risk or watch-list manager below.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {tracks.map((t, i) => (
            <TrackCard
              key={t.id} track={t} nudges={nudges} index={i}
              onView={() => setDrawerTrack(t)}
              onSend={() => setDrawerTrack(t)}
            />
          ))}
        </div>
      )}

      {/* Eligible strip */}
      {eligible.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[15px] font-medium tracking-tight">Eligible managers</h2>
            <span className="text-[11px] text-muted-foreground">— flagged this cycle, not yet on a track</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {eligible.map((m, i) => {
              const weak = weakestFor(m);
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="shrink-0 w-[220px] bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-semibold">{m.initials}</div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground">{m.score}/100 · {m.risk}</div>
                    </div>
                  </div>
                  <div className="mt-2.5 text-[11px] text-muted-foreground">
                    Suggested focus: <span className="font-medium text-foreground/80">{weak.label}</span>
                  </div>
                  <button
                    onClick={() => handleStart(m.id)}
                    className="mt-3 w-full h-8 rounded-pill bg-primary text-primary-foreground text-[12px] font-medium flex items-center justify-center gap-1.5"
                  >
                    <Plus size={12} /> Start track
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <ImpactSection tracks={tracks} nudges={nudges} />

      <TrackDrawer track={drawerTrack} onClose={() => setDrawerTrack(null)} onChange={refresh} />
    </PageShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "success" }) {
  return (
    <div>
      <div className={`text-[20px] font-semibold ${tone === "success" ? "text-success" : ""}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
function Divider() { return <div className="h-8 w-px bg-border" />; }
