import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, MessageSquare, Bell, X, CheckCircle2, PauseCircle, Clock, CalendarClock } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { toast } from "sonner";
import { streamEdgeFunction } from "@/lib/aiStream";
import {
  type DevelopmentTrack, type ManagerNudge, type Channel,
  listNudges, updateTrack, managerById, weakestFor, scheduleNudgeSeries,
} from "@/lib/tracks";

interface Props {
  track: DevelopmentTrack | null;
  onClose: () => void;
  onChange: () => void;
}

const channelIcons: Record<Channel, typeof Mail> = { email: Mail, slack: MessageSquare, "in-app": Bell };

export function TrackDrawer({ track, onClose, onChange }: Props) {
  const [plan, setPlan] = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const [nudges, setNudges] = useState<ManagerNudge[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const manager = track ? managerById(track.manager_id) : undefined;
  const weak = manager ? weakestFor(manager) : null;

  const loadNudges = async () => {
    if (!track) return;
    try { setNudges(await listNudges(track.id)); } catch {}
  };

  useEffect(() => {
    if (!track) { setPlan(""); setNudges([]); return; }
    loadNudges();
    setPlan("");
    setPlanLoading(true);
    abortRef.current?.abort();
    const c = new AbortController();
    abortRef.current = c;
    streamEdgeFunction({
      fn: "development-plan",
      body: { manager, focusDimension: track.focus_dimension, dimensionScore: weak?.score },
      signal: c.signal,
      onDelta: (chunk) => setPlan((t) => t + chunk),
      onDone: () => setPlanLoading(false),
      onError: (msg) => { setPlanLoading(false); toast.error(msg); },
    });
    return () => { abortRef.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  if (!track || !manager || !weak) return null;

  const sorted = [...nudges].sort((a, b) => (a.week_number ?? 0) - (b.week_number ?? 0));
  const sentCount = sorted.filter((n) => n.status !== "scheduled").length;
  const scheduledCount = sorted.filter((n) => n.status === "scheduled").length;

  const regenerate = async () => {
    toast.info("Regenerating nudge schedule…");
    try {
      await scheduleNudgeSeries(track);
      await loadNudges();
      toast.success("Schedule refreshed");
    } catch { toast.error("Could not regenerate schedule"); }
  };

  const markComplete = async () => {
    await updateTrack(track.id, { status: "completed" });
    toast.success("Track completed");
    onChange();
    onClose();
  };
  const pauseTrack = async () => {
    await updateTrack(track.id, { status: track.status === "paused" ? "active" : "paused" });
    toast.success(track.status === "paused" ? "Track resumed" : "Track paused");
    onChange();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40"
      />
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
        className="fixed right-0 top-0 bottom-0 w-full md:w-[520px] bg-card z-50 shadow-2xl flex flex-col"
      >
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-[15px] font-medium">{manager.name}</div>
            <div className="text-[11px] text-muted-foreground">Development Track · started {new Date(track.start_date).toLocaleDateString()}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Focus banner */}
          <div className="rounded-lg p-4" style={{ background: "linear-gradient(135deg, #FFF8F8, #FFFFFF)", border: "1px solid hsl(var(--border))" }}>
            <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">Focus area</div>
            <div className="mt-1 text-[14px] font-medium">{weak.label} — score {weak.score}/100</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">6-week journey · {sentCount} sent · {scheduledCount} scheduled</div>
          </div>

          {/* AI plan */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-primary" />
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-primary">AI Development Plan</h3>
            </div>
            {!plan && planLoading && (
              <div className="text-[12px] text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Designing 6-week plan…
              </div>
            )}
            {plan && (
              <div className="prose prose-sm max-w-none text-[13px] leading-relaxed
                prose-headings:text-[11.5px] prose-headings:font-semibold prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-primary prose-headings:mt-3 prose-headings:mb-1 first:prose-headings:mt-0
                prose-p:my-1 prose-ul:my-1 prose-ul:pl-5 prose-li:my-0.5
                prose-strong:text-foreground prose-strong:font-semibold">
                <ReactMarkdown>{plan}</ReactMarkdown>
                {planLoading && <span className="inline-block w-1 h-3.5 ml-0.5 bg-primary/70 animate-pulse align-middle" />}
              </div>
            )}
          </section>

          {/* Auto-scheduled nudge timeline */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <CalendarClock size={13} className="text-primary" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Auto-scheduled nudges</h3>
              </div>
              <button onClick={regenerate} className="text-[11px] text-primary font-medium hover:underline">↻ Regenerate</button>
            </div>
            {sorted.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-center">
                <div className="text-[12px] text-muted-foreground">Generating 6 weekly nudges…</div>
                <button onClick={regenerate} className="mt-2 text-[11px] text-primary font-medium hover:underline">Trigger now</button>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {sorted.map((n) => {
                    const Icon = channelIcons[n.channel];
                    const isScheduled = n.status === "scheduled";
                    const when = n.scheduled_for ?? n.sent_at;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        className={`rounded-md border p-3 ${isScheduled ? "border-dashed border-border bg-muted/30" : "border-border"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">Week {n.week_number ?? "—"}</span>
                            <Icon size={12} />
                            <span className="capitalize">{n.channel}</span>
                            <span>· {new Date(when).toLocaleDateString()}</span>
                          </div>
                          {isScheduled ? (
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                              <Clock size={10} /> Scheduled
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-wider text-success font-semibold">Sent</span>
                          )}
                        </div>
                        <div className="text-[13px] font-medium mt-1">{n.subject}</div>
                        <div className="text-[12px] text-muted-foreground mt-0.5 line-clamp-3">{n.body}</div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>

        <footer className="px-5 py-3 border-t border-border flex items-center justify-between">
          <button onClick={pauseTrack} className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            <PauseCircle size={13} /> {track.status === "paused" ? "Resume" : "Pause"} track
          </button>
          <button onClick={markComplete} className="h-8 px-3 rounded-pill bg-success/10 text-success text-[12px] font-medium flex items-center gap-1.5 hover:bg-success/20 transition-colors">
            <CheckCircle2 size={13} /> Mark complete
          </button>
        </footer>
      </motion.aside>
    </AnimatePresence>
  );
}
