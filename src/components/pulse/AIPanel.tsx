import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RotateCw } from "lucide-react";
import { ActionItem } from "./ActionItem";
import { aiSummary, recommendedActions, respondentTypes } from "@/lib/data";

function AIPanelBase() {
  const [refreshing, setRefreshing] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const refresh = () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="hidden lg:flex fixed right-0 top-0 bottom-0 w-[300px] flex-col bg-card border-l border-border overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* AI Insights */}
        <section>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
            <Sparkles size={11} className="text-primary" />
            AI Insights
          </div>
          <h3 className="mt-1 text-[16px] font-semibold tracking-tight">This Cycle Summary</h3>

          <div className={`relative mt-3 p-4 rounded-md bg-background overflow-hidden ${refreshing ? "shimmer" : ""}`}>
            <p className={`text-[13px] leading-relaxed text-foreground/85 ${refreshing ? "opacity-0" : ""}`}>
              {aiSummary}
            </p>
          </div>

          <button
            onClick={refresh}
            className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh summary
          </button>
        </section>

        {/* Recommended actions */}
        <section>
          <h3 className="text-[13px] font-semibold mb-2.5">Recommended Actions</h3>
          <div className="space-y-2">
            {recommendedActions.map((a) => (
              <ActionItem
                key={a.id}
                icon={a.icon}
                text={a.text}
                accent={a.accent}
                done={!!done[a.id]}
                onToggle={() => setDone((d) => ({ ...d, [a.id]: !d[a.id] }))}
              />
            ))}
          </div>
        </section>

        {/* Respondent breakdown */}
        <section>
          <h3 className="text-[13px] font-semibold mb-3">Response by Respondent Type</h3>
          <div className="space-y-3">
            {respondentTypes.map((r, i) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className="text-foreground/80">{r.label}</span>
                  <span className="text-muted-foreground font-medium">{r.value}%</span>
                </div>
                <div className="h-1.5 w-full rounded-[3px] bg-bartrack overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.value}%` }}
                    transition={{ duration: 0.6, delay: 0.8 + i * 0.08, ease: "easeOut" }}
                    className="h-full bg-primary rounded-[3px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.aside>
  );
}

export const AIPanel = memo(AIPanelBase);
