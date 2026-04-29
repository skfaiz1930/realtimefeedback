import { memo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  icon: string;
  text: string;
  accent: "danger" | "warning" | "success";
  done: boolean;
  onToggle: () => void;
}

const accentMap = {
  danger:  "border-l-primary",
  warning: "border-l-warning",
  success: "border-l-success",
};

function ActionItemBase({ icon, text, accent, done, onToggle }: Props) {
  return (
    <div
      className={`flex items-start gap-3 p-3 bg-card rounded-md border border-border border-l-2 ${accentMap[accent]} transition-opacity ${done ? "opacity-60" : ""}`}
    >
      <span className="text-[14px] leading-tight mt-0.5">{icon}</span>
      <p className={`flex-1 text-[13px] leading-snug ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {text}
      </p>
      <button
        onClick={onToggle}
        aria-label="Mark done"
        className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
          done ? "bg-success border-success" : "border-border bg-background hover:border-success"
        }`}
      >
        {done && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Check size={12} className="text-primary-foreground" strokeWidth={3} />
          </motion.span>
        )}
      </button>
    </div>
  );
}

export const ActionItem = memo(ActionItemBase);
