"use client";

import { recommendations } from "../../ascent/data";

export default function DebriefView() {
  return (
    <div className="asc-view">
      <div className="asc-debrief-head">
        <div>
          <h2>Week 34 debrief</h2>
          <p>Written from your logged data — Aug 24 to Aug 30</p>
        </div>
        <span className="asc-badge-readonly">◎ AI-generated</span>
      </div>
      <p className="asc-debrief-intro">
        Momentum is up, and it&apos;s up for a real reason: you finished things earlier in the week instead of
        scrambling into Sunday. Three moves would build on that next week — ranked by expected impact.
      </p>

      <div className="asc-reco-grid">
        {recommendations.map((r) => (
          <div className={`asc-reco-card n${r.rank}`} key={r.id}>
            <div className="asc-reco-num-big">{r.rank}</div>
            <div>
              <div className="asc-reco-title">{r.title}</div>
              <p className="asc-reco-desc">{r.description}</p>
              <div className="asc-reco-why">{r.why}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="asc-debrief-context">
        <h4>Full reasoning</h4>
        <p>
          Seventy-two out of a possible hundred this week, your best since early July. The gain isn&apos;t from
          doing more — you logged roughly the same number of total actions as Week 32 — it&apos;s from spreading
          them out. Monday and Wednesday now carry real weight instead of Sunday absorbing everything.
        </p>
        <p>
          The exception is Tuesday, which has been quiet in three of your last four weeks. It&apos;s also the day
          your &quot;avoiding hard conversations&quot; weakness goes unaddressed most often. Those two facts are
          probably the same fact: Tuesday is when your calendar fills up with other people&apos;s priorities
          before you&apos;ve claimed any time for your own.
        </p>
      </div>
    </div>
  );
}
