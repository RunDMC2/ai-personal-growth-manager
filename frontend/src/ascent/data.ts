import {
  DayLog,
  Goal,
  Weakness,
  HeatRow,
  TrendSeries,
  FocusNode,
  Recommendation,
} from "./types";

export const dayLogs: DayLog[] = [
  {
    day: "Monday",
    tasks: [
      { id: "t1", name: "Draft Q3 self-review notes", category: "Career", done: true, status: "done", statusLabel: "done" },
      { id: "t2", name: "30-min mobility routine", category: "Health", done: true, status: "done", statusLabel: "done" },
    ],
  },
  {
    day: "Wednesday",
    tasks: [
      { id: "t3", name: "Reach out to two dormant contacts", category: "Network · due Wed", done: false, status: "late", statusLabel: "2 days late" },
      { id: "t4", name: "Read one chapter, negotiation book", category: "Learning", done: true, status: "done", statusLabel: "done" },
    ],
  },
  {
    day: "Thursday",
    tasks: [
      { id: "t5", name: "Practice interrupting the inner critic", category: "Mindset", done: true, status: "done", statusLabel: "done" },
    ],
  },
  {
    day: "Friday",
    tasks: [
      { id: "t6", name: "Plan next month's budget review", category: "Finance · due Fri", done: false, status: "open", statusLabel: "open" },
    ],
  },
  {
    day: "Sunday",
    tasks: [
      { id: "t7", name: "Write Sunday reflection entry", category: "Reflection · due Sun", done: false, status: "open", statusLabel: "open" },
    ],
  },
];

export const goals: Goal[] = [
  {
    id: "g1",
    title: "Ship the side project MVP",
    description:
      "Logged progress 5 of the last 7 sessions. Pace has picked up since you broke it into weekly milestones two weeks ago — your strongest goal this month.",
    progressPct: 68,
    sparkline: [15, 25, 45, 20, 55, 50, 30],
  },
  {
    id: "g2",
    title: "Run a sub-25-minute 5K",
    description: "Steady, unglamorous progress — three runs logged this week, all within 40 seconds of target pace.",
    progressPct: 54,
    sparkline: [25, 35, 20, 40, 15, 45, 25],
  },
  {
    id: "g3",
    title: "Read 20 books this year",
    description: "On pace for 22 — the negotiation book is holding your attention.",
    progressPct: 83,
    sparkline: [40, 20, 50, 25, 35, 15, 30],
  },
  {
    id: "g4",
    title: "Build a 3-month emergency fund",
    description: "Stalled two weeks running. The budget review task keeps sliding — flagged in Debrief.",
    progressPct: 31,
    sparkline: [35, 25, 15, 12, 12, 12, 12],
  },
];

export const weaknesses: Weakness[] = [
  {
    id: "w1",
    title: "Avoiding hard conversations",
    frequencyLabel: "Addressed 2 of 7 days · flagged since Week 29",
    status: "needs-attention",
    statusLabel: "needs attention",
    accentVar: "--pink",
    pattern:
      'Third straight week under 3 check-ins. Clusters with the same "Network" tasks that keep sliding in your Flight Log — worth treating as one problem, not two.',
  },
  {
    id: "w2",
    title: "Perfectionism on low-stakes work",
    frequencyLabel: "Addressed 4 of 7 days · improving",
    status: "in-progress",
    statusLabel: "in progress",
    accentVar: "--purple",
    pattern: "Up from 2 check-ins last week. The mobility-routine habit seems to be the anchor.",
  },
  {
    id: "w3",
    title: "Interrupting the inner critic",
    frequencyLabel: "6 of 7 days",
    status: "on-track",
    statusLabel: "on track",
    accentVar: "--blue",
    pattern: "Your most consistent line item in six weeks.",
  },
];

export const heatRows: HeatRow[] = [
  { label: "Tasks", cells: [3, 1, 3, 2, 3, 2, 0].map((level) => ({ level: level as 0 | 1 | 2 | 3 })) },
  { label: "Goals", cells: [2, 0, 3, 3, 1, 2, 1].map((level) => ({ level: level as 0 | 1 | 2 | 3 })) },
  { label: "Weaknesses", cells: [1, 0, 2, 1, 2, 0, 1].map((level) => ({ level: level as 0 | 1 | 2 | 3 })) },
];

export const trendWeeks = ["W27", "W28", "W29", "W30", "W31", "W32", "W33", "W34"];

export const trendSeries: TrendSeries[] = [
  { name: "Tasks", color: "#0EA5E9", data: [58, 64, 60, 70, 68, 74, 71, 79] },
  { name: "Goals", color: "#7C4DFF", data: [41, 45, 52, 50, 58, 63, 66, 68] },
  { name: "Weaknesses", color: "#EC4899", data: [55, 52, 49, 53, 50, 51, 48, 52] },
];

export const focusNodes: FocusNode[] = [
  { label: "Tasks", value: 18, color: "#0EA5E9", angleDeg: -90 },
  { label: "Goals", value: 13, color: "#7C4DFF", angleDeg: 30 },
  { label: "Weaknesses", value: 5, color: "#EC4899", angleDeg: 150 },
];

export const recommendations: Recommendation[] = [
  {
    id: "r1",
    rank: 1,
    title: "Move one hard conversation to Monday",
    description:
      "Pick the smaller of your two dormant-contact outreach tasks and do it before Tuesday's calendar fills in. Tuesday is quiet in 3 of your last 4 weeks — this is the fix most likely to close that gap.",
    why: "WHY: highest-impact — breaks a 6-week pattern",
  },
  {
    id: "r2",
    rank: 2,
    title: "Pair the budget review with an existing habit",
    description:
      "It's stalled for two weeks straight. Attach it to Thursday's mindset check-in — your most reliable slot — instead of leaving it to float on its own.",
    why: "WHY: unblocks your lowest-progress goal",
  },
  {
    id: "r3",
    rank: 3,
    title: "Study your own strongest habit",
    description:
      '"Interrupting the inner critic" has held at 6/7 for six weeks running. Write down what made that one stick — it\'s a template you can copy for the other two.',
    why: "WHY: lowest effort, compounding payoff",
  },
];

export const cannedAnswers: Record<string, string> = {
  "why did tuesday drop?": `Tuesday's engagement has dropped in <span class="asc-stat-chip">3 of your last 4 weeks</span>. It's the day your calendar tends to fill with other people's priorities before you've claimed time for your own — it also correlates with your lowest weakness check-in rate. Try locking a recurring 20-minute block Tuesday mornings.`,
  "compare this week's goals to last month": `Goal engagement is up <span class="asc-stat-chip">+22 pts</span> since Week 27, mostly driven by the side-project MVP goal, which now leads all four in momentum. Your emergency-fund goal has stalled for two weeks and is dragging the average down.`,
  "what's my longest streak ever?": `Your longest streak on record is <span class="asc-stat-chip">19 days</span>, set back in Week 14. You're currently at <span class="asc-stat-chip">12 days</span> — nine more consistent days would set a new personal best.`,
};

export const chatSuggestions = [
  "Why did Tuesday drop?",
  "Compare this week's goals to last month",
  "What's my longest streak ever?",
];
