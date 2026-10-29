'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, type MutableRefObject } from 'react';
import * as THREE from 'three';

type Props = {
  points: readonly (readonly [number, number, number])[];
  els: MutableRefObject<(HTMLElement | null)[]>;
  /** return true to hide a label at screen position (x, y) in a w by h canvas */
  cull?: (x: number, y: number, w: number, h: number) => boolean;
};

/**
 * Pins DOM labels to 3D points. Cheaper than one React root per label, and it
 * never fights React when the canvas unmounts.
 */
export default function Projector({ points, els, cull }: Props) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    points.forEach((p, i) => {
      const el = els.current[i];
      if (!el) return;
      v.set(p[0], p[1], p[2]).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      const hidden = v.z >= 1 || (cull ? cull(x, y, size.width, size.height) : false);
      el.style.opacity = hidden ? '0' : '';
    });
  });
  return null;
}
