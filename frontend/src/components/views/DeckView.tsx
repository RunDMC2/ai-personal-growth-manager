"use client";

import RingProgress from "../RingProgress";
import FocusOrbit from "../FocusOrbit";
import { heatRows, focusNodes } from "../../ascent/data";
import { TabId } from "../../ascent/types";

interface DeckViewProps {
  onNavigate: (tab: TabId) => void;
}

export default function DeckView({ onNavigate }: DeckViewProps) {
  const totalActions = focusNodes.reduce((sum, n) => sum + n.value, 0);

  return (
    <div className="asc-view">
      <div className="asc-hero">
        <p className="asc-hero-title">Altitude gained this week</p>
        <h2 className="asc-hero-num">
          72<span>/ 100</span>
        </h2>
        <p className="asc-hero-desc">
          You engaged with at least one goal, task, or weakness on 6 of 7 days — a stronger climb than the last
          two weeks combined. Tuesday was the one flat stretch.
        </p>
        <div className="asc-hero-tags">
          <span className="asc-tag up">↑ 11 pts vs last week</span>
          <span className="asc-tag">6 / 7 days aloft</span>
          <span className="asc-tag">3-week high</span>
        </div>
        <div className="asc-hero-ring">
          <RingProgress percent={72} size={118} />
          <div className="asc-ring-label">
            DAYS ALOFT
            <br />
            6 of 7 this week
          </div>
        </div>
      </div>

      {/* Stat strip: one flowing bar instead of four separate boxes */}
      <div className="asc-stat-strip">
        <div className="asc-stat-strip-item">
          <div className="asc-stat-strip-icon" style={{ background: "var(--blue-tint)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#0879AD" strokeWidth={2}>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <div className="asc-stat-strip-num">
              18<span style={{ fontSize: 13, color: "var(--text-dim)" }}>/24</span>
            </div>
            <div className="asc-stat-strip-label">Tasks completed</div>
            <div className="asc-stat-strip-delta up">↑ 4 vs last week</div>
          </div>
        </div>
        <div className="asc-stat-divider" />
        <div className="asc-stat-strip-item">
          <div className="asc-stat-strip-icon" style={{ background: "var(--purple-tint)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#6B32E0" strokeWidth={2}>
              <path d="M4 20L10 8l3 5 2-3 5 10H4z" />
            </svg>
          </div>
          <div>
            <div className="asc-stat-strip-num">
              3<span style={{ fontSize: 13, color: "var(--text-dim)" }}>/4</span>
            </div>
            <div className="asc-stat-strip-label">Goals advanced</div>
            <div className="asc-stat-strip-delta up">↑ steady</div>
          </div>
        </div>
        <div className="asc-stat-divider" />
        <div className="asc-stat-strip-item">
          <div className="asc-stat-strip-icon" style={{ background: "var(--pink-tint)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#C22B76" strokeWidth={2}>
              <path d="M2 12c2-4 4 4 6 0s4-4 6 0 4-4 6 0" />
            </svg>
          </div>
          <div>
            <div className="asc-stat-strip-num">
              5<span style={{ fontSize: 13, color: "var(--text-dim)" }}>/7</span>
            </div>
            <div className="asc-stat-strip-label">Weakness check-ins</div>
            <div className="asc-stat-strip-delta down">↓ 1 vs last week</div>
          </div>
        </div>
        <div className="asc-stat-divider" />
        <div className="asc-stat-strip-item">
          <div className="asc-stat-strip-icon" style={{ background: "var(--wash)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#6C6484" strokeWidth={2}>
              <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
            </svg>
          </div>
          <div>
            <div className="asc-stat-strip-num">
              12<span style={{ fontSize: 13, color: "var(--text-dim)" }}> days</span>
            </div>
            <div className="asc-stat-strip-label">Current streak</div>
            <div className="asc-stat-strip-delta up">Best this quarter</div>
          </div>
        </div>
      </div>

      {/* Focus orbit: radial diagram instead of another rectangle */}
      <div className="asc-focus-section">
        <div className="asc-focus-orbit">
          <FocusOrbit nodes={focusNodes} totalValue={totalActions} totalLabel="ACTIONS" />
        </div>
        <div className="asc-focus-copy">
          <h3>Where your week went</h3>
          <p>
            {totalActions} logged actions this week, weighted heavily toward Tasks. Weaknesses is the smallest
            node here — and the one your Debrief keeps circling back to.
          </p>
          <div className="asc-focus-legend">
            {focusNodes.map((n) => (
              <div className="asc-focus-legend-item" key={n.label}>
                <span className="asc-focus-legend-dot" style={{ background: n.color }} />
                {n.label} · {n.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="asc-section-head">
        <h2>Daily consistency</h2>
        <span className="asc-section-note">Mon → Sun, by category</span>
      </div>
      <div className="asc-heat-panel">
        <div className="asc-heat-days">
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
          <span>S</span>
        </div>
        {heatRows.map((row) => (
          <div className="asc-heat-row" key={row.label}>
            <div className="asc-heat-row-label">{row.label}</div>
            <div className="asc-heat-cells">
              {row.cells.map((cell, i) => (
                <div className="asc-heat-cell" data-lvl={cell.level} key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="asc-section-head">
        <h2>Top insight from your Debrief</h2>
        <span className="asc-section-note">3 total — see Debrief tab</span>
      </div>
      <div className="asc-insight-block">
        <div className="asc-insight-num">1</div>
        <div>
          <h4>Move your hardest conversation to Monday</h4>
          <p>
            Tuesday keeps coming up empty — three of your last four quiet days landed there, and it&apos;s also
            when &quot;avoiding hard conversations&quot; goes unaddressed most.{" "}
            <button onClick={() => onNavigate("notes")}>Read the full debrief →</button>
          </p>
        </div>
      </div>
    </div>
  );
}
