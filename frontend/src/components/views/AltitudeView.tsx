"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

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

/* ---------- Animation helpers ---------- */

/** Counts a number up (or down) to `target`. Skips the animation for reduced-motion users. */
function useCountUp(target: number, ms = 700) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    const begin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      from.current = begin + (target - begin) * eased;
      setValue(from.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return Math.round(value);
}

/* ---------- Ring ---------- */

const CX = 80;
const RING_R = 50;
const LABEL_R = 69;
// pathLength={70}: each of the 7 segments owns 10 units. Weekly draws 8.4 (1.6 gap); daily draws all 10.
const SEG_WEEKLY = 8.4;
const SEG_FULL = 10;

function labelPos(i: number) {
  const angle = ((-90 + (i + 0.5) * (360 / 7)) * Math.PI) / 180;
  return { x: CX + LABEL_R * Math.cos(angle), y: CX + LABEL_R * Math.sin(angle) };
}

interface GoalRingProps {
  goal: WeeklyGoal;
  mode: ViewMode;
  dayIdx: number;
  todayIdx: number;
  ready: boolean;
}

function GoalRing({ goal, mode, dayIdx, todayIdx, ready }: GoalRingProps) {
  const count = goal.days.filter(Boolean).length;
  const shown = useCountUp(count);
  const weekly = mode === "weekly";

  // Seven separate arcs so each can grow clockwise on its own, staggered by --i.
  const arc = (i: number, len: number, stroke: string, extra?: string) => (
    <circle
      key={`${extra}-${i}`}
      className="asc-alt-seg"
      cx={CX}
      cy={CX}
      r={RING_R}
      fill="none"
      strokeWidth={12}
      pathLength={70}
      stroke={stroke}
      style={
        {
          "--i": i,
          strokeDasharray: `${len} ${70 - len}`,
          strokeDashoffset: -(i * 10),
        } as CSSProperties
      }
    />
  );

  return (
    <div className="asc-alt-ring">
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <g
          className="asc-alt-spin"
          style={{ transform: `rotate(${ready ? -90 : -150}deg)`, transformOrigin: `${CX}px ${CX}px` }}
        >
          {DAY_LETTERS.map((_, i) => arc(i, weekly ? SEG_WEEKLY : SEG_FULL, "var(--border, #E5E1F1)", "track"))}
          {DAY_LETTERS.map((_, i) => {
            const on = weekly ? goal.days[i] : goal.days[dayIdx];
            const len = !ready || !on ? 0 : weekly ? SEG_WEEKLY : SEG_FULL;
            return arc(i, len, goal.color, "fill");
          })}
        </g>
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
              style={{ opacity: weekly && ready ? 1 : 0, transitionDelay: weekly ? `${300 + i * 50}ms` : "0ms" }}
            >
              {letter}
            </text>
          );
        })}
      </svg>
      <div className="asc-alt-ring-center" style={{ color: goal.color }}>
        {shown}
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
  const [ready, setReady] = useState(false);

  // Computed after mount so server and client dates can't cause a hydration mismatch.
  useEffect(() => {
    const w = getWeek();
    setWeek(w);
    setDayIdx(w.todayIdx);
  }, []);

  // Flip after first paint so rings sweep in on load.
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(id);
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
  const summaryValue = useCountUp(mode === "weekly" ? totalDone : workedOnDay);

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
          {goals.map((goal, idx) => {
            const worked = goal.days[dayIdx];
            const daily = mode === "daily";
            const locked = !daily || dayIdx > todayIdx;
            return (
              // One persistent element in both modes, so rings animate between views instead of remounting.
              <button
                key={goal.id}
                type="button"
                className="asc-card asc-alt-card asc-alt-card-btn"
                style={{ "--i": idx } as CSSProperties}
                aria-pressed={daily ? worked : undefined}
                aria-disabled={locked}
                tabIndex={daily ? 0 : -1}
                aria-label={
                  daily
                    ? `${goal.title}: ${worked ? "worked on" : "not logged"} ${DAY_NAMES[dayIdx]}`
                    : `${goal.title}: ${goal.days.filter(Boolean).length} of 7 days`
                }
                onClick={() => !locked && toggle(goal)}
              >
                <GoalRing goal={goal} mode={mode} dayIdx={dayIdx} todayIdx={todayIdx} ready={ready} />
                <h3>{goal.title}</h3>
                <span className={`asc-alt-status${worked ? " done" : ""}${daily ? " show" : ""}`}>
                  {worked ? "Worked on it" : "Not logged"}
                </span>
              </button>
            );
          })}

          <div className="asc-alt-summary" style={{ "--i": goals.length } as CSSProperties}>
            <span>{mode === "weekly" ? "Weekly altitude" : `${DAY_NAMES[dayIdx]} altitude`}</span>
            <strong>
              {summaryValue}
              <em> / {mode === "weekly" ? goals.length * 7 : goals.length}</em>
            </strong>
            <p>{mode === "weekly" ? "Goal-days logged this week." : "Goals worked on this day."}</p>
          </div>
        </div>
      )}
    </div>
  );
}