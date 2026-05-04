import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Mail, MessageSquare, Bell, X, Wand2, CheckCircle2, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { streamEdgeFunction } from "@/lib/aiStream";
import {
  type DevelopmentTrack, type ManagerNudge, type Channel,
  listNudges, sendNudge, updateTrack, managerById, NUDGE_TEMPLATES, weakestFor,
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
  const [suggestions, setSuggestions] = useState<{ title: string; rationale: string; suggested_subject: string; suggested_body: string }[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const manager = track ? managerById(track.manager_id) : undefined;
  const weak = manager ? weakestFor(manager) : null;

  useEffect(() => {
    if (!track) { setPlan(""); setNudges([]); setSuggestions([]); return; }
    listNudges(track.id).then(setNudges).catch(() => {});
    // load suggestions
    supabase.functions.invoke("suggest-nudges", { body: { manager, focusDimension: track.focus_dimension } })
      .then(({ data }) => { if (data?.nudges) setSuggestions(data.nudges); })
      .catch(() => {});
    // stream plan
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

  const handleSendSuggestion = async (s: typeof suggestions[number]) => {
    try {
      await sendNudge({
        track_id: track.id, manager_id: track.manager_id,
        channel: "in-app", template_key: null,
        subject: s.suggested_subject, body: s.suggested_body,
      });
      const updated = await listNudges(track.id);
      setNudges(updated);
      toast.success("Nudge sent");
    } catch { toast.error("Failed to send"); }
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
            <div className="text-[12px] text-muted-foreground mt-0.5">6-week focused journey · {nudges.length} nudges sent</div>
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

          {/* Suggested nudges */}
          {suggestions.length > 0 && (
            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Suggested nudges</h3>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="rounded-lg border border-border p-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium">{s.title}</div>
                      <div className="text-[11.5px] text-muted-foreground mt-0.5">{s.rationale}</div>
                    </div>
                    <button onClick={() => handleSendSuggestion(s)} className="shrink-0 h-7 px-3 rounded-pill bg-primary text-primary-foreground text-[11px] font-medium flex items-center gap-1">
                      <Send size={11} /> Send
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Nudge timeline */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Nudge history</h3>
              <button onClick={() => setComposerOpen(true)} className="text-[11px] text-primary font-medium flex items-center gap-1 hover:underline">
                <Wand2 size={11} /> Compose new
              </button>
            </div>
            {nudges.length === 0 ? (
              <div className="text-[12px] text-muted-foreground italic">No nudges sent yet.</div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {nudges.map((n) => {
                    const Icon = channelIcons[n.channel];
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        className="rounded-md border border-border p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Icon size={12} />
                            <span className="capitalize">{n.channel}</span>
                            <span>· {new Date(n.sent_at).toLocaleDateString()}</span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-success font-semibold">{n.status}</span>
                        </div>
                        <div className="text-[13px] font-medium mt-1">{n.subject}</div>
                        <div className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>
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

      {composerOpen && (
        <NudgeComposer
          track={track} manager={manager} focusDimension={track.focus_dimension}
          onClose={() => setComposerOpen(false)}
          onSent={async () => { setComposerOpen(false); setNudges(await listNudges(track.id)); }}
        />
      )}
    </AnimatePresence>
  );
}

function NudgeComposer({
  track, manager, focusDimension, onClose, onSent,
}: {
  track: DevelopmentTrack;
  manager: ReturnType<typeof managerById> & {};
  focusDimension: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const templates = NUDGE_TEMPLATES[focusDimension] ?? NUDGE_TEMPLATES.develop;
  const [channel, setChannel] = useState<Channel>("in-app");
  const [templateKey, setTemplateKey] = useState(templates[0].key);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const compose = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("compose-nudge", {
        body: { manager, focusDimension, templateKey, channel },
      });
      if (error) throw error;
      setSubject(data.subject ?? "");
      setBody(data.body ?? "");
    } catch { toast.error("AI compose failed"); }
    finally { setAiLoading(false); }
  };

  useEffect(() => { compose(); /* eslint-disable-next-line */ }, [templateKey]);

  const send = async () => {
    if (!subject.trim() || !body.trim()) { toast.error("Subject and body required"); return; }
    setSending(true);
    try {
      await sendNudge({ track_id: track.id, manager_id: manager!.id, channel, template_key: templateKey, subject, body });
      toast.success("Nudge sent");
      onSent();
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 z-[60]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[480px] bg-card rounded-xl shadow-2xl z-[70] p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[14px] font-medium">Send nudge to {manager!.name}</div>
            <div className="text-[11px] text-muted-foreground">Focus: {focusDimension}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Channel</label>
            <div className="mt-1.5 inline-flex rounded-pill border border-border p-0.5 bg-background">
              {(["in-app", "email", "slack"] as Channel[]).map((c) => (
                <button key={c} onClick={() => setChannel(c)} className={`px-3 py-1 rounded-pill text-[11px] capitalize ${channel === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Template</label>
            <select value={templateKey} onChange={(e) => setTemplateKey(e.target.value)} className="mt-1.5 w-full h-9 rounded-md border border-border bg-background px-2 text-[13px]">
              {templates.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5 w-full h-9 rounded-md border border-border bg-background px-2 text-[13px]" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-1.5 w-full rounded-md border border-border bg-background px-2 py-1.5 text-[13px] leading-relaxed" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button onClick={compose} disabled={aiLoading} className="h-8 px-3 rounded-pill border border-border text-[11px] font-medium flex items-center gap-1.5 hover:bg-muted/50 disabled:opacity-60">
            <Sparkles size={11} /> {aiLoading ? "Composing…" : "Improve with AI"}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-8 px-3 text-[12px] text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={send} disabled={sending} className="h-8 px-4 rounded-pill bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5 disabled:opacity-60">
              <Send size={12} /> {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
