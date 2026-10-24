"use client";

import { useEffect, useRef } from "react";
import { drawSevenSeg, measureSevenSeg } from "@/lib/sevenSeg";

interface Props {
  voltage: number;
  current: number;
  fault: boolean;
  mode: string;
  className?: string;
}

export default function SevenSegDisplay({ voltage, current, fault, mode, className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2) return;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const accent = fault ? "#ff4d6d" : "#22e6ff";
    const dim = "rgba(255,255,255,0.035)";

    ctx.clearRect(0, 0, w, h);
    const glass = ctx.createLinearGradient(0, 0, 0, h);
    glass.addColorStop(0, "#060d15");
    glass.addColorStop(1, "#010508");
    ctx.fillStyle = glass;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,0.022)";
    for (let y = 0; y < h; y += 3 * dpr) ctx.fillRect(0, y, w, dpr);

    const vText = voltage.toFixed(2).padStart(5, "0");
    const iText = current.toFixed(3).padStart(6, "0");

    const vDW = h * 0.2;
    const vX = w * 0.06;
    drawSevenSeg(ctx, {
      text: vText,
      x: vLX(w, vText.length, vDW),
      y: h * 0.1,
      digitWidth: vDW,
      digitHeight: h * 0.36,
      onColor: accent,
      offColor: dim,
      glow: 14 * dpr,
    });

    const iDW = h * 0.115;
    const iEnd = drawSevenSeg(ctx, {
      text: iText,
      x: w * 0.06,
      y: h * 0.56,
      digitWidth: iDW,
      digitHeight: h * 0.21,
      onColor: fault ? "#ff8ea1" : "#7ff3ff",
      offColor: dim,
      glow: 10 * dpr,
    });

    ctx.textBaseline = "middle";
    ctx.font = `600 ${h * 0.24}px Consolas, monospace`;
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 12 * dpr;
    ctx.fillText("V", w * 0.88, h * 0.29);
    ctx.font = `600 ${h * 0.15}px Consolas, monospace`;
    ctx.fillStyle = fault ? "#ff8ea1" : "#7ff3ff";
    ctx.shadowBlur = 8 * dpr;
    ctx.fillText("A", w * 0.88, h * 0.665);
    ctx.shadowBlur = 0;

    ctx.font = `600 ${h * 0.085}px Consolas, monospace`;
    ctx.fillStyle = "rgba(148,180,200,.42)";
    ctx.fillText("VOLTAGE", w * 0.06, h * 0.5);
    ctx.fillText("CURRENT", iEnd + w * 0.03, h * 0.665);

    ctx.fillText(fault ? "SHORT-CIRCUIT FAULT · PROTECTION ACTIVE" : `LM317 · ${mode}`, w * 0.06, h * 0.9);
    ctx.textAlign = "right";
    ctx.fillStyle = fault ? "#ff4d6d" : "#7cff6b";
    ctx.fillText(fault ? "FLT" : "ON", w * 0.94, h * 0.9);
    ctx.textAlign = "left";

    const b = 1.5 * dpr;
    ctx.strokeStyle = "rgba(34,230,255,.14)";
    ctx.lineWidth = b;
    ctx.strokeRect(b / 2, b / 2, w - b, h - b);
  }, [voltage, current, fault, mode]);

  return (
    <canvas
      ref={ref}
      className={className}
      role="meter"
      aria-label={`Output ${voltage.toFixed(2)} volts, load current ${current.toFixed(3)} amperes, ${mode}`}
    />
  );
}

function vLX(w: number, len: number, digitWidth: number) {
  const total = measureSevenSeg("0".repeat(len), digitWidth);
  return Math.max(w * 0.06, w * 0.78 - total);
}
