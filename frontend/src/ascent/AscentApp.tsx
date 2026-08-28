"use client";

import { useState } from "react";
import { TabId } from "./types";
import Sidebar from "../components/Sidebar";
import FloatingBackground from "../components/FloatingBackground";
import DeckView from "../components/views/DeckView";
import FlightLogView from "../components/views/FlightLogView";
import AltitudeView from "../components/views/AltitudeView";
import TurbulenceView from "../components/views/TurbulenceView";
import RadarView from "../components/views/RadarView";
import DebriefView from "../components/views/DebriefView";
import AssistantView from "../components/views/AssistantView";
import "./styles/ascent.css";

const titles: Record<TabId, [string, string]> = {
  deck: ["Flight Deck", "Your week at a glance — pulled straight from your sheet, nothing entered here."],
  trail: ["Flight Log", "Every task from your To Do sheet, checked off where you checked it off."],
  summits: ["Altitude", "Long-range goals and how your logged effort is tracking against them."],
  terrain: ["Turbulence", "The weaknesses you've acknowledged, and how often you're meeting them."],
  radar: ["Radar", "Multi-week trends across every category you track."],
  notes: ["Debrief", "A ranked read on your data, written in plain language, with next steps."],
  assistant: ["Assistant", "Chat with your data — ask about any metric, week, or trend."],
};

export default function AscentApp() {
  const [tab, setTab] = useState<TabId>("deck");
  const [title, subtitle] = titles[tab];

  return (
    <div className="ascent-app">
      <div className="asc-sky-bg" aria-hidden="true" />
      <FloatingBackground />

      <div className="asc-layout">
        <Sidebar active={tab} onSelect={setTab} />

        <div className="asc-main">
          <div className="asc-topbar">
            <div className="asc-topbar-left">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <div className="asc-topbar-right">
              <div className="asc-badge-readonly">◎ read-only wrapper</div>
              <div style={{ marginTop: 6 }}>Week 34 · Aug 24–30, 2026</div>
            </div>
          </div>

          {/* key={tab} restarts the .asc-view rise-in animation on every switch */}
          <div key={tab}>
            {tab === "deck" && <DeckView onNavigate={setTab} />}
            {tab === "trail" && <FlightLogView />}
            {tab === "summits" && <AltitudeView />}
            {tab === "terrain" && <TurbulenceView />}
            {tab === "radar" && <RadarView />}
            {tab === "notes" && <DebriefView />}
            {tab === "assistant" && <AssistantView />}
          </div>
        </div>
      </div>
    </div>
  );
}
