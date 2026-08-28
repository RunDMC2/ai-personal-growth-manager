"use client";

import { useEffect, useId, useRef, useState } from "react";

interface RingProgressProps {
  percent: number;
  size?: number;
  showLabel?: string; // optional label text under the ring, e.g. "DAYS ALOFT\n6 of 7"
}

export default function RingProgress({ percent, size = 84 }: RingProgressProps) {
  const gradientId = useId();
  const circleRef = useRef<SVGCircleElement>(null);
  const [mounted, setMounted] = useState(false);

  const stroke = size > 70 ? 5 : 3.5;
  const r = size / 2 - stroke;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percent / 100);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !circleRef.current) return;
    // Animate from full circumference down to the target offset after mount.
    const el = circleRef.current;
    el.style.transition = "none";
    el.style.strokeDashoffset = `${circumference}`;
    // Force reflow so the browser registers the starting state before animating.
    void el.getBoundingClientRect();
    const timeout = setTimeout(() => {
      el.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)";
      el.style.strokeDashoffset = `${offset}`;
    }, 100);
    return () => clearTimeout(timeout);
  }, [mounted, offset, circumference]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="50%" stopColor="#7C4DFF" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EFEBFA" strokeWidth={stroke} />
      <circle
        ref={circleRef}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={mounted ? offset : circumference}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx}
        y={cy + (size > 70 ? 6 : 5)}
        textAnchor="middle"
        fill="#1E1832"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight={700}
        fontSize={size > 70 ? 18 : 12}
      >
        {percent}%
      </text>
    </svg>
  );
}
