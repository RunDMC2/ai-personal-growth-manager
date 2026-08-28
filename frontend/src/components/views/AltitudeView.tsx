"use client";

import RingProgress from "../RingProgress";
import { goals } from "../../ascent/data";

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  return (
    <div className="asc-spark">
      {values.map((v, i) => (
        <div
          key={i}
          className={v > max * 0.6 ? "hi" : ""}
          style={{ height: Math.max(4, (v / max) * 24) }}
        />
      ))}
    </div>
  );
}

export default function AltitudeView() {
  const [featured, ...rest] = goals;

  return (
    <div className="asc-view">
      <div className="asc-section-head">
        <h2>Active goals</h2>
        <span className="asc-section-note">{goals.length} tracked, ranked by momentum</span>
      </div>

      <div className="asc-altitude-feature">
        <div className="asc-card asc-summit-card">
          <div className="asc-summit-info">
            <h3>{featured.title}</h3>
            <p>{featured.description}</p>
            <Sparkline values={featured.sparkline} />
          </div>
          <RingProgress percent={featured.progressPct} size={92} />
        </div>
      </div>

      <div className="asc-altitude-mosaic">
        {rest.map((goal, i) => (
          <div className={`asc-card asc-summit-card asc-g${i + 2}`} key={goal.id}>
            <div className="asc-summit-info">
              <h3>{goal.title}</h3>
              <p>{goal.description}</p>
              {i === 0 && <Sparkline values={goal.sparkline} />}
            </div>
            <RingProgress percent={goal.progressPct} size={i === 0 ? 72 : 60} />
          </div>
        ))}
      </div>
    </div>
  );
}
