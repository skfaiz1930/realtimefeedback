import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Search, Users } from "lucide-react";
import { usePeriod } from "@/lib/periodContext";
import { scoreColor } from "@/lib/scoreColor";
import {
  getDepartmentResponseRates,
  getManagerResponseRates,
  getOrgResponseRate,
} from "@/lib/responseRates";

type Tab = "department" | "manager";
type Filter = "all" | "low" | "high";

function Bar({ value }: { value: number }) {
  const c = scoreColor(value);
  return (
    <div className="relative h-2 rounded-full overflow-hidden flex-1" style={{ background: "#F0F0EE" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.5 }}
        className="h-full rounded-full"
        style={{ background: c.text }}
      />
    </div>
  );
}

function DeltaPill({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-[11px] text-muted-foreground tabular-nums">±0</span>;
  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] tabular-nums ${up ? "text-success" : "text-danger"}`}>
      {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {up ? "+" : ""}{delta}%
    </span>
  );
}

export function ResponseRateBreakdown() {
  const { period } = usePeriod();
  const [tab, setTab] = useState<Tab>("department");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const org = useMemo(() => getOrgResponseRate(period), [period]);
  const departments = useMemo(() => getDepartmentResponseRates(period), [period]);
  const managers = useMemo(() => getManagerResponseRates(period), [period]);

  const filteredManagers = useMemo(() => {
    let list = managers;
    if (filter === "low") list = list.filter((m) => m.rate < 60);
    else if (filter === "high") list = list.filter((m) => m.rate >= 80);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.department.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => a.rate - b.rate);
  }, [managers, filter, query]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-lg p-6 shadow-card mb-8"
    >
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-[16px] font-medium tracking-tight">Response Rate Breakdown</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Participation by department and manager · {period}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Org-wide</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-semibold tabular-nums">{org.rate}%</span>
              <DeltaPill delta={org.delta} />
            </div>
            <div className="text-[11px] text-muted-foreground tabular-nums">{org.responded.toLocaleString()} / {org.invited.toLocaleString()}</div>
          </div>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            {(["department", "manager"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-[12px] font-medium capitalize transition-colors ${tab === t ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "department" ? (
        <div className="divide-y divide-border">
          {departments.map((d, i) => (
            <motion.div
              key={d.department}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="py-3 grid grid-cols-[160px_1fr_auto] items-center gap-4"
            >
              <div>
                <div className="text-[13px] font-medium">{d.department}</div>
                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Users size={10} /> {d.managerCount} mgrs
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bar value={d.rate} />
                <span className="text-[12px] tabular-nums w-10 text-right font-semibold">{d.rate}%</span>
              </div>
              <div className="flex items-center gap-3 min-w-[120px] justify-end">
                <span className="text-[11px] text-muted-foreground tabular-nums">{d.responded}/{d.invited}</span>
                <DeltaPill delta={d.delta} />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search manager or department"
                className="w-full pl-7 pr-3 py-1.5 text-[12px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="inline-flex gap-1">
              {([
                ["all", "All"],
                ["low", "<60%"],
                ["high", "≥80%"],
              ] as Array<[Filter, string]>).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-2.5 py-1 text-[11px] rounded-pill border transition-colors ${filter === k ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground ml-auto">{filteredManagers.length} managers</span>
          </div>
          <div className="max-h-[440px] overflow-y-auto pr-1 -mr-1 divide-y divide-border">
            {filteredManagers.map((m) => (
              <div key={m.id} className="py-2.5 grid grid-cols-[28px_1fr_120px_140px_auto] items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
                  {m.initials}
                </div>
                <div>
                  <div className="text-[12.5px] font-medium leading-tight">{m.name}</div>
                  <div className="text-[10.5px] text-muted-foreground">{m.seniority}</div>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{m.department}</div>
                <div className="flex items-center gap-2">
                  <Bar value={m.rate} />
                  <span className="text-[11.5px] tabular-nums w-8 text-right font-semibold">{m.rate}%</span>
                </div>
                <div className="flex items-center gap-2 min-w-[110px] justify-end">
                  <span className="text-[10.5px] text-muted-foreground tabular-nums">{m.responded}/{m.invited}</span>
                  <DeltaPill delta={m.delta} />
                </div>
              </div>
            ))}
            {filteredManagers.length === 0 && (
              <div className="py-8 text-center text-[12px] text-muted-foreground">No managers match your filters.</div>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}
