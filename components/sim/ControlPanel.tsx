"use client";

import KnobDial from "@/components/ui/KnobDial";
import { FaultToggle, Section, Segmented, Slider } from "@/components/ui/Controls";
import { AC_OPTIONS, CAP_OPTIONS, LM317_R1, fmt } from "@/lib/circuit";
import { positionFromLoad } from "@/hooks/useSimulator";
import type { SimulatorState } from "@/hooks/useSimulator";

export default function ControlPanel({ sim }: { sim: SimulatorState }) {
  const { sol } = sim;
  const fault = sol.isFault;

  return (
    <Section
      title="Control Panel"
      tag="B"
      right={
        <span
          className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
            fault ? "border-neon-rose/50 bg-neon-rose/10 text-neon-rose" : "border-neon/30 bg-neon/10 text-neon-soft"
          }`}
        >
          {fault ? "fault" : sol.regulationLimit === "current" ? "c.c. mode" : "c.v. mode"}
        </span>
      }
    >
      <div className="space-y-6">
        {/* 1 — input AC selector */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="label">Input AC voltage selector</span>
            <span className="font-mono text-[11px] text-slate-500">
              V<sub>sec</sub> · rms
            </span>
          </div>
          <Segmented
            columns={5}
            value={sim.vAcRms}
            onChange={sim.setVAcRms}
            options={AC_OPTIONS.map((v) => ({ value: v as number, label: `${v} V`, sub: "AC" }))}
          />
          <div className="mt-2 font-mono text-[10px] text-slate-600">
            V_peak = V_rms·√2 = {fmt(sol.vPeakSec, 1)} V · after bridge {fmt(sol.vRecPeak, 1)} V
          </div>
        </div>

        {/* 2 — output adjustment */}
        <div className="surface-inset p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="label">Output adjustment knob</span>
            <span className="font-mono text-[10px] text-slate-600">R₂ = {fmt(sol.r2Ohm, 0)} Ω</span>
          </div>
          <div className="flex items-start gap-5">
            <KnobDial
              label="Voltage set"
              value={sim.setPoint}
              onChange={sim.setSetPoint}
              readout={`${fmt(sol.vSet, 2)} V`}
              size={112}
              disabled={fault}
              accent={fault ? "#ff4d6d" : "#22e6ff"}
            />
            <div className="min-w-0 flex-1 space-y-3">
              <Slider
                label="Set point"
                value={sim.setPoint}
                min={0}
                max={1}
                step={0.001}
                onChange={sim.setSetPoint}
                display={`${fmt(sim.targetVolts, 2)} V`}
                disabled={fault}
                fault={fault}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn-ghost font-mono"
                  disabled={fault}
                  onClick={() => sim.setTargetVolts(Math.min(sol.maxAchievable, 5))}
                >
                  5 V
                </button>
                <button
                  type="button"
                  className="btn-ghost font-mono"
                  disabled={fault}
                  onClick={() => sim.setTargetVolts(Math.min(sol.maxAchievable, 12))}
                >
                  12 V
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-neon/15 bg-neon/[0.04] p-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">LM317 regulation law</div>
            <div className="mt-2 font-mono text-[12px] leading-relaxed text-neon-soft">
              V<sub>out</sub> = 1.25 × (1 + R₂/R₁)
            </div>
            <div className="mt-1 font-mono text-[11.5px] leading-relaxed text-slate-400">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; = 1.25 × (1 + {fmt(sol.r2Ohm, 0)}/{LM317_R1}) ={" "}
              <span className="text-neon">{fmt(sol.vSet, 2)} V</span>
            </div>
          </div>
        </div>

        {/* 3 — load */}
        <Slider
          label="Load resistance"
          value={sim.loadPosition}
          min={0}
          max={1}
          step={0.001}
          onChange={sim.setLoadPosition}
          display={`${fmt(sol.rLoadOhm, sol.rLoadOhm < 10 ? 2 : 1)} Ω`}
          hint={`I_load = V_out / R_L = ${fmt(sol.iLoad * 1000, 0)} mA · log scale 2 Ω → 1 kΩ`}
          disabled={fault}
          fault={fault}
        />
        <div className="-mt-3 flex flex-wrap gap-1.5">
          {[10, 24, 48, 120, 470].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => sim.setLoadPosition(positionFromLoad(r))}
              disabled={fault}
              className={`rounded-md border px-2 py-1 font-mono text-[10.5px] transition ${
                Math.abs(sol.rLoadOhm - r) < 0.8
                  ? "border-neon/45 bg-neon/10 text-neon-soft"
                  : "border-white/8 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200"
              } disabled:opacity-40`}
            >
              {r} Ω
            </button>
          ))}
        </div>

        {/* 4 — filter capacitor */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="label">Filter capacitor</span>
            <span className="font-mono text-[11px] text-slate-500">C across the bus</span>
          </div>
          <Segmented
            columns={5}
            value={sim.capacitanceUf}
            onChange={sim.setCapacitanceUf}
            options={CAP_OPTIONS.map((c) => ({ value: c.uf as number, label: `${c.uf}`, sub: "µF" }))}
          />
          <div className="mt-2 font-mono text-[10px] text-slate-600">
            V_ripple = I_load / (f·C) = {fmt(sol.iLoad, 3)} / (100 × {sim.capacitanceUf}µF) ={" "}
            <span className={sol.rippleMv > 1000 ? "text-neon-amber" : "text-neon-soft"}>{fmt(sol.rippleMv, 1)} mV</span>
          </div>
        </div>

        {/* 5 — fault injection */}
        <FaultToggle on={sim.shortCircuit} onClick={sim.toggleShortCircuit} />

        <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="text-[10.5px] uppercase tracking-[0.16em] text-slate-600">
            {sim.shortCircuit ? "Protection loop open" : "All controls live"}
          </span>
          <button type="button" className="btn-ghost" onClick={sim.reset}>
            Reset defaults
          </button>
        </div>
      </div>
    </Section>
  );
}
