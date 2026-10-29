'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { scroll } from '@/lib/scroll';

export type Phase = 'loading' | 'reveal' | 'done';

const IntroContext = createContext<{ phase: Phase; setPhase: (p: Phase) => void }>({
  phase: 'loading',
  setPhase: () => {},
});

export const useIntro = () => useContext(IntroContext);

export default function Providers({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('loading');

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    scroll.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    // Fonts change line breaks; re-measure every trigger once they land.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      scroll.lenis = null;
    };
  }, []);

  useEffect(() => {
    if (phase === 'done') {
      scroll.lenis?.start();
      document.documentElement.classList.remove('is-loading');
      ScrollTrigger.refresh();
    }
  }, [phase]);

  return <IntroContext.Provider value={{ phase, setPhase }}>{children}</IntroContext.Provider>;
}
