"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import ControlPanel from "@/components/sim/ControlPanel";
import Telemetry from "@/components/sim/Telemetry";
import Calculator from "@/components/sim/Calculator";
import Oscilloscope, { type ScopeStage } from "@/components/sim/Oscilloscope";
import { Section } from "@/components/ui/Controls";
import { STAGES } from "@/lib/content";
import { fmt } from "@/lib/circuit";
import { useSimulator } from "@/hooks/useSimulator";

const PowerSupply3D = dynamic(() => import("@/components/sim/PowerSupply3D"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-neon/25 border-t-neon" />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">loading 3D model</span>
      </div>
    </div>
  ),
});

const SCOPE_TABS: Array<{ id: ScopeStage; label: string }> = [
  { id: "sine", label: "1 · AC sine" },
  { id: "bridge", label: "2 · Bridge" },
  { id: "filter", label: "3 · Filtered" },
  { id: "regulated", label: "4 · Regulated" },
  { id: "all", label: "All stages" },
];

export default function Dashboard() {
  const sim = useSimulator();
  const { sol } = sim;
  const [tab, setTab] = useState<"scope" | "calc">("scope");
  const [stage, setStage] = useState<ScopeStage>("filter");
  const [scroll, setScroll] = useState(false);

  const status = sol.isFault
    ? { text: "SHORT CIRCUIT · PROTECTION ACTIVE", tone: "text-neon-rose border-neon-rose/45 bg-neon-rose/10" }
    : sol.regulationLimit === "current"
      ? { text: "CONSTANT CURRENT · OUTPUT LIMITED", tone: "text-neon-amber border-neon-amber/40 bg-neon-amber/10" }
      : sol.saturated
        ? { text: "OUT OF REGULATION · INSUFFICIENT HEADROOM", tone: "text-neon-amber border-neon-amber/40 bg-neon-amber/10" }
        : { text: "CONSTANT VOLTAGE · REGULATED", tone: "text-neon-soft border-neon/35 bg-neon/[0.08]" };

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="blueprint absolute inset-0 opacity-70" />
        <div
          className="halo left-1/2 top-[-8%] h-[600px] w-[900px] -translate-x-1/2 opacity-60 transition-colors duration-500"
          style={{ background: sol.isFault ? "#7a1024" : "#0b6f86" }}
        />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-neon/35 bg-neon/[0.08]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-neon" fill="currentColor" aria-hidden>
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
              </svg>
            </span>
            <span className="text-[12.5px] font-semibold tracking-wide text-slate-100 transition group-hover:text-neon-soft">
              DC Power Supply Simulator
            </span>
          </Link>

          <div className="hidden h-4 w-px bg-white/10 md:block" />

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span className="text-slate-600">V_in</span>
            <span className="text-neon-soft">{sim.vAcRms} V AC</span>
            <span className="text-slate-700">→</span>
            <span className="text-slate-600">V_out</span>
            <span className={sol.isFault ? "text-neon-rose" : "text-neon"}>{fmt(sol.vOut, 2)} V</span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-600">I</span>
            <span className="text-neon-soft">{fmt(sol.iLoad * 1000, 0)} mA</span>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <span
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] sm:flex ${status.tone}`}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              {status.text}
            </span>
            <button type="button" className="btn-ghost" onClick={sim.reset}>
              Reset
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1800px] gap-4 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        {/* left: sections A + C */}
        <div className="flex min-w-0 flex-col gap-4">
          <Section
            title="Interactive 3D Hardware Model"
            tag="A"
            right={
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
                react-three-fiber · {sol.isFault ? "LED: FAULT" : "LED: POWER"}
              </span>
            }
            className=""
            bodyClassName="p-0"
          >
            <div className="h-[38vh] min-h-[320px] w-full sm:h-[44vh]">
              <PowerSupply3D sol={sol} value={sim.setPoint} onChange={sim.setSetPoint} />
            </div>
          </Section>

          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-[#0a121c]/80 p-1.5 backdrop-blur">
            <div className="flex flex-1 flex-wrap gap-1">
              {SCOPE_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setStage(t.id);
                    setTab("scope");
                  }}
                  className={`seg ${stage === t.id && tab === "scope" ? "seg-on" : "hover:text-slate-200"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setScroll((s) => !s)}
              className="seg border border-white/10 font-mono"
              title="Toggle between a triggered (locked) trace and a scrolling one"
            >
              {scroll ? "SCROLL" : "TRIG"}
            </button>
            <button
              type="button"
              onClick={() => setTab("calc")}
              className={`seg border ${tab === "calc" ? "seg-on border-neon/40" : "border-white/10 hover:text-slate-200"}`}
            >
              Calculator
            </button>
          </div>

          {tab === "scope" ? (
            <Section
              title="Real-Time Oscilloscope"
              tag="C"
              right={
                <span className="font-mono text-[10px] text-slate-600">
                  60 ms window · {STAGES.find((s) => s.id === stage)?.formula ?? "4 channels overlaid"}
                </span>
              }
            >
              <div className="h-[300px] w-full sm:h-[340px]">
                <Oscilloscope sol={sol} stage={stage} scroll={scroll} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {STAGES.map((s) => {
                  const on = stage === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setStage(s.id);
                        setTab("scope");
                      }}
                      className={`rounded-lg border px-3 py-2.5 text-left transition ${
                        on
                          ? "border-neon/45 bg-neon/[0.07]"
                          : "border-white/[0.07] bg-white/[0.02] hover:border-white/18"
                      }`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className={`font-mono text-[10px] ${on ? "text-neon" : "text-slate-600"}`}>{s.n}</span>
                        <span className={`text-[12px] font-medium ${on ? "text-neon-soft" : "text-slate-300"}`}>{s.title}</span>
                      </div>
                      <div className="mt-1 font-mono text-[10.5px] text-slate-500">{s.formula}</div>
                      <div className="mt-0.5 text-[10.5px] leading-snug text-slate-600">{s.note}</div>
                    </button>
                  );
                })}
              </div>
            </Section>
          ) : (
            <Calculator sim={sim} />
          )}

          <Telemetry sol={sol} />
        </div>

        {/* right: section B */}
        <div className="min-w-0 xl:sticky xl:top-[68px] xl:self-start">
          <ControlPanel sim={sim} />
        </div>
      </div>

      <footer className="border-t border-white/[0.06] py-6">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-2 px-4 text-[11px] text-slate-600 sm:px-6">
          <span>Interactive DC Power Supply Simulator · 2nd Year Electrical Power Engineering · Al-Azhar University (Qena)</span>
          <span className="font-mono">V_out = 1.25(1 + R₂/R₁) · V_ripple = I_load/(f·C)</span>
        </div>
      </footer>
    </main>
  );
}
