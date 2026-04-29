import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface DiagnosticFinding {
  questionId: string;
  questionText: string;
  finding: string;
  findingType: "awareness_gap" | "systemic_low" | "unexpected_drop" | "divergence";
  urgency: "high" | "medium";
}

const typeMeta: Record<DiagnosticFinding["findingType"], { label: string; bg: string; color: string; border: string }> = {
  awareness_gap:   { label: "Self-Awareness Gap",    bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
  systemic_low:    { label: "Systemic Issue",        bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
  unexpected_drop: { label: "Unexpected Drop",       bg: "#EDE9FE", color: "#5B21B6", border: "#C4B5FD" },
  divergence:      { label: "Respondent Divergence", bg: "#DBEAFE", color: "#1E40AF", border: "#93C5FD" },
};

function urgencyBadgeColor(urgency: DiagnosticFinding["urgency"], idx: number) {
  if (idx === 0 || urgency === "high") return { bg: "#C8102E", color: "#FFFFFF" };
  if (idx === 1) return { bg: "#D97706", color: "#FFFFFF" };
  return { bg: "#9CA3AF", color: "#FFFFFF" };
}

interface Props {
  questions: Array<{ id: string; text: string; self: number; team: number; peer: number; rm: number }>;
  onFindingClick: (questionId: string) => void;
  onFindingsLoaded: (findings: DiagnosticFinding[]) => void;
}

export function HeatmapDiagnosticGuide({ questions, onFindingClick, onFindingsLoaded }: Props) {
  const [findings, setFindings] = useState<DiagnosticFinding[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFindings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = Date.now();
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("heatmap-diagnostic", {
        body: { questions },
      });
      const elapsed = Date.now() - start;
      if (elapsed < 1500) await new Promise((r) => setTimeout(r, 1500 - elapsed));
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      const list: DiagnosticFinding[] = data?.findings || [];
      setFindings(list);
      onFindingsLoaded(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load diagnostic findings");
    } finally {
      setLoading(false);
    }
  }, [questions, onFindingsLoaded]);

  useEffect(() => {
    fetchFindings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="mb-5 bg-card rounded-[14px] px-5 py-4"
      style={{ borderLeft: "3px solid #7C3AED", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#7C3AED" }}>
          <Sparkles size={13} />
          AI Diagnostic Guide
        </div>
        <button
          onClick={fetchFindings}
          disabled={loading}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {loading || !findings ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 h-[52px] rounded-md bg-[#FAFAF9] animate-pulse">
              <div className="w-7 h-7 ml-2 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5 py-2">
                <div className="h-2.5 w-1/4 rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
              </div>
              <div className="w-28 h-5 mr-3 rounded-full bg-muted" />
            </div>
          ))
        ) : error ? (
          <div className="text-[13px] text-destructive py-2">{error}</div>
        ) : (
          <AnimatePresence>
            {findings.map((f, idx) => {
              const meta = typeMeta[f.findingType];
              const badge = urgencyBadgeColor(f.urgency, idx);
              return (
                <motion.button
                  key={`${f.questionId}-${idx}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.15 }}
                  onClick={() => onFindingClick(f.questionId)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-[#FAFAF9] transition-colors text-left"
                >
                  <div
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-muted-foreground truncate">
                      {f.questionId} · {f.questionText}
                    </div>
                    <div className="text-[13px] text-foreground leading-snug mt-0.5">
                      {f.finding}
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border"
                    style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
                  >
                    {meta.label}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
