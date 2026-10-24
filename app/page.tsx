import Link from "next/link";
import BlockDiagram from "@/components/landing/BlockDiagram";
import SignalChainPreview from "@/components/landing/SignalChainPreview";
import { STAGES, TEAM } from "@/lib/content";

const FEATURES = [
  {
    t: "3D Front Panel",
    d: "Rotatable potentiometer, glowing 7-segment display and a status LED that turns red the moment the protection loop trips.",
    icon: "M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 4.5L8 9v6l4 2.5L16 15V9l-4-2.5Z",
  },
  {
    t: "Live Oscilloscope",
    d: "Four selectable signal stages traced sample-by-sample from an integrated RC model — not a canned picture.",
    icon: "M3 12h3l2-6 4 12 3-9 2 3h4",
  },
  {
    t: "Real Equations",
    d: "V_out = 1.25·(1 + R₂/R₁), V_ripple = I_load/(f·C) and pass-element efficiency computed on every frame.",
    icon: "M5 5h6M5 12h9M5 19h5M17 8l3 4-3 4",
  },
  {
    t: "Fault Lab",
    d: "Throw the short-circuit toggle and watch current limiting, output collapse and the red fault LED in real time.",
    icon: "M12 3 2 20h20L12 3Zm0 6v5m0 3h.01",
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blueprint absolute inset-0" />
        <div className="halo left-[-10%] top-[-12%] h-[520px] w-[520px] animate-drift bg-[#0b8fa8]/25" />
        <div className="halo right-[-8%] top-[18%] h-[460px] w-[460px] animate-drift bg-[#1d5cff]/18 [animation-delay:-6s]" />
        <div className="halo bottom-[-14%] left-[30%] h-[420px] w-[420px] animate-drift bg-[#22e6ff]/12 [animation-delay:-11s]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/50 to-transparent" />
      </div>

      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="relative grid h-9 w-9 place-items-center rounded-lg border border-neon/35 bg-neon/[0.08]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-neon" fill="currentColor" aria-hidden>
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
              </svg>
              <span className="absolute inset-0 rounded-lg shadow-glow" />
            </span>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold tracking-wide text-slate-100">DC Power Supply Simulator</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Al-Azhar · Qena</div>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-[12px] uppercase tracking-[0.16em] text-slate-400 md:flex">
            <a className="transition hover:text-neon-soft" href="#chain">Signal chain</a>
            <a className="transition hover:text-neon-soft" href="#features">Features</a>
            <a className="transition hover:text-neon-soft" href="#team">Team</a>
          </nav>
          <Link
            href="/simulator"
            className="btn-ghost whitespace-nowrap border-neon/35 text-neon-soft hover:bg-neon/10"
          >
            Open simulator
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div className="animate-rise">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">Academic Project</span>
            <span className="chip border-white/10 bg-white/[0.03] text-slate-400">
              Linear Regulated Supply · 50 Hz
            </span>
          </div>

          <h1 className="mt-6 text-[2.6rem] font-bold leading-[1.04] tracking-tight text-slate-50 sm:text-6xl">
            Interactive{" "}
            <span className="bg-gradient-to-r from-neon via-neon-soft to-[#6ef7d0] bg-clip-text text-transparent text-glow">
              DC Power Supply
            </span>
            <br />
            Simulator
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Academic Project — 2nd Year Electrical Power Engineering Department | Al-Azhar University (Qena)
          </p>
          <p dir="rtl" className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-500">
            محاكي تفاعلي لمصدر التغذية الكهربية المستمر: من المحول إلى القنطرة، مرشّح المكثف ثم منظّم LM317 — كل شيء لحظي.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/simulator" className="btn-primary group">
              <span>Launch Interactive Simulator</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M5 12h13m0 0-5-5m5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div dir="rtl" className="text-[12px] tracking-wide text-slate-500">ابدأ المحاكاة الآن</div>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/[0.07] pt-6">
            {[
              ["Output", "1.25 – 30 V"],
              ["Current limit", "1.5 A"],
              ["Ripple model", "I / (f·C)"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{k}</dt>
                <dd className="mt-1 font-mono text-[13px] text-neon-soft">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* live preview card */}
        <div className="animate-rise [animation-delay:.15s]">
          <div className="surface relative overflow-hidden p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="panel-title">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon shadow-glow" />
                Live signal chain
              </div>
              <div className="font-mono text-[10px] text-slate-600">CH1–CH4 · 20 ms/div</div>
            </div>
            <SignalChainPreview className="mt-3 h-56 w-full sm:h-64" />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STAGES.map((s) => (
                <div key={s.id} className="surface-inset px-3 py-2">
                  <div className="font-mono text-[10px] text-neon/70">{s.n}</div>
                  <div className="mt-0.5 text-[11px] font-medium leading-tight text-slate-300">{s.title}</div>
                  <div className="mt-1 font-mono text-[10px] text-slate-500">{s.formula}</div>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-neon/10 blur-3xl" />
          </div>

          <div id="chain" className="surface mt-4 scroll-mt-24 p-4">
            <div className="panel-title mb-3">Power stage topology</div>
            <BlockDiagram />
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-10 sm:px-8">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
              Three synchronised sections
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              One React state drives the 3D knob, the digital display and the oscilloscope trace — drag the knob and every
              view updates inside the same frame.
            </p>
          </div>
          <span className="hidden shrink-0 font-mono text-[11px] text-slate-600 sm:block">A / B / C layout</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <article key={f.t} className="surface group relative overflow-hidden p-5 transition hover:border-neon/30">
              <div className="absolute inset-x-0 -top-px h-px scale-x-0 bg-gradient-to-r from-transparent via-neon to-transparent transition-transform duration-500 group-hover:scale-x-100" />
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-neon/80" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={f.icon} />
              </svg>
              <h3 className="mt-4 text-[15px] font-semibold text-slate-100">{f.t}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">{f.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* team */}
      <section id="team" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-14 sm:px-8">
        <div className="surface overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <div className="panel-title">Project team</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-100">Team Members</h2>
          </div>
          <ul className="grid gap-px bg-white/[0.05] sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((m, i) => (
              <li key={m.name} className="group flex items-center gap-3 bg-[#0a121c] px-5 py-4 transition hover:bg-[#0e1826]">
                <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neon/25 bg-gradient-to-br from-neon/15 to-transparent font-mono text-[12px] font-semibold text-neon-soft">
                  {m.initials}
                  <span className="absolute -bottom-px left-2 right-2 h-px bg-transparent transition group-hover:bg-neon/60" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-medium text-slate-100">{m.name}</div>
                  <div className="truncate text-[11px] text-slate-500">{m.role}</div>
                  <div className="font-mono text-[9px] text-slate-700">#{String(i + 1).padStart(2, "0")}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] px-6 py-5">
            <p className="text-[12px] text-slate-500">
              2nd Year · Electrical Power Engineering Department · Faculty of Engineering, Al-Azhar University (Qena)
            </p>
            <Link href="/simulator" className="btn-primary !px-6 !py-3 !text-[12px]">
              <span>Launch Interactive Simulator</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 text-[11px] text-slate-600 sm:px-8">
          <span>Interactive DC Power Supply Simulator — academic coursework use.</span>
          <span className="font-mono">Transformer → Bridge → Filter → LM317 → Load</span>
        </div>
      </footer>
    </main>
  );
}
