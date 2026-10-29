'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import { markReady, type SceneJob } from '@/lib/preload';

/**
 * Tells the loader a scene is ready to be seen. Put it last inside the canvas
 * (inside the Suspense boundary when there are textures to wait for).
 *
 * `prime` can put the scene into its fullest state for the first frame (every
 * wall, chair and lamp visible) so that frame compiles every shader and uploads
 * every texture while the loader is still up; it returns the function that puts
 * the scene back. Nothing then has to compile in the middle of a scroll.
 */
export default function Ready({ id, prime }: { id: SceneJob; prime?: () => () => void }) {
  const invalidate = useThree((s) => s.invalidate);
  const frame = useRef(0);
  const restore = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    restore.current = prime?.() ?? null;
    invalidate();
    // prime is read once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidate]);

  useFrame(() => {
    frame.current += 1;
    const n = frame.current;
    // frame 1 renders the primed scene. Other components run their frame logic
    // before this one, so the restored state reaches the screen one frame later.
    if (n === 1) invalidate();
    else if (n === 2 && restore.current) {
      restore.current();
      restore.current = null;
      invalidate();
    } else if (n === 2 || n === 3) markReady(id);
  });

  return null;
}
