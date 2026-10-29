'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { ScrollTrigger } from '@/lib/gsap';
import { mulberry32 } from '@/lib/random';

/**
 * A flowering jacaranda branch painted on canvas.
 *
 * Bark is drawn as tapered, lit segments; the fern like leaves and the trumpet
 * flowers are painted once into sprites, so a frame during growth is a few
 * hundred cheap drawImage calls. Once the branch has bloomed it is frozen as a
 * still image with a soft shadow on the paper, and from then on only a small
 * layer of sparkles, pollen and falling flowers is redrawn. The glow halos and
 * the sway are CSS animations, which the compositor runs off the main thread.
 */

const W = 600;
const H = 720;

type Mark = { t: number; side: number; len: number };
type Seg = { x0: number; y0: number; x1: number; y1: number; w0: number; w1: number; d0: number; d1: number; marks: Mark[] };
type Frond = { x: number; y: number; a: number; len: number; d: number; sprite: number; back: boolean };
type Flower = { x: number; y: number; a: number; s: number; d: number; v: number; bud: boolean };
type Stalk = { x0: number; y0: number; x1: number; y1: number; d: number };
type Cluster = { x: number; y: number; r: number; d: number };
type From = 'top' | 'bottom';

const BARK = { base: '#5e4a3b', light: '#9a826b', dark: '#33271e' };
const LEAF = ['#4b7a38', '#5b8c44', '#6c9b4f', '#83ab60', '#3d6430', '#93b86c'];
const FLOWER_SIZE = 0.62;

function generate(seed: number, from: From) {
  const rnd = mulberry32(seed);
  const r = (a: number, b: number) => a + rnd() * (b - a);
  const segs: Seg[] = [];
  const fronds: Frond[] = [];
  const flowers: Flower[] = [];
  const stalks: Stalk[] = [];
  const clusters: Cluster[] = [];
  const DOWN = Math.PI / 2;

  const panicle = (x: number, y: number, a: number, d: number) => {
    // a drooping flower head: an axis with short side stalks, trumpets hanging off each
    const len = r(36, 60);
    const axisA = a * 0.55 + DOWN * 0.45;
    const steps = 5;
    let px = x;
    let py = y;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const nx = x + Math.cos(axisA) * len * t;
      const ny = y + Math.sin(axisA) * len * t + t * t * 8;
      if (k > 0) stalks.push({ x0: px, y0: py, x1: nx, y1: ny, d: d + t * 6 });
      px = nx;
      py = ny;
      const sides = k === steps ? 1 : 2;
      for (let s = 0; s < sides; s++) {
        const sa = axisA + (s ? 1 : -1) * r(0.6, 1.25);
        const sl = r(9, 21) * (1 - t * 0.4);
        const sx = nx + Math.cos(sa) * sl;
        const sy = ny + Math.sin(sa) * sl;
        stalks.push({ x0: nx, y0: ny, x1: sx, y1: sy, d: d + t * 6 + 2 });
        const n = 2 + Math.floor(rnd() * 2);
        for (let f = 0; f < n; f++) {
          const fa = sa + r(-0.8, 0.8);
          // trumpets hang: pull each one part of the way toward straight down
          const hang = fa + Math.atan2(Math.sin(DOWN - fa), Math.cos(DOWN - fa)) * 0.4;
          flowers.push({
            x: sx + r(-3, 3),
            y: sy + r(-3, 3),
            a: hang,
            s: r(0.78, 1.15),
            d: d + t * 8 + f * 1.5,
            v: Math.floor(rnd() * 6),
            bud: t > 0.8 && rnd() < 0.55,
          });
        }
      }
    }
    clusters.push({ x: x + Math.cos(axisA) * len * 0.5, y: y + Math.sin(axisA) * len * 0.5 + 6, r: len * 1.15, d });
  };

  const grow = (x: number, y: number, a: number, len: number, depth: number, width: number, dist: number) => {
    const steps = 7 + Math.floor(rnd() * 3);
    const bend = r(-0.06, 0.06);
    let px = x;
    let py = y;
    let ang = a;
    let w = width;
    let d = dist;
    for (let i = 1; i <= steps; i++) {
      ang += bend + r(-0.15, 0.15);
      const step = len / steps;
      const nx = px + Math.cos(ang) * step;
      const ny = py + Math.sin(ang) * step;
      const nw = Math.max(0.9, width * (1 - (i / steps) * 0.7));
      const marks: Mark[] = [];
      if (w > 3) for (let m = 0; m < Math.floor(w / 2.5); m++) marks.push({ t: rnd(), side: r(-0.35, 0.35), len: r(1.5, 4) });
      segs.push({ x0: px, y0: py, x1: nx, y1: ny, w0: w, w1: nw, d0: d, d1: d + step, marks });
      d += step;
      if (depth < 3 && i > 1 && i < steps && rnd() < [0.5, 0.36, 0.22][depth]) {
        const side = rnd() < 0.5 ? -1 : 1;
        grow(nx, ny, ang + side * r(0.45, 0.95), len * r(0.45, 0.62), depth + 1, nw * 0.72, d);
      } else if (depth === 0 && i > 2 && rnd() < 0.45) {
        // short spurs off the older wood, each ending in leaves and a flower head
        grow(nx, ny, ang + (rnd() < 0.5 ? -1 : 1) * r(0.7, 1.2), len * r(0.14, 0.22), 3, nw * 0.5, d);
      } else if (depth >= 1 && i > 2 && rnd() < 0.36) {
        fronds.push({ x: nx, y: ny, a: ang + (rnd() < 0.5 ? -1 : 1) * r(0.8, 1.3), len: r(52, 86), d, sprite: Math.floor(rnd() * 4), back: rnd() < 0.35 });
      }
      px = nx;
      py = ny;
      w = nw;
    }
    fronds.push({ x: px, y: py, a: ang + r(-0.4, 0.4), len: r(58, 92), d, sprite: Math.floor(rnd() * 4), back: false });
    if (rnd() < 0.92) panicle(px, py, ang, d);
    if (depth < 2 && rnd() < 0.3) panicle(px, py, ang + r(-0.9, 0.9), d + 6);
  };

  if (from === 'top') grow(W + 30, -30, Math.PI * 0.72, 540, 0, 13, 0);
  else grow(W + 30, H + 20, -Math.PI * 0.78, 520, 0, 13, 0);

  const maxD = Math.max(...segs.map((s) => s.d1), ...fronds.map((f) => f.d + 80), ...flowers.map((f) => f.d + 32), ...clusters.map((c) => c.d + 82));
  return { segs, fronds, flowers, stalks, clusters, maxD };
}

// ---------- sprites, painted once per size ----------

type Sprite = { canvas: HTMLCanvasElement; ox: number; oy: number };

function frondSprite(seed: number, scale: number): Sprite {
  const rnd = mulberry32(seed * 977 + 13);
  const len = 100;
  const c = document.createElement('canvas');
  c.width = Math.ceil((len + 12) * scale);
  c.height = Math.ceil(72 * scale);
  const x = c.getContext('2d')!;
  x.scale(scale, scale);
  x.translate(2, 36);
  x.strokeStyle = '#4a6a31';
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(0, 0);
  x.quadraticCurveTo(len * 0.5, -4, len, 2);
  x.stroke();
  // bipinnate: pinnae off the rachis, small leaflets in pairs along each pinna
  const pinnae = 8;
  for (let p = 1; p <= pinnae; p++) {
    const t = p / (pinnae + 1);
    const bx = len * t;
    const by = -4 * Math.sin(Math.PI * t) + 2 * t * t;
    for (const side of [-1, 1]) {
      const pa = side * (0.95 - t * 0.25) + (rnd() - 0.5) * 0.12;
      const pl = 31 * (1 - t * 0.62);
      x.strokeStyle = 'rgba(74,106,49,0.85)';
      x.lineWidth = 0.55;
      x.beginPath();
      x.moveTo(bx, by);
      x.lineTo(bx + Math.cos(pa) * pl, by + Math.sin(pa) * pl);
      x.stroke();
      const leaflets = 9;
      for (let l = 1; l <= leaflets; l++) {
        const lt = l / (leaflets + 0.5);
        const lx = bx + Math.cos(pa) * pl * lt;
        const ly = by + Math.sin(pa) * pl * lt;
        const size = 3.3 * (1 - lt * 0.45) * (1 - t * 0.3);
        for (const ls of [-1, 1]) {
          const la = pa + ls * (1.05 + rnd() * 0.2);
          const cx = lx + Math.cos(la) * size * 0.9;
          const cy = ly + Math.sin(la) * size * 0.9;
          x.fillStyle = LEAF[Math.floor(rnd() * LEAF.length)];
          x.beginPath();
          x.ellipse(cx, cy, size, size * 0.38, la, 0, Math.PI * 2);
          x.fill();
          // a light midrib on the larger leaflets catches the sun
          if (size > 2.2) {
            x.strokeStyle = 'rgba(214,232,170,0.35)';
            x.lineWidth = 0.3;
            x.beginPath();
            x.moveTo(cx - Math.cos(la) * size * 0.7, cy - Math.sin(la) * size * 0.7);
            x.lineTo(cx + Math.cos(la) * size * 0.7, cy + Math.sin(la) * size * 0.7);
            x.stroke();
          }
        }
      }
    }
  }
  return { canvas: c, ox: 2, oy: 36 };
}

function flowerSprite(v: number, bud: boolean, scale: number): Sprite {
  const h = [250, 246, 254, 243, 257, 248][v % 6];
  const l = [0, 4, -3, 6, -1, 2][v % 6];
  const c = document.createElement('canvas');
  c.width = Math.ceil(34 * scale);
  c.height = Math.ceil(26 * scale);
  const x = c.getContext('2d')!;
  x.scale(scale, scale);
  x.translate(3, 13);
  if (bud) {
    const g = x.createLinearGradient(0, 0, 14, 0);
    g.addColorStop(0, `hsl(${h},34%,${40 + l}%)`);
    g.addColorStop(1, `hsl(${h},44%,${60 + l}%)`);
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0, 0);
    x.bezierCurveTo(3, -4, 11, -4.5, 14, 0);
    x.bezierCurveTo(11, 4.5, 3, 4, 0, 0);
    x.fill();
    x.fillStyle = '#5d7a3a';
    x.beginPath();
    x.ellipse(1.2, 0, 1.8, 1.4, 0, 0, Math.PI * 2);
    x.fill();
    return { canvas: c, ox: 3, oy: 13 };
  }
  // tube, narrow at the calyx and flaring to the mouth
  const g = x.createLinearGradient(0, 0, 24, 0);
  g.addColorStop(0, `hsl(${h},30%,${38 + l}%)`);
  g.addColorStop(0.55, `hsl(${h},46%,${60 + l}%)`);
  g.addColorStop(1, `hsl(${h},56%,${74 + l}%)`);
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(0, -1.4);
  x.bezierCurveTo(8, -2.2, 15, -3.6, 21, -7);
  x.lineTo(21, 7);
  x.bezierCurveTo(15, 3.6, 8, 2.2, 0, 1.4);
  x.closePath();
  x.fill();
  // five soft lobes around a deeper throat
  x.fillStyle = `hsl(${h},60%,${78 + l}%)`;
  for (let k = 0; k < 5; k++) {
    const t = -1 + (k / 4) * 2;
    x.beginPath();
    x.ellipse(22 - Math.abs(t) * 0.8, t * 5.6, 2.6, 2.9, 0, 0, Math.PI * 2);
    x.fill();
  }
  x.fillStyle = `hsl(${h},40%,${46 + l}%)`;
  x.beginPath();
  x.ellipse(22.3, 0.4, 1.3, 3.4, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = 'rgba(255,255,255,0.75)';
  x.beginPath();
  x.ellipse(22.6, -0.6, 0.45, 2, 0, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.32)';
  x.lineWidth = 0.7;
  x.beginPath();
  x.moveTo(3, -1.4);
  x.bezierCurveTo(9, -2.3, 15, -3.4, 20, -6.2);
  x.stroke();
  x.fillStyle = '#5d7a3a';
  x.beginPath();
  x.ellipse(1, 0, 2, 1.6, 0, 0, Math.PI * 2);
  x.fill();
  return { canvas: c, ox: 3, oy: 13 };
}

function haloSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(178,158,255,0.5)');
  g.addColorStop(0.4, 'rgba(162,142,250,0.2)');
  g.addColorStop(1, 'rgba(150,130,240,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return c;
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/** opens a touch past full size, then settles */
const bloomEase = (t: number) => {
  const k = clamp01(t) - 1;
  return 1 + 2.4 * k * k * k + 1.4 * k * k;
};

type Props = { seed?: number; className?: string; from?: From; start?: string };

export default function Blossom({ seed = 7, className, from = 'top', start = 'top 85%' }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const shadeRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement>(null);
  const lifeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current!;
    const base = baseRef.current!;
    const shade = shadeRef.current!;
    const glow = glowRef.current!;
    const life = lifeRef.current!;
    const bx = base.getContext('2d')!;
    const sx = shade.getContext('2d')!;
    const gx = glow.getContext('2d')!;
    const lx = life.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const data = generate(seed, from);

    // device pixels per sprite unit; sprites are painted a little above display size so they stay crisp
    let spriteK = 1;
    let fronds: Sprite[] = [];
    let blooms: Sprite[] = [];
    let buds: Sprite[] = [];
    const halo = haloSprite();

    const fit = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const [c, k] of [
        [base, dpr],
        [shade, Math.min(dpr, 1)],
        [glow, Math.min(dpr, 1)],
        [life, Math.min(dpr, 1.5)],
      ] as const) {
        c.width = Math.max(2, Math.round(rect.width * k));
        c.height = Math.max(2, Math.round(rect.height * k));
      }
      spriteK = (base.width / W) * 1.25;
      fronds = [0, 1, 2, 3].map((k) => frondSprite(seed + k, spriteK));
      blooms = [0, 1, 2, 3, 4, 5].map((v) => flowerSprite(v, false, spriteK));
      buds = [0, 1].map((v) => flowerSprite(v, true, spriteK));
    };

    /** logical units → canvas pixels */
    const logical = (ctx: CanvasRenderingContext2D, c: HTMLCanvasElement) => ctx.setTransform(c.width / W, 0, 0, c.height / H, 0, 0);

    /** draw a sprite at a logical point, rotated, `size` logical units per sprite unit */
    const sprite = (ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, sp: Sprite, x: number, y: number, a: number, size: number) => {
      const k = c.width / W;
      const m = (size * k) / spriteK;
      const cos = Math.cos(a) * m;
      const sin = Math.sin(a) * m;
      ctx.setTransform(cos, sin, -sin, cos, x * k, y * k);
      ctx.drawImage(sp.canvas, -sp.ox * spriteK, -sp.oy * spriteK);
    };

    const drawFronds = (reach: number, back: boolean) => {
      for (const f of data.fronds) {
        if (f.back !== back) continue;
        const t = easeOut(clamp01((reach - f.d - 8) / 70));
        if (t <= 0) continue;
        bx.globalAlpha = Math.min(1, t * 1.6) * (back ? 0.72 : 1);
        // fronds unfurl: they start folded toward the stem and small
        sprite(bx, base, fronds[f.sprite], f.x, f.y, f.a + (1 - t) * 0.6, (f.len / 100) * t);
      }
      bx.globalAlpha = 1;
    };

    const drawSeg = (ctx: CanvasRenderingContext2D, s: Seg, t: number) => {
      const x1 = s.x0 + (s.x1 - s.x0) * t;
      const y1 = s.y0 + (s.y1 - s.y0) * t;
      const w1 = s.w0 + (s.w1 - s.w0) * t;
      const a = Math.atan2(y1 - s.y0, x1 - s.x0);
      const nx = Math.cos(a + Math.PI / 2);
      const ny = Math.sin(a + Math.PI / 2);
      ctx.fillStyle = BARK.base;
      ctx.beginPath();
      ctx.moveTo(s.x0 + nx * s.w0 * 0.5, s.y0 + ny * s.w0 * 0.5);
      ctx.lineTo(x1 + nx * w1 * 0.5, y1 + ny * w1 * 0.5);
      ctx.lineTo(x1 - nx * w1 * 0.5, y1 - ny * w1 * 0.5);
      ctx.lineTo(s.x0 - nx * s.w0 * 0.5, s.y0 - ny * s.w0 * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x1, y1, w1 * 0.5, 0, Math.PI * 2);
      ctx.fill();
      if (s.w0 <= 2.2) return;
      // light from the upper left: a lit edge and a shaded edge give the stem volume
      ctx.lineWidth = Math.max(0.6, s.w0 * 0.18);
      ctx.strokeStyle = BARK.light;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(s.x0 - nx * s.w0 * 0.22, s.y0 - ny * s.w0 * 0.22);
      ctx.lineTo(x1 - nx * w1 * 0.22, y1 - ny * w1 * 0.22);
      ctx.stroke();
      ctx.strokeStyle = BARK.dark;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(s.x0 + nx * s.w0 * 0.38, s.y0 + ny * s.w0 * 0.38);
      ctx.lineTo(x1 + nx * w1 * 0.38, y1 + ny * w1 * 0.38);
      ctx.stroke();
      // fissures and lenticels in the older bark
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      for (const m of s.marks) {
        if (m.t > t) continue;
        const mx = s.x0 + (s.x1 - s.x0) * m.t + nx * m.side * s.w0;
        const my = s.y0 + (s.y1 - s.y0) * m.t + ny * m.side * s.w0;
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(a) * m.len, my + Math.sin(a) * m.len);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const drawStalk = (ctx: CanvasRenderingContext2D, s: Stalk, t: number) => {
      ctx.moveTo(s.x0, s.y0);
      ctx.lineTo(s.x0 + (s.x1 - s.x0) * t, s.y0 + (s.y1 - s.y0) * t);
    };

    const drawFlower = (ctx: CanvasRenderingContext2D, f: Flower, t: number) => {
      ctx.globalAlpha = Math.min(1, t * 2);
      sprite(ctx, base, f.bud ? buds[f.v % 2] : blooms[f.v], f.x, f.y, f.a + (1 - t) * 0.5, f.s * FLOWER_SIZE * bloomEase(t));
    };

    /** a small glow at the mouth of each open trumpet (logical transform expected) */
    const drawLit = (ctx: CanvasRenderingContext2D, f: Flower, alpha: number) => {
      const r = 9 * f.s;
      const out = 12 * FLOWER_SIZE * f.s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(halo, f.x + Math.cos(f.a) * out - r, f.y + Math.sin(f.a) * out - r, r * 2, r * 2);
    };

    const drawCluster = (ctx: CanvasRenderingContext2D, c: Cluster, alpha: number) => {
      ctx.globalAlpha = alpha;
      ctx.drawImage(halo, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
    };

    /**
     * While the branch grows, every piece that has finished is drawn once into a
     * cache and each frame only redraws what is still moving: a few dozen
     * segments and flowers instead of hundreds. The caches are dropped when the
     * branch is done.
     */
    type Cache = {
      wood: CanvasRenderingContext2D;
      bloom: CanvasRenderingContext2D;
      glow: CanvasRenderingContext2D;
      seg: Uint8Array;
      stalk: Uint8Array;
      flower: Uint8Array;
      lit: Uint8Array;
      cluster: Uint8Array;
    };
    let cache: Cache | null = null;
    const layer = (like: HTMLCanvasElement) => {
      const c = document.createElement('canvas');
      c.width = like.width;
      c.height = like.height;
      return c.getContext('2d')!;
    };
    const makeCache = (): Cache => ({
      wood: layer(base),
      bloom: layer(base),
      glow: layer(glow),
      seg: new Uint8Array(data.segs.length),
      stalk: new Uint8Array(data.stalks.length),
      flower: new Uint8Array(data.flowers.length),
      lit: new Uint8Array(data.flowers.length),
      cluster: new Uint8Array(data.clusters.length),
    });

    const blit = (ctx: CanvasRenderingContext2D, from: CanvasRenderingContext2D) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.drawImage(from.canvas, 0, 0);
    };

    const paint = (g: number) => {
      const reach = g * data.maxD;
      const C = cache;
      bx.setTransform(1, 0, 0, 1, 0, 0);
      bx.clearRect(0, 0, base.width, base.height);

      // distant leaves first, so the wood passes in front of them
      drawFronds(reach, true);

      if (C) {
        blit(bx, C.wood);
        logical(C.wood, base);
      }
      logical(bx, base);
      for (let i = 0; i < data.segs.length; i++) {
        const s = data.segs[i];
        if (C?.seg[i] || reach <= s.d0) continue;
        const t = clamp01((reach - s.d0) / (s.d1 - s.d0));
        drawSeg(bx, s, t);
        if (C && t >= 1) {
          drawSeg(C.wood, s, 1);
          C.seg[i] = 1;
        }
      }

      drawFronds(reach, false);

      // flower stalks and flowers sit on top; finished ones live in the bloom cache
      if (C) {
        blit(bx, C.bloom);
        logical(C.bloom, base);
        C.bloom.strokeStyle = '#5f5a3a';
        C.bloom.lineWidth = 0.8;
        C.bloom.beginPath();
      }
      logical(bx, base);
      bx.strokeStyle = '#5f5a3a';
      bx.lineWidth = 0.8;
      bx.beginPath();
      for (let i = 0; i < data.stalks.length; i++) {
        const s = data.stalks[i];
        if (C?.stalk[i]) continue;
        const t = clamp01((reach - s.d) / 14);
        if (t <= 0) continue;
        drawStalk(bx, s, t);
        if (C && t >= 1) {
          drawStalk(C.bloom, s, 1);
          C.stalk[i] = 1;
        }
      }
      bx.stroke();
      C?.bloom.stroke();

      for (let i = 0; i < data.flowers.length; i++) {
        if (C?.flower[i]) continue;
        const f = data.flowers[i];
        const t = clamp01((reach - f.d - 4) / 26);
        if (t <= 0) continue;
        drawFlower(bx, f, t);
        if (C && t >= 1) {
          drawFlower(C.bloom, f, 1);
          C.flower[i] = 1;
        }
      }
      bx.globalAlpha = 1;
      if (C) C.bloom.globalAlpha = 1;

      // halos gather behind the flower heads as they open, then each trumpet lights up
      gx.setTransform(1, 0, 0, 1, 0, 0);
      gx.clearRect(0, 0, glow.width, glow.height);
      if (C) {
        blit(gx, C.glow);
        logical(C.glow, glow);
        C.glow.globalCompositeOperation = 'lighter';
      }
      logical(gx, glow);
      gx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < data.clusters.length; i++) {
        if (C?.cluster[i]) continue;
        const c = data.clusters[i];
        const t = clamp01((reach - c.d - 20) / 60);
        if (t <= 0) continue;
        drawCluster(gx, c, t * 0.8);
        if (C && t >= 1) {
          drawCluster(C.glow, c, 0.8);
          C.cluster[i] = 1;
        }
      }
      for (let i = 0; i < data.flowers.length; i++) {
        const f = data.flowers[i];
        if (f.bud || C?.lit[i]) continue;
        const t = clamp01((reach - f.d - 10) / 30);
        if (t <= 0) continue;
        drawLit(gx, f, t * 0.38);
        if (C && t >= 1) {
          drawLit(C.glow, f, 0.38);
          C.lit[i] = 1;
        }
      }
      gx.globalAlpha = 1;
      gx.globalCompositeOperation = 'source-over';
      if (C) {
        C.glow.globalAlpha = 1;
        C.glow.globalCompositeOperation = 'source-over';
      }
    };

    /** a soft shadow of the finished branch on the paper, offset down and right */
    const castShadow = () => {
      const off = shade.width + 40;
      const k = shade.width / W;
      sx.setTransform(1, 0, 0, 1, 0, 0);
      sx.clearRect(0, 0, shade.width, shade.height);
      sx.shadowColor = 'rgba(44,34,66,0.2)';
      sx.shadowBlur = 8 * k;
      sx.shadowOffsetX = off + 7 * k;
      sx.shadowOffsetY = 11 * k;
      // draw off canvas so only the shadow lands
      sx.drawImage(base, -off, 0, shade.width, shade.height);
      sx.shadowColor = 'transparent';
    };

    // ---- living layer: twinkles, pollen and the odd falling flower ----
    type Fall = { x: number; y: number; vx: number; vy: number; a: number; va: number; life: number; v: number };
    const falls: Fall[] = [];
    const rl = mulberry32(seed + 99);
    const sparkles = Array.from({ length: Math.min(40, data.flowers.length) }, () => {
      const f = data.flowers[Math.floor(rl() * data.flowers.length)];
      // sit at the mouth of the trumpet, where light catches the petals
      const reachOut = 13 * FLOWER_SIZE * f.s;
      return { x: f.x + Math.cos(f.a) * reachOut, y: f.y + Math.sin(f.a) * reachOut, ph: rl() * 6.28, sp: 1 + rl() * 2, s: 0.7 + rl() * 1.2 };
    });
    const motes = Array.from({ length: 16 }, () => {
      const c = data.clusters[Math.floor(rl() * data.clusters.length)] ?? { x: W / 2, y: H / 2, r: 40 };
      return { ox: c.x + (rl() - 0.5) * c.r, oy: c.y + (rl() - 0.5) * c.r * 0.6, t: rl() * 8, sp: 0.07 + rl() * 0.09 };
    });
    let nextFall = 1.2;

    const live = (time: number, dt: number, strength: number) => {
      lx.setTransform(1, 0, 0, 1, 0, 0);
      lx.clearRect(0, 0, life.width, life.height);
      if (strength <= 0) return;
      logical(lx, life);
      for (const s of sparkles) {
        const a = Math.pow((Math.sin(time * s.sp + s.ph) + 1) / 2, 5) * strength;
        if (a < 0.03) continue;
        lx.globalAlpha = a * 0.55;
        lx.fillStyle = '#a996ff';
        lx.beginPath();
        lx.arc(s.x, s.y, s.s * 3.4, 0, Math.PI * 2);
        lx.fill();
        lx.globalAlpha = a;
        lx.fillStyle = '#ffffff';
        lx.beginPath();
        lx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
        lx.fill();
      }
      lx.fillStyle = '#f6d98e';
      for (const m of motes) {
        m.t += dt * m.sp;
        const ph = m.t % 1;
        lx.globalAlpha = Math.sin(ph * Math.PI) * 0.7 * strength;
        lx.beginPath();
        lx.arc(m.ox - ph * 36 + Math.sin(m.t * 6) * 6, m.oy - ph * 64, 1.15, 0, Math.PI * 2);
        lx.fill();
      }

      // jacaranda drops whole trumpets; they spin and drift as they fall
      nextFall -= dt;
      if (nextFall <= 0 && falls.length < 5 && data.flowers.length) {
        const f = data.flowers[Math.floor(rl() * data.flowers.length)];
        falls.push({ x: f.x, y: f.y, vx: -8 - rl() * 10, vy: 18 + rl() * 12, a: f.a, va: (rl() - 0.5) * 2.6, life: 0, v: f.v });
        nextFall = 1.6 + rl() * 2.4;
      }
      for (let i = falls.length - 1; i >= 0; i--) {
        const p = falls[i];
        p.life += dt;
        p.x += (p.vx + Math.sin(p.life * 2.2) * 14) * dt;
        p.y += p.vy * dt;
        p.a += p.va * dt;
        if (p.y > H + 20 || p.life > 10) {
          falls.splice(i, 1);
          continue;
        }
        lx.globalAlpha = Math.min(1, p.life * 2) * Math.min(1, (10 - p.life) / 2) * strength;
        sprite(lx, life, blooms[p.v], p.x, p.y, p.a, FLOWER_SIZE * 0.9);
      }
      lx.globalAlpha = 1;
    };

    // ---- lifecycle: grow once on entry, then only the living layer runs, only while on screen ----
    fit();
    const GROW = 3.8;
    let grown = 0;
    let state: 'idle' | 'growing' | 'done' = 'idle';
    let visible = false;
    let running = false;
    let raf = 0;
    let last = 0;

    const finish = () => {
      cache = null;
      paint(1);
      castShadow();
      state = 'done';
      el.classList.add('is-bloomed');
    };

    if (process.env.NODE_ENV !== 'production') {
      // dev only: window.__blossom[seed].time() → ms per growth frame, flushed to the GPU
      const w = window as Window & { __blossom?: Record<number, unknown>; __blossomGen?: typeof generate };
      w.__blossomGen = generate;
      (w.__blossom ??= {})[seed] = {
        flowers: data.flowers.length,
        fronds: data.fronds.length,
        segs: data.segs.length,
        bloom: () => finish(),
        time: (n = 228) => {
          const keep = cache;
          cache = makeCache();
          let worst = 0;
          const t0 = performance.now();
          for (let i = 1; i <= n; i++) {
            const f0 = performance.now();
            paint(i / n);
            worst = Math.max(worst, performance.now() - f0);
          }
          // one readback at the end, so Chrome does not move the canvas off the GPU
          bx.getImageData(0, 0, 1, 1);
          const avg = (performance.now() - t0) / n;
          cache = keep;
          if (state === 'done') finish();
          return { avg: +avg.toFixed(2), worstCpu: +worst.toFixed(2) };
        },
      };
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (state === 'growing') {
        grown = Math.min(1, grown + dt / GROW);
        paint(grown * (2 - grown) * 0.35 + grown * 0.65);
        if (grown >= 1) finish();
      }
      if (!reduce) live(now / 1000, dt, state === 'done' ? 1 : clamp01((grown - 0.65) / 0.35));
      if (visible && (state !== 'done' || !reduce)) raf = requestAnimationFrame(loop);
      else running = false;
    };

    const kick = () => {
      if (running || !visible || state === 'idle') return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const begin = () => {
      if (state !== 'idle') return;
      if (reduce) finish();
      else {
        cache = makeCache();
        state = 'growing';
      }
      kick();
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(el);

    const st = ScrollTrigger.create({ trigger: el, start, once: true, onEnter: begin });

    let resizeTimer = 0;
    let firstResize = true;
    const ro = new ResizeObserver(() => {
      if (firstResize) {
        firstResize = false;
        return;
      }
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        fit();
        if (state === 'done') finish();
        else {
          if (state === 'growing') cache = makeCache();
          paint(grown);
        }
      }, 150);
    });
    ro.observe(el);

    return () => {
      visible = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      io.disconnect();
      ro.disconnect();
      st.kill();
    };
  }, [seed, from, start]);

  const style = {
    '--sway-origin': from === 'top' ? '100% 0%' : '100% 100%',
    '--sway-delay': `${-(seed % 7) * 0.9}s`,
  } as CSSProperties;

  return (
    <div ref={wrap} className={`blossom ${className ?? ''}`} style={style} aria-hidden>
      <div className="blossom__sway">
        <canvas ref={shadeRef} className="blossom__shade" />
        <canvas ref={glowRef} className="blossom__glow" />
        <canvas ref={baseRef} className="blossom__base" />
        <canvas ref={lifeRef} className="blossom__life" />
      </div>
    </div>
  );
}
