import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { streamEdgeFunction } from "@/lib/aiStream";
import { usePeriod } from "@/lib/periodContext";

export function PeriodSummaryAI() {
  const { period, snapshot } = usePeriod();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setText("");
    setLoading(true);

    streamEdgeFunction({
      fn: "period-summary",
      body: { period, snapshot },
      signal: controller.signal,
      onDelta: (chunk) => setText((t) => t + chunk),
      onDone: () => setLoading(false),
      onError: (msg) => {
        setLoading(false);
        toast.error(msg);
      },
    });
  };

  // Auto-generate on mount and whenever period changes
  useEffect(() => {
    generate();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  return (
    <motion.section
      key={period}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-6 rounded-[12px] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #FFF8F8 100%)",
        border: "1px solid #EEEEEC",
      }}
    >
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {period.replace(" Cycle", "")} — AI Cycle Summary
            </div>
            <button
              onClick={generate}
              disabled={loading}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              {loading ? "Generating" : "Regenerate"}
            </button>
          </div>
          <div className="text-[14px] leading-relaxed text-foreground/90 mt-1.5 prose prose-sm max-w-none prose-p:my-0">
            {text ? (
              <ReactMarkdown>{text}</ReactMarkdown>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Analysing this cycle…
              </span>
            )}
            {loading && text && <span className="inline-block w-1 h-3.5 ml-0.5 bg-primary/70 animate-pulse align-middle" />}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>Org {snapshot.org}/100</span>
            <span>·</span>
            <span className={snapshot.delta > 0 ? "text-success" : snapshot.delta < 0 ? "text-danger" : ""}>
              {snapshot.delta > 0 ? "+" : ""}{snapshot.delta} pts vs last
            </span>
            <span>·</span>
            <span>Best: {snapshot.best.name} ({snapshot.best.score})</span>
            <span>·</span>
            <span className="text-primary">Watch: {snapshot.worst.name} ({snapshot.worst.score})</span>
            <span>·</span>
            <span>{snapshot.atRisk} at-risk teams</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
