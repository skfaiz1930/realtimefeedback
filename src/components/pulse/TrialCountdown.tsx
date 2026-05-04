import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const KEY = "pulse:trial-end";

function getEnd(): number {
  const cached = localStorage.getItem(KEY);
  if (cached) {
    const n = Number(cached);
    if (!Number.isNaN(n) && n > Date.now()) return n;
  }
  // 14 day trial
  const end = Date.now() + 14 * 24 * 60 * 60 * 1000;
  localStorage.setItem(KEY, String(end));
  return end;
}

export function TrialCountdown() {
  const [end] = useState(getEnd);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, end - now);
  const s = Math.floor(remaining / 1000);
  const days = Math.floor(s / 86400);
  const hrs = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const expired = remaining === 0;

  return (
    <div
      className="mb-5 rounded-lg flex items-center justify-between gap-3 px-4 py-2.5"
      style={{ background: expired ? "#FEF2F2" : "#FFF8F0", borderLeft: `3px solid ${expired ? "#C8102E" : "#D97706"}` }}
    >
      <div className="flex items-center gap-2 text-[12px] text-foreground/85">
        <Clock size={14} className={expired ? "text-primary" : "text-warning"} />
        <span className="font-semibold">{expired ? "Free trial expired" : "Free trial ends in"}</span>
      </div>
      {!expired && (
        <div className="flex items-center gap-1.5">
          {[
            { v: days, l: "d" },
            { v: hrs, l: "h" },
            { v: mins, l: "m" },
            { v: secs, l: "s" },
          ].map((u) => (
            <div key={u.l} className="flex items-baseline gap-0.5 px-2 py-1 rounded-md bg-card border border-border">
              <span className="text-[14px] font-bold tabular-nums text-foreground">{String(u.v).padStart(2, "0")}</span>
              <span className="text-[10px] text-muted-foreground">{u.l}</span>
            </div>
          ))}
        </div>
      )}
      <button className="h-7 px-3 rounded-pill bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-95">
        Upgrade
      </button>
    </div>
  );
}
