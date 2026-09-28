"use client";

import "../../ascent/styles/flight-log-additions.css";
import { useCallback, useEffect, useRef, useState } from "react";

// ----- Scheduler hook (unchanged) -----

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

// ----- Types & date helpers -----

type Task = {
  id: number; // sheet row number
  do: boolean;
  done: boolean;
  name: string; // stand in for "task"
  assigned_by: string;
  due_by: string; // YYYY-MM-DD
  est_time_rem: string;
  days_rem: string;
  completed_on: string | null;
  scheduledFor: string | null; // YYYY-MM-DD, set in custom mode
};

type Mode = "due" | "custom";

const API = process.env.NEXT_PUBLIC_API_URL;
const POOL = "pool";

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parseKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

function nextSevenDays(): Date[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function dayLabel(d: Date, i: number) {
  const short = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (i === 0) return `Today, ${short}`;
  if (i === 1) return `Tomorrow, ${short}`;
  return `${d.toLocaleDateString("en-US", { weekday: "long" })}, ${short}`;
}

/**
 * `urgency` drives the color coding (see the data-due rules in the CSS):
 *   "overdue" and "0" = red, "1" = orange, "2" = yellow, "3" = green,
 *   "4" = blue, "5" = indigo, "6" (6+ days out) = violet, "done" = no tint.
 */
function statusFor(task: Task, todayKey: string) {
  if (task.done) return { status: "done", label: "Done", urgency: "done" };
  const diff = Math.round(
    (parseKey(task.due_by).getTime() - parseKey(todayKey).getTime()) / 86_400_000
  );
  if (diff < 0) return { status: "overdue", label: "Overdue", urgency: "overdue" };
  if (diff === 0) return { status: "today", label: "Due today", urgency: "0" };
  return { status: "upcoming", label: `Due in ${diff}d`, urgency: String(Math.min(diff, 6)) };
}

const sortTasks = (ts: Task[]) =>
  [...ts].sort((a, b) => a.due_by.localeCompare(b.due_by) || a.name.localeCompare(b.name));

// ----- Data hook -----

function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const tasksRef = useRef<Task[]>([]);
  tasksRef.current = tasks;
  const dragging = useRef(false); // skip polling while a drag is in progress

  const load = useCallback(async () => {
    if (dragging.current) return;
    try {
      const res = await fetch(`${API}/sheets/tasks`);
      if (!res.ok) throw new Error(String(res.status));
      setTasks(await res.json());
      setError(null);
    } catch {
      setError("Couldn't load tasks. Retrying shortly.");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000); // matches the backend sync interval
    return () => clearInterval(t);
  }, [load]);

  const schedule = useCallback(async (id: number, date: string | null) => {
    const previous = tasksRef.current.find((t) => t.id === id)?.scheduledFor ?? null;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, scheduledFor: date } : t)));
    try {
      const res = await fetch(`${API}/sheets/tasks/${id}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_for: date }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, scheduledFor: previous } : t)));
      setError("Couldn't save that change. It was undone.");
    }
  }, []);

  return { tasks, error, schedule, dragging };
}

// ----- Row -----

function TaskRow(props: {
  task: Task;
  todayKey: string;
  draggable: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  moveControl?: React.ReactNode;
}) {
  const { task, todayKey, draggable, isDragging, onDragStart, onDragEnd, moveControl } = props;
  const { status, label, urgency } = statusFor(task, todayKey);

  return (
    <div
      className={`asc-log-task${draggable ? " fl-draggable" : ""}${isDragging ? " fl-dragging" : ""}`}
      data-due={urgency}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Absolutely positioned in the row's left padding, so it never shifts the checkbox */}
      {task.do && !task.done && (
        <span className="fl-do" role="img" aria-label="Marked to do" title="Marked to do">
          !
        </span>
      )}
      <div className="asc-log-task-left">
        <div className={`asc-task-check${task.done ? " done" : ""}`} />
        <div className="asc-task-name">
          {task.name}
          <span className="asc-task-cat">{task.assigned_by}</span>
        </div>
      </div>
      <div className="fl-task-right">
        {moveControl}
        <div className={`asc-pill ${status}`} data-due={urgency}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ----- View -----

export default function FlightLogView() {
  useScheduler("update_todo_list");

  const { tasks, error, schedule, dragging } = useTasks();
  const [mode, setMode] = useState<Mode>("due");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  // Fallback for drags that end outside any drop zone (e.g. dropped on the
  // page background, or cancelled with Esc) — "dragend" always fires on
  // window even when the row itself has already unmounted.
  useEffect(() => {
    const clear = () => {
      setDraggingId(null);
      dragging.current = false;
    };
    window.addEventListener("dragend", clear);
    return () => window.removeEventListener("dragend", clear);
  }, [dragging]);

  const days = nextSevenDays();
  const dayKeys = days.map(toKey);
  const todayKey = dayKeys[0];

  const dueOn = (key: string) => sortTasks(tasks.filter((t) => t.due_by === key));
  const plannedOn = (key: string) => sortTasks(tasks.filter((t) => t.scheduledFor === key));
  const pool = sortTasks(
    tasks.filter((t) => !t.done && !(t.scheduledFor && dayKeys.includes(t.scheduledFor)))
  );

  function handleDrop(e: React.DragEvent, key: string) {
    e.preventDefault();
    setOverKey(null);
    setDraggingId(null); // the row may re-render into a different list before its own
    dragging.current = false; // dragend event would fire, so clear the state here too
    const id = Number(e.dataTransfer.getData("text/plain"));
    const task = tasks.find((t) => t.id === id);
    const target = key === POOL ? null : key;
    if (task && task.scheduledFor !== target) schedule(id, target);
  }

  const zoneProps = (key: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setOverKey(key);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverKey(null);
    },
    onDrop: (e: React.DragEvent) => handleDrop(e, key),
  });

  const renderTask = (t: Task, draggable: boolean) => (
    <TaskRow
      key={t.id}
      task={t}
      todayKey={todayKey}
      draggable={draggable}
      isDragging={draggingId === t.id}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(t.id));
        e.dataTransfer.effectAllowed = "move";
        dragging.current = true;
        setDraggingId(t.id);
      }}
      onDragEnd={() => {
        dragging.current = false;
        setDraggingId(null);
        setOverKey(null);
      }}
      // Select is the keyboard and touch fallback for drag and drop
      moveControl={
        draggable ? (
          <select
            className="fl-move"
            aria-label={`Schedule ${t.name}`}
            value={t.scheduledFor && dayKeys.includes(t.scheduledFor) ? t.scheduledFor : ""}
            onChange={(e) => schedule(t.id, e.target.value || null)}
          >
            <option value="">Unscheduled</option>
            {days.map((d, i) => (
              <option key={dayKeys[i]} value={dayKeys[i]}>
                {dayLabel(d, i)}
              </option>
            ))}
          </select>
        ) : null
      }
    />
  );

  const renderDays = (getTasks: (key: string) => Task[], custom: boolean) =>
    days.map((d, i) => {
      const key = dayKeys[i];
      const list = getTasks(key);
      const isLast = i === days.length - 1;
      return (
        <div
          className={`asc-log-day${custom && overKey === key ? " fl-over" : ""}`}
          key={key}
          style={isLast ? { borderLeftColor: "transparent", marginBottom: 0 } : undefined}
          {...(custom ? zoneProps(key) : {})}
        >
          <div className="asc-log-day-label">{dayLabel(d, i)}</div>
          {list.map((t) => renderTask(t, custom))}
          {list.length === 0 && (
            <div className="fl-empty">{custom ? "Drop a task here" : "Nothing due"}</div>
          )}
        </div>
      );
    });

  return (
    <div className="asc-view">
      <div className="asc-section-head">
        <h2>{mode === "due" ? "Open this week" : "Plan your week"}</h2>
        <div className="fl-toggle" role="tablist" aria-label="View mode">
          <button
            className="fl-toggle-due"
            role="tab"
            aria-selected={mode === "due"}
            onClick={() => setMode("due")}
          >
            By due date
          </button>
          <button
            className="fl-toggle-custom"
            role="tab"
            aria-selected={mode === "custom"}
            onClick={() => setMode("custom")}
          >
            Custom
          </button>
        </div>
      </div>

      {error && (
        <p className="fl-error" role="alert">
          {error}
        </p>
      )}

      {mode === "custom" && (
        <>
          <div className="asc-section-head">
            <h2>Unscheduled</h2>
            <span className="asc-section-note">{pool.length} to place</span>
          </div>
          <div
            className={`asc-card fl-pool${overKey === POOL ? " fl-over" : ""}`}
            {...zoneProps(POOL)}
          >
            {pool.map((t) => renderTask(t, true))}
            {pool.length === 0 && <div className="fl-empty">Everything is scheduled.</div>}
          </div>
          <div className="asc-section-head">
            <h2>Next 7 days</h2>
          </div>
        </>
      )}

      <div className="asc-card">
        {mode === "due" ? renderDays(dueOn, false) : renderDays(plannedOn, true)}
      </div>

      <p style={{ fontSize: 12, color: "var(--text-dimmer)", marginTop: 14 }}>
        {mode === "due"
          ? "Tasks are logged and checked off in your sheet — this view just keeps score. To add or edit a task, open growth-log.xlsx."
          : "Drag tasks onto a day, or use the menu on each task. Your plan is saved here, not in the sheet."}
      </p>
    </div>
  );
}