export const TEAM = [
  { name: "Eng. Kholoud Hussein", initials: "KH", role: "Rectifier & Transformer stage" },
  { name: "Eng. Omayma Zaafar", initials: "OZ", role: "Capacitive filter design" },
  { name: "Eng. Fatima Muhammad", initials: "FM", role: "LM317 regulation loop" },
  { name: "Eng. Mariam Salama", initials: "MS", role: "Protection & fault analysis" },
  { name: "Eng. Nada Numeiri", initials: "NN", role: "3D front-panel model" },
  { name: "Eng. Mona Fleifel", initials: "MF", role: "Oscilloscope & telemetry" },
  { name: "Eng. Ruqayya Muhammad", initials: "RM", role: "Efficiency calculations" },
  { name: "Eng. Malak Mahmoud", initials: "MM", role: "UI / UX & documentation" },
];

export const STAGES = [
  {
    id: "sine",
    n: "01",
    title: "Transformer Output",
    sub: "AC sine wave",
    formula: "V_p = V_rms · √2",
    note: "Step-down from the 230 V / 50 Hz mains to the selected secondary voltage.",
  },
  {
    id: "bridge",
    n: "02",
    title: "Full-Wave Bridge",
    sub: "4-diode rectifier",
    formula: "V_dc = 2 · V_p / π",
    note: "Both half cycles conduct through two diodes: V_p − 2·V_d.",
  },
  {
    id: "filter",
    n: "03",
    title: "Capacitor Filter",
    sub: "Ripple DC",
    formula: "V_ripple = I_load / (f · C)",
    note: "The capacitor recharges at every ripple peak, f = 2 × 50 Hz = 100 Hz.",
  },
  {
    id: "regulated",
    n: "04",
    title: "LM317 Regulated",
    sub: "Flat DC output",
    formula: "V_out = 1.25 · (1 + R₂/R₁)",
    note: "Series pass element holds the output constant regardless of load.",
  },
] as const;
