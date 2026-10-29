'use client';

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

type BenchEntry = { run: (frames?: number) => { ms: number; calls: number; triangles: number }; get?: () => unknown };
declare global {
  interface Window {
    __bench?: Record<string, BenchEntry>;
  }
}

/**
 * Development only: exposes window.__bench[name].run(frames) which renders the
 * scene synchronously and waits for the GPU each frame, giving a true cost per
 * frame (CPU and GPU) that does not depend on the browser's frame timing.
 */
export default function Bench({ name }: { name: string }) {
  const get = useThree((s) => s.get);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    window.__bench ??= {};
    window.__bench[name] = {
      get,
      run: (frames = 60) => {
        const s = get();
        const ctx = s.gl.getContext();
        const px = new Uint8Array(4);
        s.gl.info.autoReset = false;
        s.gl.info.reset();
        const t0 = performance.now();
        for (let i = 0; i < frames; i++) {
          s.advance(t0 + i * 16.67, true);
          ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
        }
        const ms = (performance.now() - t0) / frames;
        const calls = Math.round(s.gl.info.render.calls / frames);
        const triangles = Math.round(s.gl.info.render.triangles / frames);
        s.gl.info.autoReset = true;
        return { ms: Math.round(ms * 100) / 100, calls, triangles };
      },
    };
    return () => {
      delete window.__bench?.[name];
    };
  }, [get, name]);
  return null;
}
