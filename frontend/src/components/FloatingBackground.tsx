"use client";

import { useEffect, useRef } from "react";

interface ShapeDef {
  type: "circle" | "tri" | "hex";
  cx?: number;
  cy?: number;
  r?: number;
  points?: string;
  color: string;
  depth: number;
  filled?: boolean;
}

interface PathDef {
  d: string;
  color: string;
  w: number;
  op: number;
  depth: number;
}

const paths: PathDef[] = [
  { d: "M -50,600 C 260,500 560,680 1450,400", color: "#EC4899", w: 1.6, op: 0.26, depth: 0.4 },
  { d: "M -50,160 C 320,60 700,240 1450,100", color: "#7C4DFF", w: 1.6, op: 0.22, depth: 0.55 },
];

const shapes: ShapeDef[] = [
  { type: "circle", cx: 160, cy: 120, r: 56, color: "#EC4899", depth: 1.3 },
  { type: "circle", cx: 1240, cy: 180, r: 38, color: "#0EA5E9", depth: 1.6 },
  { type: "circle", cx: 1320, cy: 660, r: 64, color: "#7C4DFF", depth: 0.9 },
  { type: "tri", points: "1100,80 1160,180 1040,180", color: "#0EA5E9", depth: 1.8 },
  { type: "hex", cx: 660, cy: 60, r: 32, color: "#7C4DFF", depth: 1.1 },
  { type: "circle", cx: 700, cy: 800, r: 34, color: "#EC4899", depth: 1.7, filled: true },
  { type: "circle", cx: 1360, cy: 380, r: 12, color: "#7C4DFF", depth: 2.3, filled: true },
];

function hexPoints(cx: number, cy: number, r: number) {
  return [0, 1, 2, 3, 4, 5]
    .map((k) => {
      const a = (Math.PI / 3) * k - Math.PI / 2;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    })
    .join(" ");
}

export default function FloatingBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const groups = Array.from(container.querySelectorAll<SVGGElement>(".asc-pgroup"));
    let mouseX = 0;
    let mouseY = 0;
    let scrollY = 0;
    let raf = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    };
    const onScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll, { passive: true });

    function loop(t: number) {
      groups.forEach((g) => {
        const depth = parseFloat(g.dataset.depth || "1");
        const phase = parseFloat(g.dataset.phase || "0");
        const idle = Math.sin(t / 2400 + phase) * 10 * depth;
        const px = mouseX * 26 * depth;
        const py = mouseY * 20 * depth + idle - scrollY * 0.035 * depth;
        g.setAttribute("transform", `translate(${px} ${py})`);
      });
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="asc-shape-field" ref={containerRef} aria-hidden="true">
      <svg width="100%" height="100%" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice">
        {paths.map((p, i) => (
          <g key={`path-${i}`} className="asc-pgroup" data-depth={p.depth} data-phase={i * 1.7}>
            <path
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={p.w}
              strokeDasharray="2 10"
              strokeLinecap="round"
              opacity={p.op}
            />
          </g>
        ))}
        {shapes.map((s, i) => (
          <g key={`shape-${i}`} className="asc-pgroup" data-depth={s.depth} data-phase={(i + 3) * 1.2}>
            {s.type === "circle" && (
              <circle
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                fill={s.filled ? s.color : "none"}
                stroke={s.filled ? "none" : s.color}
                strokeWidth={1.4}
                opacity={s.filled ? 0.14 : 0.4}
              />
            )}
            {s.type === "tri" && (
              <polygon
                points={s.points}
                fill="none"
                stroke={s.color}
                strokeWidth={1.4}
                opacity={0.4}
                strokeLinejoin="round"
              />
            )}
            {s.type === "hex" && (
              <polygon
                points={hexPoints(s.cx || 0, s.cy || 0, s.r || 0)}
                fill="none"
                stroke={s.color}
                strokeWidth={1.4}
                opacity={0.4}
                strokeLinejoin="round"
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
