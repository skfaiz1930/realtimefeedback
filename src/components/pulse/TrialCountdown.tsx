import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const KEY = "pulse:trial-end";

function getEnd(): number {
  const cached = localStorage.getItem(KEY);
  if (cached) {
    const n = Number(cached);
    if (!Number.isNaN(n) && n > Date.now()) return n;
  }
  const end = Date.now() + 14 * 24 * 60 * 60 * 1000;
  localStorage.setItem(KEY, String(end));
  return end;
}

function useCountdown() {
  const [end] = useState(getEnd);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = Math.max(0, end - now);
  const s = Math.floor(remaining / 1000);
  return {
    expired: remaining === 0,
    days: Math.floor(s / 86400),
    hrs: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

/** Kept for backwards compatibility — renders nothing now (moved to sidebar). */
export function TrialCountdown() {
  return null;
}

/** Compact countdown for the sidebar. */
export function SidebarTrialCountdown({ collapsed = false }: { collapsed?: boolean }) {
  const { expired, days, hrs, mins, secs } = useCountdown();

  if (collapsed) {
    return (
      <div
        className="mx-auto flex flex-col items-center justify-center w-10 h-10 rounded-md"
        style={{ background: expired ? "#FEF2F2" : "#FFF8F0" }}
        title={expired ? "Trial expired" : `${days}d ${hrs}h left`}
      >
        <Clock size={12} className={expired ? "text-primary" : "text-warning"} />
        <span className="text-[10px] font-bold tabular-nums leading-none mt-0.5">
          {expired ? "0" : days}
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-md px-3 py-2"
      style={{ background: expired ? "#FEF2F2" : "#FFF8F0", borderLeft: `3px solid ${expired ? "#C8102E" : "#D97706"}` }}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground/85 mb-1.5">
        <Clock size={11} className={expired ? "text-primary" : "text-warning"} />
        <span>{expired ? "Trial expired" : "Free trial ends in"}</span>
      </div>
      {!expired && (
        <div className="grid grid-cols-4 gap-1 mb-2">
          {[
            { v: days, l: "d" },
            { v: hrs, l: "h" },
            { v: mins, l: "m" },
            { v: secs, l: "s" },
          ].map((u) => (
            <div key={u.l} className="flex flex-col items-center px-0.5 py-1 rounded bg-card border border-border">
              <span className="text-[11px] font-bold tabular-nums leading-none text-foreground">
                {String(u.v).padStart(2, "0")}
              </span>
              <span className="text-[8px] text-muted-foreground mt-0.5">{u.l}</span>
            </div>
          ))}
        </div>
      )}
      <button className="w-full h-6 rounded-pill bg-primary text-primary-foreground text-[10px] font-semibold hover:opacity-95">
        Upgrade
      </button>
    </div>
  );
}
