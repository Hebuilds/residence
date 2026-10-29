'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import Bench from './Bench';
import Ready from './Ready';
import { AdaptiveResolution } from './perf';

export type RingState = { velocity: number; progress: number; pointer: [number, number] };

const thumb = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=384&q=75`;

function Cards({ images, state }: { images: string[]; state: MutableRefObject<RingState> }) {
  const textures = useTexture(images.map(thumb));
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const N = images.length * 2;
  const W = 0.82;
  const Hh = 1.08;

  const materials = useMemo(
    () =>
      textures.map((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        // cover-fit the photo inside a portrait card
        const img = t.image as HTMLImageElement;
        const aspect = img.width / img.height;
        const card = W / Hh;
        if (aspect > card) {
          t.repeat.set(card / aspect, 1);
          t.offset.set((1 - card / aspect) / 2, 0);
        } else {
          t.repeat.set(1, aspect / card);
          t.offset.set(0, (1 - aspect / card) / 2);
        }
        return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false });
      }),
    [textures],
  );
  const plane = useMemo(() => new THREE.PlaneGeometry(W, Hh), []);
  const spin = useRef(0);
  const speed = useRef(0.05);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  // Landscape: a wide ellipse orbiting the copy. Portrait: a smaller band beneath the form.
  const portrait = viewport.aspect < 1;
  const R = portrait ? Math.min(viewport.width * 0.62, 3.2) : Math.max(4.4, viewport.width * 0.44);
  const RZ = portrait ? 2.6 : 6.2;
  const tilt = portrait ? 0.32 : 0.5;
  const lift = portrait ? -3.1 : 0;
  const cardScale = portrait ? 0.72 : 1;

  // Cards travel along a fixed ellipse; each one turns to follow the curve like a spoke.
  useFrame((_, delta) => {
    // the first frame after the ring comes back on screen carries the whole idle gap; never let it jump
    const dt = Math.min(delta, 1 / 30);
    const st = state.current;
    // scrolling speeds the orbit up, but the speed eases in and out instead of snapping
    const target = 0.05 + Math.min(Math.abs(st.velocity) / 2600, 0.45);
    speed.current += (target - speed.current) * Math.min(1, dt * 2.5);
    spin.current += dt * speed.current;
    const base = spin.current + st.progress * 1.4;
    meshes.current.forEach((m, i) => {
      if (!m) return;
      const th = (i / N) * Math.PI * 2 + base;
      const c = Math.cos(th);
      const sn = Math.sin(th);
      m.position.set(c * R, Math.sin(i * 2.3) * 0.32, sn * RZ);
      m.rotation.set(0, Math.atan2(-R * sn, RZ * c), Math.sin(i * 1.7) * 0.1);
    });
    const g = group.current!;
    g.rotation.x += (tilt + st.pointer[1] * 0.05 - g.rotation.x) * Math.min(1, dt * 2);
    g.rotation.z += (st.pointer[0] * 0.04 - g.rotation.z) * Math.min(1, dt * 2);
  });

  return (
    <group ref={group} position={[0, lift, 0]}>
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i} ref={(el) => { meshes.current[i] = el; }} geometry={plane} material={materials[i % materials.length]} scale={cardScale} />
      ))}
    </group>
  );
}

function Bg() {
  const { scene } = useThree();
  useEffect(() => {
    // opaque paper instead of a transparent canvas: the browser no longer blends every pixel
    scene.background = new THREE.Color('#f3f0e9');
    // back of the ring dissolves into the paper
    scene.fog = new THREE.Fog('#f3f0e9', 13, 25);
  }, [scene]);
  return null;
}

export default function PhotoRing({ images, state, active }: { images: string[]; state: MutableRefObject<RingState>; active: boolean }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'demand'}
      // measure layout size, not the on-screen box: the entrance scale on .visit__ring must not shrink the buffer
      resize={{ offsetSize: true }}
      flat
      dpr={1}
      camera={{ fov: 34, position: [0, 0.4, 16] }}
      gl={{ alpha: false, antialias: true, stencil: false }}
    >
      <AdaptiveResolution />
      <Bg />
      <Bench name="ring" />
      <Suspense fallback={null}>
        <Cards images={images} state={state} />
        <Ready id="ring" />
      </Suspense>
    </Canvas>
  );
}
