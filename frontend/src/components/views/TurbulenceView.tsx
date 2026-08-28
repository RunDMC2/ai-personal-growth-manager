"use client";

import { weaknesses } from "../../ascent/data";
import { Weakness } from "../../ascent/types";

const statusToPill: Record<Weakness["status"], string> = {
  "needs-attention": "late",
  "in-progress": "open",
  "on-track": "done",
};

function WeaknessCard({ w, accentOverride }: { w: Weakness; accentOverride?: boolean }) {
  return (
    <div className="asc-card asc-terrain-card" style={accentOverride ? { borderLeftColor: `var(${w.accentVar})` } : undefined}>
      <div className="asc-terrain-top">
        <div>
          <h3>{w.title}</h3>
          <span className="asc-terrain-freq">{w.frequencyLabel}</span>
        </div>
        <span className={`asc-pill ${statusToPill[w.status]}`}>{w.statusLabel}</span>
      </div>
      <div className="asc-terrain-note">
        <b>Pattern:</b> {w.pattern}
      </div>
    </div>
  );
}

export default function TurbulenceView() {
  const [urgent, ...rest] = weaknesses;

  return (
    <div className="asc-view">
      <div className="asc-section-head">
        <h2>Weaknesses you&apos;re working</h2>
        <span className="asc-section-note">Acknowledged in your sheet, tracked here</span>
      </div>

      <div className="asc-turbulence-layout">
        <WeaknessCard w={urgent} />
        <div className="asc-turbulence-row">
          {rest.map((w) => (
            <WeaknessCard w={w} accentOverride key={w.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
