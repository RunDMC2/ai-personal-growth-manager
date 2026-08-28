"use client";

import TrendChart from "../TrendChart";
import { trendWeeks, trendSeries } from "../../ascent/data";

export default function RadarView() {
  return (
    <div className="asc-view">
      <div className="asc-section-head">
        <h2>8-week trend</h2>
        <span className="asc-section-note">Weekly engagement rate by category</span>
      </div>
      <div className="asc-card">
        <div className="asc-legend">
          {trendSeries.map((s) => (
            <div className="asc-legend-item" key={s.name}>
              <span className="asc-legend-dot" style={{ background: s.color }} />
              {s.name}
            </div>
          ))}
        </div>
        <TrendChart weeks={trendWeeks} series={trendSeries} />
      </div>

      <div className="asc-radar-cluster">
        <div className="asc-radar-stat feature">
          <p className="asc-eyebrow">Best category</p>
          <div className="asc-val" style={{ color: "var(--blue-text)" }}>
            Tasks
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-dim)" }}>
            76% average engagement over the last 8 weeks — your most reliable category by a wide margin.
          </p>
        </div>
        <div className="asc-radar-stat b">
          <p className="asc-eyebrow">Most improved</p>
          <div className="asc-val" style={{ color: "var(--purple-text)" }}>
            Goals
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--text-dim)" }}>+22 pts since Week 27</p>
        </div>
        <div className="asc-radar-stat c">
          <p className="asc-eyebrow">Needs a push</p>
          <div className="asc-val" style={{ color: "var(--pink-text)" }}>
            Weaknesses
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--text-dim)" }}>Flat for 4 straight weeks</p>
        </div>
      </div>
    </div>
  );
}
