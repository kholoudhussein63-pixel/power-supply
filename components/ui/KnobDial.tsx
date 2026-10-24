"use client";

import { useCallback, useRef } from "react";

const SWEEP = 135;

function polar(cx: number, cy: number, r: number, deg: number) {
  const r_ = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(r_), cy + r * Math.sin(r_)] as const;
}

interface Props {
  value: number;
  onChange: (v: number) => void;
  label: string;
  readout: string;
  size?: number;
  disabled?: boolean;
  accent?: string;
}

export default function KnobDial({ value, onChange, label, readout, size = 116, disabled, accent = "#22e6ff" }: Props) {
  const drag = useRef<{ y: number; x: number; start: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (disabled) return;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      drag.current = { y: e.clientY, x: e.clientX, start: value };
    },
    [disabled, value]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const d = drag.current;
      if (!d) return;
      const delta = (d.y - e.clientY) + (e.clientX - d.x);
      onChange(Math.min(1, Math.max(0, d.start + delta / 220)));
    },
    [onChange]
  );

  const end = useCallback(() => {
    drag.current = null;
  }, []);

  const angle = -SWEEP + value * SWEEP * 2;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 3;
  const rTick = rOuter - 7;
  const rKnob = rOuter - 17;

  const arcStart = polar(cx, cy, rTick - 4, -SWEEP);
  const arcEnd = polar(cx, cy, rTick - 4, angle);
  const large = value * SWEEP * 2 > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        className={`canvas-host select-none outline-none ${disabled ? "opacity-40" : "cursor-ns-resize"} focus-visible:ring-2 focus-visible:ring-neon/50 rounded-full`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onWheel={(e) => {
          if (disabled) return;
          onChange(Math.min(1, Math.max(0, value - Math.sign(e.deltaY) * 0.02)));
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          const step = e.shiftKey ? 0.1 : 0.02;
          if (e.key === "ArrowUp" || e.key === "ArrowRight") onChange(Math.min(1, value + step));
          if (e.key === "ArrowDown" || e.key === "ArrowLeft") onChange(Math.max(0, value - step));
          if (e.key === "Home") onChange(0);
          if (e.key === "End") onChange(1);
        }}
      >
        <defs>
          <radialGradient id={`kg-${label}`} cx="50%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#2a3b52" />
            <stop offset="62%" stopColor="#16202d" />
            <stop offset="100%" stopColor="#080d14" />
          </radialGradient>
        </defs>

        {Array.from({ length: 21 }).map((_, i) => {
          const a = -SWEEP + (i / 20) * SWEEP * 2;
          const on = a <= angle + 0.001;
          const [x1, y1] = polar(cx, cy, rTick, a);
          const [x2, y2] = polar(cx, cy, rTick - (i % 5 === 0 ? 8 : 4.5), a);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={on ? accent : "#22303f"}
              strokeWidth={i % 5 === 0 ? 1.9 : 1.1}
              strokeLinecap="round"
              opacity={on ? 0.95 : 0.7}
            />
          );
        })}

        <circle cx={cx} cy={cy} r={rKnob + 3} fill="#050a11" />
        <circle cx={cx} cy={cy} r={rKnob} fill={`url(#kg-${label})`} stroke="rgba(255,255,255,.09)" strokeWidth="1" />
        <path
          d={`M ${arcStart[0]} ${arcStart[1]} A ${rTick - 4} ${rTick - 4} 0 ${large} 1 ${arcEnd[0]} ${arcEnd[1]}`}
          fill="none"
          stroke={accent}
          strokeOpacity="0.22"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <g transform={`rotate(${angle} ${cx} ${cy})`}>
          <line
            x1={cx}
            y1={cy - rKnob + 6}
            x2={cx}
            y2={cy - 4}
            stroke={accent}
            strokeWidth="3.2"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${accent})` }}
          />
        </g>
        <circle cx={cx} cy={cy - rKnob * 0.42} r={rKnob * 0.42} fill="rgba(255,255,255,.045)" />
      </svg>
      <div className="text-center">
        <div className="font-mono text-[13px] leading-none" style={{ color: accent }}>
          {readout}
        </div>
        <div className="label mt-1.5">{label}</div>
      </div>
    </div>
  );
}
