import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32 } from '@/lib/random';

/**
 * Procedural model of the Ituze hillside. The lake is toward +z (west), the hill
 * climbs toward -z (east). Terraces are cut like a contour model, faced in basalt
 * and planted on top; every residence sits on the front edge of its terrace.
 * Geometry is merged per material so the whole estate draws in a handful of calls.
 */

export const LAYERS = 7;
export const T = 0.55;
const X0 = -24;
const X1 = 24;
const ZB = -24;
export const STAIR_X = 1.2;

export function frontZ(i: number, x: number) {
  return (
    11 -
    i * 3.4 +
    2.4 * Math.exp(-((x / 13) ** 2)) +
    1.1 * Math.sin(x * 0.19 + i * 1.7) +
    0.55 * Math.sin(x * 0.51 + i * 0.6)
  );
}

export const slope = (i: number, x: number) => (frontZ(i, x + 0.01) - frontZ(i, x - 0.01)) / 0.02;

export function buildLayers() {
  const out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < LAYERS; i++) {
    // Each terrace is only the strip you can see, tucked under the next riser:
    // full slabs stacked seven deep cost seven times the pixels at the back of the hill.
    const back = (x: number) => (i === LAYERS - 1 ? ZB : frontZ(i + 1, x) - 0.6);
    const s = new THREE.Shape();
    s.moveTo(X0, -back(X0));
    for (let x = X0 + 0.5; x <= X1; x += 0.5) s.lineTo(x, -back(x));
    s.lineTo(X1, -back(X1));
    for (let x = X1; x >= X0; x -= 0.5) s.lineTo(x, -frontZ(i, x));
    s.lineTo(X0, -frontZ(i, X0));
    s.closePath();
    // group 0 = caps (lawn), group 1 = sides (stone)
    const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(-Math.PI / 2);
    bakeAO(g, 0.6, T * 0.9);
    out.push(g);
  }
  return out;
}

export type Placement = { x: number; y: number; z: number; ry: number; s?: number };

/**
 * Cheap baked ambient occlusion: vertex colours darken toward the foot of each
 * piece, which is where contact shadow would gather. Replaces screen space AO.
 */
export function bakeAO(g: THREE.BufferGeometry, floor: number, reach: number) {
  const pos = g.getAttribute('position');
  let minY = Infinity;
  for (let i = 0; i < pos.count; i++) minY = Math.min(minY, pos.getY(i));
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(1, Math.max(0, (pos.getY(i) - minY) / reach));
    const k = floor + (1 - floor) * t * t * (3 - 2 * t);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
}

type Buckets = Record<
  'walls' | 'trim' | 'glass' | 'wood' | 'water' | 'rail' | 'solar' | 'stone' | 'green' | 'fabric',
  THREE.BufferGeometry[]
>;

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

/** Adds geometry in a local frame (house space) transformed by `m`. */
function placer(b: Buckets, m: THREE.Matrix4) {
  return (bucket: keyof Buckets, g: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0) => {
    if (rx) g.rotateX(rx);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    g.applyMatrix4(m);
    // non indexed and without uvs so mixed primitives merge cleanly
    const ng = g.index ? g.toNonIndexed() : g;
    ng.deleteAttribute('uv');
    bakeAO(ng, bucket === 'green' || bucket === 'fabric' || bucket === 'water' || bucket === 'rail' ? 0.86 : 0.64, 0.45);
    b[bucket].push(ng);
  };
}

type HouseOpts = { w: number; duplex: boolean; pool: boolean; solar: boolean; umbrella: boolean };

function house(b: Buckets, m: THREE.Matrix4, o: HouseOpts, flowers: THREE.Vector3[], lamps: THREE.Vector3[], seats: THREE.Vector3[]) {
  const put = placer(b, m);
  const { w } = o;
  const D = 2;
  const H = 1.15;
  const fz = D / 2;

  put('walls', box(w, H, D), 0, H / 2, 0);
  // parapet lip so the roof reads as a terrace
  put('trim', box(w + 0.04, 0.09, 0.06), 0, H + 0.045, fz - 0.03);
  put('trim', box(w + 0.04, 0.09, 0.06), 0, H + 0.045, -fz + 0.03);
  put('trim', box(0.06, 0.09, D), w / 2 - 0.01, H + 0.045, 0);
  put('trim', box(0.06, 0.09, D), -w / 2 + 0.01, H + 0.045, 0);
  // a plinth line of stone at the foot of the wall
  put('stone', box(w + 0.02, 0.08, D + 0.02), 0, 0.04, 0);

  // two tall glazed openings with frames and mullions
  for (const sx of [-1, 1]) {
    const ox = sx * w * 0.22;
    const ow = w * 0.36;
    put('glass', box(ow, 0.72, 0.03), ox, 0.54, fz + 0.005);
    put('trim', box(ow + 0.07, 0.045, 0.06), ox, 0.92, fz + 0.02);
    put('trim', box(ow + 0.07, 0.035, 0.07), ox, 0.165, fz + 0.025);
    put('trim', box(0.035, 0.72, 0.05), ox - ow / 2 - 0.015, 0.54, fz + 0.015);
    put('trim', box(0.035, 0.72, 0.05), ox + ow / 2 + 0.015, 0.54, fz + 0.015);
    put('trim', box(0.022, 0.72, 0.045), ox, 0.54, fz + 0.02);
  }
  // side slit window and a timber door
  put('glass', box(0.03, 0.52, 0.26), w / 2 + 0.006, 0.58, -0.35);
  put('wood', box(0.03, 0.66, 0.32), -w / 2 - 0.006, 0.33, 0.35);

  // deck and pergola over the front terrace
  put('wood', box(w + 0.3, 0.05, 0.9), 0, 0.025, fz + 0.45);
  for (const sx of [-1, 1]) {
    put('wood', box(0.06, 0.97, 0.06), sx * (w / 2 + 0.1), 0.485, fz + 0.84);
    put('wood', box(0.05, 0.05, 0.9), sx * (w / 2 + 0.1), 0.98, fz + 0.45);
  }
  put('wood', box(w + 0.32, 0.06, 0.06), 0, 0.98, fz + 0.84);
  const slats = 11;
  for (let k = 0; k < slats; k++) put('wood', box(0.035, 0.035, 0.9), -w / 2 - 0.05 + (k * (w + 0.1)) / (slats - 1), 1.02, fz + 0.45);
  // bougainvillea spilling off the pergola
  const fl = new THREE.Vector3();
  for (let k = 0; k < 5; k++) {
    fl.set(-w / 2 + (k / 4) * w + (k % 2 ? 0.1 : -0.1), 1.04 - (k % 3) * 0.08, fz + 0.84 + (k % 2) * 0.05).applyMatrix4(m);
    flowers.push(fl.clone());
  }

  if (o.pool) {
    put('stone', box(1.08, 0.035, 0.64), w / 2 - 0.62, 0.065, fz + 0.45);
    put('water', box(0.96, 0.03, 0.52), w / 2 - 0.62, 0.085, fz + 0.45);
  }
  // loungers
  for (let k = 0; k < 2; k++) {
    put('fabric', box(0.17, 0.05, 0.4), -w / 2 + 0.3 + k * 0.26, 0.09, fz + 0.5);
    put('fabric', box(0.17, 0.12, 0.08), -w / 2 + 0.3 + k * 0.26, 0.15, fz + 0.32, -0.6);
  }
  if (o.umbrella) {
    put('trim', new THREE.CylinderGeometry(0.012, 0.012, 0.55, 5), -w / 2 + 0.43, 0.32, fz + 0.62);
    put('fabric', new THREE.ConeGeometry(0.3, 0.1, 10), -w / 2 + 0.43, 0.62, fz + 0.62);
  }
  // shrubs along the deck edge
  put('green', new THREE.IcosahedronGeometry(0.12, 1), w / 2 + 0.22, 0.1, fz + 0.15);
  put('green', new THREE.IcosahedronGeometry(0.09, 1), w / 2 + 0.2, 0.08, fz - 0.3);
  // a garden lamp at the deck corner
  put('trim', new THREE.CylinderGeometry(0.012, 0.012, 0.26, 5), w / 2 + 0.12, 0.13, fz + 0.95);
  lamps.push(new THREE.Vector3(w / 2 + 0.12, 0.28, fz + 0.95).applyMatrix4(m));
  seats.push(new THREE.Vector3(-w / 2 + 0.55, 0.05, fz + 0.62).applyMatrix4(m));

  if (o.duplex) {
    const uw = w * 0.52;
    const ux = -w * 0.2;
    put('walls', box(uw, 0.8, 1.4), ux, H + 0.4, -0.25);
    put('trim', box(uw + 0.04, 0.07, 1.44), ux, H + 0.835, -0.25);
    put('glass', box(uw * 0.62, 0.46, 0.03), ux, H + 0.42, 0.455);
    put('trim', box(uw * 0.62 + 0.06, 0.04, 0.05), ux, H + 0.67, 0.465);
    // glass balustrade and a small pergola on the roof terrace
    put('rail', box(w * 0.42, 0.22, 0.015), w * 0.27, H + 0.2, fz - 0.07);
    put('rail', box(0.015, 0.22, 0.8), w / 2 - 0.07, H + 0.2, fz - 0.47);
    put('wood', box(0.04, 0.5, 0.04), w * 0.44, H + 0.34, fz - 0.15);
    put('wood', box(0.04, 0.5, 0.04), w * 0.1, H + 0.34, fz - 0.15);
    for (let k = 0; k < 6; k++) put('wood', box(0.03, 0.03, 0.8), w * 0.08 + k * w * 0.075, H + 0.6, fz - 0.5);
    put('green', box(0.34, 0.09, 0.12), w * 0.3, H + 0.1, -fz + 0.2);
  } else if (o.solar) {
    for (let k = 0; k < 2; k++) put('solar', box(0.55, 0.025, 0.36), -w * 0.18 + k * 0.62, H + 0.14, -0.35, -0.32);
    put('green', box(0.4, 0.09, 0.12), w * 0.28, H + 0.1, fz - 0.2);
  } else {
    put('green', box(0.5, 0.09, 0.12), 0, H + 0.1, fz - 0.2);
  }
}

export function buildSite(seed = 5) {
  const rnd = mulberry32(seed);
  const b: Buckets = { walls: [], trim: [], glass: [], wood: [], water: [], rail: [], solar: [], stone: [], green: [], fabric: [] };
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const flowers: THREE.Vector3[] = [];
  const lamps: THREE.Vector3[] = [];
  const seats: THREE.Vector3[] = [];
  const houses: { x: number; i: number; w: number }[] = [];
  let count = 0;

  const placeOn = (i: number, x: number, back = 2.0): Placement => {
    const ry = Math.atan2(-slope(i, x), 1);
    return { x, y: (i + 1) * T, z: frontZ(i, x) - back, ry };
  };
  const frame = (p: Placement) => m.compose(new THREE.Vector3(p.x, p.y, p.z), q.setFromAxisAngle(up, p.ry), new THREE.Vector3(1, 1, 1));

  for (let i = 1; i <= 6; i++) {
    for (let x = -19.5; x <= 19.5; x += 4.9) {
      if (i === 3 && x > -1 && x < 13) continue;
      if (i === 5 && x < -8) continue;
      if (count >= 38) break;
      const jx = x + (rnd() - 0.5) * 0.8;
      if (Math.abs(jx - STAIR_X) < 2.3) continue;
      const w = 2.8 + rnd() * 0.7;
      frame(placeOn(i, jx));
      house(b, m, { w, duplex: rnd() < 0.45, pool: rnd() < 0.4, solar: rnd() < 0.5, umbrella: rnd() < 0.35 }, flowers, lamps, seats);
      houses.push({ x: jx, i, w });
      count++;
    }
  }

  // ---- the residents' pavilion, west end of terrace five ----
  frame(placeOn(5, -14, 2.6));
  const put = placer(b, m);
  put('stone', box(9.2, 0.12, 5.2), 0, 0.06, 0.4);
  put('glass', box(6, 0.92, 2.2), 0, 0.58, -0.6);
  put('wood', box(8.8, 0.12, 4.6), 0, 1.16, 0.2);
  put('trim', box(8.9, 0.05, 4.7), 0, 1.24, 0.2);
  for (let k = 0; k < 7; k++) put('trim', box(0.09, 1.04, 0.09), -4.1 + k * 1.37, 0.58, 2.35);
  put('stone', box(7.6, 0.06, 1.4), 0, 0.14, 1.6);
  put('water', box(7.3, 0.04, 1.1), 0, 0.17, 1.6);
  for (let k = 0; k < 6; k++) put('fabric', box(0.18, 0.05, 0.42), -3.2 + k * 1.25, 0.15, 2.8);
  for (let a = 0; a < 3; a++)
    for (let c = 0; c < 2; c++) {
      put('wood', box(1.2, 0.14, 0.62), 5.4 + a * 1.45, 0.07, -0.9 + c * 0.95);
      put('green', box(1.1, 0.06, 0.52), 5.4 + a * 1.45, 0.16, -0.9 + c * 0.95);
    }
  seats.push(new THREE.Vector3(-1.5, 0.12, 2.9).applyMatrix4(m), new THREE.Vector3(1.8, 0.12, 2.6).applyMatrix4(m));

  // ---- lap pool on terrace three ----
  frame(placeOn(3, 6, 1.5));
  put('stone', box(13, 0.06, 2.9), 0, 0.03, 0);
  put('water', box(11.8, 0.05, 1.7), 0, 0.085, 0.15);
  for (let k = 0; k < 7; k++) put('fabric', box(0.18, 0.05, 0.42), -5.2 + k * 1.7, 0.09, -1.1);
  for (let k = 0; k < 3; k++) {
    put('trim', new THREE.CylinderGeometry(0.014, 0.014, 0.6, 5), -4.4 + k * 4.2, 0.33, -1.15);
    put('fabric', new THREE.ConeGeometry(0.42, 0.12, 12), -4.4 + k * 4.2, 0.65, -1.15);
  }
  seats.push(new THREE.Vector3(-2, 0.1, -1).applyMatrix4(m), new THREE.Vector3(3, 0.1, -1).applyMatrix4(m));

  // ---- the central stair, climbing every terrace ----
  m.identity();
  for (let i = 1; i < LAYERS; i++) {
    const zr = frontZ(i, STAIR_X);
    for (let k = 0; k < 4; k++) {
      const h = ((k + 1) * T) / 4;
      put('stone', box(1.1, h, 0.26), STAIR_X, i * T + h / 2, zr + (3 - k) * 0.26 + 0.13);
    }
    put('stone', box(0.08, T + 0.12, 1.06), STAIR_X - 0.6, i * T + (T + 0.12) / 2, zr + 0.53);
    put('stone', box(0.08, T + 0.12, 1.06), STAIR_X + 0.6, i * T + (T + 0.12) / 2, zr + 0.53);
  }

  // ---- the jetty, kayaks tied alongside ----
  const jx = 9;
  const jz = frontZ(0, jx);
  put('wood', box(1.1, 0.08, 9), jx, 0.2, jz + 4.2);
  put('wood', box(4.2, 0.08, 1.4), jx + 1.5, 0.2, jz + 8.6);
  for (let k = 0; k < 7; k++) {
    put('wood', new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6), jx - 0.5, -0.05, jz + 0.4 + k * 1.4);
    put('wood', new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6), jx + 0.5, -0.05, jz + 0.4 + k * 1.4);
  }
  put('wood', box(0.05, 0.3, 9), jx - 0.53, 0.38, jz + 4.2);
  seats.push(new THREE.Vector3(jx + 2.4, 0.24, jz + 8.6), new THREE.Vector3(jx, 0.24, jz + 3));

  // ---- hedges along the terrace edges, skipping decks and the stair ----
  const hedges: Placement[] = [];
  for (let i = 0; i < LAYERS; i++) {
    for (let x = X0 + 0.6; x < X1 - 0.6; x += 0.55) {
      if (Math.abs(x - STAIR_X) < 0.75) continue;
      if (houses.some((h) => h.i === i && Math.abs(x - h.x) < h.w / 2 + 0.25)) continue;
      if (i === 3 && x > -0.5 && x < 12.5) continue;
      if (rnd() < 0.12) continue;
      hedges.push({ x, y: (i + 1) * T, z: frontZ(i, x) - 0.12, ry: Math.atan2(-slope(i, x), 1), s: 0.8 + rnd() * 0.5 });
    }
  }

  // ---- trees ----
  const cypress: Placement[] = [];
  const canopy: (Placement & { tint: number })[] = [];
  const palms: Placement[] = [];
  for (let i = 0; i < LAYERS; i++) {
    for (let x = -22; x <= 22; x += 1.6 + rnd() * 2) {
      const r = rnd();
      if (Math.abs(x - STAIR_X) < 1.2) continue;
      if (i === 0) {
        if (r < 0.62) palms.push({ x, y: T, z: frontZ(0, x) - 0.5 - rnd() * 0.8, ry: rnd() * 6, s: 0.85 + rnd() * 0.35 });
        continue;
      }
      const z = frontZ(i, x);
      if (r < 0.26) cypress.push({ x, y: (i + 1) * T, z: z - 0.4 - rnd() * 0.3, ry: 0, s: 0.8 + rnd() * 0.45 });
      else if (r < 0.48) canopy.push({ x, y: (i + 1) * T, z: z - 3.0 - rnd() * 0.5, ry: rnd() * 6, s: 0.75 + rnd() * 0.5, tint: rnd() < 0.22 ? 1 : 0 });
    }
  }
  // the crown of the hill is wooded, with jacaranda among the green
  for (let k = 0; k < 70; k++) {
    const x = X0 + 1 + rnd() * (X1 - X0 - 2);
    const z = ZB + 1 + rnd() * (frontZ(LAYERS - 1, x) - ZB - 3.2);
    canopy.push({ x, y: LAYERS * T, z, ry: rnd() * 6, s: 0.8 + rnd() * 0.7, tint: rnd() < 0.18 ? 1 : 0 });
  }
  // a few lining the shore path
  for (let k = 0; k < 8; k++) {
    const x = -20 + k * 5.4 + rnd();
    if (Math.abs(x - jx) < 2) continue;
    canopy.push({ x, y: T, z: frontZ(0, x) - 1.6, ry: rnd() * 6, s: 0.7 + rnd() * 0.3, tint: k % 3 === 0 ? 1 : 0 });
  }

  const merge = (k: keyof Buckets) => {
    const g = mergeGeometries(b[k]);
    g.computeVertexNormals();
    if (k === 'stone' || k === 'water') boxUV(g, k === 'stone' ? 0.9 : 0.6);
    return g;
  };
  return {
    walls: merge('walls'),
    trim: merge('trim'),
    glass: merge('glass'),
    wood: merge('wood'),
    water: merge('water'),
    rail: merge('rail'),
    solar: merge('solar'),
    stone: merge('stone'),
    green: merge('green'),
    fabric: merge('fabric'),
    hedges,
    flowers,
    lamps,
    seats,
    cypress,
    canopy,
    palms,
    jetty: new THREE.Vector3(jx, 0.2, jz + 8.6),
    count,
  };
}

/** Box projected UVs: each face takes the two world axes it is most nearly aligned with. */
function boxUV(g: THREE.BufferGeometry, scale: number) {
  const pos = g.getAttribute('position');
  const nor = g.getAttribute('normal');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const [u, v] = ay >= ax && ay >= az ? [x, z] : ax >= az ? [z, y] : [x, y];
    uv[i * 2] = u * scale;
    uv[i * 2 + 1] = v * scale;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

const flat = (parts: THREE.BufferGeometry[]) =>
  mergeGeometries(
    parts.map((g) => {
      const n = g.index ? g.toNonIndexed() : g;
      n.deleteAttribute('uv');
      return n;
    }),
  );

/** A Kivu fishing boat: three canoes lashed side by side, long eucalyptus poles fore and aft. */
export function fishingBoat() {
  const parts: THREE.BufferGeometry[] = [];
  for (const dx of [-0.34, 0, 0.34]) {
    parts.push(new THREE.CapsuleGeometry(0.1, 1.5, 3, 8).rotateX(Math.PI / 2).scale(1, 0.55, 1).translate(dx, 0.02, 0));
  }
  for (const dz of [-0.45, 0, 0.45]) parts.push(new THREE.BoxGeometry(0.95, 0.03, 0.04).translate(0, 0.09, dz));
  for (const [dz, rx] of [
    [1.25, -0.28],
    [-1.25, 0.28],
  ] as const) {
    for (const dx of [-0.34, 0.34]) parts.push(new THREE.CylinderGeometry(0.012, 0.016, 1.6, 4).rotateX(Math.PI / 2 + rx).translate(dx, 0.22, dz));
  }
  return flat(parts);
}

export function launch() {
  return flat([
    new THREE.CapsuleGeometry(0.22, 1.2, 3, 10).rotateX(Math.PI / 2).scale(1, 0.45, 1).translate(0, 0.04, 0),
    new THREE.BoxGeometry(0.34, 0.22, 0.55).translate(0, 0.24, -0.1),
    new THREE.BoxGeometry(0.4, 0.03, 0.7).translate(0, 0.37, -0.1),
  ]);
}

export function person() {
  return flat([new THREE.CapsuleGeometry(0.045, 0.13, 2, 6).translate(0, 0.11, 0), new THREE.SphereGeometry(0.038, 8, 6).translate(0, 0.25, 0)]);
}

/** Canopy tree crown: overlapping lobes. */
export function canopyCrown() {
  const g = flat([
    new THREE.IcosahedronGeometry(0.58, 1).translate(0, 1.02, 0),
    new THREE.IcosahedronGeometry(0.44, 1).translate(0.34, 0.86, 0.12),
    new THREE.IcosahedronGeometry(0.42, 1).translate(-0.3, 0.92, -0.16),
  ]);
  g.computeVertexNormals();
  bakeAO(g, 0.62, 0.9);
  return g;
}

export function treeTrunk() {
  return new THREE.CylinderGeometry(0.035, 0.06, 0.8, 6).translate(0, 0.4, 0);
}

/** A cypress: a smooth spindle turned on a lathe. */
export function cypressShape() {
  const pts: THREE.Vector2[] = [];
  for (let k = 0; k <= 12; k++) {
    const t = k / 12;
    pts.push(new THREE.Vector2(Math.sin(Math.PI * Math.pow(t, 0.8)) * 0.24 * (1 - t * 0.3) + 0.001, t * 2.1));
  }
  return new THREE.LatheGeometry(pts, 10);
}

/** Palm crown: drooping fronds as tapered ribbons. */
export function palmCrown() {
  const fronds: THREE.BufferGeometry[] = [];
  const N = 9;
  const at = (t: number) => [t * 0.85, 1.9 + Math.sin(t * Math.PI * 0.9) * 0.22 - t * t * 0.45] as const;
  for (let f = 0; f < N; f++) {
    const pos: number[] = [];
    const seg = 8;
    for (let k = 0; k < seg; k++) {
      const t0 = k / seg;
      const t1 = (k + 1) / seg;
      const [x0, y0] = at(t0);
      const [x1, y1] = at(t1);
      const w0 = 0.13 * Math.sin(Math.PI * Math.min(1, t0 + 0.08));
      const w1 = 0.13 * Math.sin(Math.PI * Math.min(1, t1 + 0.08));
      pos.push(x0, y0, -w0, x1, y1, -w1, x1, y1, w1, x0, y0, -w0, x1, y1, w1, x0, y0, w0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.rotateY((f / N) * Math.PI * 2 + (f % 2) * 0.2);
    fronds.push(g);
  }
  const g = mergeGeometries(fronds);
  g.computeVertexNormals();
  return g;
}

export function palmTrunk() {
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.12, 1.0, 0), new THREE.Vector3(0.04, 1.92, 0));
  return new THREE.TubeGeometry(curve, 8, 0.045, 6, false);
}

export function bird() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.06, -0.22, 0.05, -0.04, 0, 0, -0.05, 0, 0, 0.06, 0, 0, -0.05, 0.22, 0.05, -0.04], 3));
  g.computeVertexNormals();
  return g;
}

// ---------- procedural textures ----------

export function stoneTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const x = c.getContext('2d')!;
  const rnd = mulberry32(17);
  x.fillStyle = '#5d5a55';
  x.fillRect(0, 0, 512, 256);
  let y = 0;
  while (y < 256) {
    const h = 22 + rnd() * 18;
    let px = -rnd() * 40;
    while (px < 512) {
      const w = 34 + rnd() * 60;
      const g = 128 + Math.floor(rnd() * 46);
      x.fillStyle = `rgb(${g + 6},${g + 2},${g - 6})`;
      x.fillRect(px + 2, y + 2, w - 3, h - 3);
      for (let k = 0; k < 18; k++) {
        x.fillStyle = `rgba(30,28,25,${0.06 + rnd() * 0.08})`;
        x.fillRect(px + rnd() * w, y + rnd() * h, 2, 2);
      }
      px += w;
    }
    y += h;
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(0.28, 1.1);
  t.anisotropy = 8;
  return t;
}

export function lawnTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  const rnd = mulberry32(29);
  x.fillStyle = '#a9b98a';
  x.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 2600; k++) {
    x.fillStyle = rnd() < 0.5 ? 'rgba(126,148,102,0.35)' : 'rgba(196,206,160,0.35)';
    x.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 3, 2 + rnd() * 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(0.35, 0.35);
  return t;
}

/** Tileable ripple normals for the lake and pools: wrapped value noise in four octaves. */
export function waterNormals() {
  const N = 256;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d')!;
  const img = x.createImageData(N, N);
  const rnd = mulberry32(41);
  const octaves = [8, 16, 32, 64].map((g) => ({ g, v: Array.from({ length: g * g }, () => rnd()) }));
  const sm = (t: number) => t * t * (3 - 2 * t);
  const h = (u: number, v: number) => {
    let sum = 0;
    let amp = 1;
    for (const o of octaves) {
      const fx = (((u % 1) + 1) % 1) * o.g;
      const fy = (((v % 1) + 1) % 1) * o.g;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = sm(fx - x0);
      const ty = sm(fy - y0);
      const at = (i: number, j: number) => o.v[((j + o.g) % o.g) * o.g + ((i + o.g) % o.g)];
      const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
      const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
      sum += (a + (b - a) * ty) * amp;
      amp *= 0.5;
    }
    return sum;
  };
  const e = 1 / N;
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const v = j / N;
      const dx = (h(u + e, v) - h(u - e, v)) * 9;
      const dy = (h(u, v + e) - h(u, v - e)) * 9;
      const len = Math.hypot(dx, dy, 1);
      const o = (j * N + i) * 4;
      img.data[o] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[o + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      img.data[o + 2] = (1 / len) * 0.5 * 255 + 127;
      img.data[o + 3] = 255;
    }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(30, 19);
  return t;
}

/** Lake plane with shallows near the shore and a line of foam at the water's edge. */
export function lakeGeometry() {
  const g = new THREE.PlaneGeometry(220, 140, 96, 60);
  g.rotateX(-Math.PI / 2);
  g.translate(0, -0.01, 30);
  const pos = g.getAttribute('position');
  const col = new Float32Array(pos.count * 3);
  const shallow = new THREE.Color('#9cc2c0');
  const deep = new THREE.Color('#4f7f98');
  const foam = new THREE.Color('#eef3f0');
  const c = new THREE.Color();
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k);
    const z = pos.getZ(k);
    const d = z - frontZ(0, Math.max(X0, Math.min(X1, x)));
    c.copy(shallow).lerp(deep, Math.min(1, Math.max(0, d / 9)));
    if (d > -0.2 && d < 0.35) c.lerp(foam, 1 - Math.abs(d - 0.05) / 0.35);
    col[k * 3] = c.r;
    col[k * 3 + 1] = c.g;
    col[k * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
