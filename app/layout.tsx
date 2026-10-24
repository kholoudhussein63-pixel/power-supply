import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interactive DC Power Supply Simulator",
  description:
    "Academic project — 2nd Year Electrical Power Engineering Department, Al-Azhar University (Qena). Interactive linear DC power supply simulator with 3D front panel and live oscilloscope.",
};

export const viewport: Viewport = {
  themeColor: "#04070c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-ink-950 font-sans antialiased">{children}</body>
    </html>
  );
}
