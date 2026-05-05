import { memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, ChevronDown } from "lucide-react";
import { CycleType, usePeriod } from "@/lib/periodContext";
import { AskPulse } from "./AskPulse";

interface Props {
  compare: boolean;
  onToggleCompare: () => void;
}

const TYPE_TABS: { key: CycleType; label: string }[] = [
  { key: "month", label: "Month" },
  { key: "quarter", label: "Quarter" },
  { key: "date", label: "Date" },
];

function HeaderBase({ compare, onToggleCompare }: Props) {
  const { period, setPeriod, cycleType, setCycleType, periodsForType } = usePeriod();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const periods = periodsForType(cycleType);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-medium tracking-tight">
            Good morning, Priya <span className="inline-block">👋</span>
          </h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">
            Here's what needs your attention today.
          </p>
        </div>

        <div data-tour="ask-pulse" className="hidden md:block relative z-30">
          <AskPulse />
        </div>

        <div className="flex items-center gap-2">
        <div ref={ref} data-tour="period-selector" className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-pill bg-card border border-border text-[13px] font-medium hover:bg-muted/50 transition-colors"
          >
            <span className="text-muted-foreground capitalize">{cycleType}:</span> {period}
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-[240px] bg-card border border-border rounded-lg shadow-lg z-40 py-2"
            >
              <div className="px-2 pb-2 flex gap-1">
                {TYPE_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setCycleType(t.key)}
                    className={`flex-1 h-7 rounded-pill text-[11px] font-medium transition-colors ${
                      cycleType === t.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-border pt-1 max-h-[260px] overflow-y-auto">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPeriod(p); setOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] text-left hover:bg-muted/50 transition-colors ${
                      p === period ? "text-primary font-medium" : "text-foreground/85"
                    }`}
                  >
                    {p}
                    {p === period && <Check size={13} />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <button
          onClick={onToggleCompare}
          className={`h-9 px-3.5 rounded-pill border text-[12px] font-medium transition-colors ${
            compare
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          vs prev
        </button>

        <button className="relative w-9 h-9 rounded-pill bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-medium">
          PS
        </div>
      </div>
      </div>

      <div className="md:hidden mt-4 relative z-30">
        <AskPulse />
      </div>
    </motion.header>
  );
}

export const Header = memo(HeaderBase);
