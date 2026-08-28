"use client";

import { TrendSeries } from "../ascent/types";

interface TrendChartProps {
  weeks: string[];
  series: TrendSeries[];
}

export default function TrendChart({ weeks, series }: TrendChartProps) {
  const W = 780;
  const H = 300;
  const padL = 30;
  const padR = 16;
  const padT = 20;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xFor = (i: number) => padL + (i / (weeks.length - 1)) * plotW;
  const yFor = (v: number) => padT + plotH - (v / 100) * plotH;

  const gridLines = [0, 1, 2, 3, 4].map((g) => {
    const y = padT + (g / 4) * plotH;
    return (
      <g key={g}>
        <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#EEE9FA" strokeWidth={1} />
        <text x={padL - 8} y={y + 3} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize={9} fill="#9791AC">
          {100 - g * 25}
        </text>
      </g>
    );
  });

  const xLabels = weeks.map((w, i) => (
    <text
      key={w}
      x={xFor(i)}
      y={H - 10}
      textAnchor="middle"
      fontFamily="JetBrains Mono, monospace"
      fontSize={9.5}
      fill="#9791AC"
    >
      {w}
    </text>
  ));

  return (
    <div className="asc-chart-wrap">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 560 }}>
        {gridLines}
        {xLabels}
        {series.map((s) => {
          const points = s.data.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
          const lastX = xFor(s.data.length - 1);
          const lastY = yFor(s.data[s.data.length - 1]);
          return (
            <g key={s.name}>
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth={2.4}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.data.map((v, i) => (
                <circle key={i} cx={xFor(i)} cy={yFor(v)} r={3.2} fill={s.color} />
              ))}
              <text
                x={lastX + 8}
                y={lastY + 4}
                fontFamily="Space Grotesk, sans-serif"
                fontWeight={600}
                fontSize={11}
                fill={s.color}
              >
                {s.data[s.data.length - 1]}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
