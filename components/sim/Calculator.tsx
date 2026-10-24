"use client";

import { useState } from "react";
import { Section } from "@/components/ui/Controls";
import {
  BRIDGE_DROP_V,
  CAP_OPTIONS,
  DROPOUT_V,
  I_LIMIT_A,
  LM317_R1,
  LM317_VREF,
  MAINS_FREQ_HZ,
  POT_R2_MAX,
  RIPPLE_FREQ_HZ,
  fmt,
  r2ForOutput,
} from "@/lib/circuit";
import type { SimulatorState } from "@/hooks/useSimulator";

function Field({
  label,
  unit,
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="relative mt-1.5">
        <input
          type="number"
          className="numfield pr-10"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          step={step}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-500">
          {unit}
        </span>
      </div>
    </label>
  );
}

export default function Calculator({ sim }: { sim: SimulatorState }) {
  const [vout, setVout] = useState(12);
  const [iload, setIload] = useState(0.5);
  const [rippleMv, setRippleMv] = useState(50);
  const [r1, setR1] = useState(LM317_R1);

  const r2 = r2ForOutput(vout, r1);
  const rippleV = rippleMv / 1000;
  const capUf = iload / (RIPPLE_FREQ_HZ * rippleV) * 1e6;
  const busNeeded = vout + DROPOUT_V + rippleV / 2;
  const acRmsNeeded = (busNeeded + BRIDGE_DROP_V) / Math.SQRT2;
  const pOut = vout * iload;
  const pDiss = (busNeeded - vout) * (iload + 0.01);
  const eff = (vout / busNeeded) * 100;
  const heatsink = pDiss > 2 ? pDiss * 12 : 0;
  const overCurrent = iload > I_LIMIT_A;

  const rows: Array<[string, string, string]> = [
    ["R₂ (potentiometer)", `${fmt(r2, 0)} Ω`, `V_out = ${LM317_VREF}(1 + R₂/R₁)`],
    ["Filter capacitor", `${fmt(capUf, 0)} µF`, `C = I_load / (f · V_ripple), f = ${RIPPLE_FREQ_HZ} Hz`],
    ["DC bus required", `${fmt(busNeeded, 2)} V`, `V_out + ${DROPOUT_V} V dropout + V_ripple/2`],
    ["Transformer secondary", `${fmt(acRmsNeeded, 1)} V AC`, `V_rms = (V_bus + 2V_d)/√2 @ ${MAINS_FREQ_HZ} Hz`],
    ["Output power", `${fmt(pOut, 2)} W`, `P = V_out · I_load`],
    ["Pass-element loss", `${fmt(pDiss, 2)} W`, `P = (V_bus − V_out) · I_load`],
    ["Efficiency", `${fmt(eff, 1)} %`, `η = V_out / V_bus`],
    ["Heatsink target", heatsink > 0 ? `< ${heatsink.toFixed(0)} °C/W` : "not required", "ambient rise budget at 40 °C"],
  ];

  const potOk = r2 <= POT_R2_MAX;

  const apply = () => {
    sim.setTargetVolts(vout);
    sim.setLoadOhm(vout / Math.max(iload, 1e-4));
    const nearest = CAP_OPTIONS.reduce((a, b) => (Math.abs(b.uf - capUf) < Math.abs(a.uf - capUf) ? b : a));
    sim.setCapacitanceUf(nearest.uf);
    sim.setShortCircuit(false);
  };

  return (
    <Section
      title="Design Calculator"
      tag="Σ"
      right={<span className="font-mono text-[10px] text-slate-600">forward design sheet</span>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Field label="Desired V out" unit="V" value={vout} onChange={setVout} step={0.5} min={1.25} />
          <Field label="Load current" unit="A" value={iload} onChange={setIload} step={0.05} min={0.001} />
          <Field label="Allowed ripple" unit="mV" value={rippleMv} onChange={setRippleMv} step={5} min={1} />
          <Field label="R₁ (Rset)" unit="Ω" value={r1} onChange={setR1} step={10} min={1} />

          <button type="button" className="btn-primary w-full !px-4 !py-3 !text-[11px]" onClick={apply}>
            <span>Apply to simulator</span>
          </button>
          {overCurrent && (
            <p className="rounded-lg border border-neon-rose/25 bg-neon-rose/[0.07] px-3 py-2 text-[11px] text-neon-rose">
              {fmt(iload, 2)} A exceeds the {I_LIMIT_A} A internal limit — the supply would fold back into C.C. mode.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          {rows.map(([k, v, note]) => (
            <div key={k} className="surface-inset flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400">{k}</div>
                <div className="truncate font-mono text-[9.5px] text-slate-600">{note}</div>
              </div>
              <div className={`shrink-0 font-mono text-[14px] ${v === "not required" ? "text-slate-500" : "text-neon"}`}>{v}</div>
            </div>
          ))}
          {!potOk && (
            <p className="rounded-lg border border-neon-amber/25 bg-neon-amber/[0.06] px-3 py-2 text-[11px] text-neon-amber">
              Required R₂ exceeds the {POT_R2_MAX} Ω potentiometer — the 5 kΩ trimmer cannot reach {fmt(vout, 2)} V.
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}
