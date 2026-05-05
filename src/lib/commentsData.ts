// Rich tagged comment pool. Deterministic per cycle.
import { POOL } from "@/lib/managerPool";

export type Sent = "pos" | "neu" | "neg";
export type Dim = "Connect" | "Develop" | "Inspire";
export type Respondent = "Manager Self" | "Team Member" | "Peer" | "RM";
export type AgeGroup = "18-24" | "25-34" | "35-44" | "45-54" | "55+";

export interface Comment {
  id: string;
  text: string;
  sent: Sent;
  dim: Dim;
  theme: string;
  department: string;
  managerId: string;
  managerName: string;
  ageGroup: AgeGroup;
  tenure: string;
  respondent: Respondent;
}

export const THEMES = [
  "Growth & Development",
  "Manager Accessibility",
  "Recognition Gap",
  "Team Culture",
  "Workload & Burnout",
  "Career Clarity",
] as const;

const THEME_DIM: Record<string, Dim> = {
  "Growth & Development": "Develop",
  "Manager Accessibility": "Connect",
  "Recognition Gap": "Connect",
  "Team Culture": "Inspire",
  "Workload & Burnout": "Inspire",
  "Career Clarity": "Develop",
};

const TEMPLATES: Record<string, Array<{ text: string; sent: Sent }>> = {
  "Growth & Development": [
    { text: "I don't feel like my manager invests in my growth at all.", sent: "neg" },
    { text: "We talked about a learning plan months ago but nothing happened.", sent: "neg" },
    { text: "I'd love stretch assignments but they never come my way.", sent: "neg" },
    { text: "My manager has helped me get into a leadership program — grateful.", sent: "pos" },
    { text: "Quarterly skill reviews have been useful for my growth.", sent: "pos" },
    { text: "Development goals are tracked but rarely revisited.", sent: "neu" },
    { text: "I had to ask three times before I got a development budget approved.", sent: "neg" },
    { text: "Mentor pairing this cycle has accelerated my learning.", sent: "pos" },
    { text: "There's no formal upskilling path for senior ICs.", sent: "neg" },
    { text: "Manager shared great course recommendations — appreciated.", sent: "pos" },
  ],
  "Manager Accessibility": [
    { text: "She's very busy but always makes time when I really need her.", sent: "pos" },
    { text: "Hard to get 1:1 time. Meetings always get rescheduled.", sent: "neg" },
    { text: "Async updates work fine for us most weeks.", sent: "neu" },
    { text: "My manager responds within hours — feels supported.", sent: "pos" },
    { text: "I haven't had a real 1:1 in over a month.", sent: "neg" },
    { text: "Office hours format works well for quick questions.", sent: "neu" },
    { text: "He's in too many meetings to actually coach the team.", sent: "neg" },
    { text: "Door is always open, even on tough days.", sent: "pos" },
  ],
  "Recognition Gap": [
    { text: "I completed the entire migration alone and it wasn't mentioned once.", sent: "neg" },
    { text: "Would be nice to just hear 'good job' once in a while.", sent: "neg" },
    { text: "Public shout-outs in team meetings have improved.", sent: "pos" },
    { text: "Recognition feels selective — same names every cycle.", sent: "neg" },
    { text: "Manager nominated me for an internal award — meant a lot.", sent: "pos" },
    { text: "Weekly wins channel has lifted morale.", sent: "pos" },
    { text: "Effort goes unnoticed when results are delayed.", sent: "neg" },
  ],
  "Team Culture": [
    { text: "Best team I've been on. My manager sets the tone.", sent: "pos" },
    { text: "There's a real sense of trust and safety in our team.", sent: "pos" },
    { text: "Could use more cross-team collaboration.", sent: "neu" },
    { text: "Some cliques have formed; not everyone feels included.", sent: "neg" },
    { text: "Team rituals — Friday demos — keep us connected.", sent: "pos" },
    { text: "Psychological safety has improved since last cycle.", sent: "pos" },
    { text: "Disagreements get personal sometimes.", sent: "neg" },
  ],
  "Workload & Burnout": [
    { text: "Deadlines are unrealistic and my manager doesn't push back.", sent: "neg" },
    { text: "I've raised this three times. Still no change.", sent: "neg" },
    { text: "Workload manageable this quarter — sustainable.", sent: "pos" },
    { text: "On-call rotation is brutal; we need more headcount.", sent: "neg" },
    { text: "Manager protected me from a last-minute scope change.", sent: "pos" },
    { text: "Always-on culture is draining; weekends bleed into work.", sent: "neg" },
    { text: "Capacity planning got better after the Q1 retro.", sent: "pos" },
  ],
  "Career Clarity": [
    { text: "I genuinely don't know what promotion looks like for me.", sent: "neg" },
    { text: "My manager is great but the path forward isn't clear.", sent: "neu" },
    { text: "Career conversation last cycle was actually useful.", sent: "pos" },
    { text: "Levels and expectations aren't documented anywhere.", sent: "neg" },
    { text: "Got a clear 12-month roadmap — feels motivating.", sent: "pos" },
    { text: "Lateral moves are talked about but never actually happen.", sent: "neg" },
  ],
};

const AGES: AgeGroup[] = ["18-24", "25-34", "35-44", "45-54", "55+"];
const TENURES = ["0–1 yr", "1–3 yr", "3–5 yr", "5+ yr"];
const RESPONDENTS: Respondent[] = ["Team Member", "Peer", "RM", "Manager Self"];

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

let cache: { cycle: string; list: Comment[] } | null = null;

export function getComments(cycle: string): Comment[] {
  if (cache && cache.cycle === cycle) return cache.list;
  const r = rng(hash("comments::" + cycle));
  const list: Comment[] = [];
  let i = 0;
  for (const theme of THEMES) {
    const tpl = TEMPLATES[theme];
    // Generate ~50-80 comments per theme
    const n = 50 + Math.floor(r() * 30);
    for (let k = 0; k < n; k++) {
      const t = tpl[Math.floor(r() * tpl.length)];
      const m = POOL[Math.floor(r() * POOL.length)];
      list.push({
        id: `c${i++}`,
        text: t.text,
        sent: t.sent,
        dim: THEME_DIM[theme],
        theme,
        department: m.department,
        managerId: m.id,
        managerName: m.name,
        ageGroup: AGES[Math.floor(r() * AGES.length)],
        tenure: TENURES[Math.floor(r() * TENURES.length)],
        respondent: RESPONDENTS[Math.floor(r() * RESPONDENTS.length)],
      });
    }
  }
  cache = { cycle, list };
  return list;
}
