'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import Projector from './Projector';
import Bench from './Bench';
import Ready from './Ready';
import { ROOMS } from './plan-data';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildFurniture, pergolaBlooms, plankTexture, type MatKey, type Part } from './furniture';
import { bakeAO } from './site-model';
import { AdaptiveResolution, PostFX, shadowType, tier } from './perf';

export type PlanState = { progress: number; pointer: [number, number] };

// Terrace House, 19 m x 12 m inside, terrace to the front (+z, the lake side).
// Each wall: [x1, z1, x2, z2, thickness]
const EXT = 0.3;
const INT = 0.14;
type Wall = [number, number, number, number, number];
const WALLS: Wall[] = [
  // back wall with the kitchen window, a bedroom window and the front door
  [-9.5, -6, -8, -6, EXT], [-5, -6, -1.5, -6, EXT], [3, -6, 6, -6, EXT], [7.2, -6, 9.5, -6, EXT],
  // lake front: three wide openings
  [-9.5, 6, -8.8, 6, EXT], [-3.7, 6, -2.4, 6, EXT], [3.9, 6, 5.2, 6, EXT], [8.8, 6, 9.5, 6, EXT],
  // sides
  [-9.5, -6, -9.5, -4.5, EXT], [-9.5, -3, -9.5, 2.5, EXT], [-9.5, 4.5, -9.5, 6, EXT],
  [9.5, -6, 9.5, 1.8, EXT], [9.5, 4.4, 9.5, 6, EXT],
  // west wing: two bedrooms, a bath and the corridor
  [-3, -6, -3, -1.5, INT], [-3, 0, -3, 6, INT],
  [-9.5, 1, -5, 1, INT], [-4.1, 1, -3, 1, INT],
  [-9.5, -1.5, -5, -1.5, INT], [-4.1, -1.5, -3, -1.5, INT],
  [-6, -1.5, -6, -0.8, INT], [-6, 0, -6, 1, INT],
  // kitchen and living are one room, marked by two short piers
  [-3, 0, -2, 0, INT], [3.5, 0, 4.5, 0, INT],
  // east wing: entry, bath, main bedroom
  [4.5, -6, 4.5, -4.4, INT], [4.5, -3.4, 4.5, 1.2, INT], [4.5, 2.1, 4.5, 6, INT],
  [4.5, 0.5, 5.4, 0.5, INT], [6.2, 0.5, 9.5, 0.5, INT],
  [4.5, -2.5, 9.5, -2.5, INT],
];

const GLASS: [number, number, number, number][] = [
  [-8.8, 6, -3.7, 6], [-2.4, 6, 3.9, 6], [5.2, 6, 8.8, 6],
  [-8, -6, -5, -6], [-1.5, -6, 3, -6],
  [-9.5, -4.5, -9.5, -3], [-9.5, 2.5, -9.5, 4.5], [9.5, 1.8, 9.5, 4.4],
];


const H = 2.9;
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (p: number, a: number, b: number) => smooth(clamp01((p - a) / (b - a)));

const INK = new THREE.Color('#15233a');
const CLAY = new THREE.Color('#f3efe6');

const TONES: Record<MatKey, string> = {
  oak: '#b98d5f', linen: '#e4ddcf', white: '#f8f6f1', throw: '#c0714b', blue: '#5b6e8c', rug: '#d9cdb7',
  stone: '#d7d1c6', metal: '#3a3c40', plant: '#5f7f4e', pot: '#b5714f', lamp: '#fff4dc', flower: '#c94a82',
};

/** Merge an item's parts into one vertex coloured mesh, plus one for anything that glows. */
function mergeItem(parts: Part[]) {
  const solid: THREE.BufferGeometry[] = [];
  const glow: THREE.BufferGeometry[] = [];
  const c = new THREE.Color();
  for (const part of parts) {
    const g = part.geo.index ? part.geo.toNonIndexed() : part.geo.clone();
    g.deleteAttribute('uv');
    c.set(TONES[part.mat]);
    const n = g.getAttribute('position').count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    (part.mat === 'lamp' ? glow : solid).push(g);
  }
  return { solid: solid.length ? mergeGeometries(solid) : null, glow: glow.length ? mergeGeometries(glow) : null };
}

/** Darken vertex colours toward the floor, like light gathering less in corners. */
function shadeToFloor(g: THREE.BufferGeometry) {
  const pos = g.getAttribute('position');
  const col = g.getAttribute('color');
  for (let i = 0; i < pos.count; i++) {
    const k = 0.72 + 0.28 * Math.min(1, pos.getY(i) / 0.45);
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
}

function House({ state }: { state: MutableRefObject<PlanState> }) {
  const walls = useRef<(THREE.Mesh | null)[]>([]);
  const furn = useRef<(THREE.Group | null)[]>([]);
  const floor = useRef<THREE.MeshLambertMaterial>(null);
  const blooms = useRef<THREE.Group>(null);
  const glass = useRef<THREE.Group>(null);
  const pergola = useRef<THREE.Group>(null);
  const terrace = useRef<THREE.Mesh>(null);
  const wallMat = useMemo(() => new THREE.MeshLambertMaterial({ color: INK.clone(), vertexColors: true }), []);
  const items = useMemo(buildFurniture, []);
  const merged = useMemo(
    () =>
      items.map((it) => {
        const m = mergeItem(it.parts);
        if (m.solid) shadeToFloor(m.solid);
        return m;
      }),
    [items],
  );
  const furnMat = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true }), []);
  const lampMat = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#ffcf8a', emissiveIntensity: 0.2 }), []);
  const flowerMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#c94a82' }), []);
  const woodMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#a98058' }), []);
  const pergolaGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const x of [-9.3, -4.7, 0, 4.7, 9.3]) parts.push(new THREE.BoxGeometry(0.12, H, 0.12).translate(x, H / 2, 9.25));
    for (let k = 0; k < 24; k++) parts.push(new THREE.BoxGeometry(0.07, 0.1, 3.3).translate(-9.2 + (k * 18.4) / 23, H - 0.05, 7.7));
    parts.push(new THREE.BoxGeometry(19, 0.16, 0.14).translate(0, H - 0.18, 9.25));
    return mergeGeometries(parts);
  }, []);
  const bloomAt = useMemo(pergolaBlooms, []);
  const tex = useMemo(() => {
    const oak = plankTexture('#d8bf98', 3);
    oak.repeat.set(3.2, 4.2);
    const deck = plankTexture('#a7835c', 9);
    deck.repeat.set(3.2, 1);
    return { oak, deck };
  }, []);
  const glassMat = useMemo(() => new THREE.MeshPhongMaterial({ color: '#b9d0da', specular: '#ffffff', shininess: 90, transparent: true, opacity: 0, depthWrite: false }), []);
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0 }), []);

  const wallData = useMemo(
    () =>
      WALLS.map(([x1, z1, x2, z2, t]) => {
        const len = Math.hypot(x2 - x1, z2 - z1) + t;
        const geo = new THREE.BoxGeometry(len, H, t).translate(0, H / 2, 0);
        bakeAO(geo, 0.7, 0.9);
        return { geo, edges: new THREE.EdgesGeometry(geo), x: (x1 + x2) / 2, z: (z1 + z2) / 2, ry: -Math.atan2(z2 - z1, x2 - x1) };
      }),
    [],
  );

  useFrame(() => {
    const p = state.current.progress;
    const n = wallData.length;
    const draw = (i: number) => seg(p, 0.02 + (i / n) * 0.26, 0.06 + (i / n) * 0.26);
    const rise = seg(p, 0.36, 0.6);
    walls.current.forEach((m, i) => {
      if (!m) return;
      const d = draw(i);
      m.scale.set(Math.max(0.001, d), 0.012 + rise * 0.988, 1);
      m.visible = d > 0.002;
    });
    wallMat.color.copy(INK).lerp(CLAY, seg(p, 0.38, 0.55));
    edgeMat.opacity = seg(p, 0.42, 0.6) * 0.45;
    glassMat.opacity = seg(p, 0.62, 0.72) * 0.38;
    const count = items.length;
    furn.current.forEach((m, i) => {
      if (!m) return;
      const at = 0.62 + (i / count) * 0.2;
      const k = seg(p, at, at + 0.07);
      m.scale.set(1, Math.max(0.001, k), 1);
      m.visible = k > 0.002;
    });
    if (floor.current) floor.current.opacity = seg(p, 0.48, 0.62);
    if (blooms.current) {
      const k = seg(p, 0.82, 0.92);
      blooms.current.scale.setScalar(Math.max(0.001, k));
      blooms.current.visible = k > 0.002;
    }
    // evening arrives at the end of the scroll and the lamps come on
    lampMat.emissiveIntensity = 0.2 + seg(p, 0.85, 1) * 2.4;
    if (pergola.current) {
      const k = seg(p, 0.7, 0.85);
      pergola.current.scale.y = Math.max(0.001, k);
      pergola.current.visible = k > 0.002;
    }
    if (terrace.current) terrace.current.scale.z = Math.max(0.001, seg(p, 0.3, 0.42));
  });

  return (
    <group>
      {/* the slab and terrace deck */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[19.6, 0.12, 12.6]} />
        <meshLambertMaterial color="#f8f6f1" emissive="#ebe6dc" emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[19, 12]} />
        <meshLambertMaterial ref={floor} map={tex.oak} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={terrace} position={[0, -0.07, 7.7]} receiveShadow>
        <boxGeometry args={[19.6, 0.1, 3.4]} />
        <meshLambertMaterial map={tex.deck} />
      </mesh>

      {wallData.map((w, i) => (
        <mesh key={i} ref={(el) => { walls.current[i] = el; }} position={[w.x, 0, w.z]} rotation={[0, w.ry, 0]} geometry={w.geo} material={wallMat} castShadow receiveShadow>
          <lineSegments geometry={w.edges} material={edgeMat} />
        </mesh>
      ))}

      <group ref={glass}>
        {GLASS.map(([x1, z1, x2, z2], i) => (
          <mesh key={i} position={[(x1 + x2) / 2, 1.35, (z1 + z2) / 2]} rotation={[0, -Math.atan2(z2 - z1, x2 - x1), 0]} material={glassMat}>
            <boxGeometry args={[Math.hypot(x2 - x1, z2 - z1), 2.6, 0.04]} />
          </mesh>
        ))}
      </group>

      {items.map((it, i) => (
        <group key={i} ref={(el) => { furn.current[i] = el; }} position={[it.x, 0, it.z]} rotation={[0, it.ry, 0]}>
          {merged[i].solid && <mesh geometry={merged[i].solid!} material={furnMat} castShadow receiveShadow />}
          {merged[i].glow && <mesh geometry={merged[i].glow!} material={lampMat} />}
        </group>
      ))}
      <group ref={blooms}>
        <Blooms at={bloomAt} material={flowerMat} />
      </group>

      <group ref={pergola}>
        <mesh geometry={pergolaGeo} material={woodMat} castShadow />
      </group>
    </group>
  );
}

function Blooms({ at, material }: { at: THREE.Vector3[]; material: THREE.Material }) {
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.12, 0), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current!;
    const o = new THREE.Object3D();
    at.forEach((p, i) => {
      o.position.copy(p);
      o.rotation.set(i, i * 2, 0);
      o.scale.setScalar(0.7 + ((i * 37) % 10) / 15);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [at]);
  return <instancedMesh ref={ref} args={[geo, material, at.length]} castShadow />;
}

function Grid() {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let x = -13; x <= 13; x++) pts.push(x, 0.002, -9, x, 0.002, 12);
    for (let z = -9; z <= 12; z++) pts.push(-13, 0.002, z, 13, 0.002, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geo} position={[0, -0.13, 0]}>
      <lineBasicMaterial color="#15233a" transparent opacity={0.07} />
    </lineSegments>
  );
}

function Light({ state }: { state: MutableRefObject<PlanState> }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const gl = useThree((st) => st.gl);
  const last = useRef(-1);
  useLayoutEffect(() => {
    const l = sun.current!;
    const res = tier().shadowMap;
    l.shadow.mapSize.set(res, res);
    l.shadow.radius = tier().shadowType === 'vsm' ? 5 : 3;
    l.shadow.blurSamples = 8;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -16; c.right = 16; c.top = 16; c.bottom = -16; c.near = 1; c.far = 90;
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.02;
  }, []);
  useFrame(() => {
    const p = state.current.progress;
    if (Math.abs(p - last.current) > 1e-4) {
      gl.shadowMap.needsUpdate = true;
      last.current = p;
    }
    // morning from the hill behind (-z), evening from the lake in front (+z)
    const k = seg(p, 0.55, 1);
    const th = Math.PI * (0.12 + k * 0.76);
    const elev = Math.sin(th);
    sun.current!.position.set(10 * elev + 4, 8 + elev * 30, -Math.cos(th) * 34);
    sun.current!.intensity = 1.6 + elev * 1.6;
    sun.current!.color.setHSL(0.09, 0.9 - elev * 0.6, 0.78 + elev * 0.18);
  });
  return (
    <>
      <hemisphereLight args={['#eef3f7', '#e4dccd', 1.35]} />
      <directionalLight ref={sun} castShadow />
    </>
  );
}

function Rig({ state }: { state: MutableRefObject<PlanState> }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    // the canvas itself starts right of the copy on desktop (see .plan__canvas), so no offset
    cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }, [camera, size]);
  const top = useMemo(() => new THREE.Vector3(0, 47, 0.01), []);
  const persp = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(0, 0, 1.2), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const ptr = useRef([0, 0]);

  useFrame((_, dt) => {
    const p = state.current.progress;
    const tilt = seg(p, 0.34, 0.62);
    const orbit = seg(p, 0.6, 1);
    const a = 0.7 - orbit * 1.1;
    const fit = size.width < size.height ? 1.45 : 1;
    persp.set(Math.sin(a) * 50, 30 - orbit * 5, Math.cos(a) * 50).multiplyScalar(fit);
    pos.copy(top).multiplyScalar(fit).lerp(persp, tilt);
    ptr.current[0] += (state.current.pointer[0] - ptr.current[0]) * Math.min(1, dt * 2.5);
    ptr.current[1] += (state.current.pointer[1] - ptr.current[1]) * Math.min(1, dt * 2.5);
    pos.x += ptr.current[0] * 1.6 * tilt;
    pos.y += ptr.current[1] * 1.0 * tilt;
    target.set(0, tilt * 0.8, 1.2 - tilt * 0.6);
    camera.position.lerp(pos, Math.min(1, dt * 5));
    look.lerp(target, Math.min(1, dt * 5));
    camera.lookAt(look);
  });
  return null;
}

function Background() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color('#ece7dd');
  }, [scene]);
  return null;
}

const ROOM_POINTS = ROOMS.map(([, x, z]) => [x, 0.05, z] as const);

type Props = { state: MutableRefObject<PlanState>; labels: MutableRefObject<(HTMLElement | null)[]>; active: boolean };

export default function PlanHouse({ state, labels, active }: Props) {
  const t = tier();
  return (
    <Canvas
      frameloop={active ? 'always' : 'demand'}
      shadows={{ type: shadowType() }}
      dpr={1}
      camera={{ fov: 30, near: 0.5, far: 200, position: [0, 47, 0.01] }}
      gl={{ antialias: !t.post, stencil: false, powerPreference: 'high-performance', toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.05 }}
    >
      <AdaptiveResolution />
      <Background />
      <Light state={state} />
      <Grid />
      <House state={state} />
      <Projector points={ROOM_POINTS} els={labels} />
      <Rig state={state} />
      <Bench name="plan" />
      <PostFX aoRadius={0.9} aoIntensity={2} />
      <Ready
        id="plan"
        // first frame fully furnished and lit, so every material compiles behind the loader
        prime={() => {
          const was = state.current.progress;
          state.current.progress = 1;
          return () => {
            state.current.progress = was;
          };
        }}
      />
    </Canvas>
  );
}
