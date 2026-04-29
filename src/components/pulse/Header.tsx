import { memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, ChevronDown } from "lucide-react";
import { PERIODS, Period, usePeriod } from "@/lib/periodContext";
import { AskPulse } from "./AskPulse";

interface Props {
  compare: boolean;
  onToggleCompare: () => void;
}

function HeaderBase({ compare, onToggleCompare }: Props) {
  const { period, setPeriod } = usePeriod();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

        <div className="hidden md:block relative z-30">
          <AskPulse />
        </div>

        <div className="flex items-center gap-2">
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-pill bg-card border border-border text-[13px] font-medium hover:bg-muted/50 transition-colors"
          >
            {period}
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-[200px] bg-card border border-border rounded-lg shadow-lg z-40 py-1.5"
            >
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p as Period); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] text-left hover:bg-muted/50 transition-colors ${
                    p === period ? "text-primary font-medium" : "text-foreground/85"
                  }`}
                >
                  {p}
                  {p === period && <Check size={13} />}
                </button>
              ))}
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
          vs Mar 2026
        </button>

        <button className="relative w-9 h-9 rounded-pill bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-medium">
          PS
        </div>
      </div>
    </motion.header>
  );
}

export const Header = memo(HeaderBase);
