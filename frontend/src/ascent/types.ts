export type TabId =
  | "deck"
  | "trail"
  | "summits"
  | "terrain"
  | "radar"
  | "notes"
  | "assistant";

export interface Task {
  id: string;
  name: string;
  category: string;
  done: boolean;
  status: "done" | "open" | "late";
  statusLabel: string;
}

export interface DayLog {
  day: string;
  tasks: Task[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  progressPct: number;
  sparkline: number[]; // relative bar heights, 0-100
}

export interface Weakness {
  id: string;
  title: string;
  frequencyLabel: string;
  status: "needs-attention" | "in-progress" | "on-track";
  statusLabel: string;
  accentVar: "--pink" | "--purple" | "--blue";
  pattern: string;
}

export interface HeatCell {
  level: 0 | 1 | 2 | 3;
}

export interface HeatRow {
  label: string;
  cells: HeatCell[]; // Mon -> Sun
}

export interface TrendSeries {
  name: string;
  color: string;
  data: number[];
}

export interface FocusNode {
  label: string;
  value: number;
  color: string;
  angleDeg: number;
}

export interface Recommendation {
  id: string;
  rank: 1 | 2 | 3;
  title: string;
  description: string;
  why: string;
}

export interface ChatMessage {
  id: string;
  who: "ai" | "user";
  html: string;
}
