"use client";

import { useEffect, useState } from "react";

/* ---------- Types & sample data (swap for ../../ascent/data + types) ---------- */

type ViewMode = "weekly" | "daily";

export interface WeeklyGoal {
  id: string;
  title: string;
  color: string;
  /** Mon → Sun. true = worked on that day. */
  days: boolean[];
}

const SAMPLE_GOALS: WeeklyGoal[] = [
  { id: "g1", title: "Ship portfolio site", color: "#6B32E0", days: [true, true, false, false, false, false, false] },
  { id: "g2", title: "Run a 5K", color: "#0879AD", days: [true, false, true, false, false, false, false] },
  { id: "g3", title: "Read 20 pages", color: "#C22B76", days: [true, true, true, false, false, false, false] },
  { id: "g4", title: "Practice Spanish", color: "#B8741A", days: [false, true, true, false, false, false, false] },
  { id: "g5", title: "Save $500", color: "#2E8B6A", days: [true, false, false, false, false, false, false] },
];

const DAY_LETTERS = ["M", "T", "W", "R", "F", "S", "S"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------- Week helpers ---------- */

interface Week {
  todayIdx: number; // 0 = Monday
  dates: number[]; // day-of-month for Mon..Sun
}

function getWeek(): Week {
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - todayIdx);
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });
  return { todayIdx, dates };
}

/* ---------- Ring ---------- */

const CX = 80;
const RING_R = 50;
const LABEL_R = 69;
// pathLength={70} => each of the 7 segments is 10 units: 8.4 drawn + 1.6 gap
const SEG_ON = "8.4 1.6";
const SEG_OFF = "0 10";

function labelPos(i: number) {
  const angle = ((-90 + (i + 0.5) * (360 / 7)) * Math.PI) / 180;
  return { x: CX + LABEL_R * Math.cos(angle), y: CX + LABEL_R * Math.sin(angle) };
}

interface GoalRingProps {
  goal: WeeklyGoal;
  mode: ViewMode;
  dayIdx: number;
  todayIdx: number;
}

function GoalRing({ goal, mode, dayIdx, todayIdx }: GoalRingProps) {
  const count = goal.days.filter(Boolean).length;
  const common = {
    cx: CX,
    cy: CX,
    r: RING_R,
    fill: "none",
    strokeWidth: 12,
    transform: `rotate(-90 ${CX} ${CX})`,
  };

  return (
    <div className="asc-alt-ring">
      <svg viewBox="0 0 160 160" aria-hidden="true">
        {mode === "weekly" ? (
          <>
            <circle {...common} stroke="var(--border, #E5E1F1)" pathLength={70} strokeDasharray={SEG_ON} />
            <circle
              {...common}
              stroke={goal.color}
              pathLength={70}
              strokeDasharray={goal.days.map((d) => (d ? SEG_ON : SEG_OFF)).join(" ")}
            />
            {DAY_LETTERS.map((letter, i) => {
              const { x, y } = labelPos(i);
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`asc-alt-letter${i === todayIdx ? " today" : ""}`}
                >
                  {letter}
                </text>
              );
            })}
          </>
        ) : (
          <circle
            {...common}
            stroke={goal.days[dayIdx] ? goal.color : "var(--border, #E5E1F1)"}
          />
        )}
      </svg>
      <div className="asc-alt-ring-center" style={{ color: goal.color }}>
        {count}
        <small>of 7 days</small>
      </div>
    </div>
  );
}

/* ---------- View ---------- */

interface AltitudeViewProps {
  initialGoals?: WeeklyGoal[]; // 0–5 goals
  onToggleDay?: (goalId: string, dayIdx: number, worked: boolean) => void;
}

export default function AltitudeView({ initialGoals = SAMPLE_GOALS, onToggleDay }: AltitudeViewProps) {
  const [goals, setGoals] = useState<WeeklyGoal[]>(initialGoals.slice(0, 5));
  const [mode, setMode] = useState<ViewMode>("weekly");
  const [week, setWeek] = useState<Week | null>(null);
  const [dayIdx, setDayIdx] = useState(0);

  // Computed after mount so server and client dates can't cause a hydration mismatch.
  useEffect(() => {
    const w = getWeek();
    setWeek(w);
    setDayIdx(w.todayIdx);
  }, []);

  const todayIdx = week?.todayIdx ?? -1;

  const toggle = (goal: WeeklyGoal) => {
    if (dayIdx > todayIdx) return; // can't log the future
    const next = !goal.days[dayIdx];
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id ? { ...g, days: g.days.map((d, i) => (i === dayIdx ? next : d)) } : g
      )
    );
    onToggleDay?.(goal.id, dayIdx, next);
  };

  const totalDone = goals.reduce((s, g) => s + g.days.filter(Boolean).length, 0);
  const workedOnDay = goals.filter((g) => g.days[dayIdx]).length;

  return (
    <div className="asc-view">
      <div className="asc-section-head asc-alt-head">
        <h2>Active goals</h2>
        <div className="asc-alt-toggle" role="tablist" aria-label="Goal view">
          {(["weekly", "daily"] as ViewMode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              className={`asc-alt-opt ${m}`}
              onClick={() => setMode(m)}
            >
              {m === "weekly" ? "Weekly view" : "Daily view"}
            </button>
          ))}
        </div>
      </div>

      {mode === "daily" && (
        <div className="asc-alt-days" role="group" aria-label="Select a day">
          {DAY_NAMES.map((name, i) => {
            const future = i > todayIdx;
            return (
              <button
                key={name}
                className={`asc-alt-day${dayIdx === i ? " on" : ""}${i === todayIdx ? " today" : ""}`}
                aria-pressed={dayIdx === i}
                disabled={future}
                onClick={() => setDayIdx(i)}
              >
                <span>{name}</span>
                <strong>{week ? week.dates[i] : ""}</strong>
              </button>
            );
          })}
        </div>
      )}

      {goals.length === 0 ? (
        <div className="asc-card asc-alt-empty">
          <h3>No goals yet</h3>
          <p>Add up to five goals and log the days you work on them.</p>
        </div>
      ) : (
        <div className="asc-alt-grid">
          {goals.map((goal) => {
            const worked = goal.days[dayIdx];
            const body = (
              <>
                <GoalRing goal={goal} mode={mode} dayIdx={dayIdx} todayIdx={todayIdx} />
                <h3>{goal.title}</h3>
                {mode === "daily" && (
                  <span className={`asc-alt-status${worked ? " done" : ""}`}>
                    {worked ? "Worked on it" : "Not logged"}
                  </span>
                )}
              </>
            );
            return mode === "daily" ? (
              <button
                key={goal.id}
                className="asc-card asc-alt-card asc-alt-card-btn"
                aria-pressed={worked}
                aria-label={`${goal.title}: ${worked ? "worked on" : "not logged"} ${DAY_NAMES[dayIdx]}`}
                disabled={dayIdx > todayIdx}
                onClick={() => toggle(goal)}
              >
                {body}
              </button>
            ) : (
              <div key={goal.id} className="asc-card asc-alt-card">
                {body}
              </div>
            );
          })}

          <div className="asc-alt-summary">
            <span>{mode === "weekly" ? "Weekly altitude" : `${DAY_NAMES[dayIdx]} altitude`}</span>
            <strong>
              {mode === "weekly" ? totalDone : workedOnDay}
              <em> / {mode === "weekly" ? goals.length * 7 : goals.length}</em>
            </strong>
            <p>{mode === "weekly" ? "Goal-days logged this week." : "Goals worked on this day."}</p>
          </div>
        </div>
      )}
    </div>
  );
}