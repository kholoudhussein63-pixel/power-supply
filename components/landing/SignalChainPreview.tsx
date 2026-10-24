"use client";

import { useEffect, useRef } from "react";
import { simulateWindow, stageMeta, type WaveContext } from "@/lib/waveform";

const LANES: Array<{ key: "sine" | "bridge" | "filter" | "regulated"; tag: string }> = [
  { key: "sine", tag: "AC" },
  { key: "bridge", tag: "RECT" },
  { key: "filter", tag: "FILTER" },
  { key: "regulated", tag: "REG" },
];

/** Circuit-seconds advanced per wall-second, so the traces crawl instead of racing. */
const CRAWL_RATE = 0.02;

const CTX: WaveContext = {
  vAcRms: 24,
  vRecPeak: 24 * Math.SQRT2 - 1.1,
  capacitanceF: 470e-6,
  rLoadOhm: 24,
  vSet: 12,
  vOut: 12,
  fault: false,
};

export default function SignalChainPreview({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const state = { bus: 0 };
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);

      const laneH = h / LANES.length;
      const windowSec = 0.06;
      const res = simulateWindow(CTX, { ...state }, t, windowSec, Math.min(420, w));
      state.bus = res.busEnd;

      for (let li = 0; li < LANES.length; li++) {
        const lane = LANES[li];
        const meta = stageMeta(lane.key);
        const y0 = li * laneH;
        const series = res[lane.key];

        ctx2d.strokeStyle = "rgba(34,230,255,0.06)";
        ctx2d.lineWidth = 1 * dpr;
        ctx2d.beginPath();
        ctx2d.moveTo(0, y0 + laneH);
        ctx2d.lineTo(w, y0 + laneH);
        ctx2d.stroke();

        const top = lane.key === "sine" ? -CTX.vAcRms * Math.SQRT2 : 0;
        const span = (lane.key === "sine" ? CTX.vAcRms * Math.SQRT2 * 2 : CTX.vRecPeak) || 1;
        const pad = laneH * 0.16;

        ctx2d.beginPath();
        for (let i = 0; i < series.length; i++) {
          const x = (i / (series.length - 1)) * w;
          const y = y0 + pad + (1 - (series[i] - top) / span) * (laneH - pad * 2);
          if (i === 0) ctx2d.moveTo(x, y);
          else ctx2d.lineTo(x, y);
        }
        ctx2d.strokeStyle = meta.color;
        ctx2d.lineWidth = 1.7 * dpr;
        ctx2d.shadowColor = meta.color;
        ctx2d.shadowBlur = 10 * dpr;
        ctx2d.globalAlpha = 0.9;
        ctx2d.stroke();
        ctx2d.shadowBlur = 0;
        ctx2d.globalAlpha = 1;

        ctx2d.fillStyle = "rgba(127,243,255,.55)";
        ctx2d.font = `${10 * dpr}px Consolas, monospace`;
        ctx2d.fillText(lane.tag, 6 * dpr, y0 + 13 * dpr);
      }

      const cx = ((t / windowSec) % 1) * w;
      ctx2d.fillStyle = "rgba(34,230,255,.16)";
      ctx2d.fillRect(cx, 0, 2 * dpr, h);

      const now = performance.now();
      t += Math.min(0.05, (now - last) / 1000) * CRAWL_RATE;
      last = now;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
