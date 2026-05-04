import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { PageShell } from "@/components/pulse/PageShell";
import { usePeriod } from "@/lib/periodContext";
import { getManagersForCycle } from "@/lib/managerPool";
import { cycleNoise } from "@/lib/cycleData";

const dotColor = {
  "at-risk": { bg: "#C8102E", ring: "rgba(200,16,46,0.18)" },
  "watch":   { bg: "#D97706", ring: "rgba(217,119,6,0.18)" },
  "healthy": { bg: "#16A34A", ring: "rgba(22,163,74,0.18)" },
} as const;

const quadrants = [
  { key: "champions",  label: "Champions",  desc: "High self & team",     bg: "rgba(34,197,94,0.06)",  pill: "bg-[#DCFCE7] text-[#16A34A]" },
  { key: "underrated", label: "Underrated", desc: "Low self, high team",  bg: "rgba(59,130,246,0.06)", pill: "bg-[#DBEAFE] text-[#2563EB]" },
  { key: "blindspots", label: "Blind Spots",desc: "High self, low team",  bg: "rgba(245,158,11,0.07)", pill: "bg-[#FEF3C7] text-[#D97706]" },
  { key: "atrisk",     label: "At Risk",    desc: "Low self & team",      bg: "rgba(200,16,46,0.06)",  pill: "bg-[#FEE2E2] text-[#C8102E]" },
];

export default function CultureMap() {
  const [hover, setHover] = useState<string | null>(null);
  const { period, snapshot } = usePeriod();
  const managers = useMemo(() => getManagersForCycle(period, snapshot.delta), [period, snapshot.delta]);
  const scores = useMemo(() => {
    const o: Record<string, { self: number; team: number }> = {};
    managers.forEach((m) => {
      const selfBoost = cycleNoise(period, m.id + ":self", 18);
      const teamBoost = cycleNoise(period, m.id + ":team", 14);
      o[m.id] = {
        self: Math.max(20, Math.min(98, Math.round(m.score + selfBoost + 4))),
        team: Math.max(20, Math.min(98, Math.round(m.score + teamBoost - 2))),
      };
    });
    return o;
  }, [managers, period]);

  // Plot geometry: percentage based inside an aspect-square chart
  const toX = (v: number) => `${v}%`;
  const toY = (v: number) => `${100 - v}%`;

  return (
    <PageShell>
      <div className="mt-6">
        <h1 className="text-[22px] font-semibold tracking-tight">Culture Map</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Self vs team perception across managers — uncover blind spots and champions.
        </p>
      </div>

      {/* Chart card */}
      <div className="mt-6 bg-card border border-border rounded-xl shadow-card p-5 md:p-7">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="text-[15px] font-medium">Manager Self vs Team Perception</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              Each dot = one manager. Solid lines = org avg (70). Dashed lines = industry benchmark (69).
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">n = {managers.length}</div>
        </div>

        <div className="flex">
          {/* Y axis label */}
          <div className="hidden sm:flex w-6 items-center justify-center">
            <span className="text-[11px] text-muted-foreground -rotate-90 whitespace-nowrap tracking-wide">
              Team Member score →
            </span>
          </div>

          {/* Plot area */}
          <div className="flex-1">
            <div className="relative w-full aspect-square max-w-[640px] mx-auto">
              {/* Quadrant tints */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-lg overflow-hidden">
                {/* top-left = Underrated (Self<70, Team>70) */}
                <div style={{ background: quadrants[1].bg }} className="border-r border-b border-border/60" />
                {/* top-right = Champions */}
                <div style={{ background: quadrants[0].bg }} className="border-b border-border/60" />
                {/* bottom-left = At Risk */}
                <div style={{ background: quadrants[3].bg }} className="border-r border-border/60" />
                {/* bottom-right = Blind Spots */}
                <div style={{ background: quadrants[2].bg }} />
              </div>

              {/* Quadrant labels */}
              <div className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider text-[#2563EB]/70">Underrated</div>
              <div className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wider text-[#16A34A]/70">Champions</div>
              <div className="absolute bottom-2 left-2 text-[10px] font-semibold uppercase tracking-wider text-[#C8102E]/70">At Risk</div>
              <div className="absolute bottom-2 right-2 text-[10px] font-semibold uppercase tracking-wider text-[#D97706]/80">Blind Spots</div>

              {/* Outer border */}
              <div className="absolute inset-0 rounded-lg border border-border pointer-events-none" />

              {/* Industry benchmark crosshair (dashed) */}
              <div className="absolute top-0 bottom-0 border-l border-dashed border-foreground/40 pointer-events-none" style={{ left: "69%" }} />
              <div className="absolute left-0 right-0 border-t border-dashed border-foreground/40 pointer-events-none" style={{ top: "31%" }} />

              {/* Axis ticks */}
              {[0, 25, 50, 75, 100].map((t) => (
                <div key={`yt-${t}`} className="absolute -left-7 text-[10px] text-muted-foreground" style={{ top: `calc(${100 - t}% - 6px)` }}>
                  {t}
                </div>
              ))}
              {[0, 25, 50, 75, 100].map((t) => (
                <div key={`xt-${t}`} className="absolute -bottom-5 text-[10px] text-muted-foreground" style={{ left: `calc(${t}% - 6px)` }}>
                  {t}
                </div>
              ))}

              {/* Dots */}
              {managers.map((m, i) => {
                const s = scores[m.id];
                if (!s) return null;
                const c = dotColor[m.risk];
                const up = m.delta > 0;
                const isHover = hover === m.id;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.85 }}
                    transition={{
                      delay: Math.min(i * 0.005, 0.6),
                      duration: 0.25,
                    }}
                    style={{ left: toX(s.self), top: toY(s.team) }}
                    className="absolute"
                  >
                    <button
                      onMouseEnter={() => setHover(m.id)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(m.id)}
                      onBlur={() => setHover(null)}
                      className="relative -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-[8px] font-semibold text-white transition-transform hover:scale-150 hover:z-10 focus:outline-none"
                      style={{
                        width: 14,
                        height: 14,
                        background: c.bg,
                        boxShadow: `0 0 0 2px ${c.ring}`,
                      }}
                      aria-label={`${m.name}, self ${s.self}, team ${s.team}`}
                    >
                      {""}

                      {isHover && (
                        <div
                          className="absolute z-20 left-1/2 -translate-x-1/2 -top-2 -translate-y-full w-[180px] bg-card border border-border rounded-lg shadow-lg p-3 text-left pointer-events-none"
                        >
                          <div className="text-[13px] font-semibold leading-tight">{m.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">Team of {m.teamSize}</div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">CDI</span>
                            <span className="text-[13px] font-semibold">{m.score}/100</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Trend</span>
                            <span className={`flex items-center gap-1 text-[12px] font-medium ${up ? "text-success" : "text-danger"}`}>
                              {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                              {up ? "+" : ""}{m.delta} pts
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Self {s.self} · Team {s.team}</span>
                          </div>
                        </div>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* X axis label */}
            <div className="text-center mt-7 text-[11px] text-muted-foreground tracking-wide">
              Manager Self score →
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-2">
        {quadrants.map((q) => (
          <div key={q.key} className={`px-3 py-1.5 rounded-pill text-[12px] font-medium ${q.pill}`}>
            <span className="font-semibold">{q.label}</span>
            <span className="opacity-70"> · {q.desc}</span>
          </div>
        ))}
      </div>

      {/* Insight callout */}
      <div className="mt-5 mb-10 bg-card border-l-2 border-primary border-y border-r border-border rounded-lg p-4 shadow-card">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Insight</div>
        <p className="text-[14px] leading-relaxed mt-1.5 text-foreground/90">
          3 of 6 managers score significantly higher on self-assessment than team perception —
          indicating blind spots in self-awareness. Consider structured 360 feedback conversations.
        </p>
      </div>
    </PageShell>
  );
}
