'use client';

import { useEffect, useState, type RefObject } from 'react';
import { isReady, onPreloadChange, SCENES, type SceneJob } from '@/lib/preload';

/**
 * Like useViewportPresence, but the scene is also mounted during the opening
 * loader: the grounds first, then the plan and the ring once the grounds have
 * drawn. By the time anyone scrolls there it is built.
 */
export function useWarmScene(id: SceneJob, ref: RefObject<HTMLElement | null>) {
  const { mounted: near, visible } = useViewportPresence(ref);
  const [turn, setTurn] = useState(false);
  useEffect(() => {
    const i = SCENES.indexOf(id);
    // the plan and the ring start together once the grounds have drawn: the ring is light
    // and mostly waits on its photographs, so it can load beside the plan's build
    const before = i === 0 ? undefined : SCENES[0];
    let timer = 0;
    let off = () => {};
    const check = () => {
      if (before && !isReady(before)) return;
      off();
      // the first scene waits a beat so the loader paints before the heavy work starts
      timer = window.setTimeout(() => setTurn(true), i === 0 ? 250 : 60);
    };
    off = onPreloadChange(check);
    check();
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, [id]);
  return { mounted: near || turn, visible };
}

/**
 * `mounted` turns true once the element comes within a screen and a half of the
 * viewport and stays true, so a WebGL scene is built once, ahead of time, and
 * never rebuilt. `visible` is true only while it is on screen, so the scene can
 * stop rendering the rest of the time.
 */
export function useViewportPresence(ref: RefObject<HTMLElement | null>, near = '150% 0px') {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const early = new IntersectionObserver(([e]) => e.isIntersecting && setMounted(true), { rootMargin: near });
    const now = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '8% 0px' });
    early.observe(el);
    now.observe(el);
    return () => {
      early.disconnect();
      now.disconnect();
    };
  }, [ref, near]);
  return { mounted, visible };
}
