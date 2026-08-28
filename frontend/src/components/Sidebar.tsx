"use client";

import type { ReactNode } from "react";
import { TabId } from "../ascent/types";

interface NavItem {
  id: TabId;
  label: string;
  sub?: string;
  icon: ReactNode;
}

const guidanceItems: NavItem[] = [
  {
    id: "deck",
    label: "Flight Deck",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    id: "trail",
    label: "Flight Log",
    sub: "24",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M22 2L11 13M22 2l-7 19-4-9-9-4 20-6z" />
      </svg>
    ),
  },
  {
    id: "summits",
    label: "Altitude",
    sub: "4",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M4 20L10 8l3 5 2-3 5 10H4z" />
      </svg>
    ),
  },
  {
    id: "terrain",
    label: "Turbulence",
    sub: "3",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M2 12c2-4 4 4 6 0s4-4 6 0 4-4 6 0" />
      </svg>
    ),
  },
  {
    id: "radar",
    label: "Radar",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const aiReviewItems: NavItem[] = [
  {
    id: "notes",
    label: "Debrief",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    id: "assistant",
    label: "Assistant",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="M4 4h16v12H8l-4 4V4z" />
        <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="13" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="17" cy="10" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

interface SidebarProps {
  active: TabId;
  onSelect: (tab: TabId) => void;
}

function NavRow({ item, active, onSelect }: { item: NavItem; active: TabId; onSelect: (t: TabId) => void }) {
  return (
    <div
      className={`asc-nav-item${active === item.id ? " active" : ""}`}
      onClick={() => onSelect(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(item.id);
      }}
    >
      {item.icon}
      {item.label}
      {item.sub && <span className="asc-nav-sub">{item.sub}</span>}
    </div>
  );
}

export default function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <div className="asc-sidebar">
      <div className="asc-brand">
        <svg className="asc-brand-mark" viewBox="0 0 32 32" fill="none">
          <path d="M16 3 L26 22 L16 17 L6 22 Z" fill="#EC4899" />
          <path d="M16 3 L26 22 L16 17 Z" fill="#7C4DFF" opacity={0.8} />
        </svg>
        <span className="asc-brand-name">Ascent</span>
      </div>

      <div className="asc-nav-eyebrow">Guidance layer</div>
      {guidanceItems.map((item) => (
        <NavRow key={item.id} item={item} active={active} onSelect={onSelect} />
      ))}

      <div className="asc-nav-eyebrow">AI review</div>
      {aiReviewItems.map((item) => (
        <NavRow key={item.id} item={item} active={active} onSelect={onSelect} />
      ))}

      {/* Decorative radar-sweep graphic filling the sidebar's bottom whitespace */}
      <div className="asc-sidebar-art">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="62" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
          <circle cx="75" cy="75" r="42" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={1} />
          <circle cx="75" cy="75" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          <line x1="13" y1="75" x2="137" y2="75" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          <line x1="75" y1="13" x2="75" y2="137" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          <g className="asc-radar-sweep">
            <path d="M75,75 L75,13 A62,62 0 0 1 106,21.3 Z" fill="url(#asc-sweep-grad)" />
          </g>
          <circle className="asc-radar-blip" cx="108" cy="52" r="3.5" fill="#FF8FC4" />
          <circle className="asc-radar-blip" cx="52" cy="100" r="3" fill="#7FD8FF" />
          <circle className="asc-radar-blip" cx="95" cy="108" r="2.6" fill="#B9A2FF" />
          <circle cx="75" cy="75" r="3" fill="#fff" />
          <defs>
            <linearGradient id="asc-sweep-grad" x1="75" y1="75" x2="106" y2="21" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EC4899" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#EC4899" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="asc-sidebar-foot">
        <div>
          <span className="asc-sync-dot" />
          Sheet synced 6:12 AM
        </div>
        <div style={{ opacity: 0.7, marginTop: 2 }}>Source: growth-log.xlsx</div>
      </div>
    </div>
  );
}
