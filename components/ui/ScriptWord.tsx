'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import paths from '@/lib/script-paths.json';

export type ScriptKey = keyof typeof paths;

type Props = {
  word: ScriptKey;
  className?: string;
  /** 'inview' writes the word when it scrolls in; true/false drives it from a parent. */
  play?: boolean | 'inview';
  duration?: number;
  delay?: number;
  stroke?: number;
};

/**
 * A script word "written" glyph by glyph: each outline is traced with
 * stroke-dashoffset, then the fill floods in behind the pen.
 */
export default function ScriptWord({ word, className, play = 'inview', duration = 1.6, delay = 0, stroke = 1.4 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const data = paths[word];
  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const glyphs = gsap.utils.toArray<SVGPathElement>('path', ref.current);
      gsap.set(glyphs, { strokeDasharray: 1, strokeDashoffset: 1, fillOpacity: 0 });
      const per = duration / Math.max(glyphs.length, 1);
      tl.current = gsap
        .timeline({ paused: true, delay })
        .to(glyphs, { strokeDashoffset: 0, duration: per * 2.2, ease: 'power1.inOut', stagger: per * 0.8 })
        .to(glyphs, { fillOpacity: 1, duration: 0.7, ease: 'power2.out', stagger: per * 0.8 }, per * 1.4)
        .to(glyphs, { strokeOpacity: 0, duration: 0.6 }, '>-0.3');

      if (play === 'inview') {
        ScrollTrigger.create({
          trigger: ref.current,
          start: 'top 85%',
          onEnter: () => tl.current?.play(),
          onLeaveBack: () => tl.current?.pause(0),
        });
      }
    },
    { scope: ref, dependencies: [word] },
  );

  useGSAP(() => {
    if (play === true) tl.current?.play();
    if (play === false) tl.current?.pause(0);
  }, [play]);

  const [x, y, w, h] = data.viewBox;
  return (
    <svg
      ref={ref}
      className={className}
      viewBox={`${x} ${y} ${w} ${h}`}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={stroke}
      aria-label={word}
      role="img"
      style={{ overflow: 'visible' }}
    >
      {data.glyphs.map((d, i) => (
        <path key={i} d={d} pathLength={1} />
      ))}
    </svg>
  );
}
