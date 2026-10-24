/**
 * Linear DC power-supply model: mains → step-down transformer → bridge rectifier
 * → capacitive filter → LM317 series regulator → load.
 */

export const MAINS_FREQ_HZ = 50;
/** Ripple repetition of a full-wave bridge is twice the mains frequency. */
export const RIPPLE_FREQ_HZ = MAINS_FREQ_HZ * 2;

export const LM317_VREF = 1.25;
export const LM317_R1 = 240;
export const POT_R2_MAX = 4700;

/** Combined drop of the two diodes conducting in each half cycle. */
export const BRIDGE_DROP_V = 1.1;
/** LM317 needs Vin − Vout above this or it leaves regulation. */
export const DROPOUT_V = 2.5;
export const I_LIMIT_A = 1.5;
export const I_QUIESCENT_A = 0.01;
/** Fault-path resistance used when the short-circuit toggle is thrown. */
export const SHORT_OHM = 0.12;

export const AC_OPTIONS = [9, 12, 18, 24, 30] as const;
export const CAP_OPTIONS = [
  { uf: 100, f: 100e-6 },
  { uf: 470, f: 470e-6 },
  { uf: 1000, f: 1000e-6 },
  { uf: 2200, f: 2200e-6 },
  { uf: 4700, f: 4700e-6 },
] as const;

export const LOAD_MIN_OHM = 2;
export const LOAD_MAX_OHM = 1000;

export interface SimInputs {
  vAcRms: number;
  /** Potentiometer position, 0 → 1. */
  setPoint: number;
  rLoadOhm: number;
  capacitanceF: number;
  shortCircuit: boolean;
}

export interface SimSolution extends SimInputs {
  r2Ohm: number;
  /** LM317 set target: 1.25 × (1 + R2/R1). */
  vSet: number;
  vPeakSec: number;
  vRecPeak: number;
  /** Unfiltered full-wave average, 2·Vp/π. */
  vRecAvg: number;
  /** DC level on the filter capacitor. */
  vBus: number;
  vRipple: number;
  rippleMv: number;
  /** Voltage actually delivered to the load. */
  vOut: number;
  iLoad: number;
  iRegulator: number;
  /** Headroom between the filter bus and the requested output. */
  headroom: number;
  pOut: number;
  pIn: number;
  pDiss: number;
  efficiency: number;
  tau: number;
  regulationLimit: "set" | "headroom" | "current" | "fault" | "ovp";
  isFault: boolean;
  /** True when the requested output cannot physically be reached. */
  saturated: boolean;
  maxAchievable: number;
}

export function r2FromSetPoint(setPoint: number): number {
  return clamp(setPoint, 0, 1) * POT_R2_MAX;
}

export function setPointFromR2(r2Ohm: number): number {
  return clamp(r2Ohm / POT_R2_MAX, 0, 1);
}

export function lm317Output(r2Ohm: number, r1Ohm = LM317_R1): number {
  return LM317_VREF * (1 + r2Ohm / r1Ohm);
}

export function r2ForOutput(vOut: number, r1Ohm = LM317_R1): number {
  return Math.max(0, (vOut / LM317_VREF - 1) * r1Ohm);
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Ripple for a full-wave capacitive filter: V_ripple = I_load / (f · C). */
export function rippleVoltage(iLoad: number, capacitanceF: number): number {
  return iLoad / (RIPPLE_FREQ_HZ * Math.max(capacitanceF, 1e-9));
}

export function solve(inputs: SimInputs): SimSolution {
  const { vAcRms, setPoint, capacitanceF, shortCircuit } = inputs;

  const r2Ohm = r2FromSetPoint(setPoint);
  const vSet = lm317Output(r2Ohm);

  const vPeakSec = vAcRms * Math.SQRT2;
  const vRecPeak = Math.max(0, vPeakSec - BRIDGE_DROP_V);
  const vRecAvg = (2 * vRecPeak) / Math.PI;

  const rLoad = shortCircuit ? SHORT_OHM : clamp(inputs.rLoadOhm, LOAD_MIN_OHM, LOAD_MAX_OHM);

  // The load current sets the ripple, the ripple sets the bus, the bus caps the
  // output, and the output sets the load current — resolve the loop by iteration.
  // Ripple can never exceed the unfiltered full-wave average, so clamp the bus floor.
  const maxRipple = Math.max(0, vRecPeak - vRecAvg);
  let vOut = Math.min(vSet, Math.max(0, vRecPeak - DROPOUT_V));
  let iLoad = vOut / rLoad;
  let vRipple = Math.min(rippleVoltage(iLoad, capacitanceF), maxRipple);
  let vBus = vRecPeak - vRipple / 2;

  for (let i = 0; i < 40; i++) {
    vRipple = Math.min(rippleVoltage(iLoad, capacitanceF), maxRipple);
    vBus = vRecPeak - vRipple / 2;
    const ceiling = Math.max(0, vBus - DROPOUT_V);
    const target = Math.min(vSet, ceiling);
    const next = Math.min(target, I_LIMIT_A * rLoad);
    const done = Math.abs(next - vOut) < 1e-7;
    vOut = next;
    iLoad = vOut / rLoad;
    if (done) break;
  }

  const headroom = vBus - vOut;
  const currentLimited = iLoad >= I_LIMIT_A - 1e-4 && !shortCircuit;
  const saturated = vSet > vBus - DROPOUT_V + 0.02;

  let regulationLimit: SimSolution["regulationLimit"] = "set";
  if (shortCircuit) regulationLimit = "fault";
  else if (currentLimited) regulationLimit = "current";
  else if (saturated) regulationLimit = "headroom";

  const maxAchievable = Math.max(0, vBus - DROPOUT_V);

  let faultTrip = false;
  if (shortCircuit) {
    // Protection loop opens: series pass element shuts down, output collapses.
    const rawFault = vBus / (SHORT_OHM + 0.4);
    iLoad = Math.min(rawFault, I_LIMIT_A);
    vOut = 0;
    faultTrip = true;
  }

  const iRegulator = iLoad + I_QUIESCENT_A;
  const pOut = vOut * iLoad;
  const pDiss = Math.max(0, (vBus - vOut) * iRegulator);
  const pIn = pOut + pDiss + (faultTrip ? iLoad * iLoad * SHORT_OHM : 0);
  const efficiency = pIn > 0.0001 ? (pOut / pIn) * 100 : 0;

  return {
    ...inputs,
    rLoadOhm: rLoad,
    r2Ohm,
    vSet,
    vPeakSec,
    vRecPeak,
    vRecAvg,
    vBus,
    vRipple,
    rippleMv: vRipple * 1000,
    vOut,
    iLoad,
    iRegulator,
    headroom,
    pOut,
    pIn,
    pDiss,
    efficiency: faultTrip ? 0 : efficiency,
    tau: rLoad * capacitanceF,
    regulationLimit: faultTrip ? "fault" : regulationLimit,
    isFault: faultTrip,
    saturated: saturated || currentLimited || faultTrip,
    maxAchievable,
  };
}

export function fmt(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return "---";
  return v.toFixed(digits);
}
