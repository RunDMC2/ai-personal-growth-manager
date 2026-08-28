"use client";

import { dayLogs } from "../../ascent/data";

export default function FlightLogView() {
  return (
    <div className="asc-view">
      <div className="asc-section-head">
        <h2>Open this week</h2>
        <span className="asc-section-note">Synced from your To Do sheet</span>
      </div>
      <div className="asc-card">
        {dayLogs.map((log, i) => (
          <div
            className="asc-log-day"
            key={log.day}
            style={i === dayLogs.length - 1 ? { borderLeftColor: "transparent", marginBottom: 0 } : undefined}
          >
            <div className="asc-log-day-label">{log.day}</div>
            {log.tasks.map((task) => (
              <div className="asc-log-task" key={task.id}>
                <div className="asc-log-task-left">
                  <div className={`asc-task-check${task.done ? " done" : ""}`} />
                  <div className="asc-task-name">
                    {task.name}
                    <span className="asc-task-cat">{task.category}</span>
                  </div>
                </div>
                <div className={`asc-pill ${task.status}`}>{task.statusLabel}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-dimmer)", marginTop: 14 }}>
        Tasks are logged and checked off in your sheet — this view just keeps score. To add or edit a task, open
        growth-log.xlsx.
      </p>
    </div>
  );
}
