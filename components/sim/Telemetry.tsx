"use client";

import { Section, Stat } from "@/components/ui/Controls";
import { DROPOUT_V, I_LIMIT_A, fmt, type SimSolution } from "@/lib/circuit";

const WARN_TONE: Record<string, "rose" | "amber" | "neon"> = {
  fault: "rose",
  thermal: "rose",
  dropout: "amber",
  limit: "amber",
};

export default function Telemetry({ sol }: { sol: SimSolution }) {
  const warnings: Array<{ key: string; text: string }> = [];

  if (sol.isFault) {
    warnings.push({ key: "fault", text: "Short circuit across the output terminals — series pass element is open." });
  }
  if (sol.headroom < DROPOUT_V && !sol.isFault) {
    warnings.push({
      key: "dropout",
      text: `Dropped out of regulation: headroom ${fmt(sol.headroom, 2)} V < ${DROPOUT_V} V dropout. Raise the AC input or lower V_out.`,
    });
  }
  if (sol.regulationLimit === "current") {
    warnings.push({ key: "limit", text: `Load demands more than ${I_LIMIT_A} A — the LM317 current limit is holding the output.` });
  }
  if (sol.pDiss > 5) {
    warnings.push({ key: "thermal", text: `Pass element dissipating ${fmt(sol.pDiss, 1)} W — a heatsink is required above 2 W.` });
  }
  if (warnings.length === 0) {
    warnings.push({ key: "ok", text: "Regulator in C.V. mode, ripple within limits, junction inside safe area." });
  }

  const eff = Math.max(0, Math.min(100, sol.efficiency));

  return (
    <Section
      title="Real-Time Telemetry"
      tag="C"
      right={
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${sol.isFault ? "bg-neon-rose" : "animate-pulse bg-neon-lime"}`} />
          live
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat k="V out" v={fmt(sol.vOut, 2)} unit="V" tone={sol.isFault ? "rose" : "neon"} hint={`set ${fmt(sol.vSet, 2)} V`} />
        <Stat
          k="I load"
          v={sol.iLoad < 1 ? fmt(sol.iLoad * 1000, 0) : fmt(sol.iLoad, 3)}
          unit={sol.iLoad < 1 ? "mA" : "A"}
          tone="lime"
          hint={`R_L ${fmt(sol.rLoadOhm, 1)} Ω`}
        />
        <Stat
          k="V ripple"
          v={sol.rippleMv >= 1000 ? fmt(sol.rippleMv / 1000, 3) : fmt(sol.rippleMv, 1)}
          unit={sol.rippleMv >= 1000 ? "V" : "mV"}
          tone={sol.rippleMv > 1000 ? "amber" : "neon"}
          hint="I / (f · C)"
        />
        <Stat k="Efficiency" v={fmt(eff, 1)} unit="%" tone={eff < 40 ? "amber" : "lime"} hint={`P_out ${fmt(sol.pOut, 2)} W`} />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="label">Linear-regulator efficiency</span>
          <span className="font-mono text-[10px] text-slate-600">η = V_out / V_bus</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/60">
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{
              width: `${eff}%`,
              background: sol.isFault
                ? "linear-gradient(90deg,#7a1024,#ff4d6d)"
                : "linear-gradient(90deg,#0b8fa8,#22e6ff 60%,#7cff6b)",
              boxShadow: "0 0 14px rgba(34,230,255,.6)",
            }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat k="V bus" v={fmt(sol.vBus, 2)} unit="V" tone="muted" hint="filtered DC" />
        <Stat k="P diss" v={fmt(sol.pDiss, 2)} unit="W" tone={sol.pDiss > 5 ? "rose" : "muted"} hint="LM317 junction" />
        <Stat k="Headroom" v={fmt(sol.headroom, 2)} unit="V" tone={sol.headroom < DROPOUT_V ? "amber" : "muted"} hint={`min ${DROPOUT_V} V`} />
      </div>

      <ul className="mt-3 space-y-1.5">
        {warnings.map((w) => {
          const tone = w.key === "ok" ? "lime" : WARN_TONE[w.key] ?? "amber";
          return (
            <li
              key={w.key}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[11.5px] leading-snug ${
                tone === "lime"
                  ? "border-neon-lime/20 bg-neon-lime/[0.05] text-neon-lime/85"
                  : tone === "rose"
                    ? "border-neon-rose/25 bg-neon-rose/[0.07] text-neon-rose"
                    : "border-neon-amber/25 bg-neon-amber/[0.06] text-neon-amber"
              }`}
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              {w.text}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
