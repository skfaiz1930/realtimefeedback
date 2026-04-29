export type RiskLevel = "at-risk" | "watch" | "healthy";

export interface Manager {
  id: string;
  name: string;
  initials: string;
  teamSize: number;
  score: number;
  delta: number;
  risk: RiskLevel;
}

export const managers: Manager[] = [
  { id: "1", name: "Rahul Mehta",     initials: "RM", teamSize: 8,  score: 54, delta: -12, risk: "at-risk" },
  { id: "2", name: "Sneha Kulkarni",  initials: "SK", teamSize: 6,  score: 58, delta: -8,  risk: "at-risk" },
  { id: "3", name: "Arjun Nair",      initials: "AN", teamSize: 10, score: 63, delta: -4,  risk: "watch" },
  { id: "4", name: "Deepa Sharma",    initials: "DS", teamSize: 7,  score: 67, delta: 2,   risk: "watch" },
  { id: "5", name: "Vikram Rao",      initials: "VR", teamSize: 9,  score: 79, delta: 5,   risk: "healthy" },
  { id: "6", name: "Ananya Iyer",     initials: "AI", teamSize: 11, score: 83, delta: 7,   risk: "healthy" },
];

export interface Dimension {
  key: "connect" | "develop" | "inspire";
  label: string;
  sub: string;
  score: number;
  prev: number;
  color: string; // hsl var class fragment
  questions: string[];
}

export const dimensions: Dimension[] = [
  {
    key: "connect",
    label: "Connect",
    sub: "Building trust and relationships",
    score: 74, prev: 71,
    color: "hsl(var(--primary))",
    questions: [
      "My manager genuinely listens to me.",
      "My manager shows care for me as a person.",
      "I trust my manager to do the right thing.",
    ],
  },
  {
    key: "develop",
    label: "Develop",
    sub: "Growing people's skills",
    score: 61, prev: 64,
    color: "hsl(var(--warning))",
    questions: [
      "My manager helps me grow professionally.",
      "I receive useful, regular feedback.",
      "My manager knows my career aspirations.",
    ],
  },
  {
    key: "inspire",
    label: "Inspire",
    sub: "Motivating teams toward purpose",
    score: 78, prev: 76,
    color: "hsl(var(--success))",
    questions: [
      "My manager connects our work to a larger purpose.",
      "My manager makes me feel my work matters.",
      "I feel motivated by my manager's vision.",
    ],
  },
];

export const respondentTypes = [
  { label: "Manager Self",      value: 91 },
  { label: "Team Member",       value: 74 },
  { label: "Peer",              value: 68 },
  { label: "Reporting Manager", value: 82 },
];

export const recommendedActions = [
  { id: "a1", icon: "🎯", text: "Schedule a 1:1 with Rahul Mehta's team", accent: "danger" as const },
  { id: "a2", icon: "📢", text: "Run a Develop-focused nudge this week", accent: "warning" as const },
  { id: "a3", icon: "📅", text: "Review response rate for Sales department", accent: "success" as const },
];

export const aiSummary =
  "Your org scored 72/100 this cycle — up 3 points from March. The biggest opportunity is in the Develop dimension, which dropped to 61. 6 manager teams are showing early flight risk signals. Rahul Mehta's team had the sharpest decline (-12 pts) and should be prioritised this week.";
