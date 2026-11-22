"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DAY_NAMES, GoalRing, orbitPos, useCountUp, type ViewMode, type Week, type WeeklyGoal } from "./views/AltitudeView";

/** Measures the Weekly/Daily toggle so the day rail can match its width. */
export function useToggleWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(250);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(220, Math.round(el.getBoundingClientRect().width)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

interface OrbitBoardProps {
  title: string;
  subtitle?: string;
  items: WeeklyGoal[]; // max 5
  week: Week | null;
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
  dayIdx: number;
  setDayIdx: (i: number) => void;
  hubValue: number;
  hubLabel: string;
  /** Small line under each title. */
  caption: (item: WeeklyGoal, active: boolean) => { text: string; color?: string; dim?: boolean };
  /** Right-hand text of each day row, e.g. "20 pts". */
  railText: (dayIndex: number) => string;
  onSelect: (item: WeeklyGoal) => void;
  emptyText: ReactNode;
  /** Shown instead of the orbit (loading / error). */
  placeholder?: ReactNode;
  children?: ReactNode; // banners under the header
}

export default function OrbitBoard(p: OrbitBoardProps) {
  const { ref, width } = useToggleWidth();
  const hubShown = useCountUp(p.hubValue);
  const todayIdx = p.week?.todayIdx ?? -1;
  const daily = p.mode === "daily";

  return (
    <div className="asc-view">
      <div className="asc-section-head asc-alt-head">
        <h2>{p.title}</h2>
        <div className="asc-alt-toggle" ref={ref} role="tablist" aria-label="View">
          {(["weekly", "daily"] as ViewMode[]).map((m) => (
            <button key={m} role="tab" aria-selected={p.mode === m} className={`asc-alt-opt ${m}`} onClick={() => p.setMode(m)}>
              {m === "weekly" ? "Weekly view" : "Daily view"}
            </button>
          ))}
        </div>
      </div>
      {p.subtitle && <p className="asc-section-note" style={{ margin: "-6px 0 14px" }}>{p.subtitle}</p>}
      {p.children}

      {p.placeholder ?? (
        <>
          <div className={`asc-orbit-layout ${p.mode}`} style={{ "--rail-w": `${width}px` } as CSSProperties}>
            <div className="asc-orbit-stage" style={{ position: "relative", aspectRatio: "1 / 1" }}>
              <div
                role="status"
                aria-label={`${hubShown} ${p.hubLabel}`}
                style={{
                  position: "absolute", left: "50%", top: "50%", width: "24%", aspectRatio: "1 / 1",
                  transform: "translate(-50%, -50%)", borderRadius: "50%",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
                  background: "var(--hub-bg, #F4F2F9)", border: "2px solid var(--hub-border, #DDD8EA)",
                  boxShadow: "0 0 0 8px rgba(120, 105, 170, 0.07)", color: "var(--hub-text, #5E5480)",
                }}
              >
                <strong style={{ fontSize: "clamp(1.4rem, 8cqw, 3rem)", lineHeight: 1 }}>{hubShown}</strong>
                <span style={{ fontSize: "clamp(0.65rem, 2.1cqw, 0.85rem)", opacity: 0.75, marginTop: 4 }}>{p.hubLabel}</span>
              </div>

              {p.items.map((item, idx) => {
                const active = item.days[p.dayIdx];
                const cap = p.caption(item, active);
                const blocked = daily && p.dayIdx > todayIdx; // can't log the future
                return (
                  <div
                    key={item.id}
                    style={{
                      position: "absolute", width: "20%", transform: "translate(-50%, -50%)",
                      transition: "left 0.5s ease, top 0.5s ease", ...orbitPos(idx, p.items.length),
                    }}
                  >
                    <button
                      type="button"
                      className="asc-orbit-goal"
                      aria-haspopup="dialog"
                      aria-disabled={blocked}
                      aria-label={`${item.title}: ${item.days.filter(Boolean).length} of 7 days`}
                      onClick={() => !blocked && p.onSelect(item)}
                      style={{
                        position: "relative", display: "block", width: "100%", padding: 0, border: 0,
                        background: "none", font: "inherit", color: "inherit", cursor: blocked ? "default" : "pointer",
                      }}
                    >
                      <GoalRing goal={item} mode={p.mode} dayIdx={p.dayIdx} todayIdx={todayIdx} />
                      <span
                        style={{
                          position: "absolute", top: "100%", left: "-30%", width: "160%", marginTop: 8,
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                          textAlign: "center", pointerEvents: "none",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "clamp(11px, 2.7cqw, 15px)", lineHeight: 1.25,
                            textWrap: "balance" as CSSProperties["textWrap"],
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                          }}
                        >
                          {item.title}
                        </strong>
                        <span style={{ fontSize: "clamp(9.5px, 2cqw, 12px)", opacity: cap.dim ? 0.6 : 1, color: cap.color }}>{cap.text}</span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="asc-rail-wrap" aria-hidden={!daily}>
              <div className="asc-rail" role="group" aria-label="Select a day">
                {DAY_NAMES.map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    className={`asc-rail-day${daily && p.dayIdx === i ? " on" : ""}${i === todayIdx ? " today" : ""}`}
                    aria-pressed={daily && p.dayIdx === i}
                    disabled={i > todayIdx}
                    onClick={() => p.setDayIdx(i)}
                  >
                    <span className="name">
                      {name}
                      <small>{p.week ? p.week.dates[i] : ""}</small>
                    </span>
                    <span className="asc-rail-dots" aria-hidden="true">
                      {p.items.map((g) => (
                        <i key={g.id} style={g.days[i] ? { background: g.color, borderColor: g.color } : undefined} />
                      ))}
                    </span>
                    <span className="asc-rail-pts">{p.railText(i)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {p.items.length === 0 && <div className="asc-card asc-alt-empty">{p.emptyText}</div>}
        </>
      )}
    </div>
  );
}