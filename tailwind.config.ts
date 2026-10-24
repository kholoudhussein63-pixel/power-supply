import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#04070c",
          900: "#070c14",
          850: "#0a121c",
          800: "#0e1826",
          700: "#152232",
          600: "#1d2f43",
          500: "#2b4460",
        },
        neon: {
          DEFAULT: "#22e6ff",
          soft: "#7ff3ff",
          deep: "#0b8fa8",
          lime: "#7cff6b",
          amber: "#ffc94d",
          rose: "#ff4d6d",
        },
      },
      fontFamily: {
        sans: ["Segoe UI", "Inter", "system-ui", "-apple-system", "Roboto", "sans-serif"],
        mono: ["Consolas", "JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 18px -2px rgba(34,230,255,.45)",
        "glow-lg": "0 0 42px -6px rgba(34,230,255,.55)",
        fault: "0 0 34px -4px rgba(255,77,109,.6)",
      },
      keyframes: {
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(3%, -4%, 0) scale(1.12)" },
        },
        sweep: {
          "0%": { backgroundPosition: "-140% 0" },
          "100%": { backgroundPosition: "240% 0" },
        },
        flicker: {
          "0%,100%": { opacity: "1" },
          "48%": { opacity: ".82" },
          "52%": { opacity: "1" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        drift: "drift 16s ease-in-out infinite",
        sweep: "sweep 2.6s linear infinite",
        flicker: "flicker 4s ease-in-out infinite",
        rise: "rise .6s cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
