import type { Metadata } from "next";
import Dashboard from "@/components/sim/Dashboard";

export const metadata: Metadata = {
  title: "Simulator · Interactive DC Power Supply",
  description:
    "3D front panel, LM317 control loop, filter-ripple physics and a live four-stage oscilloscope.",
};

export default function SimulatorRoute() {
  return <Dashboard />;
}
