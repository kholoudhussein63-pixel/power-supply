"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { drawSevenSeg } from "@/lib/sevenSeg";
import { fmt, type SimSolution } from "@/lib/circuit";

const PANEL_Z = 1.106;

/* ------------------------------------------------------------------ textures */

/** Maps world panel coordinates (x −1.71…1.71, y −1.035…1.035) onto the canvas. */
function makeMapper(W: number, H: number, pw: number, ph: number) {
  const sx = (x: number) => ((x + pw / 2) / pw) * W;
  const sy = (y: number) => H - ((y + ph / 2) / ph) * H;
  return { sx, sy };
}

function usePanelTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1536;
    c.height = 932;
    const g = c.getContext("2d")!;
    const { sx, sy } = makeMapper(c.width, c.height, 3.42, 2.07);

    const metal = g.createLinearGradient(0, 0, c.width, c.height);
    metal.addColorStop(0, "#18222e");
    metal.addColorStop(0.45, "#0d151f");
    metal.addColorStop(1, "#0a1119");
    g.fillStyle = metal;
    g.fillRect(0, 0, c.width, c.height);

    g.globalAlpha = 0.05;
    for (let i = 0; i < 800; i++) {
      g.fillStyle = i % 2 ? "#ffffff" : "#000000";
      g.fillRect(Math.random() * c.width, Math.random() * c.height, Math.random() * 90, 0.9);
    }
    g.globalAlpha = 1;

    const silk = (
      wx: number,
      wy: number,
      text: string,
      px: number,
      color = "rgba(196,214,228,.8)",
      align: CanvasTextAlign = "left",
      weight = 700,
      tracked = true
    ) => {
      g.save();
      g.font = `${weight} ${px}px Consolas, "Courier New", monospace`;
      g.fillStyle = color;
      g.textBaseline = "middle";
      if (!tracked) {
        g.textAlign = align;
        g.fillText(text, sx(wx), sy(wy));
      } else {
        const step = px * 0.74;
        const start = align === "center" ? sx(wx) - (text.length * step) / 2 : sx(wx);
        g.textAlign = "left";
        let cursor = start;
        for (const ch of text) {
          g.fillText(ch, cursor, sy(wy));
          cursor += step;
        }
      }
      g.restore();
    };

    // identity block
    g.strokeStyle = "rgba(34,230,255,.3)";
    g.lineWidth = 3;
    g.strokeRect(sx(-1.52), sy(0.99), sx(-0.3) - sx(-1.52), sy(0.79) - sy(0.99));
    silk(-1.485, 0.935, "LINEAR  DC  POWER  SUPPLY", 24, "#7ff3ff");
    silk(-1.485, 0.86, "APS-1500   1.25–30 V / 1.5 A", 16, "rgba(150,176,196,.72)");

    // meter window: x −1.05…0.95, y 0.10…0.78
    const wx0 = sx(-1.05);
    const wy0 = sy(0.78);
    const ww = sx(0.95) - wx0;
    const wh = sy(0.1) - wy0;
    g.strokeStyle = "rgba(0,0,0,.8)";
    g.lineWidth = 16;
    g.strokeRect(wx0 - 8, wy0 - 8, ww + 16, wh + 16);
    g.fillStyle = "#01070b";
    g.fillRect(wx0, wy0, ww, wh);
    g.strokeStyle = "rgba(34,230,255,.34)";
    g.lineWidth = 4;
    g.strokeRect(wx0, wy0, ww, wh);
    silk(-1.02, 0.815, "DIGITAL  OUTPUT  METER", 15, "rgba(150,176,196,.55)");
    silk(-0.03, 0.055, "VOLTAGE                        CURRENT", 15, "rgba(127,243,255,.45)", "center");

    // status column
    g.strokeStyle = "rgba(255,255,255,.08)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(sx(1.16), sy(0.97));
    g.lineTo(sx(1.16), sy(0.06));
    g.stroke();
    silk(1.24, 0.87, "POWER", 15, "rgba(150,176,196,.7)");
    silk(1.24, 0.63, "FAULT", 15, "rgba(255,120,140,.7)");
    silk(1.24, 0.36, "C.C.", 15, "rgba(150,176,196,.5)");

    // controls
    silk(-1.18, -0.13, "VOLTAGE  ADJUST", 17, "rgba(127,243,255,.6)", "center");
    silk(-1.18, -0.21, "Vout = 1.25(1 + R2/R1)", 14, "rgba(150,176,196,.4)", "center", 500, false);
    silk(-0.28, -0.17, "C.C.", 14, "rgba(150,176,196,.5)", "center");
    silk(-0.28, -0.24, "LIMIT", 14, "rgba(150,176,196,.5)", "center");

    // terminal block
    g.strokeStyle = "rgba(255,255,255,.07)";
    g.lineWidth = 2;
    g.strokeRect(sx(0.36), sy(-0.2), sx(1.5) - sx(0.36), sy(-0.92) - sy(-0.2));
    silk(0.93, -0.28, "DC  OUTPUT", 15, "rgba(150,176,196,.6)", "center");
    silk(0.62, -0.95, "+", 30, "#ff6b81", "center", 700, false);
    silk(1.2, -0.95, "−", 30, "rgba(196,214,228,.7)", "center", 700, false);

    silk(0, -1.0, "AL-AZHAR  UNIVERSITY  ·  QENA  ·  ELECTRICAL  POWER  ENGINEERING", 14, "rgba(120,148,168,.48)", "center");

    for (const [px, py] of [
      [-1.62, 0.94],
      [1.62, 0.94],
      [-1.62, -0.94],
      [1.62, -0.94],
    ]) {
      g.save();
      g.translate(sx(px), sy(py));
      g.fillStyle = "#2a3543";
      g.beginPath();
      g.arc(0, 0, 17, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#0a0f15";
      g.lineWidth = 4;
      g.stroke();
      g.strokeStyle = "#55647a";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-9, 0);
      g.lineTo(9, 0);
      g.stroke();
      g.restore();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);
}

const SCREEN_W = 900;
const SCREEN_H = 300;

function paintScreen(
  g: CanvasRenderingContext2D,
  vOut: number,
  iLoad: number,
  rLoad: number,
  fault: boolean,
  mode: string
) {
  const accent = fault ? "#ff3f5f" : "#19e8ff";
  g.clearRect(0, 0, SCREEN_W, SCREEN_H);
  g.fillStyle = "#01070b";
  g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  g.fillStyle = "rgba(255,255,255,.022)";
  for (let y = 0; y < SCREEN_H; y += 3) g.fillRect(0, y, SCREEN_W, 1);

  drawSevenSeg(g, {
    text: fault ? "0.00" : fmt(vOut, 2),
    x: 44,
    y: 30,
    digitWidth: 60,
    digitHeight: 132,
    onColor: accent,
    offColor: "rgba(255,255,255,.028)",
    glow: 20,
  });
  drawSevenSeg(g, {
    text: fault ? "1.500" : fmt(iLoad, 3),
    x: 452,
    y: 48,
    digitWidth: 42,
    digitHeight: 94,
    onColor: fault ? "#ff8ea1" : "#8ef7c6",
    offColor: "rgba(255,255,255,.028)",
    glow: 15,
  });

  g.textBaseline = "middle";
  g.font = "700 40px Consolas, monospace";
  g.fillStyle = accent;
  g.shadowColor = accent;
  g.shadowBlur = 16;
  g.fillText("V", 392, 100);
  g.font = "700 30px Consolas, monospace";
  g.fillStyle = fault ? "#ff8ea1" : "#8ef7c6";
  g.fillText("A", 742, 100);
  g.shadowBlur = 0;

  g.font = "700 25px Consolas, monospace";
  g.fillStyle = "rgba(140,175,195,.42)";
  g.fillText(fault ? "SHORT CIRCUIT · PROTECTION OPEN" : `${mode} · R_LOAD ${fmt(rLoad, 1)} OHM`, 44, 205);
  g.textAlign = "right";
  g.fillStyle = fault ? "#ff4d6d" : "#7cff6b";
  g.fillText(fault ? "FLT" : "REG OK", SCREEN_W - 44, 205);
  g.textAlign = "left";

  g.font = "600 22px Consolas, monospace";
  g.fillStyle = "rgba(34,230,255,.26)";
  g.fillText("LM317  LINEAR  REGULATOR", 44, 262);
  g.textAlign = "right";
  g.fillText("FULL WAVE · 100 Hz RIPPLE", SCREEN_W - 44, 262);
  g.textAlign = "left";
}

function glowTexture(color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const rad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rad.addColorStop(0, color);
  rad.addColorStop(0.35, `${color}55`);
  rad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ hardware */

function Screen({ sol }: { sol: SimSolution }) {
  const { canvas, tex } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = SCREEN_W;
    c.height = SCREEN_H;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex: t };
  }, []);

  useEffect(() => {
    const g = canvas.getContext("2d");
    if (!g) return;
    paintScreen(
      g,
      sol.vOut,
      sol.iLoad,
      sol.rLoadOhm,
      sol.isFault,
      sol.regulationLimit === "set" ? "C.V." : sol.regulationLimit.toUpperCase()
    );
    tex.needsUpdate = true;
  }, [canvas, tex, sol.vOut, sol.iLoad, sol.rLoadOhm, sol.isFault, sol.regulationLimit]);

  const accent = sol.isFault ? "#ff3f5f" : "#19e8ff";

  return (
    <group position={[-0.05, 0.44, PANEL_Z + 0.004]}>
      <mesh>
        <planeGeometry args={[1.94, 0.645]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.6, 1.15]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Led({
  position,
  color,
  on,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  on: boolean;
  scale?: number;
}) {
  const glow = useMemo(() => glowTexture(color), [color]);
  const cap = useRef<THREE.MeshBasicMaterial>(null);
  const sprite = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const pulse = on ? 0.8 + Math.sin(clock.elapsedTime * 3.2) * 0.2 : 0.08;
    if (cap.current) cap.current.opacity = pulse;
    if (sprite.current) sprite.current.scale.setScalar((on ? 0.36 : 0.1) * scale * (0.95 + Math.sin(clock.elapsedTime * 3.2) * 0.06));
  });

  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.048, 0.052, 0.09, 20]} />
        <meshStandardMaterial color={on ? color : "#18212e"} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.048]}>
        <circleGeometry args={[0.044, 22]} />
        <meshBasicMaterial ref={cap} color={color} transparent toneMapped={false} />
      </mesh>
      <mesh ref={sprite} position={[0, 0, 0.06]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

interface KnobProps {
  position: [number, number, number];
  radius: number;
  height?: number;
  value: number;
  accent: string;
  interactive?: boolean;
  onChange?: (v: number) => void;
  onActive?: (active: boolean) => void;
  onHover?: (hover: boolean) => void;
}

function Knob({ position, radius, height = 0.3, value, accent, interactive, onChange, onActive, onHover }: KnobProps) {
  const dragging = useRef(false);
  const anchor = useRef<{ x: number; y: number; start: number } | null>(null);
  const spin = -Math.PI * 0.75 + value * Math.PI * 1.5;

  const ridges = useMemo(() => Array.from({ length: 26 }, (_, i) => (i / 26) * Math.PI * 2), []);

  useEffect(() => {
    if (!interactive) return;
    const stop = () => {
      if (!dragging.current) return;
      dragging.current = false;
      anchor.current = null;
      onActive?.(false);
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [interactive, onActive]);

  const handlers = interactive
    ? {
        onPointerDown: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          dragging.current = true;
          anchor.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, start: value };
          onActive?.(true);
        },
        onPointerMove: (e: ThreeEvent<PointerEvent>) => {
          const a = anchor.current;
          if (!dragging.current || !a || !onChange) return;
          const d = (e.nativeEvent.clientX - a.x - (e.nativeEvent.clientY - a.y)) / 200;
          onChange(Math.min(1, Math.max(0, a.start + d)));
        },
        onPointerUp: () => {
          dragging.current = false;
          anchor.current = null;
          onActive?.(false);
        },
        onWheel: (e: ThreeEvent<WheelEvent>) => {
          e.stopPropagation();
          onChange?.(Math.min(1, Math.max(0, value - Math.sign(e.nativeEvent.deltaY) * 0.02)));
        },
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover?.(true);
        },
        onPointerOut: () => onHover?.(false),
      }
    : {};

  return (
    <group position={position}>
      <mesh position={[0, 0, 0.014]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 1.3, radius * 1.34, 0.03, 40]} />
        <meshStandardMaterial color="#0b131c" roughness={0.55} metalness={0.7} />
      </mesh>

      <group rotation={[0, 0, spin]} {...handlers}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[radius, radius * 1.05, height, 48]} />
          <meshStandardMaterial color="#202d3d" roughness={0.33} metalness={0.85} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, height / 2 + 0.004]}>
          <cylinderGeometry args={[radius * 0.8, radius * 0.8, 0.018, 40]} />
          <meshStandardMaterial color="#111a24" roughness={0.5} metalness={0.7} />
        </mesh>
        {ridges.map((a, i) => (
          <mesh
            key={i}
            position={[Math.sin(a) * radius, Math.cos(a) * radius, 0]}
            rotation={[0, 0, -a]}
          >
            <boxGeometry args={[radius * 0.15, radius * 0.16, height * 0.84]} />
            <meshStandardMaterial color="#2c3c50" roughness={0.45} metalness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, radius * 0.55, height * 0.45]}>
          <boxGeometry args={[radius * 0.16, radius * 0.95, 0.016]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
        <mesh position={[0, radius * 0.55, height * 0.45 + 0.014]}>
          <planeGeometry args={[radius * 0.7, radius * 1.7]} />
          <meshBasicMaterial color={accent} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function BindingPost({ position, color, cap }: { position: [number, number, number]; color: string; cap: string }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.092, 0.14, 22]} />
        <meshStandardMaterial color={color} roughness={0.42} metalness={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.12]}>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 18]} />
        <meshStandardMaterial color={cap} roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.21]}>
        <cylinderGeometry args={[0.028, 0.028, 0.07, 12]} />
        <meshStandardMaterial color="#c2cfdb" roughness={0.22} metalness={0.95} />
      </mesh>
    </group>
  );
}

function Supply({ sol, value, onChange, onActive, onHover }: {
  sol: SimSolution;
  value: number;
  onChange: (v: number) => void;
  onActive: (a: boolean) => void;
  onHover: (h: boolean) => void;
}) {
  const panel = usePanelTexture();
  const shell = useRef<THREE.Group>(null);
  const accent = sol.isFault ? "#ff4d6d" : "#22e6ff";

  useFrame(({ clock }) => {
    if (shell.current) shell.current.rotation.x = Math.sin(clock.elapsedTime * 0.32) * 0.005;
  });

  const vents = useMemo(() => Array.from({ length: 11 }, (_, i) => -1.05 + i * 0.21), []);
  const fins = useMemo(() => Array.from({ length: 13 }, (_, i) => -0.6 + i * 0.1), []);

  return (
    <group ref={shell} position={[0, -0.04, 0]}>
      <RoundedBox args={[3.42, 2.07, 2.2]} radius={0.055} smoothness={5} position={[0, 0, -0.02]}>
        <meshStandardMaterial color="#131c26" roughness={0.42} metalness={0.88} />
      </RoundedBox>

      {[
        [-1.63, 0.97, 1.0],
        [1.63, 0.97, 1.0],
        [-1.63, -0.97, 1.0],
        [1.63, -0.97, 1.0],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#070c11" roughness={0.96} metalness={0.04} />
        </mesh>
      ))}

      {[
        [-1.3, -1.12, 0.75],
        [1.3, -1.12, 0.75],
        [-1.3, -1.12, -0.75],
        [1.3, -1.12, -0.75],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.13, 0.15, 0.12, 18]} />
          <meshStandardMaterial color="#080d12" roughness={0.9} />
        </mesh>
      ))}

      {vents.map((x, i) => (
        <mesh key={i} position={[x, 1.042, -0.1]}>
          <boxGeometry args={[0.09, 0.014, 1.3]} />
          <meshStandardMaterial color="#05090e" roughness={0.8} metalness={0.3} />
        </mesh>
      ))}

      <mesh position={[0, 0, PANEL_Z]}>
        <planeGeometry args={[3.42, 2.07]} />
        <meshStandardMaterial map={panel} roughness={0.58} metalness={0.4} />
      </mesh>

      <Screen sol={sol} />

      <Knob
        position={[-1.18, -0.52, PANEL_Z]}
        radius={0.34}
        height={0.32}
        value={value}
        accent={accent}
        interactive
        onChange={onChange}
        onActive={onActive}
        onHover={onHover}
      />
      <Knob position={[-0.28, -0.52, PANEL_Z]} radius={0.19} height={0.22} value={0.62} accent="#4d6274" />

      <Led position={[1.33, 0.87, PANEL_Z + 0.03]} color="#4dff7a" on={!sol.isFault} />
      <Led position={[1.33, 0.63, PANEL_Z + 0.03]} color="#ff3f5f" on={sol.isFault} scale={1.5} />
      <Led position={[1.33, 0.37, PANEL_Z + 0.03]} color="#ffc94d" on={sol.regulationLimit === "current"} />

      <BindingPost position={[0.62, -0.55, PANEL_Z]} color="#c9243f" cap="#ff5f78" />
      <BindingPost position={[1.2, -0.55, PANEL_Z]} color="#10161d" cap="#2b3a4c" />

      <group position={[0, -0.18, -1.16]}>
        {fins.map((x, i) => (
          <mesh key={i} position={[x, 0, -0.19]}>
            <boxGeometry args={[0.035, 0.88, 0.38]} />
            <meshStandardMaterial color="#93a0ae" roughness={0.55} metalness={0.92} />
          </mesh>
        ))}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[1.35, 0.9, 0.05]} />
          <meshStandardMaterial color="#5d6a78" roughness={0.6} metalness={0.88} />
        </mesh>
        <mesh position={[-1.28, -0.34, -0.14]}>
          <boxGeometry args={[0.34, 0.42, 0.26]} />
          <meshStandardMaterial color="#0d1218" roughness={0.7} />
        </mesh>
        <mesh position={[1.3, 0.2, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />
          <meshStandardMaterial color="#0d1218" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

export default function PowerSupply3D({
  sol,
  value,
  onChange,
}: {
  sol: SimSolution;
  value: number;
  onChange: (v: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);

  return (
    <div className="relative h-full w-full" style={{ cursor: hover ? (dragging ? "grabbing" : "grab") : undefined }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: sol.isFault
            ? "radial-gradient(ellipse 58% 48% at 50% 56%, rgba(255,63,95,.24), transparent 72%)"
            : "radial-gradient(ellipse 58% 48% at 50% 56%, rgba(34,230,255,.16), transparent 72%)",
        }}
      />
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0.7, 0.75, 5.7], fov: 33 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.6} color="#9fd4e8" />
        <directionalLight position={[3, 5, 6]} intensity={1.6} color="#eaf6ff" />
        <directionalLight position={[-4, 1, 3]} intensity={0.5} color="#2f9fc4" />
        <pointLight position={[0, 0.4, 3.4]} intensity={14} color={sol.isFault ? "#ff3f5f" : "#19e8ff"} distance={8} decay={2} />
        <spotLight position={[-3, 4, -3]} intensity={20} angle={0.7} penumbra={1} color="#6ad9ff" distance={13} decay={2} />

        <Supply
          sol={sol}
          value={value}
          onChange={onChange}
          onActive={setDragging}
          onHover={setHover}
        />

        <OrbitControls
          enabled={!dragging}
          enablePan={false}
          enableZoom={!hover}
          minDistance={3.6}
          maxDistance={9}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 1.72}
          dampingFactor={0.08}
          target={[0, 0, 0]}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-2 left-3 font-mono text-[10px] text-slate-600">
        drag / scroll the knob to set V<sub>out</sub> · drag the case to orbit
      </div>
    </div>
  );
}
