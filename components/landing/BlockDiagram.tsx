const BLOCKS = [
  { k: "MAINS", v: "230 V", s: "50 Hz", tone: "text-amber-300" },
  { k: "TRANSFORMER", v: "12 / 24 V", s: "step-down", tone: "text-neon-soft" },
  { k: "BRIDGE", v: "4 × Si", s: "full wave", tone: "text-orange-300" },
  { k: "FILTER", v: "100–4700 µF", s: "C store", tone: "text-neon" },
  { k: "LM317", v: "V_out", s: "1.25(1+R₂/R₁)", tone: "text-lime-300" },
  { k: "LOAD", v: "R_L", s: "I = V/R", tone: "text-rose-300" },
];

export default function BlockDiagram() {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
      {BLOCKS.map((b, i) => (
        <div key={b.k} className="flex flex-1 items-center gap-3">
          <div className="group relative flex-1 overflow-hidden rounded-xl border border-white/[0.08] bg-[#080f18] px-3 py-3 transition hover:border-neon/40">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/60 to-transparent opacity-40 transition group-hover:opacity-100" />
            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">{b.k}</div>
            <div className={`mt-1 font-mono text-sm ${b.tone}`}>{b.v}</div>
            <div className="text-[10px] text-slate-500">{b.s}</div>
          </div>
          {i < BLOCKS.length - 1 && (
            <svg viewBox="0 0 18 18" className="hidden h-4 w-4 shrink-0 text-neon/45 lg:block" aria-hidden>
              <path d="M2 9h11m0 0-4-4m4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
