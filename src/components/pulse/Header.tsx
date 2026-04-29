import { memo } from "react";
import { motion } from "framer-motion";
import { Bell, ChevronDown } from "lucide-react";

interface Props {
  period: string;
  compare: boolean;
  onToggleCompare: () => void;
}

function HeaderBase({ period, compare, onToggleCompare }: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
      className="flex flex-wrap items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 className="text-[22px] font-medium tracking-tight">
          Good morning, Priya <span className="inline-block">👋</span>
        </h1>
        <p className="text-[14px] text-muted-foreground mt-0.5">
          Here's what needs your attention today.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-pill bg-card border border-border text-[13px] font-medium hover:bg-muted/50 transition-colors">
          {period}
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>

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
