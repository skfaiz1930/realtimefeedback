import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePeriod, PERIODS, Period } from "@/lib/periodContext";

const EXAMPLES = [
  "Which managers declined most?",
  "Compare Develop by department",
  "Who is at highest flight risk?",
  "Show Sales team feedback",
];

interface AskResponse {
  page: string;
  filters?: Record<string, string>;
  sortBy?: string | null;
  highlightElement?: string | null;
  confirmationMessage: string;
}

export function AskPulse() {
  const navigate = useNavigate();
  const { setPeriod } = usePeriod();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chipIdx, setChipIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
        setResult(null);
        setError(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submit = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("ask-pulse", { body: { query: q } });
      if (fnErr) throw new Error(fnErr.message || "Request failed");
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as AskResponse);
    } catch (e: any) {
      setError("I couldn't understand that query. Try: 'Show Sales managers' or 'Which dimension dropped most?'");
    } finally {
      setLoading(false);
    }
  };

  const filtersToParams = (f?: Record<string, string>, sortBy?: string | null) => {
    const params = new URLSearchParams();
    if (f) Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
    if (sortBy) params.set("sortBy", sortBy);
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  const navigateToResult = () => {
    if (!result) return;
    // Apply period if requested and valid
    const p = result.filters?.period;
    if (p && (PERIODS as readonly string[]).includes(p)) {
      setPeriod(p as Period);
    }
    const { period: _omit, ...rest } = result.filters || {};
    const qs = filtersToParams(rest, result.sortBy);
    navigate(`${result.page}${qs}`);
    setResult(null); setValue(""); setFocused(false); setError(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setResult(null); setError(null); setFocused(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submit(value);
      return;
    }
    if (!value && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setChipIdx((i) => {
        const n = e.key === "ArrowDown" ? i + 1 : i - 1;
        return Math.max(-1, Math.min(EXAMPLES.length - 1, n));
      });
    }
    if (e.key === "Tab" && chipIdx >= 0) {
      e.preventDefault();
      const q = EXAMPLES[chipIdx];
      setValue(q); submit(q);
    }
  };

  const showChips = focused && !value && !loading && !result && !error;
  const showCard = loading || result || error;

  return (
    <div ref={wrapRef} className="relative w-full md:w-[340px]">
      <div className="relative">
        <Sparkles
          size={15}
          className="absolute left-[14px] top-1/2 -translate-y-1/2 text-primary pointer-events-none"
          strokeWidth={2.25}
        />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null); setChipIdx(-1); }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder="Ask Pulse anything... e.g. 'Which managers declined most this cycle?'"
          className={`w-full h-10 bg-card text-[14px] rounded-pill pl-10 pr-10 py-2.5 border outline-none transition-all placeholder:text-muted-foreground/70 ${
            focused
              ? "border-primary shadow-[0_0_0_3px_rgba(200,16,46,0.1)]"
              : "border-[#EEEEEC]"
          }`}
        />
        <button
          onClick={() => submit(value)}
          disabled={loading || !value.trim()}
          className="absolute right-[6px] top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:cursor-not-allowed"
          aria-label="Submit query"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin text-primary" />
          ) : (
            <ArrowRight
              size={14}
              className={value.trim() ? "text-primary" : "text-muted-foreground/60"}
            />
          )}
        </button>
      </div>

      <AnimatePresence>
        {showChips && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 flex flex-wrap gap-1.5 z-40"
          >
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex}
                onMouseDown={(e) => { e.preventDefault(); setValue(ex); submit(ex); }}
                className={`text-[12px] px-3 py-1.5 rounded-pill border bg-card transition-colors ${
                  i === chipIdx
                    ? "border-primary text-primary bg-primary/5"
                    : "border-border text-foreground/75 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {ex}
              </button>
            ))}
          </motion.div>
        )}

        {showCard && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 mt-2 bg-card rounded-[14px] shadow-lg border border-border p-3.5 z-40"
          >
            {loading && (
              <div className="flex items-center gap-2 text-[13px] text-foreground/80">
                <Sparkles size={14} className="text-primary" />
                <span>Asking Pulse</span>
                <span className="inline-flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse [animation-delay:120ms]" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse [animation-delay:240ms]" />
                </span>
              </div>
            )}

            {!loading && error && (
              <div>
                <div className="flex items-start gap-2 text-[13px] text-foreground/85">
                  <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {EXAMPLES.slice(0, 3).map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { setValue(ex); submit(ex); }}
                      className="text-[12px] px-2.5 py-1 rounded-pill border border-border text-foreground/75 hover:border-primary/40 hover:text-foreground"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loading && !error && result && (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 text-[13px] text-foreground/90 leading-snug">
                  <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
                  <span>{result.confirmationMessage}</span>
                </div>
                <button
                  onClick={navigateToResult}
                  className="shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-pill bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
                >
                  Navigate <ArrowRight size={12} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
