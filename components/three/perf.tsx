'use client';

import { useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, N8AO, Bloom, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { dprRange, settings } from '@/lib/gpu';

export const tier = settings;
export const shadowType = () => (settings().shadowType === 'vsm' ? THREE.VSMShadowMap : THREE.PCFShadowMap);

/**
 * Keeps the canvas inside its pixel budget, then lets PerformanceMonitor trade
 * resolution for frame rate: down when frames run long, back up with headroom.
 */
export function AdaptiveResolution() {
  const { size, setDpr } = useThree();
  const range = useRef<[number, number]>([1, 1]);
  const factor = useRef(1);

  useEffect(() => {
    range.current = dprRange(size.width, size.height);
    const [lo, hi] = range.current;
    setDpr(lo + (hi - lo) * factor.current);
  }, [size.width, size.height, setDpr]);

  return (
    <PerformanceMonitor
      flipflops={4}
      onChange={({ factor: f }) => {
        factor.current = f;
        const [lo, hi] = range.current;
        setDpr(lo + (hi - lo) * f);
      }}
      onFallback={() => setDpr(range.current[0])}
    />
  );
}

/** Screen space occlusion and a little bloom, on strong GPUs only. Everyone else relies on baked occlusion. */
export function PostFX({ aoRadius = 1.4, aoIntensity = 2.2 }: { aoRadius?: number; aoIntensity?: number }) {
  if (!tier().post) return null;
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={aoRadius} distanceFalloff={0.8} intensity={aoIntensity} halfRes quality="performance" />
      <Bloom luminanceThreshold={0.92} intensity={0.5} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <SMAA />
    </EffectComposer>
  );
}
