"use client";

export function Slider({
  label,
  hint,
  value,
  min,
  max,
  step = 0.001,
  onChange,
  display,
  disabled,
  fault,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  display: string;
  disabled?: boolean;
  fault?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={disabled ? "opacity-45" : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="label">{label}</span>
        <span className={`font-mono text-[13px] tabular-nums ${fault ? "text-neon-rose" : "text-neon-soft"}`}>
          {display}
        </span>
      </div>
      <input
        type="range"
        className={`rail mt-2.5 ${fault ? "rail-fault" : ""}`}
        style={{ ["--fill" as string]: `${pct}%` }}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <div className="mt-1.5 font-mono text-[10px] text-slate-600">{hint}</div>}
    </div>
  );
}

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns,
}: {
  label?: string;
  options: Array<{ value: T; label: string; sub?: string }>;
  value: T;
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div>
      {label && <div className="label mb-2">{label}</div>}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0,1fr))` }}
      >
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={on}
              className={`rounded-lg border px-2 py-2 text-center transition ${
                on
                  ? "border-neon/50 bg-neon/[0.12] text-neon-soft shadow-glow"
                  : "border-white/[0.07] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-slate-200"
              }`}
            >
              <div className="font-mono text-[12px] leading-tight">{o.label}</div>
              {o.sub && <div className="mt-0.5 text-[9px] uppercase tracking-wider opacity-70">{o.sub}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FaultToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-xl border px-4 py-3.5 text-left transition ${
        on
          ? "border-neon-rose/60 bg-neon-rose/[0.13] shadow-fault"
          : "border-white/10 bg-white/[0.02] hover:border-neon-rose/40 hover:bg-neon-rose/[0.06]"
      }`}
    >
      <span
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/12 to-transparent transition-transform duration-700 group-hover:translate-x-[420%]"
        aria-hidden
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
              on ? "border-neon-rose/60 bg-neon-rose/20" : "border-white/10 bg-black/40"
            }`}
          >
            <svg viewBox="0 0 24 24" className={`h-4 w-4 ${on ? "text-neon-rose" : "text-slate-400"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
            </svg>
          </span>
          <div>
            <div className={`text-[13px] font-semibold ${on ? "text-neon-rose" : "text-slate-200"}`}>
              Simulate Short Circuit
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500">
              {on ? "Protection tripped · output 0 V" : "Fault injection on R_L terminals"}
            </div>
          </div>
        </div>
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
            on ? "border-neon-rose/60 bg-neon-rose/30" : "border-white/12 bg-black/50"
          }`}
        >
          <span
            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all ${
              on ? "left-[calc(100%-1.15rem)] bg-neon-rose shadow-fault" : "left-1 bg-slate-500"
            }`}
          />
        </span>
      </div>
    </button>
  );
}

export function Section({
  title,
  tag,
  right,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title: string;
  tag?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`surface overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5">
          {tag && (
            <span className="grid h-5 w-5 place-items-center rounded border border-neon/30 bg-neon/10 font-mono text-[10px] text-neon">
              {tag}
            </span>
          )}
          <h2 className="panel-title">{title}</h2>
        </div>
        {right}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Stat({
  k,
  v,
  unit,
  tone = "neon",
  hint,
}: {
  k: string;
  v: string;
  unit?: string;
  tone?: "neon" | "rose" | "lime" | "amber" | "muted";
  hint?: string;
}) {
  const color =
    tone === "rose"
      ? "text-neon-rose"
      : tone === "lime"
        ? "text-neon-lime"
        : tone === "amber"
          ? "text-neon-amber"
          : tone === "muted"
            ? "text-slate-400"
            : "text-neon";
  return (
    <div className="surface-inset relative overflow-hidden px-3 py-2.5">
      <div className="text-[9.5px] uppercase tracking-[0.16em] text-slate-500">{k}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`font-mono text-[17px] leading-none tabular-nums ${color}`}>{v}</span>
        {unit && <span className="font-mono text-[10px] text-slate-500">{unit}</span>}
      </div>
      {hint && <div className="mt-1 font-mono text-[9.5px] text-slate-600">{hint}</div>}
    </div>
  );
}
