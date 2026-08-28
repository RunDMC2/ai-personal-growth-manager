"use client";

import { FocusNode } from "../ascent/types";

interface FocusOrbitProps {
  nodes: FocusNode[];
  totalLabel: string;
  totalValue: number;
}

export default function FocusOrbit({ nodes, totalLabel, totalValue }: FocusOrbitProps) {
  const cx = 108;
  const cy = 128;
  const hubR = 40;
  const orbitR = 78;
  const maxV = Math.max(...nodes.map((n) => n.value));

  return (
    <svg width={216} height={236} viewBox="0 0 216 236">
      {nodes.map((n, i) => {
        const rad = (n.angleDeg * Math.PI) / 180;
        const nx = cx + orbitR * Math.cos(rad);
        const ny = cy + orbitR * Math.sin(rad);
        return (
          <line
            key={`line-${i}`}
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke={n.color}
            strokeWidth={1.4}
            opacity={0.35}
          />
        );
      })}

      <circle cx={cx} cy={cy} r={hubR} fill="#F4F2FB" stroke="#E5E1F1" strokeWidth={1} />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight={700}
        fontSize={20}
        fill="#1E1832"
      >
        {totalValue}
      </text>
      <text
        x={cx}
        y={cy + 13}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize={9}
        fill="#6C6484"
      >
        {totalLabel}
      </text>

      {nodes.map((n, i) => {
        const rad = (n.angleDeg * Math.PI) / 180;
        const nx = cx + orbitR * Math.cos(rad);
        const ny = cy + orbitR * Math.sin(rad);
        const nr = 14 + (n.value / maxV) * 20;
        return (
          <g key={`node-${i}`}>
            <circle cx={nx} cy={ny} r={nr} fill={n.color} opacity={0.16} />
            <circle cx={nx} cy={ny} r={nr} fill="none" stroke={n.color} strokeWidth={1.6} />
            <text
              x={nx}
              y={ny + 4}
              textAnchor="middle"
              fontFamily="Space Grotesk, sans-serif"
              fontWeight={700}
              fontSize={13}
              fill={n.color}
            >
              {n.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
