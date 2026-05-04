import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PageShell } from "@/components/pulse/PageShell";

type Sentiment = "Mostly Negative" | "Mixed" | "Mostly Positive";
type Dim = "All" | "Connect" | "Develop" | "Inspire";

interface Quote { text: string; meta: string; sent: "pos" | "neu" | "neg"; }
interface Theme {
  name: string; count: number; sentiment: Sentiment;
  pos: number; neu: number; neg: number;
  quotes: Quote[];
}

const themes: Theme[] = [
  {
    name: "Growth & Development", count: 67, sentiment: "Mostly Negative",
    pos: 18, neu: 22, neg: 60,
    quotes: [
      { text: "I don't feel like my manager invests in my growth at all.", meta: "Team Member, Product, 0–1 yr", sent: "neg" },
      { text: "We talked about a learning plan in January but nothing happened.", meta: "Team Member, Engineering, 1–3 yr", sent: "neg" },
      { text: "I'd love stretch assignments but they never come my way.", meta: "IC, Sales, 1–3 yr", sent: "neg" },
      { text: "My manager has helped me get into a leadership program — grateful.", meta: "Team Member, HR, 3–5 yr", sent: "pos" },
    ],
  },
  {
    name: "Manager Accessibility", count: 54, sentiment: "Mixed",
    pos: 38, neu: 32, neg: 30,
    quotes: [
      { text: "She's very busy but always makes time when I really need her.", meta: "Team Member, Sales, 3–5 yr", sent: "pos" },
      { text: "Hard to get 1:1 time. Meetings always get rescheduled.", meta: "Individual Contributor, Ops, 1–3 yr", sent: "neg" },
      { text: "Async updates work fine for us most weeks.", meta: "Peer, Engineering, 5+ yr", sent: "neu" },
    ],
  },
  {
    name: "Recognition Gap", count: 48, sentiment: "Mostly Negative",
    pos: 22, neu: 28, neg: 50,
    quotes: [
      { text: "I completed the entire migration alone and it wasn't mentioned once.", meta: "Team Member, Engineering, 2–3 yr", sent: "neg" },
      { text: "Would be nice to just hear 'good job' once in a while.", meta: "Individual Contributor, Sales, 1 yr", sent: "neg" },
      { text: "Public shout-outs in team meetings have improved.", meta: "Team Member, Product, 3–5 yr", sent: "pos" },
    ],
  },
  {
    name: "Team Culture", count: 52, sentiment: "Mostly Positive",
    pos: 65, neu: 22, neg: 13,
    quotes: [
      { text: "Best team I've been on. My manager sets the tone.", meta: "Team Member, Product, 3–5 yr", sent: "pos" },
      { text: "There's a real sense of trust and safety in our team.", meta: "Peer, HR, 5+ yr", sent: "pos" },
      { text: "Could use more cross-team collaboration.", meta: "IC, Engineering, 1–3 yr", sent: "neu" },
    ],
  },
  {
    name: "Workload & Burnout", count: 43, sentiment: "Mostly Negative",
    pos: 14, neu: 26, neg: 60,
    quotes: [
      { text: "Deadlines are unrealistic and my manager doesn't push back with leadership.", meta: "Team Member, Engineering, 2–3 yr", sent: "neg" },
      { text: "I've raised this three times. Still no change.", meta: "IC, Operations, 1–3 yr", sent: "neg" },
      { text: "Workload manageable this quarter — sustainable.", meta: "Team Member, Finance, 3–5 yr", sent: "pos" },
    ],
  },
  {
    name: "Career Clarity", count: 48, sentiment: "Mixed",
    pos: 35, neu: 35, neg: 30,
    quotes: [
      { text: "I genuinely don't know what promotion looks like for me.", meta: "Team Member, Finance, 3–5 yr", sent: "neg" },
      { text: "My manager is great but the path forward isn't clear.", meta: "Team Member, Product, 2–3 yr", sent: "neu" },
      { text: "Career conversation last cycle was actually useful.", meta: "Team Member, HR, 1–3 yr", sent: "pos" },
    ],
  },
];

const sentMeta = {
  "Mostly Negative": "bg-primary/10 text-primary",
  "Mixed":           "bg-warning/10 text-warning",
  "Mostly Positive": "bg-success/10 text-success",
} as const;

const dotColor = { pos: "#16A34A", neu: "#9CA3AF", neg: "#DC2626" } as const;

function Donut() {
  const total = 312;
  const segs = [
    { v: 42, color: "#16A34A" },
    { v: 35, color: "#9CA3AF" },
    { v: 23, color: "#DC2626" },
  ];
  const r = 50, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative w-[160px] h-[160px] mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F0F0EE" strokeWidth="14" />
        {segs.map((s, i) => {
          const len = (s.v / 100) * c;
          const el = (
            <motion.circle
              key={i}
              cx="60" cy="60" r={r} fill="none"
              stroke={s.color} strokeWidth="14"
              strokeDasharray={`${len} ${c}`}
              strokeDashoffset={-offset}
              initial={{ strokeDasharray: `0 ${c}` }}
              animate={{ strokeDasharray: `${len} ${c}` }}
              transition={{ duration: 0.6, delay: 0.1 * i }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[18px] font-semibold leading-none">{total}</div>
        <div className="text-[11px] text-muted-foreground mt-1">comments</div>
      </div>
    </div>
  );
}

function ThemeCard({ t }: { t: Theme }) {
  const [expanded, setExpanded] = useState(false);
  

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-[14px] shadow-card p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-[15px] font-medium">{t.name}</h4>
          <span className="text-[11px] px-2 py-0.5 rounded-pill bg-muted text-muted-foreground">{t.count} comments</span>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-pill font-medium shrink-0 ${sentMeta[t.sentiment]}`}>{t.sentiment}</span>
      </div>

      <div className="h-1.5 w-full rounded-[3px] overflow-hidden flex mb-4" style={{ background: "#F0F0EE" }}>
        <div style={{ width: `${t.neg}%`, background: "#DC2626" }} />
        <div style={{ width: `${t.neu}%`, background: "#9CA3AF" }} />
        <div style={{ width: `${t.pos}%`, background: "#16A34A" }} />
      </div>

      {/* Always-visible first 2 quotes */}
      <div className="space-y-3">
        {t.quotes.slice(0, 2).map((q, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[24px] leading-none text-muted-foreground/60 font-serif select-none">"</span>
            <div>
              <p className="text-[13px] italic text-foreground/85 leading-relaxed">{q.text}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1 h-1 rounded-full inline-block" style={{ background: dotColor[q.sent] }} />
                {q.meta}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expandable extra quotes — CSS max-height transition */}
      <div
        style={{
          maxHeight: expanded ? 800 : 0,
          overflow: "hidden",
          transition: "max-height 350ms ease-out",
        }}
      >
        <div className="space-y-3 pt-3">
          {t.quotes.slice(2).map((q, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[24px] leading-none text-muted-foreground/60 font-serif select-none">"</span>
              <div>
                <p className="text-[13px] italic text-foreground/85 leading-relaxed">{q.text}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-1 h-1 rounded-full inline-block" style={{ background: dotColor[q.sent] }} />
                  {q.meta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-[12px] text-primary/80 hover:text-primary transition-colors"
        >
          {expanded ? "Show less" : `See all quotes →`}
        </button>
      </div>
    </motion.div>
  );
}

const Comments = () => {
  const [dim, setDim] = useState<Dim>("All");
  const [resp, setResp] = useState("All");

  const dims: Dim[] = ["All", "Connect", "Develop", "Inspire"];
  const respOpts = ["All", "Manager Self", "Team Member", "Peer", "RM"];

  return (
    <PageShell>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Left */}
        <div>
          {/* AI summary */}
          <div
            className="mb-5 rounded-lg flex items-start gap-2.5 px-4 py-3.5"
            style={{ background: "#F5F3FF", borderLeft: "3px solid #7F77DD" }}
          >
            <Sparkles size={16} className="text-[#7F77DD] mt-0.5 shrink-0" />
            <p className="text-[13px] text-foreground/85 leading-relaxed">
              <span className="font-semibold">AI Summary:</span> The most common theme is Growth & Development (67 comments, 60% negative). Employees feel managers are not following through on development conversations. This aligns with the Develop dimension scoring lowest at 61. <span className="font-medium">Recommended:</span> Launch a structured 1:1 development check-in nudge for all managers this cycle.
            </p>
          </div>

          <div className="mb-3">
            <h2 className="text-[16px] font-medium tracking-tight">Top Themes This Cycle</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">AI-clustered from 312 open-text responses. Names removed.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themes.map((t) => <ThemeCard key={t.name} t={t} />)}
          </div>
        </div>

        {/* Right */}
        <aside className="bg-card border border-border rounded-lg shadow-card p-5 self-start lg:sticky lg:top-5">
          <div className="text-[13px] font-medium mb-3">Sentiment Overview</div>
          <Donut />
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2"><span>✅</span>Positive</span>
              <span className="font-medium tabular-nums">131 comments <span className="text-muted-foreground">(42%)</span></span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2"><span>➖</span>Neutral</span>
              <span className="font-medium tabular-nums">109 comments <span className="text-muted-foreground">(35%)</span></span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2"><span>❌</span>Negative</span>
              <span className="font-medium tabular-nums">72 comments <span className="text-muted-foreground">(23%)</span></span>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-md bg-muted/50 text-[11px] text-muted-foreground leading-relaxed">
            <div className="font-semibold text-foreground/80 mb-1">vs Benchmarks</div>
            Industry positive avg: <span className="font-medium text-foreground/80">48%</span> (you: 42%, <span className="text-danger font-medium">-6 pts</span>)<br/>
            Internal 12-mo avg: <span className="font-medium text-foreground/80">39%</span> (you: 42%, <span className="text-success font-medium">+3 pts</span>)
          </div>

          <div className="border-t border-border my-5" />

          <div className="text-[13px] font-medium mb-2">Dimension</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dims.map((d) => (
              <button
                key={d}
                onClick={() => setDim(d)}
                className={`h-7 px-3 rounded-pill text-[11px] font-medium border transition-colors ${
                  dim === d ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                }`}
              >{d}</button>
            ))}
          </div>

          <div className="text-[13px] font-medium mb-2">Respondent</div>
          <div className="flex flex-wrap gap-1.5">
            {respOpts.map((r) => (
              <button
                key={r}
                onClick={() => setResp(r)}
                className={`h-7 px-3 rounded-pill text-[11px] font-medium border transition-colors ${
                  resp === r ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                }`}
              >{r}</button>
            ))}
          </div>
        </aside>
      </div>
    </PageShell>
  );
};

export default Comments;
