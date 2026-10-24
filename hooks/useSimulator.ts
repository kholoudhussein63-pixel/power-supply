"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CAP_OPTIONS,
  LOAD_MAX_OHM,
  LOAD_MIN_OHM,
  clamp,
  lm317Output,
  r2ForOutput,
  r2FromSetPoint,
  setPointFromR2,
  solve,
  type SimSolution,
} from "@/lib/circuit";

const LOAD_RATIO = LOAD_MAX_OHM / LOAD_MIN_OHM;

export function loadFromPosition(pos: number): number {
  return LOAD_MIN_OHM * Math.pow(LOAD_RATIO, clamp(pos, 0, 1));
}

export function positionFromLoad(ohm: number): number {
  return clamp(Math.log(clamp(ohm, LOAD_MIN_OHM, LOAD_MAX_OHM) / LOAD_MIN_OHM) / Math.log(LOAD_RATIO), 0, 1);
}

export interface SimulatorState {
  vAcRms: number;
  setVAcRms: (v: number) => void;
  setPoint: number;
  setSetPoint: (p: number) => void;
  setTargetVolts: (v: number) => void;
  targetVolts: number;
  rLoadOhm: number;
  loadPosition: number;
  setLoadPosition: (p: number) => void;
  setLoadOhm: (r: number) => void;
  capacitanceF: number;
  capacitanceUf: number;
  setCapacitanceUf: (uf: number) => void;
  shortCircuit: boolean;
  toggleShortCircuit: () => void;
  setShortCircuit: (v: boolean) => void;
  sol: SimSolution;
  reset: () => void;
}

export const DEFAULTS = {
  vAcRms: 24,
  setPoint: 0.55,
  loadPosition: positionFromLoad(60),
  capacitanceUf: 1000,
};

export function useSimulator(): SimulatorState {
  const [vAcRms, setVAcRms] = useState<number>(DEFAULTS.vAcRms);
  const [setPoint, setSetPointRaw] = useState<number>(DEFAULTS.setPoint);
  const [loadPosition, setLoadPositionRaw] = useState<number>(DEFAULTS.loadPosition);
  const [capIndex, setCapIndex] = useState<number>(2);
  const [shortCircuit, setShortCircuit] = useState(false);

  const rLoadOhm = useMemo(() => loadFromPosition(loadPosition), [loadPosition]);
  const capacitanceF = CAP_OPTIONS[capIndex].f;

  const sol = useMemo(
    () => solve({ vAcRms, setPoint, rLoadOhm, capacitanceF, shortCircuit }),
    [vAcRms, setPoint, rLoadOhm, capacitanceF, shortCircuit]
  );

  const setSetPoint = useCallback((p: number) => setSetPointRaw(clamp(p, 0, 1)), []);
  const setTargetVolts = useCallback(
    (v: number) => setSetPointRaw(setPointFromR2(r2ForOutput(v))),
    []
  );
  const setLoadPosition = useCallback((p: number) => setLoadPositionRaw(clamp(p, 0, 1)), []);
  const setLoadOhm = useCallback(
    (r: number) => setLoadPositionRaw(positionFromLoad(r)),
    []
  );
  const setCapacitanceUf = useCallback((uf: number) => {
    const i = CAP_OPTIONS.findIndex((c) => c.uf === uf);
    if (i >= 0) setCapIndex(i);
  }, []);
  const toggleShortCircuit = useCallback(() => setShortCircuit((s) => !s), []);
  const reset = useCallback(() => {
    setVAcRms(DEFAULTS.vAcRms);
    setSetPointRaw(0.55);
    setLoadPositionRaw(DEFAULTS.loadPosition);
    setCapIndex(2);
    setShortCircuit(false);
  }, []);

  return {
    vAcRms,
    setVAcRms,
    setPoint,
    setSetPoint,
    setTargetVolts,
    targetVolts: lm317Output(r2FromSetPoint(setPoint)),
    rLoadOhm,
    loadPosition,
    setLoadPosition,
    setLoadOhm,
    capacitanceF,
    capacitanceUf: CAP_OPTIONS[capIndex].uf,
    setCapacitanceUf,
    shortCircuit,
    toggleShortCircuit,
    setShortCircuit,
    sol,
    reset,
  };
}
