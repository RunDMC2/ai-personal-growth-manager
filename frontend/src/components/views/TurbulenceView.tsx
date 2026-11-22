"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Weakness } from "../../ascent/types";
import { DAY_NAMES, NoteDialog, getWeek, useScheduler, type ViewMode, type Week, type WeeklyGoal } from "./AltitudeView";
import OrbitBoard from "../OrbitBoard";

/** A weakness shaped like a goal (so the shared ring/orbit works), plus its descriptive fields.
 *  days[i] = true means the weakness showed up that day. */
interface WeaknessItem extends WeeklyGoal {
  status: Weakness["status"];
  statusLabel: string;
  frequencyLabel: string;
  pattern: string;
}

const STATUS_COLOR: Record<Weakness["status"], string> = {
  "needs-attention": "var(--pink-text)",
  "in-progress": "var(--purple-text)",
  "on-track": "var(--blue-text)",
};

/** Adjust field names to match your endpoint. accentVar is e.g. "--pink". */
function normalize(data: unknown): WeaknessItem[] {
  if (!Array.isArray(data)) return [];
  return data.slice(0, 5).map((w) => ({
    id: String(w.id),
    title: String(w.title ?? "Untitled weakness"),
    color: `var(${w.accentVar ?? "--pink"})`,
    days: Array.from({ length: 7 }, (_, d) => Boolean(w.days?.[d])),
    notes: Array.from({ length: 7 }, (_, d) => (typeof w.notes?.[d] === "string" ? w.notes[d] : "")),
    status: w.status ?? "in-progress",
    statusLabel: String(w.statusLabel ?? ""),
    frequencyLabel: String(w.frequencyLabel ?? ""),
    pattern: String(w.pattern ?? ""),
  }));
}
const same = (a: WeaknessItem[], b: WeaknessItem[]) => JSON.stringify(a) === JSON.stringify(b);

const base_url = process.env.NEXT_PUBLIC_API_URL;

export default function TurbulenceView({ endpoint = `${base_url}/weaknesses` }: { endpoint?: string }) {
  useScheduler("update_weaknesses_list"); // sheet -> db sync job (see backend notes)

  const [items, setItems] = useState<WeaknessItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [saveError, setSaveError] = useState(false);
  const [mode, setMode] = useState<ViewMode>("weekly");
  const [week, setWeek] = useState<Week | null>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const hasData = useRef(false);
  const savesInFlight = useRef(0);
  const lastSaveDone = useRef(0);

  useEffect(() => {
    const w = getWeek();
    setWeek(w);
    setDayIdx(w.todayIdx);
  }, []);

  const load = useCallback(async () => {
    if (!week) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const startedAt = Date.now();
    if (!hasData.current) setStatus("loading");
    try {
      const res = await fetch(`${endpoint}/pull/${week.isos[0]}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const next = normalize(await res.json());
      if (savesInFlight.current > 0 || lastSaveDone.current > startedAt) return; // possibly stale
      hasData.current = true;
      setItems((prev) => (same(prev, next) ? prev : next));
      setStatus("ready");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      if (!hasData.current) setStatus("error");
    }
  }, [week, endpoint]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => {
      clearInterval(t);
      abortRef.current?.abort();
    };
  }, [load]);

  const todayIdx = week?.todayIdx ?? -1;

  // Optimistic: update now, save in the background, restore if the save fails.
  const logDay = async (w: WeaknessItem, occurred: boolean, note: string) => {
    if (!week || dayIdx > todayIdx) return;
    const prev = { occurred: w.days[dayIdx], note: w.notes[dayIdx] };
    const apply = (o: boolean, n: string) =>
      setItems((list) =>
        list.map((x) =>
          x.id === w.id
            ? { ...x, days: x.days.map((d, i) => (i === dayIdx ? o : d)), notes: x.notes.map((t, i) => (i === dayIdx ? n : t)) }
            : x
        )
      );
    setSaveError(false);
    setOpenId(null);
    apply(occurred, note);
    savesInFlight.current += 1;
    try {
      const res = await fetch(`${endpoint}/${w.id}/log`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: week.isos[dayIdx], occurred, note: note || null }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    } catch {
      apply(prev.occurred, prev.note);
      setSaveError(true);
    } finally {
      savesInFlight.current -= 1;
      lastSaveDone.current = Date.now();
    }
  };

  const closeDialog = useCallback(() => setOpenId(null), []);
  const open = items.find((x) => x.id === openId) ?? null;
  const dayName = DAY_NAMES[dayIdx];
  const daily = mode === "daily";

  const total = items.reduce((s, x) => s + x.days.filter(Boolean).length, 0);
  const onDay = items.filter((x) => x.days[dayIdx]).length;
  const plural = (n: number) => `${n} ${n === 1 ? "slip" : "slips"}`;

  return (
    <>
      <OrbitBoard
        title="Weaknesses you're working"
        subtitle="Acknowledged in your sheet, tracked here"
        items={items}
        week={week}
        mode={mode}
        setMode={setMode}
        dayIdx={dayIdx}
        setDayIdx={(i) => {
          setDayIdx(i);
          setMode("daily");
        }}
        hubValue={daily ? onDay : total}
        hubLabel={daily ? `slips · ${dayName}` : "slips this week"}
        caption={(item, active) =>
          daily
            ? active
              ? { text: "Showed up", color: item.color }
              : { text: "Held steady", dim: true }
            : { text: item.statusLabel, color: STATUS_COLOR[(item as WeaknessItem).status] }
        }
        railText={(i) => plural(items.filter((x) => x.days[i]).length)}
        onSelect={(item) => setOpenId(item.id)}
        emptyText={
          <>
            <h3>No weaknesses tracked</h3>
            <p>Add them in your sheet and they&apos;ll appear here.</p>
          </>
        }
        placeholder={
          status === "loading" ? (
            <div className="asc-card asc-alt-empty" role="status">
              <p>Loading…</p>
            </div>
          ) : status === "error" ? (
            <div className="asc-card asc-alt-empty" role="alert">
              <h3>Couldn&apos;t load your weaknesses</h3>
              <p>Check your connection, then try again.</p>
              <button type="button" className="asc-alt-retry" onClick={load}>
                Try again
              </button>
            </div>
          ) : undefined
        }
      >
        {saveError && (
          <p className="asc-alt-error" role="alert">
            Couldn&apos;t save that change, so it was undone. Try again.
          </p>
        )}
      </OrbitBoard>

      {open && (
        <NoteDialog
          key={`${open.id}-${dayIdx}-${mode}`}
          goal={open}
          dayName={dayName}
          initialNote={open.notes[dayIdx]}
          alreadyLogged={open.days[dayIdx]}
          readOnly={!daily}
          subtitle={!daily ? "This week" : open.days[dayIdx] ? `Edit your note for ${dayName}` : `Did it show up on ${dayName}?`}
          noteLabel="What triggered it? (optional)"
          placeholder="What was going on?"
          submitLabel={open.days[dayIdx] ? "Save note" : "Log slip"}
          info={
            <div style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.5 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {open.frequencyLabel} · <span style={{ color: STATUS_COLOR[open.status] }}>{open.statusLabel}</span>
              </div>
              <p style={{ margin: "6px 0 0" }}>
                <b>Pattern:</b> {open.pattern}
              </p>
            </div>
          }
          onSubmit={(note) => logDay(open, true, note)}
          onUndo={() => logDay(open, false, "")}
          onClose={closeDialog}
        />
      )}
    </>
  );
}