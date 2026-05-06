import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, RotateCw, ThumbsUp, AlertTriangle, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Comment } from "@/lib/commentsData";

export interface SynthesisResult {
  doingWell: string;
  hurting: string;
  doTomorrow: string;
  commentCount: number;
  topDepartmentMentioned: string;
  topThemeMentioned: string;
}

interface Props {
  comments: Comment[];
  period: string;
  filters?: Record<string, string>;
  scope: "org" | "manager";
  managerName?: string;
  compact?: boolean;
  autoGenerate?: boolean;
  onViewAllHref?: () => void;
}

const LOADING_MESSAGES = [
  "Reading comments...",
  "Finding patterns...",
  "Identifying what's working...",
  "Spotting what's hurting...",
  "Writing tomorrow's action...",
  "Finalising synthesis...",
];

export function CommentSynthesizer({
  comments, period, filters, scope, managerName,
  compact = false, autoGenerate = false, onViewAllHref,
}: Props) {
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [stale, setStale] = useState(false);
  const filterKey = useMemo(() => JSON.stringify({ filters, count: comments.length, period, managerName }), [filters, comments.length, period, managerName]);
  const filterKeyRef = useRef(filterKey);
  const generatedKeyRef = useRef<string | null>(null);

  // Filter change → mark stale
  useEffect(() => {
    if (filterKeyRef.current !== filterKey) {
      filterKeyRef.current = filterKey;
      if (result) setStale(true);
    }
  }, [filterKey, result]);

  const generate = async () => {
    if (loading || comments.length === 0) return;
    setLoading(true);
    setStale(false);
    setProgress(0);
    setMsgIdx(0);

    const startedAt = Date.now();
    const progInt = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(95, (elapsed / 2500) * 100));
    }, 80);
    const msgInt = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 600);

    try {
      const { data, error } = await supabase.functions.invoke("comment-synthesis", {
        body: { comments, period, filters, scope, managerName },
      });
      clearInterval(progInt);
      clearInterval(msgInt);
      setProgress(100);
      if (error) throw new Error(error.message || "Synthesis failed");
      if ((data as any)?.error) throw new Error((data as any).error);
      await new Promise((r) => setTimeout(r, 250));
      setResult(data as SynthesisResult);
      generatedKeyRef.current = filterKey;
    } catch (e: any) {
      clearInterval(progInt);
      clearInterval(msgInt);
      toast.error(e?.message || "Synthesis failed");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate (manager drawer)
  useEffect(() => {
    if (autoGenerate && !result && !loading && comments.length >= 5 && generatedKeyRef.current !== filterKey) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, comments.length]);

  const copy = async () => {
    if (!result) return;
    const text = `GMI Pulse — Comment Synthesis · ${period}\n\n✅ What you're doing well:\n${result.doingWell}\n\n⚠ What's hurting your team:\n${result.hurting}\n\n🎯 What to do tomorrow:\n${result.doTomorrow}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Synthesis copied");
    setTimeout(() => setCopied(false), 2000);
  };

  // Manager scope insufficient comments
  if (scope === "manager" && comments.length < 5) {
    return (
      <div className={`mt-6 rounded-[14px] border border-border bg-card ${compact ? "p-4" : "p-6"}`}>
        <div className="text-[11px] uppercase tracking-wider text-primary/80 font-semibold mb-2">✦ AI Comment Synthesis</div>
        <div className="text-[12px] text-muted-foreground italic">Not enough comments to synthesise (min 5 required).</div>
      </div>
    );
  }

  const filterPillText = scope === "manager"
    ? `${comments.length} comments · ${managerName}'s team`
    : `${comments.length} comments · ${filters?.dimension ?? "All dimensions"} · ${filters?.respondent ?? "All respondents"}`;

  const pad = compact ? "p-4" : "px-7 py-6";
  const labelSize = compact ? "text-[10px]" : "text-[11px]";
  const bodySize = compact ? "text-[13px]" : "text-[14px]";

  return (
    <div className={`rounded-[14px] border bg-card ${pad}`} style={{ borderColor: "#EEEEEC" }}>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[13px] uppercase tracking-wider font-semibold" style={{ color: "#A12030", letterSpacing: "0.08em" }}>
          ✦ AI Comment Synthesis
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-pill bg-muted text-muted-foreground">{filterPillText}</span>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="py-8">
            <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "#F0F0EE" }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.2 }} className="h-full" style={{ background: "#C8102E" }} />
            </div>
            <div className="text-center text-[13px] text-muted-foreground">{LOADING_MESSAGES[msgIdx]}</div>
          </motion.div>
        ) : !result || stale ? (
          <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="text-center py-8">
            <Sparkles size={32} className="mx-auto mb-3" style={{ color: "#C8102E", opacity: 0.7 }} />
            {stale ? (
              <>
                <div className="text-[15px] font-medium mb-1.5">Filters changed — regenerate synthesis for {comments.length} comments?</div>
                <button onClick={generate} className="mt-3 h-11 px-6 rounded-[10px] bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-95">Regenerate →</button>
              </>
            ) : (
              <>
                <div className="text-[15px] font-medium mb-1.5">Synthesise {comments.length} comments into 3 actionable insights</div>
                <div className="text-[13px] text-muted-foreground max-w-md mx-auto mb-4">AI reads every comment and distills what's working, what's hurting, and what to do tomorrow.</div>
                <button onClick={generate} disabled={comments.length === 0} className="h-11 px-6 rounded-[10px] bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-95 disabled:opacity-50 inline-flex items-center gap-1.5" style={{ maxWidth: 240 }}>
                  Generate Synthesis →
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {[
              { label: "What you're doing well", color: "#16A34A", Icon: ThumbsUp, text: result.doingWell, delay: 0 },
              { label: "What's hurting your team", color: "#DC2626", Icon: AlertTriangle, text: result.hurting, delay: 0.15 },
              { label: "What to do tomorrow", color: "#2563EB", Icon: Target, text: result.doTomorrow, delay: 0.3 },
            ].map((row) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: row.delay }}
                className="relative pl-4 py-3 pr-3 rounded-[10px]"
                style={{ background: row.color + "08" }}
              >
                <motion.span
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ duration: 0.2, delay: row.delay + 0.2, ease: "easeOut" }}
                  className="absolute left-0 top-0 w-1 rounded-l-[10px]"
                  style={{ background: row.color }}
                />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: row.color + "1a", color: row.color }}>
                    <row.Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`${labelSize} uppercase tracking-wider font-semibold mb-1`} style={{ color: row.color, opacity: 0.85 }}>
                      {row.label}
                    </div>
                    <div className={`${bodySize} text-foreground/90`} style={{ lineHeight: 1.7 }}>{row.text}</div>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-border flex-wrap">
              <div className="text-[12px] text-muted-foreground">Based on {result.commentCount} comments · {period}</div>
              <div className="flex items-center gap-2">
                <button onClick={generate} className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  <RotateCw size={11} /> Regenerate
                </button>
                <button onClick={copy} className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  {copied ? <><Check size={11} className="text-success" /><span className="text-success">Copied!</span></> : <><Copy size={11} /> Copy all 3</>}
                </button>
              </div>
            </div>

            {scope === "manager" && onViewAllHref && (
              <button onClick={onViewAllHref} className="text-[12px] text-primary hover:underline mt-1">
                View all {comments.length} comments from this team →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
