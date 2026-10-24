/** Canvas 7-segment renderer shared by the 3D panel texture and the DOM readouts. */

const A = 1, B = 2, C = 4, D = 8, E = 16, F = 32, G = 64;

const GLYPHS: Record<string, number> = {
  "0": A | B | C | D | E | F,
  "1": B | C,
  "2": A | B | G | E | D,
  "3": A | B | G | C | D,
  "4": F | G | B | C,
  "5": A | F | G | C | D,
  "6": A | F | G | C | D | E,
  "7": A | B | C,
  "8": A | B | C | D | E | F | G,
  "9": A | B | C | D | F | G,
  A: A | B | C | E | F | G,
  b: G | C | D | E | F,
  C: A | D | E | F,
  d: G | C | D | B | A,
  E: A | D | E | F | G,
  F: A | E | F | G,
  H: B | C | E | F | G,
  L: D | E,
  n: C | E | G,
  o: C | D | E | G,
  P: A | B | E | F | G,
  t: G | C | D | E,
  U: C | D | E,
  "-": G,
  "_": D,
  " ": 0,
};

function hexH(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.lineTo(x + w, y + r);
  ctx.lineTo(x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.closePath();
}

function hexV(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.lineTo(x + r, y + h);
  ctx.lineTo(x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.closePath();
}

export interface SegOptions {
  text: string;
  x: number;
  y: number;
  digitWidth: number;
  digitHeight: number;
  gap?: number;
  onColor: string;
  offColor?: string;
  glow?: number;
  /** Width of the decimal point block. */
  dotWidth?: number;
}

export function drawSevenSeg(ctx: CanvasRenderingContext2D, o: SegOptions) {
  const t = Math.max(2, o.digitWidth * 0.17);
  const gap = o.gap ?? o.digitWidth * 0.22;
  const dot = o.dotWidth ?? t * 1.15;
  let cursor = o.x;

  ctx.save();
  for (const ch of o.text) {
    if (ch === ".") {
      ctx.fillStyle = o.onColor;
      ctx.shadowColor = o.onColor;
      ctx.shadowBlur = o.glow ?? 0;
      ctx.fillRect(cursor, o.y + o.digitHeight - dot, dot, dot);
      cursor += dot + gap * 0.4;
      continue;
    }
    const mask = GLYPHS[ch] ?? GLYPHS[ch.toUpperCase()] ?? 0;
    const w = o.digitWidth;
    const h = o.digitHeight;
    const x = cursor;
    const y = o.y;

    const segs: Array<{ box: [number, number, number, number]; bit: number; vert: boolean }> = [
      { box: [x + t * 0.75, y, w - t * 1.5, t], bit: A, vert: false },
      { box: [x + w - t, y + t * 0.75, t, h / 2 - t * 1.5], bit: B, vert: true },
      { box: [x + w - t, y + h / 2 + t * 0.75, t, h / 2 - t * 1.5], bit: C, vert: true },
      { box: [x + t * 0.75, y + h - t, w - t * 1.5, t], bit: D, vert: false },
      { box: [x, y + h / 2 + t * 0.75, t, h / 2 - t * 1.5], bit: E, vert: true },
      { box: [x, y + t * 0.75, t, h / 2 - t * 1.5], bit: F, vert: true },
      { box: [x + t * 0.75, y + h / 2 - t / 2, w - t * 1.5, t], bit: G, vert: false },
    ];

    for (const s of segs) {
      const lit = (mask & s.bit) !== 0;
      ctx.shadowBlur = lit ? (o.glow ?? 0) : 0;
      ctx.shadowColor = lit ? o.onColor : "transparent";
      ctx.fillStyle = lit ? o.onColor : (o.offColor ?? "rgba(255,255,255,0.045)");
      const [bx, by, bw, bh] = s.box;
      if (s.vert) hexV(ctx, bx, by, bw, bh);
      else hexH(ctx, bx, by, bw, bh);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    cursor += w + gap;
  }
  ctx.restore();
  return cursor;
}

/** Total advance width of a string, used for centring. */
export function measureSevenSeg(text: string, digitWidth: number, gap?: number, dotWidth?: number) {
  const g = gap ?? digitWidth * 0.22;
  const dot = dotWidth ?? Math.max(2, digitWidth * 0.17) * 1.15;
  let w = 0;
  for (const ch of text) w += ch === "." ? dot + g * 0.4 : digitWidth + g;
  return Math.max(0, w - g);
}
