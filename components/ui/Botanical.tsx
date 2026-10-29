'use client';

import { useMemo, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { mulberry32, round } from '@/lib/random';

type Pt = [number, number];
type Stem = { d: string; depth: number };
type Leaf = { d: string; depth: number };
type Bloom = { d: string; x: number; y: number };

// Catmull-Rom through the points, written as cubic Beziers.
function smooth(pts: Pt[]) {
  let d = `M${round(pts[0][0])} ${round(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(p2[0])} ${round(p2[1])}`;
  }
  return d;
}

// A small almond: the leaflet of a jacaranda frond, or a petal.
function almond(x: number, y: number, a: number, len: number, wid: number) {
  const tx = x + Math.cos(a) * len;
  const ty = y + Math.sin(a) * len;
  const nx = Math.cos(a + Math.PI / 2) * wid;
  const ny = Math.sin(a + Math.PI / 2) * wid;
  const mx = (x + tx) / 2;
  const my = (y + ty) / 2;
  return `M${round(x)} ${round(y)} Q${round(mx + nx)} ${round(my + ny)} ${round(tx)} ${round(ty)} Q${round(mx - nx)} ${round(my - ny)} ${round(x)} ${round(y)}`;
}

function generate(seed: number) {
  const rnd = mulberry32(seed);
  const r = (a: number, b: number) => a + rnd() * (b - a);
  const stems: Stem[] = [];
  const leaves: Leaf[] = [];
  const blooms: Bloom[] = [];

  function frond(x: number, y: number, a: number, len: number, depth: number) {
    const rachis: Pt[] = [];
    const steps = 9;
    let px = x;
    let py = y;
    let ang = a;
    for (let i = 0; i <= steps; i++) {
      rachis.push([px, py]);
      ang += r(-0.06, 0.06);
      px += Math.cos(ang) * (len / steps);
      py += Math.sin(ang) * (len / steps);
    }
    let d = smooth(rachis);
    for (let i = 1; i < steps; i++) {
      const [lx, ly] = rachis[i];
      const size = (1 - i / steps) * 9 + 4;
      d += ' ' + almond(lx, ly, ang - 1.0, size, size * 0.28);
      d += ' ' + almond(lx, ly, ang + 1.0, size, size * 0.28);
    }
    leaves.push({ d, depth });
  }

  function cluster(x: number, y: number, a: number) {
    const n = Math.floor(r(7, 13));
    for (let i = 0; i < n; i++) {
      const ca = a + r(-1.3, 1.3);
      const dist = r(4, 26);
      const bx = x + Math.cos(ca) * dist;
      const by = y + Math.sin(ca) * dist;
      const ba = ca + r(-0.5, 0.5);
      const len = r(9, 14);
      // trumpet: a long almond with a flared mouth
      const d =
        almond(bx, by, ba, len, len * 0.3) +
        ' ' +
        almond(bx + Math.cos(ba) * len * 0.8, by + Math.sin(ba) * len * 0.8, ba + 0.9, len * 0.35, len * 0.16) +
        ' ' +
        almond(bx + Math.cos(ba) * len * 0.8, by + Math.sin(ba) * len * 0.8, ba - 0.9, len * 0.35, len * 0.16);
      blooms.push({ d, x: round(bx), y: round(by) });
    }
  }

  function grow(x: number, y: number, a: number, length: number, depth: number) {
    const pts: Pt[] = [[x, y]];
    const steps = 7 + Math.floor(rnd() * 3);
    let px = x;
    let py = y;
    let ang = a;
    const bend = r(-0.07, 0.07);
    for (let i = 1; i <= steps; i++) {
      ang += bend + r(-0.18, 0.18);
      px += Math.cos(ang) * (length / steps);
      py += Math.sin(ang) * (length / steps);
      pts.push([px, py]);
      if (depth < 3 && i > 1 && i < steps && rnd() < 0.42 - depth * 0.08) {
        const side = rnd() < 0.5 ? -1 : 1;
        grow(px, py, ang + side * r(0.5, 0.95), length * r(0.42, 0.6), depth + 1);
      } else if (depth >= 1 && i > 2 && rnd() < 0.3) {
        frond(px, py, ang + (rnd() < 0.5 ? -1 : 1) * r(0.7, 1.2), r(48, 78), depth);
      }
    }
    stems.push({ d: smooth(pts), depth });
    if (depth >= 1) frond(px, py, ang + r(-0.3, 0.3), r(56, 84), depth);
    if (depth >= 1 && rnd() < 0.75) cluster(px + Math.cos(ang) * 10, py + Math.sin(ang) * 10, ang);
  }

  // Enter from the top right corner and lean down into the page.
  grow(620, -20, Math.PI * 0.72, 520, 0);
  return { stems, leaves, blooms };
}

type Props = { seed?: number; className?: string; start?: string; end?: string };

export default function Botanical({ seed = 7, className, start = 'top 85%', end = 'bottom 35%' }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const { stems, leaves, blooms } = useMemo(() => generate(seed), [seed]);

  useGSAP(
    () => {
      ref.current!.querySelectorAll<SVGPathElement>('.bot-bloom').forEach((el) => {
        gsap.set(el, { scale: 0, svgOrigin: `${el.dataset.x} ${el.dataset.y}` });
      });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start, end, scrub: 0.8 },
        defaults: { ease: 'none' },
      });
      [0, 1, 2, 3].forEach((depth) => {
        const s = ref.current!.querySelectorAll(`.bot-stem[data-depth="${depth}"]`);
        if (s.length) tl.to(s, { strokeDashoffset: 0, duration: 1, stagger: 0.08 }, depth * 0.45);
      });
      tl.to('.bot-leaf', { strokeDashoffset: 0, duration: 0.9, stagger: 0.02 }, 0.7);
      tl.to('.bot-bloom', { scale: 1, opacity: 1, duration: 0.4, stagger: 0.008, ease: 'back.out(2)' }, 1.4);
    },
    { scope: ref },
  );

  return (
    <svg ref={ref} className={className} viewBox="0 0 600 720" fill="none" aria-hidden style={{ overflow: 'visible' }}>
      <g stroke="currentColor" strokeWidth={1.1} strokeLinecap="round">
        {stems.map((s, i) => (
          <path key={`s${i}`} className="bot-stem" data-depth={s.depth} d={s.d} pathLength={1} strokeWidth={1.6 - s.depth * 0.3} style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
        ))}
        {leaves.map((l, i) => (
          <path key={`l${i}`} className="bot-leaf" d={l.d} pathLength={1} strokeWidth={0.7} style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
        ))}
      </g>
      <g stroke="currentColor" strokeWidth={0.6} fill="var(--jacaranda)" fillOpacity={0.78}>
        {blooms.map((b, i) => (
          <path
            key={`b${i}`}
            className="bot-bloom"
            d={b.d}
            data-x={b.x}
            data-y={b.y}
            style={{ opacity: 0 }}
          />
        ))}
      </g>
    </svg>
  );
}
