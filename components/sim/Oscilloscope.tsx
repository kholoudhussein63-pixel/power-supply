"use client";

import { useEffect, useRef } from "react";
import { simulateWindow, stageMeta, type StageId, type WaveContext } from "@/lib/waveform";
import { RIPPLE_FREQ_HZ, fmt, type SimSolution } from "@/lib/circuit";

export type ScopeStage = StageId | "all";

interface Props {
  sol: SimSolution;
  stage: ScopeStage;
  scroll: boolean;
}

const WINDOW_SEC = 0.06;
/** Circuit-seconds advanced per wall-second while scrolling. */
const SCROLL_RATE = 0.045;
/** Full left-to-right sweeps per second. */
const SWEEP_RATE = 0.16;

function ctxOf(sol: SimSolution): WaveContext {
  return {
    vAcRms: sol.vAcRms,
    vRecPeak: sol.vRecPeak,
    capacitanceF: sol.capacitanceF,
    rLoadOhm: sol.rLoadOhm,
    vSet: sol.vSet,
    vOut: sol.vOut,
    fault: sol.isFault,
  };
}

export default function Oscilloscope({ sol, stage, scroll }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useRef({ sol, stage, scroll });
  live.current = { sol, stage, scroll };

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let clock = 0;
    let scrollT = 0;
    const filterState = { bus: 0 };
    let settledSig = "";

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = host.getBoundingClientRect();
      canvas.width = Math.max(2, Math.round(r.width * dpr));
      canvas.height = Math.max(2, Math.round(r.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;

      const { sol: s, stage: st, scroll: sc } = live.current;
      const wave = ctxOf(s);
      const sig = `${s.vAcRms}|${s.vSet}|${s.capacitanceF}|${s.rLoadOhm}|${s.isFault}`;
      if (sig !== settledSig) {
        // Let the capacitor reach steady state before drawing, so the trace is honest.
        let t = 0;
        for (let i = 0; i < 10; i++) {
          simulateWindow(wave, filterState, t, WINDOW_SEC, 48);
          t += WINDOW_SEC;
        }
        settledSig = sig;
      }

      const tStart = sc ? (scrollT += dt * SCROLL_RATE) : 0;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.width;
      const h = canvas.height;
      const padL = 42 * dpr;
      const padB = 20 * dpr;
      const padT = 10 * dpr;
      const padR = 12 * dpr;
      const pw = w - padL - padR;
      const ph = h - padT - padB;

      const samples = simulateWindow(wave, { ...filterState }, tStart, WINDOW_SEC, Math.max(120, Math.floor(pw / dpr)));

      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#050b12");
      bg.addColorStop(1, "#02070c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      drawGrid(ctx, padL, padT, pw, ph, dpr);

      const lanes: Array<{ key: StageId; y: number; hgt: number }> =
        st === "all"
          ? (["sine", "bridge", "filter", "regulated"] as StageId[]).map((k, i) => ({
              key: k,
              y: padT + (i * ph) / 4,
              hgt: ph / 4,
            }))
          : [{ key: st, y: padT, hgt: ph }];

      for (const lane of lanes) {
        const series = samples[lane.key];
        const bipolar = lane.key === "sine";
        const vMax = bipolar ? wave.vAcRms * Math.SQRT2 : Math.max(wave.vRecPeak * 1.06, 1);
        const vMin = bipolar ? -vMax : 0;
        const meta = stageMeta(lane.key);
        const color = s.isFault && lane.key === "regulated" ? "#ff4d6d" : meta.color;

        const toX = (i: number) => padL + (i / (series.length - 1)) * pw;
        const toY = (v: number) => lane.y + (1 - (v - vMin) / (vMax - vMin)) * (lane.hgt - (st === "all" ? 8 * dpr : 0));

        ctx.beginPath();
        ctx.moveTo(toX(0), toY(series[0]));
        for (let i = 1; i < series.length; i++) ctx.lineTo(toX(i), toY(series[i]));
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = (st === "all" ? 1.5 : 2.1) * dpr;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14 * dpr;
        ctx.globalAlpha = 0.95;
        ctx.stroke();
        ctx.restore();

        if (st !== "all") {
          ctx.save();
          ctx.lineTo(toX(series.length - 1), lane.y + lane.hgt);
          ctx.lineTo(toX(0), lane.y + lane.hgt);
          ctx.closePath();
          const fill = ctx.createLinearGradient(0, lane.y, 0, lane.y + lane.hgt);
          fill.addColorStop(0, `${color}33`);
          fill.addColorStop(1, `${color}00`);
          ctx.fillStyle = fill;
          ctx.globalAlpha = 0.55;
          ctx.fill();
          ctx.restore();
        }

        // travelling beam spot — the "live" element of a CRT sweep
        const beam = Math.floor(((clock * SWEEP_RATE) % 1) * (series.length - 1));
        const bx = toX(beam);
        const by = toY(series[beam]);
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 18 * dpr;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(bx, by, 2.6 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = `${color}22`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, lane.y);
        ctx.lineTo(bx, lane.y + lane.hgt);
        ctx.stroke();

        ctx.font = `600 ${9.5 * dpr}px Consolas, monospace`;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fillText(meta.label.toUpperCase(), padL + 6 * dpr, lane.y + 12 * dpr);
        ctx.globalAlpha = 1;
      }

      if (st === "all") {
        ctx.font = `600 ${9 * dpr}px Consolas, monospace`;
        ctx.fillStyle = "rgba(148,180,200,.45)";
        for (const lane of lanes) {
          const v = lane.key === "sine" ? 0 : samples[lane.key][samples[lane.key].length - 1];
          ctx.fillText(`${fmt(v, 1)} V`, 4 * dpr, lane.y + lane.hgt / 2);
        }
      } else {
        axisLabels(ctx, st, wave, padL, padT, pw, ph, dpr, s);
        cornerReadout(ctx, st, s, w, h, dpr);
      }

      if (s.isFault) {
        ctx.fillStyle = "rgba(255,77,109,.07)";
        ctx.fillRect(0, 0, w, h);
        ctx.font = `700 ${11 * dpr}px Consolas, monospace`;
        ctx.fillStyle = "#ff4d6d";
        ctx.fillText("FAULT · OUTPUT DISABLED", padL + 8 * dpr, h - 7 * dpr);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={hostRef} className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full rounded-lg" />
    </div>
  );
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  ctx.save();
  ctx.strokeStyle = "rgba(34,230,255,.055)";
  ctx.lineWidth = 1;
  const cols = 10;
  const rows = 8;
  for (let i = 0; i <= cols; i++) {
    const gx = Math.round(x + (i / cols) * w) + 0.5;
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let i = 0; i <= rows; i++) {
    const gy = Math.round(y + (i / rows) * h) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(34,230,255,.16)";
  ctx.beginPath();
  ctx.moveTo(x, Math.round(y + h / 2) + 0.5);
  ctx.lineTo(x + w, Math.round(y + h / 2) + 0.5);
  ctx.stroke();
  ctx.restore();
  void dpr;
}

function axisLabels(
  ctx: CanvasRenderingContext2D,
  stage: StageId,
  wave: WaveContext,
  padL: number,
  padT: number,
  pw: number,
  ph: number,
  dpr: number,
  sol: SimSolution
) {
  ctx.save();
  ctx.font = `500 ${8.5 * dpr}px Consolas, monospace`;
  ctx.fillStyle = "rgba(148,180,200,.5)";
  ctx.textAlign = "right";
  const bipolar = stage === "sine";
  const vMax = bipolar ? wave.vAcRms * Math.SQRT2 : Math.max(wave.vRecPeak * 1.06, 1);
  const vMin = bipolar ? -vMax : 0;
  for (let i = 0; i <= 4; i++) {
    const v = vMax - (i / 4) * (vMax - vMin);
    ctx.fillText(`${v.toFixed(0)}`, padL - 5 * dpr, padT + (i / 4) * ph + 3 * dpr);
  }
  ctx.textAlign = "center";
  const msPerDiv = (WINDOW_SEC / 10) * 1000;
  for (let i = 0; i <= 10; i += 2) {
    ctx.fillStyle = "rgba(148,180,200,.35)";
    ctx.fillText(`${(i * msPerDiv).toFixed(1)}`, padL + (i / 10) * pw, padT + ph + 12 * dpr);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(34,230,255,.4)";
  ctx.fillText("V", 4 * dpr, padT + 8 * dpr);
  ctx.fillText("ms", padL + pw - 12 * dpr, padT + ph + 12 * dpr);
  ctx.restore();
  void sol;
}

function cornerReadout(
  ctx: CanvasRenderingContext2D,
  stage: StageId,
  sol: SimSolution,
  w: number,
  h: number,
  dpr: number
) {
  const rows: Array<[string, string]> =
    stage === "sine"
      ? [
          ["V_rms", `${fmt(sol.vAcRms, 0)} V`],
          ["V_peak", `${fmt(sol.vPeakSec, 1)} V`],
          ["freq", "50 Hz"],
        ]
      : stage === "bridge"
        ? [
            ["V_peak(rect)", `${fmt(sol.vRecPeak, 1)} V`],
            ["V_avg", `${fmt(sol.vRecAvg, 1)} V`],
            ["freq", "100 Hz"],
          ]
        : stage === "filter"
          ? [
              ["V_dc", `${fmt(sol.vBus, 2)} V`],
              ["V_ripple", `${fmt(sol.rippleMv, 0)} mV`],
              ["τ = RC", `${fmt(sol.tau * 1000, 1)} ms`],
            ]
          : [
              ["V_out", `${fmt(sol.vOut, 2)} V`],
              ["I_load", `${fmt(sol.iLoad * 1000, 0)} mA`],
              ["η", `${fmt(sol.efficiency, 1)} %`],
            ];

  ctx.save();
  const bw = 118 * dpr;
  const bh = (rows.length * 13 + 10) * dpr;
  const bx = w - bw - 8 * dpr;
  const by = 8 * dpr;
  ctx.fillStyle = "rgba(4,10,16,.78)";
  ctx.strokeStyle = "rgba(34,230,255,.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 6 * dpr);
  ctx.fill();
  ctx.stroke();
  ctx.font = `500 ${9.5 * dpr}px Consolas, monospace`;
  rows.forEach(([k, v], i) => {
    ctx.fillStyle = "rgba(148,180,200,.62)";
    ctx.fillText(k, bx + 8 * dpr, by + (16 + i * 13) * dpr);
    ctx.fillStyle = sol.isFault && stage === "regulated" ? "#ff4d6d" : "#7ff3ff";
    ctx.textAlign = "right";
    ctx.fillText(v, bx + bw - 8 * dpr, by + (16 + i * 13) * dpr);
    ctx.textAlign = "left";
  });
  ctx.restore();
  void h;
}
