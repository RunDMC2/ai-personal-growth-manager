"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function useScheduler(job_id: string) {
  useEffect(() => {
    const base_url = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${base_url}/scheduler/start/${job_id}`, {
      method: "POST",
    }).catch((err) => console.error("Failed to start scheduler job:", err));

    return () => {
      navigator.sendBeacon(`${base_url}/scheduler/stop/${job_id}`);
    };
  }, [job_id]);
}

/* ---------- Types ---------- */

export type ViewMode = "weekly" | "daily";

export interface WeeklyGoal {
  id: string;
  title: string;
  color: string;
  /** Mon → Sun. true = worked on that day. */
  days: boolean[];
  /** Mon → Sun. Optional note written when the day was logged ("" = none). */
  notes: string[];
}

const POINTS_PER_GOAL_DAY = 10;
const FALLBACK_COLORS = ["#C22B76", "#B8741A", "#2E8B6A", "#0879AD", "#6B32E0"];

/** Shapes whatever your API returns into WeeklyGoal[]. Adjust the field names to match your endpoint. */
function normalizeGoals(data: unknown): WeeklyGoal[] {
  if (!Array.isArray(data)) return [];
  return data.slice(0, 5).map((g, i) => ({
    id: String(g.id),
    title: String(g.title ?? "Untitled goal"),
    color: typeof g.color === "string" ? g.color : FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    days: Array.from({ length: 7 }, (_, d) => Boolean(g.days?.[d])),
    notes: Array.from({ length: 7 }, (_, d) => (typeof g.notes?.[d] === "string" ? g.notes[d] : "")),
  }));
}

/** Cheap deep-compare so a poll that returns identical data doesn't trigger a re-render. */
const sameGoals = (a: WeeklyGoal[], b: WeeklyGoal[]) => JSON.stringify(a) === JSON.stringify(b);

const DAY_LETTERS = ["M", "T", "W", "R", "F", "S", "S"];
export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------- Week helpers ---------- */

export interface Week {
  todayIdx: number; // 0 = Monday
  dates: number[]; // day-of-month for Mon..Sun
  isos: string[]; // YYYY-MM-DD for Mon..Sun, local time
}

export function getWeek(): Week {
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - todayIdx);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    todayIdx,
    dates: days.map((d) => d.getDate()),
    isos: days.map((d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`),
  };
}

/* ---------- Animation helpers ---------- */

/** Counts a number up (or down) to `target`. Skips the animation for reduced-motion users. */
export function useCountUp(target: number, ms = 700) {
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
}

export function GoalRing({ goal, mode, dayIdx, todayIdx }: GoalRingProps) {
  // Each ring flips this after it mounts, so it sweeps in even when the data arrives late.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(id);
  }, []);
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
          stroke,
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
        <span style={{ fontSize: "0.65rem", marginTop: "2px" }}>of 7 days</span>
      </div>
    </div>
  );
}

/* ---------- Orbit layout ---------- */

const ORBIT_RADIUS = 34; // % of the container; goals sit on this circle around the center

/** Position of goal i of n, evenly spaced, first goal at 12 o'clock (4 goals = top/right/bottom/left, 5 = pentagon). */
export function orbitPos(i: number, n: number) {
  const angle = ((-90 + (i * 360) / n) * Math.PI) / 180;
  return { left: `${50 + ORBIT_RADIUS * Math.cos(angle)}%`, top: `${50 + ORBIT_RADIUS * Math.sin(angle)}%` };
}

/* ---------- Note popup ---------- */

interface NoteDialogProps {
  goal: WeeklyGoal;
  dayName: string;
  initialNote: string;
  alreadyLogged: boolean;
  onSubmit: (note: string) => void;
  onUndo: () => void;
  onClose: () => void;
  subtitle?: string;
  noteLabel?: string;
  placeholder?: string;
  submitLabel?: string;
  info?: ReactNode; // extra content under the subtitle
  readOnly?: boolean; // details only: no note box, just a Close button
}

export function NoteDialog({
  goal, dayName, initialNote, alreadyLogged, onSubmit, onUndo, onClose,
  subtitle, noteLabel = "Notes (optional)", placeholder = "What did you do? How did it go?", submitLabel, info, readOnly,
}: NoteDialogProps) {
  const [note, setNote] = useState(initialNote);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    areaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock page scroll behind the popup
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const btn: CSSProperties = {
    font: "inherit",
    fontWeight: 600,
    padding: "10px 18px",
    borderRadius: 10,
    cursor: "pointer",
    border: "1px solid transparent",
  };

  // Portaled to <body>: a parent with a transform/animation would otherwise shrink "fixed" to its own box.
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: 16,
        background: "rgba(30, 24, 48, 0.45)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="asc-note-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 20,
          borderRadius: 16,
          background: "var(--card, #fff)",
          color: "var(--text, #2A2440)",
          boxShadow: "0 20px 50px rgba(30, 24, 48, 0.25)",
          borderTop: `4px solid ${goal.color}`,
        }}
      >
        <h3 id="asc-note-title" style={{ margin: 0, fontSize: 18 }}>
          {goal.title}
        </h3>
        <p style={{ margin: "4px 0 14px", opacity: 0.65, fontSize: 14 }}>
          {subtitle ?? (alreadyLogged ? `Edit your note for ${dayName}` : `Log ${dayName} · earns ${POINTS_PER_GOAL_DAY} points`)}
        </p>
        {info}
        {!readOnly && (
          <>
        <label htmlFor="asc-note" style={{ display: "block", fontSize: 14, marginBottom: 6 }}>
          {noteLabel}
        </label>
        <textarea
          id="asc-note"
          ref={areaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder={placeholder}
          style={{
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
            font: "inherit",
            padding: 10,
            borderRadius: 10,
            border: "1px solid var(--border, #E5E1F1)",
            background: "transparent",
            color: "inherit",
          }}
        />
          </>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, flexWrap: "wrap" }}>
          {!readOnly && alreadyLogged && (
            <button type="button" onClick={onUndo} style={{ ...btn, background: "transparent", marginRight: "auto", borderColor: "var(--border, #E5E1F1)", color: "inherit" }}>
              Remove log
            </button>
          )}
          <button type="button" onClick={onClose} style={{ ...btn, background: "transparent", color: "inherit" }}>
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly && (
            <button type="button" onClick={() => onSubmit(note.trim())} style={{ ...btn, background: goal.color, color: "#fff" }}>
              {submitLabel ?? (alreadyLogged ? "Save note" : "Submit")}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- View ---------- */

interface AltitudeViewProps {
  /** GET `${endpoint}/pull/:weekStart` returns goals for the week. PUT `${endpoint}/:id/log` saves a day ({ date, worked, note }). */
  endpoint?: string;
}

const base_url = process.env.NEXT_PUBLIC_API_URL;

type LoadStatus = "loading" | "ready" | "error";

export default function AltitudeView({ endpoint = `${base_url}/goals` }: AltitudeViewProps) {
  useScheduler("update_goals_list");

  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [saveError, setSaveError] = useState(false);
  const [mode, setMode] = useState<ViewMode>("weekly");
  const [week, setWeek] = useState<Week | null>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Day rail takes the exact width of the Weekly/Daily toggle, so it sits right-aligned and centered beneath it.
  const toggleRef = useRef<HTMLDivElement>(null);
  const [railW, setRailW] = useState(250);
  useEffect(() => {
    const el = toggleRef.current;
    if (!el) return;
    const measure = () => setRailW(Math.max(220, Math.round(el.getBoundingClientRect().width)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Polling bookkeeping (refs, so changing them never re-renders).
  const abortRef = useRef<AbortController | null>(null);
  const hasData = useRef(false); // true after the first successful load
  const savesInFlight = useRef(0); // pending PUTs
  const lastSaveDone = useRef(0); // timestamp of the last finished save

  // Computed after mount so server and client dates can't cause a hydration mismatch.
  useEffect(() => {
    const w = getWeek();
    setWeek(w);
    setDayIdx(w.todayIdx);
  }, []);

  // Fetch this week's goals. Used by the first load, the 15s poll, and the Try again button.
  const fetchWeekGoals = useCallback(async () => {
    if (!week) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const startedAt = Date.now();

    // Loading card only on the very first load (or a manual retry). Background polls stay silent,
    // so the grid never unmounts and the ring animations don't replay.
    if (!hasData.current) setStatus("loading");

    try {
      const res = await fetch(`${endpoint}/pull/${week.isos[0]}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const next = normalizeGoals(await res.json());

      // A save is pending, or finished after this request started: this response may be stale. Skip it.
      if (savesInFlight.current > 0 || lastSaveDone.current > startedAt) return;

      hasData.current = true;
      setGoals((prev) => (sameGoals(prev, next) ? prev : next)); // same data = same reference = no re-render
      setStatus("ready");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      // If a background refresh fails, keep showing the last good data instead of an error card.
      if (!hasData.current) setStatus("error");
    }
  }, [week, endpoint]);

  //* TODO: This works, and is present in FlightLogView.tsx, but means the scheduler isn't running the subjobs every 15 seconds like supposed to */
  useEffect(() => {
    fetchWeekGoals();
    const t = setInterval(fetchWeekGoals, 15_000); // matches the backend sync interval
    return () => {
      clearInterval(t);
      abortRef.current?.abort(); // cancels the in-flight request on unmount
    };
  }, [fetchWeekGoals]);

  const todayIdx = week?.todayIdx ?? -1;

  // Optimistic update: change the day now, save in the background, restore the old values if the save fails.
  const logDay = async (goal: WeeklyGoal, worked: boolean, note: string) => {
    if (!week || dayIdx > todayIdx) return; // can't log the future
    const prev = { worked: goal.days[dayIdx], note: goal.notes[dayIdx] };
    const apply = (w: boolean, n: string) =>
      setGoals((list) =>
        list.map((g) =>
          g.id === goal.id
            ? {
                ...g,
                days: g.days.map((d, i) => (i === dayIdx ? w : d)),
                notes: g.notes.map((x, i) => (i === dayIdx ? n : x)),
              }
            : g
        )
      );
    setSaveError(false);
    setEditingId(null);
    apply(worked, note);
    savesInFlight.current += 1;
    try {
      const res = await fetch(`${endpoint}/${goal.id}/log`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: week.isos[dayIdx], worked, note: note || null }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    } catch {
      apply(prev.worked, prev.note);
      setSaveError(true);
    } finally {
      savesInFlight.current -= 1;
      lastSaveDone.current = Date.now();
    }
  };

  const closeDialog = useCallback(() => setEditingId(null), []);
  const editingGoal = goals.find((g) => g.id === editingId) ?? null;

  const totalDone = goals.reduce((s, g) => s + g.days.filter(Boolean).length, 0);
  const workedOnDay = goals.filter((g) => g.days[dayIdx]).length;
  const points = (mode === "weekly" ? totalDone : workedOnDay) * POINTS_PER_GOAL_DAY;
  const pointsShown = useCountUp(points);

  return (
    <div className="asc-view">
      <div className="asc-section-head asc-alt-head">
        <h2>Active goals</h2>
        <div className="asc-alt-toggle" ref={toggleRef} role="tablist" aria-label="Goal view">
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

      {saveError && (
        <p className="asc-alt-error" role="alert">
          Couldn&apos;t save that change, so it was undone. Try again.
        </p>
      )}

      {status === "loading" ? (
        <div className="asc-card asc-alt-empty" role="status">
          <p>Loading your goals…</p>
        </div>
      ) : status === "error" ? (
        <div className="asc-card asc-alt-empty" role="alert">
          <h3>Couldn&apos;t load your goals</h3>
          <p>Check your connection, then try again.</p>
          <button type="button" className="asc-alt-retry" onClick={fetchWeekGoals}>
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Square stage: points hub in the middle, goals spaced evenly around it. */}
          <div className={`asc-orbit-layout ${mode}`} style={{ "--rail-w": `${railW}px` } as CSSProperties}>
          <div className="asc-orbit-stage" style={{ position: "relative", aspectRatio: "1 / 1" }}>
            <div
              role="status"
              aria-label={`${pointsShown} points`}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "24%",
                aspectRatio: "1 / 1",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                // Muted lavender-grey: soft fill, hairline edge, faint halo instead of a saturated ring.
                background: "var(--hub-bg, #F4F2F9)",
                border: "2px solid var(--hub-border, #DDD8EA)",
                boxShadow: "0 0 0 8px rgba(120, 105, 170, 0.07)",
                color: "var(--hub-text, #5E5480)",
              }}
            >
              <strong style={{ fontSize: "clamp(1.4rem, 8cqw, 3rem)", lineHeight: 1 }}>{pointsShown}</strong>
              <span style={{ fontSize: "clamp(0.65rem, 2.1cqw, 0.85rem)", opacity: 0.75, marginTop: 4 }}>
                {mode === "weekly" ? "points this week" : `points · ${DAY_NAMES[dayIdx]}`}
              </span>
            </div>

            {goals.map((goal, idx) => {
              const worked = goal.days[dayIdx];
              const daily = mode === "daily";
              const locked = !daily || dayIdx > todayIdx;
              return (
                // Wrapper centers the ring on its orbit position; the title hangs below it (absolute), so it
                // never pushes the ring off-center. Rings are 22% wide, neighbors are >= 38% apart.
                <div
                  key={goal.id}
                  style={{
                    position: "absolute",
                    width: "20%",
                    transform: "translate(-50%, -50%)",
                    transition: "left 0.5s ease, top 0.5s ease",
                    ...orbitPos(idx, goals.length),
                  }}
                >
                  <button
                    type="button"
                    className="asc-orbit-goal"
                    aria-haspopup={daily ? "dialog" : undefined}
                    aria-disabled={locked}
                    tabIndex={daily ? 0 : -1}
                    aria-label={
                      daily
                        ? `${goal.title}: ${worked ? "worked on" : "not logged"} ${DAY_NAMES[dayIdx]}`
                        : `${goal.title}: ${goal.days.filter(Boolean).length} of 7 days`
                    }
                    onClick={() => !locked && setEditingId(goal.id)}
                    style={{
                      position: "relative",
                      display: "block",
                      width: "100%",
                      padding: 0,
                      border: 0,
                      background: "none",
                      font: "inherit",
                      color: "inherit",
                      cursor: locked ? "default" : "pointer",
                    }}
                  >
                    <GoalRing goal={goal} mode={mode} dayIdx={dayIdx} todayIdx={todayIdx} />
                    <span
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "-30%",
                        width: "160%",
                        marginTop: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 3,
                        textAlign: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: "clamp(11px, 2.7cqw, 15px)",
                          lineHeight: 1.25,
                          textWrap: "balance" as CSSProperties["textWrap"],
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {goal.title}
                      </strong>
                      {daily && (
                        <span style={{ fontSize: "clamp(9.5px, 2cqw, 12px)", opacity: worked ? 1 : 0.6, color: worked ? goal.color : undefined }}>
                          {worked ? "Done" : "Not logged"}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Day rail: points per day with a dot per goal. Click a day to open it in daily view. */}
          <div className="asc-rail-wrap" aria-hidden={mode === "weekly"}>
          <div className="asc-rail" role="group" aria-label="Select a day">
            {DAY_NAMES.map((name, i) => {
              const done = goals.filter((g) => g.days[i]);
              return (
                <button
                  key={name}
                  type="button"
                  className={`asc-rail-day${mode === "daily" && dayIdx === i ? " on" : ""}${i === todayIdx ? " today" : ""}`}
                  aria-pressed={mode === "daily" && dayIdx === i}
                  disabled={i > todayIdx}
                  onClick={() => {
                    setDayIdx(i);
                    setMode("daily");
                  }}
                >
                  <span className="name">
                    {name}
                    <small>{week ? week.dates[i] : ""}</small>
                  </span>
                  <span className="asc-rail-dots" aria-hidden="true">
                    {goals.map((g) => (
                      <i key={g.id} style={g.days[i] ? { background: g.color, borderColor: g.color } : undefined} />
                    ))}
                  </span>
                  <span className="asc-rail-pts">{done.length * POINTS_PER_GOAL_DAY} pts</span>
                </button>
              );
            })}
          </div>
          </div>
          </div>

          {goals.length === 0 && (
            <div className="asc-card asc-alt-empty">
              <h3>No goals yet</h3>
              <p>Add up to five goals and log the days you work on them.</p>
            </div>
          )}
        </>
      )}

      {editingGoal && (
        <NoteDialog
          key={`${editingGoal.id}-${dayIdx}`}
          goal={editingGoal}
          dayName={DAY_NAMES[dayIdx]}
          initialNote={editingGoal.notes[dayIdx]}
          alreadyLogged={editingGoal.days[dayIdx]}
          onSubmit={(note) => logDay(editingGoal, true, note)}
          onUndo={() => logDay(editingGoal, false, "")}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}