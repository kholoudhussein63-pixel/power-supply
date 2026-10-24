import { DROPOUT_V, MAINS_FREQ_HZ, RIPPLE_FREQ_HZ } from "./circuit";

export type StageId = "sine" | "bridge" | "filter" | "regulated";

export interface WaveContext {
  vAcRms: number;
  vRecPeak: number;
  capacitanceF: number;
  rLoadOhm: number;
  vSet: number;
  vOut: number;
  fault: boolean;
}

/** Winding + diode resistance seen by the filter capacitor during recharge spikes. */
export const SOURCE_R_OHM = 0.45;
const W = 2 * Math.PI * MAINS_FREQ_HZ;

export interface WindowResult {
  times: Float32Array;
  sine: Float32Array;
  bridge: Float32Array;
  filter: Float32Array;
  regulated: Float32Array;
  /** Bus voltage the regulator input is currently sitting on. */
  busEnd: number;
}

export interface FilterState {
  bus: number;
}

/**
 * March the window forward in time, integrating the capacitor charge/discharge
 * ODE so the trace behaves like a real scrolling scope rather than a plot.
 */
export function simulateWindow(
  ctx: WaveContext,
  state: FilterState,
  tStart: number,
  windowSec: number,
  samples: number
): WindowResult {
  const n = Math.max(2, Math.floor(samples));
  const dt = windowSec / (n - 1);
  const times = new Float32Array(n);
  const sine = new Float32Array(n);
  const bridge = new Float32Array(n);
  const filter = new Float32Array(n);
  const regulated = new Float32Array(n);

  const dischargeTau = Math.max(1e-4, ctx.rLoadOhm * ctx.capacitanceF);
  const chargeTau = Math.max(1e-5, SOURCE_R_OHM * ctx.capacitanceF);
  const sub = Math.min(64, Math.max(2, Math.ceil(dt / 3e-5)));
  const h = dt / sub;

  let t = tStart;
  let v = state.bus;

  for (let i = 0; i < n; i++) {
    const s = Math.sin(W * t);
    times[i] = t;
    sine[i] = ctx.vAcRms * Math.SQRT2 * s;
    const rect = Math.max(0, ctx.vRecPeak * Math.abs(s));
    bridge[i] = rect;

    if (i > 0) {
      for (let k = 0; k < sub; k++) {
        const tk = t - dt + k * h;
        const source = Math.max(0, ctx.vRecPeak * Math.abs(Math.sin(W * tk)));
        const tau = source > v ? chargeTau : dischargeTau;
        v += ((source - v) / tau) * h;
        if (v < 0) v = 0;
      }
    }
    filter[i] = v;
    regulated[i] = ctx.fault ? 0 : Math.max(0, Math.min(ctx.vSet, v - DROPOUT_V));
    t += dt;
  }

  state.bus = v;
  return { times, sine, bridge, filter, regulated, busEnd: v };
}

export function stageMeta(stage: StageId) {
  switch (stage) {
    case "sine":
      return {
        label: "Transformer secondary",
        detail: "Pure mains sine, 50 Hz",
        color: "#ffc94d",
        bipolar: true,
        rippleFreq: MAINS_FREQ_HZ,
      };
    case "bridge":
      return {
        label: "Bridge rectifier output",
        detail: "Full-wave, 2 diode drops",
        color: "#ff8b4d",
        bipolar: false,
        rippleFreq: RIPPLE_FREQ_HZ,
      };
    case "filter":
      return {
        label: "Capacitor-filtered DC",
        detail: "Charging spikes + exponential decay",
        color: "#22e6ff",
        bipolar: false,
        rippleFreq: RIPPLE_FREQ_HZ,
      };
    default:
      return {
        label: "LM317 regulated output",
        detail: "Flat DC, load independent",
        color: "#7cff6b",
        bipolar: false,
        rippleFreq: RIPPLE_FREQ_HZ,
      };
  }
}
