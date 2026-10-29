import * as THREE from 'three';
import { mulberry32 } from '@/lib/random';

/**
 * Furniture for the Terrace House, built from simple solids. Each item is a small
 * group of parts in its own frame (front = +z) so it can pop into place on its own.
 */

export type MatKey = 'oak' | 'linen' | 'white' | 'throw' | 'blue' | 'rug' | 'stone' | 'metal' | 'plant' | 'pot' | 'lamp' | 'flower';
export type Part = { geo: THREE.BufferGeometry; mat: MatKey };
export type Item = { x: number; z: number; ry: number; parts: Part[] };

const B = (w: number, h: number, d: number, x = 0, y = 0, z = 0, rx = 0, ry = 0) => {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  return g.translate(x, y, z);
};
const C = (rt: number, rb: number, h: number, x = 0, y = 0, z = 0, seg = 18) => new THREE.CylinderGeometry(rt, rb, h, seg).translate(x, y, z);

function sofa(): Part[] {
  return [
    { geo: B(3.0, 0.38, 0.95, 0, 0.19, 0), mat: 'linen' },
    { geo: B(3.0, 0.44, 0.22, 0, 0.56, -0.37), mat: 'linen' },
    { geo: B(0.2, 0.56, 0.95, -1.4, 0.28, 0), mat: 'linen' },
    { geo: B(0.2, 0.56, 0.95, 1.4, 0.28, 0), mat: 'linen' },
    ...[-0.9, 0, 0.9].map((x) => ({ geo: B(0.88, 0.12, 0.7, x, 0.44, 0.06), mat: 'white' as MatKey })),
    { geo: B(0.42, 0.34, 0.12, -0.85, 0.62, -0.18, -0.25, 0.2), mat: 'throw' },
    { geo: B(0.42, 0.34, 0.12, 0.95, 0.62, -0.18, -0.25, -0.15), mat: 'blue' },
  ];
}

function armchair(): Part[] {
  return [
    { geo: B(0.82, 0.36, 0.8, 0, 0.18, 0), mat: 'linen' },
    { geo: B(0.82, 0.48, 0.16, 0, 0.5, -0.32), mat: 'linen' },
    { geo: B(0.7, 0.1, 0.6, 0, 0.41, 0.05), mat: 'white' },
  ];
}

function bed(throwMat: MatKey): Part[] {
  return [
    { geo: B(1.95, 0.3, 2.15, 0, 0.15, 0), mat: 'oak' },
    { geo: B(1.84, 0.22, 2.02, 0, 0.41, 0.02), mat: 'white' },
    { geo: B(2.1, 0.95, 0.08, 0, 0.47, -1.08), mat: 'oak' },
    { geo: B(0.62, 0.13, 0.36, -0.46, 0.58, -0.74), mat: 'white' },
    { geo: B(0.62, 0.13, 0.36, 0.46, 0.58, -0.74), mat: 'white' },
    { geo: B(1.88, 0.05, 0.66, 0, 0.545, 0.58), mat: throwMat },
    { geo: B(0.46, 0.46, 0.42, -1.3, 0.23, -0.82), mat: 'oak' },
    { geo: B(0.46, 0.46, 0.42, 1.3, 0.23, -0.82), mat: 'oak' },
    { geo: C(0.09, 0.12, 0.16, -1.3, 0.54, -0.86), mat: 'lamp' },
    { geo: C(0.09, 0.12, 0.16, 1.3, 0.54, -0.86), mat: 'lamp' },
  ];
}

function plant(scale = 1): Part[] {
  return [
    { geo: C(0.2 * scale, 0.15 * scale, 0.45 * scale, 0, 0.225 * scale, 0), mat: 'pot' },
    { geo: new THREE.IcosahedronGeometry(0.42 * scale, 1).translate(0, 0.9 * scale, 0), mat: 'plant' },
    { geo: new THREE.IcosahedronGeometry(0.3 * scale, 1).translate(0.18 * scale, 1.25 * scale, 0.05), mat: 'plant' },
  ];
}

function chair(): Part[] {
  return [
    { geo: B(0.42, 0.44, 0.4, 0, 0.22, 0), mat: 'oak' },
    { geo: B(0.44, 0.06, 0.44, 0, 0.47, 0), mat: 'linen' },
    { geo: B(0.44, 0.44, 0.05, 0, 0.7, -0.2), mat: 'oak' },
  ];
}

function lounger(): Part[] {
  return [
    { geo: B(0.66, 0.2, 1.4, 0, 0.1, 0.15), mat: 'oak' },
    { geo: B(0.62, 0.08, 1.36, 0, 0.24, 0.15), mat: 'white' },
    { geo: B(0.62, 0.08, 0.62, 0, 0.42, -0.72, -0.6), mat: 'white' },
  ];
}

export function buildFurniture(): Item[] {
  const items: Item[] = [];
  const add = (x: number, z: number, ry: number, parts: Part[]) => items.push({ x, z, ry, parts });

  // living room, looking out to the lake
  add(0.6, 2.9, 0, [{ geo: B(4.4, 0.015, 3.0, 0, 0.008, 0), mat: 'rug' }]);
  add(0.6, 1.9, 0, sofa());
  add(0.6, 3.15, 0, [
    { geo: C(0.6, 0.6, 0.06, 0, 0.38, 0, 28), mat: 'oak' },
    { geo: C(0.28, 0.34, 0.35, 0, 0.175, 0), mat: 'stone' },
    { geo: C(0.08, 0.06, 0.16, 0.2, 0.49, -0.1), mat: 'white' },
  ]);
  add(-1.6, 3.5, Math.PI / 2, armchair());
  add(2.8, 3.5, -Math.PI / 2, armchair());
  add(-2.4, 1.3, 0, [
    { geo: C(0.015, 0.015, 1.5, 0, 0.75, 0, 6), mat: 'metal' },
    { geo: C(0.14, 0.24, 0.26, 0, 1.55, 0), mat: 'lamp' },
  ]);
  add(-2.5, 5.4, 0, plant(1.1));
  add(4.0, 5.4, 0, plant(0.9));

  // kitchen and dining
  add(0.75, -5.6, 0, [
    { geo: B(5.4, 0.9, 0.62, 0, 0.45, 0), mat: 'oak' },
    { geo: B(5.46, 0.05, 0.68, 0, 0.92, 0.01), mat: 'stone' },
    { geo: B(5.4, 0.04, 0.3, 0, 1.75, -0.18), mat: 'oak' },
    { geo: B(0.7, 0.04, 0.45, -1.4, 0.95, 0.05), mat: 'metal' },
  ]);
  add(0.75, -2.7, 0, [
    { geo: B(3.0, 0.88, 1.0, 0, 0.44, 0), mat: 'oak' },
    { geo: B(3.2, 0.06, 1.12, 0, 0.91, 0), mat: 'stone' },
    ...[-0.9, 0, 0.9].flatMap((x) => [
      { geo: C(0.17, 0.17, 0.05, x, 0.68, 0.85), mat: 'linen' as MatKey },
      { geo: C(0.03, 0.03, 0.66, x, 0.33, 0.85, 8), mat: 'metal' as MatKey },
    ]),
    ...[-0.9, 0, 0.9].flatMap((x) => [
      { geo: C(0.006, 0.006, 0.7, x, 2.55, 0, 4), mat: 'metal' as MatKey },
      { geo: C(0.08, 0.15, 0.16, x, 2.14, 0), mat: 'lamp' as MatKey },
    ]),
  ]);
  add(0.8, -0.65, 0, [
    { geo: B(2.5, 0.05, 1.0, 0, 0.75, 0), mat: 'oak' },
    { geo: B(0.08, 0.72, 0.8, -1.05, 0.36, 0), mat: 'oak' },
    { geo: B(0.08, 0.72, 0.8, 1.05, 0.36, 0), mat: 'oak' },
    { geo: C(0.09, 0.07, 0.22, 0, 0.88, 0), mat: 'white' },
  ]);
  for (const x of [-0.75, 0, 0.75]) {
    add(0.8 + x, -1.35, 0, chair());
    add(0.8 + x, 0.05, Math.PI, chair());
  }

  // bedrooms
  add(7.1, 1.75, 0, bed('throw'));
  add(-6.2, 2.25, 0, bed('blue'));
  add(-6.2, -4.85, 0, bed('throw'));
  add(8.9, 5.3, 0, plant(0.8));
  add(-8.9, 5.4, 0, plant(0.8));

  // baths
  add(8.3, -1.0, 0, [
    { geo: new THREE.CapsuleGeometry(0.42, 0.9, 4, 16).rotateZ(Math.PI / 2).scale(1, 0.55, 1).translate(0, 0.28, 0), mat: 'white' },
    { geo: B(1.0, 0.05, 0.5, -2.6, 0.85, -1.15), mat: 'stone' },
    { geo: B(0.9, 0.8, 0.45, -2.6, 0.4, -1.15), mat: 'oak' },
  ]);
  add(-7.8, -0.3, 0, [
    { geo: B(1.0, 0.05, 0.5, 0, 0.85, -0.9), mat: 'stone' },
    { geo: B(0.9, 0.8, 0.45, 0, 0.4, -0.9), mat: 'oak' },
    { geo: B(0.9, 0.05, 0.9, 0.2, 0.025, 0.45), mat: 'stone' },
  ]);

  // entry
  add(7.1, -5.3, 0, [
    { geo: B(1.6, 0.05, 0.4, 0, 0.8, 0), mat: 'oak' },
    { geo: B(1.5, 0.78, 0.36, 0, 0.39, 0), mat: 'oak' },
    { geo: C(0.12, 0.1, 0.3, -0.5, 0.97, 0), mat: 'pot' },
  ]);
  add(5.3, -3.2, 0, plant(0.9));

  // the terrace
  add(-4.5, 7.7, 0, lounger());
  add(-3.5, 7.7, 0, lounger());
  add(2.6, 7.75, 0, [
    { geo: B(2.2, 0.05, 0.95, 0, 0.74, 0), mat: 'oak' },
    { geo: B(0.08, 0.72, 0.75, -0.95, 0.36, 0), mat: 'oak' },
    { geo: B(0.08, 0.72, 0.75, 0.95, 0.36, 0), mat: 'oak' },
  ]);
  for (const x of [-0.7, 0, 0.7]) {
    add(2.6 + x, 7.05, 0, chair());
    add(2.6 + x, 8.45, Math.PI, chair());
  }
  for (const x of [-8.6, 7.6]) add(x, 8.9, 0, plant(0.85));
  return items;
}

/** Bougainvillea along the pergola beam: world positions for instanced blooms. */
export function pergolaBlooms() {
  const rnd = mulberry32(8);
  const out: THREE.Vector3[] = [];
  for (let k = 0; k < 90; k++) {
    const x = -9.3 + rnd() * 18.6;
    const cluster = Math.abs(Math.sin(x * 0.7)) > 0.35;
    if (!cluster) continue;
    out.push(new THREE.Vector3(x, 2.62 + rnd() * 0.28 - (rnd() < 0.3 ? 0.4 : 0), 9.1 + rnd() * 0.35));
  }
  return out;
}

/** Wide oak planks for the floor. */
export function plankTexture(base: string, seed = 3) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d')!;
  const rnd = mulberry32(seed);
  const col = new THREE.Color(base);
  const rows = 8;
  for (let r = 0; r < rows; r++) {
    let px = -rnd() * 200;
    while (px < 512) {
      const w = 180 + rnd() * 220;
      const k = 0.92 + rnd() * 0.12;
      x.fillStyle = `rgb(${Math.min(255, col.r * 255 * k)},${Math.min(255, col.g * 255 * k)},${Math.min(255, col.b * 255 * k)})`;
      x.fillRect(px, r * 64, w, 64);
      for (let g = 0; g < 7; g++) {
        x.strokeStyle = `rgba(90,60,30,${0.05 + rnd() * 0.06})`;
        x.beginPath();
        const y = r * 64 + 6 + rnd() * 52;
        x.moveTo(px, y);
        x.bezierCurveTo(px + w * 0.3, y + (rnd() - 0.5) * 8, px + w * 0.7, y + (rnd() - 0.5) * 8, px + w, y);
        x.stroke();
      }
      x.fillStyle = 'rgba(60,40,20,0.25)';
      x.fillRect(px, r * 64, 2, 64);
      px += w;
    }
    x.fillStyle = 'rgba(60,40,20,0.3)';
    x.fillRect(0, r * 64, 512, 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
