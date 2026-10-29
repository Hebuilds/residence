'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import {
  bird,
  buildLayers,
  buildSite,
  canopyCrown,
  cypressShape,
  fishingBoat,
  lakeGeometry,
  launch,
  lawnTexture,
  palmCrown,
  palmTrunk,
  person,
  stoneTexture,
  T,
  treeTrunk,
  waterNormals,
  type Placement,
} from './site-model';
import { HOTSPOTS, SHOTS } from './site-data';
import Projector from './Projector';
import { AdaptiveResolution, PostFX, shadowType, tier } from './perf';
import Bench from './Bench';
import Ready from './Ready';

export type MasterplanState = {
  progress: number; // 0..1 through the pinned tour
  sun: number; // 0 = 07:00, 1 = 17:30
  build: number; // 0..1 assembly when the section arrives
  pointer: [number, number];
  step: number;
};

type Site = ReturnType<typeof buildSite>;

const PAPER = new THREE.Color('#f3f0e9');
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const ramp = (b: number, start: number, len: number) => smooth(clamp01((b - start) / len));

/** How much evening (or early morning) light is on: windows, lamps and lanterns glow. */
const duskOf = (s: number) => clamp01((s - 0.72) / 0.2) + clamp01((0.24 - s) / 0.14) * 0.45;

// ---------------------------------------------------------------------------

function useMaterials() {
  return useMemo(() => {
    const ripples = waterNormals();
    const poolRipples = waterNormals();
    poolRipples.repeat.set(3, 3);
    const L = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(o);
    const P = (o: THREE.MeshPhongMaterialParameters) => new THREE.MeshPhongMaterial(o);
    // Lambert and Phong instead of physically based materials: a fraction of the
    // fragment cost, and the baked vertex occlusion does the shading work.
    return {
      lawn: L({ map: lawnTexture(), vertexColors: true }),
      stone: L({ map: stoneTexture(), vertexColors: true }),
      walls: L({ color: '#f6f2ea', vertexColors: true }),
      trim: L({ color: '#e8e2d7', vertexColors: true }),
      glass: P({ color: '#22303f', specular: '#9fb1c4', shininess: 90, emissive: '#ffc985', emissiveIntensity: 0, vertexColors: true }),
      wood: L({ color: '#b08a62', vertexColors: true }),
      water: P({ color: '#5fb4c9', specular: '#ffffff', shininess: 120, normalMap: poolRipples, normalScale: new THREE.Vector2(0.35, 0.35), emissive: '#3c9fb8', emissiveIntensity: 0.12 }),
      rail: P({ color: '#cfe3ea', specular: '#ffffff', shininess: 100, transparent: true, opacity: 0.35, depthWrite: false }),
      solar: P({ color: '#1d2a44', specular: '#6f7f99', shininess: 60, vertexColors: true }),
      green: L({ color: '#6f8b5c', flatShading: true, vertexColors: true }),
      fabric: L({ color: '#f7f4ee', vertexColors: true }),
      leaf: L({ color: '#ffffff', flatShading: true, vertexColors: true }),
      frond: L({ color: '#6b8d4d', side: THREE.DoubleSide }),
      bark: L({ color: '#8a7358' }),
      cypress: L({ color: '#4d6a47', flatShading: true }),
      hedge: L({ color: '#ffffff' }),
      flower: L({ color: '#ffffff' }),
      lamp: L({ color: '#fff2d6', emissive: '#ffcc80', emissiveIntensity: 0 }),
      lantern: L({ color: '#fff3d1', emissive: '#ffbf6b', emissiveIntensity: 0 }),
      people: L({ color: '#ffffff' }),
      boat: L({ color: '#6b5440' }),
      hull: L({ color: '#f4f1ea' }),
      lake: P({ vertexColors: true, specular: '#d8e6ee', shininess: 70, normalMap: ripples, normalScale: new THREE.Vector2(0.22, 0.22) }),
      bird: new THREE.MeshBasicMaterial({ color: '#2a3442', side: THREE.DoubleSide }),
      edge: new THREE.LineBasicMaterial({ color: '#15233a', transparent: true, opacity: 0.1 }),
    };
  }, []);
}

type Mats = ReturnType<typeof useMaterials>;

// ---------------------------------------------------------------------------

type InstProps = {
  count: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  /** writes instance i into `o` for build progress b and time t */
  pose: (i: number, o: THREE.Object3D, b: number, t: number) => void;
  colors?: THREE.Color[];
  live?: boolean;
  state: MutableRefObject<MasterplanState>;
  shadows?: boolean;
};

/** An instanced mesh that re-poses while the model assembles, and every frame if `live`. */
function Inst({ count, geometry, material, pose, colors, live = false, state, shadows = true }: InstProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  const done = useRef(false);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!colors || !mesh) return;
    colors.forEach((c, i) => mesh.setColorAt(i, c));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [colors]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const b = state.current.build;
    if (done.current && !live) return;
    for (let i = 0; i < count; i++) {
      o.position.set(0, 0, 0);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(1);
      pose(i, o, b, clock.elapsedTime);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (b >= 1) done.current = true;
  });

  return <instancedMesh ref={ref} args={[geometry, material, count]} castShadow={shadows} receiveShadow frustumCulled={false} />;
}

// ---------------------------------------------------------------------------

function Estate({ state, mats, site }: { state: MutableRefObject<MasterplanState>; mats: Mats; site: Site }) {
  const layers = useMemo(buildLayers, []);
  const layerEdges = useMemo(() => layers.map((g) => new THREE.EdgesGeometry(g, 30)), [layers]);
  const layerRefs = useRef<(THREE.Group | null)[]>([]);
  const built = useRef<THREE.Group>(null);

  const geo = useMemo(
    () => ({
      hedge: new THREE.BoxGeometry(0.56, 0.14, 0.16).translate(0, 0.07, 0),
      flower: new THREE.IcosahedronGeometry(0.07, 0),
      lamp: new THREE.SphereGeometry(0.03, 8, 6),
      crown: canopyCrown(),
      trunk: treeTrunk(),
      cypress: cypressShape(),
      palmTrunk: palmTrunk(),
      palmCrown: palmCrown(),
    }),
    [],
  );

  const colors = useMemo(() => {
    const greens = ['#6f8c5c', '#7f9a68', '#5f7d55', '#8aa176'];
    const lilac = ['#9a86c9', '#8f7cc0', '#a592d2'];
    const blooms = ['#c2477e', '#d0568c', '#b23d72', '#e07aa6'];
    const hedge = ['#5d7b4f', '#678657', '#56724a'];
    return {
      canopy: site.canopy.map((c, i) => new THREE.Color(c.tint ? lilac[i % 3] : greens[i % 4]).offsetHSL(0, 0, ((i * 37) % 10) / 160 - 0.03)),
      flowers: site.flowers.map((_, i) => new THREE.Color(blooms[i % 4])),
      hedges: site.hedges.map((_, i) => new THREE.Color(hedge[i % 3])),
    };
  }, [site]);

  useFrame(() => {
    const b = state.current.build;
    layerRefs.current.forEach((g, i) => {
      if (!g) return;
      const k = ramp(b, i * 0.05, 0.3);
      g.position.y = -1.6 * (1 - k);
      g.visible = k > 0.001;
    });
    if (built.current) {
      const k = ramp(b, 0.38, 0.35);
      built.current.position.y = -1.2 * (1 - k);
      built.current.scale.y = 0.001 + k * 0.999;
      built.current.visible = k > 0.001;
    }
  });

  const terraceMats = useMemo(() => [mats.lawn, mats.stone], [mats]);
  const grow = (p: Placement, o: THREE.Object3D, b: number, i: number, n: number) => {
    const k = ramp(b, 0.55 + (i / n) * 0.3, 0.14);
    const s = (p.s ?? 1) * k + 1e-4;
    o.position.set(p.x, p.y, p.z);
    o.rotation.y = p.ry;
    o.scale.setScalar(s);
  };

  return (
    <group>
      {layers.map((g, i) => (
        <group key={i} ref={(el) => { layerRefs.current[i] = el; }}>
          <mesh geometry={g} material={terraceMats} position={[0, i * T, 0]} castShadow receiveShadow />
          <lineSegments geometry={layerEdges[i]} material={mats.edge} position={[0, i * T, 0]} />
        </group>
      ))}

      <group ref={built}>
        <mesh geometry={site.walls} material={mats.walls} castShadow receiveShadow />
        <mesh geometry={site.trim} material={mats.trim} castShadow receiveShadow />
        <mesh geometry={site.glass} material={mats.glass} />
        <mesh geometry={site.wood} material={mats.wood} castShadow receiveShadow />
        <mesh geometry={site.stone} material={mats.stone} castShadow receiveShadow />
        <mesh geometry={site.water} material={mats.water} receiveShadow />
        <mesh geometry={site.rail} material={mats.rail} />
        <mesh geometry={site.solar} material={mats.solar} castShadow />
        <mesh geometry={site.green} material={mats.green} castShadow receiveShadow />
        <mesh geometry={site.fabric} material={mats.fabric} castShadow receiveShadow />
      </group>

      <Inst state={state} count={site.hedges.length} geometry={geo.hedge} material={mats.hedge} colors={colors.hedges} pose={(i, o, b) => grow(site.hedges[i], o, b, i, site.hedges.length)} />
      <Inst
        state={state}
        count={site.flowers.length}
        geometry={geo.flower}
        material={mats.flower}
        colors={colors.flowers}
        shadows={false}
        pose={(i, o, b) => {
          const k = ramp(b, 0.75 + (i / site.flowers.length) * 0.2, 0.1);
          o.position.copy(site.flowers[i]);
          o.scale.setScalar(k * (0.8 + (i % 3) * 0.25) + 1e-4);
        }}
      />
      <Inst
        state={state}
        count={site.lamps.length}
        geometry={geo.lamp}
        material={mats.lamp}
        shadows={false}
        pose={(i, o, b) => {
          o.position.copy(site.lamps[i]);
          o.scale.setScalar(ramp(b, 0.8, 0.1) + 1e-4);
        }}
      />
      {/* canopy trees, a few of them jacaranda in lilac */}
      <Inst state={state} count={site.canopy.length} geometry={geo.trunk} material={mats.bark} pose={(i, o, b) => grow(site.canopy[i], o, b, i, site.canopy.length)} />
      <Inst state={state} count={site.canopy.length} geometry={geo.crown} material={mats.leaf} colors={colors.canopy} pose={(i, o, b) => grow(site.canopy[i], o, b, i, site.canopy.length)} />
      <Inst state={state} count={site.cypress.length} geometry={geo.cypress} material={mats.cypress} pose={(i, o, b) => grow(site.cypress[i], o, b, i, site.cypress.length)} />
      {/* palms along the shore sway a little */}
      <Inst state={state} count={site.palms.length} geometry={geo.palmTrunk} material={mats.bark} pose={(i, o, b) => grow(site.palms[i], o, b, i, site.palms.length)} />
      <Inst
        state={state}
        live
        count={site.palms.length}
        geometry={geo.palmCrown}
        material={mats.frond}
        pose={(i, o, b, t) => {
          grow(site.palms[i], o, b, i, site.palms.length);
          o.rotation.z = Math.sin(t * 0.9 + i) * 0.04;
          o.rotation.x = Math.cos(t * 0.7 + i * 1.3) * 0.03;
        }}
      />

      <People state={state} site={site} mats={mats} />
    </group>
  );
}

// ---------------------------------------------------------------------------

function People({ state, site, mats }: { state: MutableRefObject<MasterplanState>; site: Site; mats: Mats }) {
  const geo = useMemo(person, []);
  const colors = useMemo(() => {
    const palette = ['#c96a43', '#2f4a6b', '#e9e2d3', '#7b8f5a', '#b84a5a', '#f0c35a', '#3a3a3a'];
    return site.seats.map((_, i) => new THREE.Color(palette[i % palette.length]));
  }, [site]);
  // every fourth person strolls back and forth; the rest sit or stand
  return (
    <Inst
      state={state}
      live
      count={site.seats.length}
      geometry={geo}
      material={mats.people}
      colors={colors}
      shadows={false}
      pose={(i, o, b, t) => {
        const p = site.seats[i];
        const walk = i % 4 === 0 ? Math.sin(t * 0.25 + i) * 0.5 : 0;
        o.position.set(p.x + walk, p.y, p.z);
        o.rotation.y = walk ? (Math.cos(t * 0.25 + i) > 0 ? Math.PI / 2 : -Math.PI / 2) : i;
        o.scale.setScalar(ramp(b, 0.85, 0.1) + 1e-4);
      }}
    />
  );
}

// ---------------------------------------------------------------------------

function Lake({ mats }: { mats: Mats }) {
  const geo = useMemo(lakeGeometry, []);
  useFrame((_, dt) => {
    const n = mats.lake.normalMap!;
    n.offset.x += dt * 0.012;
    n.offset.y += dt * 0.007;
    const p = mats.water.normalMap!;
    p.offset.x += dt * 0.04;
  });
  // the lake does not sample the shadow map: it covers half the screen and almost nothing falls on it
  return <mesh geometry={geo} material={mats.lake} />;
}

function Boats({ mats, jetty }: { mats: Mats; jetty: THREE.Vector3 }) {
  const fish = useMemo(fishingBoat, []);
  const boat = useMemo(launch, []);
  const lantern = useMemo(() => new THREE.SphereGeometry(0.05, 8, 6), []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const ferry = useRef<THREE.Group>(null);
  const routes = useMemo(
    () => [
      { z: 26, x0: -30, speed: 0.22, phase: 0 },
      { z: 33, x0: 18, speed: -0.16, phase: 2 },
      { z: 21, x0: -8, speed: 0.12, phase: 4 },
    ],
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    routes.forEach((r, i) => {
      const g = refs.current[i];
      if (!g) return;
      const x = ((((r.x0 + t * r.speed * 3) % 80) + 120) % 80) - 40;
      g.position.set(x, 0.02 + Math.sin(t * 1.3 + r.phase) * 0.02, r.z + Math.sin(t * 0.2 + r.phase) * 0.6);
      g.rotation.set(Math.sin(t * 1.1 + r.phase) * 0.03, (Math.PI / 2) * Math.sign(r.speed), Math.cos(t * 0.9 + r.phase) * 0.025);
    });
    // the evening launch to Rubona leaves the jetty, swings out and comes home
    if (ferry.current) {
      const c = (Math.sin(t * 0.06) + 1) / 2;
      ferry.current.position.set(jetty.x + 3 + c * 16, 0.03 + Math.sin(t * 1.6) * 0.015, jetty.z + 1.5 + Math.sin(c * Math.PI) * 6);
      ferry.current.rotation.y = Math.PI / 2 - Math.cos(t * 0.06) * 0.6;
    }
  });

  return (
    <group>
      {routes.map((_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          <mesh geometry={fish} material={mats.boat} />
          <mesh geometry={lantern} material={mats.lantern} position={[0, 0.25, 0]} />
        </group>
      ))}
      <group ref={ferry}>
        <mesh geometry={boat} material={mats.hull} />
      </group>
    </group>
  );
}

function Birds({ mats }: { mats: Mats }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(bird, []);
  const o = useMemo(() => new THREE.Object3D(), []);
  const N = 14;
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const a = t * 0.16 + (i / N) * 0.9;
      const r = 14 + (i % 4) * 0.8;
      o.position.set(Math.cos(a) * r + 2, 8 + Math.sin(t * 0.5 + i) * 0.4 + (i % 3) * 0.3, Math.sin(a) * r * 0.5 + 12);
      o.rotation.set(0, -a, 0);
      o.scale.set(1.6, 1.6 * (0.4 + Math.abs(Math.sin(t * 6 + i * 1.7))), 1.6);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mats.bird, N]} frustumCulled={false} />;
}

// ---------------------------------------------------------------------------

function Light({ state, mats }: { state: MutableRefObject<MasterplanState>; mats: Mats }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const warm = useMemo(() => new THREE.Color('#ffb877'), []);
  const noon = useMemo(() => new THREE.Color('#fff7ea'), []);
  const s = useRef(state.current.sun);
  const { size, gl } = useThree();
  const lastSun = useRef(-1);
  const frames = useRef(0);

  useLayoutEffect(() => {
    const l = sun.current!;
    const res = tier().shadowMap;
    l.shadow.mapSize.set(res, res);
    l.shadow.radius = tier().shadowType === 'vsm' ? 5 : 3;
    l.shadow.blurSamples = 8;
    // the shadow map only re-renders when the sun or the model moves
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    l.shadow.map?.dispose();
    l.shadow.map = null;
    const cam = l.shadow.camera as THREE.OrthographicCamera;
    cam.left = -30;
    cam.right = 30;
    cam.top = 30;
    cam.bottom = -30;
    cam.near = 1;
    cam.far = 150;
    cam.updateProjectionMatrix();
    l.shadow.bias = -0.0003;
    l.shadow.normalBias = 0.02;
    l.target.position.set(0, 0, 0);
    l.target.updateMatrixWorld();
  }, [size.width, gl]);

  useFrame((_, dt) => {
    s.current += (state.current.sun - s.current) * Math.min(1, dt * 3);
    if (Math.abs(s.current - lastSun.current) > 1e-4 || state.current.build < 1 || frames.current < 3) {
      gl.shadowMap.needsUpdate = true;
      lastSun.current = s.current;
    }
    frames.current++;
    const th = Math.PI * (0.06 + s.current * 0.88);
    const elev = Math.sin(th);
    sun.current!.position.set(0.38 * elev * 60, (elev * 1.05 + 0.12) * 60, -Math.cos(th) * 60);
    sun.current!.color.copy(noon).lerp(warm, (1 - elev) * 0.85);
    sun.current!.intensity = 1.6 + elev * 1.8;
    hemi.current!.intensity = 0.8 + elev * 0.45;
    const dusk = duskOf(s.current);
    mats.glass.emissiveIntensity = dusk * 1.6;
    mats.lamp.emissiveIntensity = dusk * 5;
    mats.lantern.emissiveIntensity = dusk * 4;
    mats.water.emissiveIntensity = 0.12 + dusk * 0.9;
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={['#d7e6f2', '#d8c9ae', 1]} />
      <directionalLight ref={sun} castShadow />
    </>
  );
}

function Rig({ state }: { state: MutableRefObject<MasterplanState> }) {
  const { camera, size } = useThree();
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3().fromArray(SHOTS[0].target), []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  const ptr = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    // the canvas itself starts right of the copy on desktop (see .grounds__canvas), so no offset
    cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }, [camera, size]);

  useFrame(({ clock }, dt) => {
    const st = state.current;
    const f = st.progress * (SHOTS.length - 1);
    const i = Math.min(SHOTS.length - 2, Math.floor(f));
    const k = smooth(clamp01(f - i));
    pos.copy(a.fromArray(SHOTS[i].pos)).lerp(b.fromArray(SHOTS[i + 1].pos), k);
    tgt.copy(a.fromArray(SHOTS[i].target)).lerp(b.fromArray(SHOTS[i + 1].target), k);
    pos.multiplyScalar(1 + (1 - smooth(Math.min(1, st.build))) * 0.25);
    // a slow drift so the model never sits perfectly still
    const t = clock.elapsedTime;
    pos.x += Math.sin(t * 0.12) * 0.8;
    pos.y += Math.sin(t * 0.17) * 0.3;
    ptr.current[0] += (st.pointer[0] - ptr.current[0]) * Math.min(1, dt * 2.5);
    ptr.current[1] += (st.pointer[1] - ptr.current[1]) * Math.min(1, dt * 2.5);
    pos.x += ptr.current[0] * 2.2;
    pos.y += ptr.current[1] * 1.2;
    const ease = Math.min(1, dt * 4);
    camera.position.lerp(pos, ease);
    look.lerp(tgt, ease);
    camera.lookAt(look);
  });
  return null;
}

function Atmosphere() {
  const { scene, gl } = useThree();
  useEffect(() => {
    scene.fog = new THREE.Fog(PAPER, 60, 140);
    scene.background = PAPER;
  }, [scene, gl]);
  return null;
}

/** Ambient occlusion and a little bloom for the evening lights. Desktop only. */
// keep labels out from under the copy column and the sun study control
const cullLabel = (x: number, y: number, w: number, h: number) => x < w * 0.1 || y > h * 0.84 || y < h * 0.13;

function Scene({ state, labels }: { state: MutableRefObject<MasterplanState>; labels: MutableRefObject<(HTMLElement | null)[]> }) {
  const mats = useMaterials();
  const site = useMemo(() => buildSite(5), []);
  return (
    <>
      <Atmosphere />
      <Light state={state} mats={mats} />
      <Estate state={state} mats={mats} site={site} />
      <Lake mats={mats} />
      <Boats mats={mats} jetty={site.jetty} />
      <Birds mats={mats} />
      <Projector points={HOTSPOTS.map((h) => h.pos)} els={labels} cull={cullLabel} />
      <Rig state={state} />
      <Bench name="grounds" />
      <PostFX />
    </>
  );
}

type Props = { state: MutableRefObject<MasterplanState>; labels: MutableRefObject<(HTMLElement | null)[]>; active: boolean };

export default function Masterplan({ state, labels, active }: Props) {
  const t = tier();
  return (
    <Canvas
      frameloop={active ? 'always' : 'demand'}
      shadows={{ type: shadowType() }}
      dpr={1}
      camera={{ fov: 32, near: 0.5, far: 260, position: [40, 30, 48] }}
      gl={{ antialias: !t.post, stencil: false, powerPreference: 'high-performance', toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.05 }}
    >
      <AdaptiveResolution />
      <Scene state={state} labels={labels} />
      <Ready id="grounds" />
    </Canvas>
  );
}
