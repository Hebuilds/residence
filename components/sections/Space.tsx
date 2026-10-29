'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import Reveal from '@/components/ui/Reveal';
import ScriptWord from '@/components/ui/ScriptWord';
import Blossom from '@/components/ui/Blossom';
import { archPath, type ArchRect } from '@/lib/arch';
import { space } from '@/lib/content';

/** A doorway grows until the room is all you can see. */
export default function Space() {
  const root = useRef<HTMLElement>(null);
  const [write, setWrite] = useState(false);

  useGSAP(
    () => {
      const stage = root.current!.querySelector<HTMLElement>('.space__stage')!;
      const media = stage.querySelector<HTMLElement>('.space__media')!;
      const outline = stage.querySelector<SVGPathElement>('.space__outline path')!;
      const r: ArchRect = { l: 0, t: 0, w: 0, b: 0 };
      let from: ArchRect;
      let to: ArchRect;

      const measure = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const w = Math.min(vw * 0.24, 380, vw * 0.6);
        const aw = vw < 760 ? vw * 0.5 : w;
        from = { l: (vw - aw) / 2, t: vh * 0.36, w: aw, b: vh * 0.94 };
        const W = Math.max(vw, vh) * 1.9;
        to = { l: (vw - W) / 2, t: -W / 2 - 60, w: W, b: vh * 1.02 };
      };
      measure();

      const apply = (p: number) => {
        const k = gsap.parseEase('sharp')(p);
        r.l = from.l + (to.l - from.l) * k;
        r.t = from.t + (to.t - from.t) * k;
        r.w = from.w + (to.w - from.w) * k;
        r.b = from.b + (to.b - from.b) * k;
        media.style.clipPath = `path('${archPath(r)}')`;
        outline.setAttribute('d', archPath({ l: r.l - 14, t: r.t - 14, w: r.w + 28, b: r.b }));
      };
      apply(0);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 0.6,
          onRefresh: () => {
            measure();
          },
          onUpdate: (self) => {
            const open = Math.min(1, Math.max(0, (self.progress - 0.1) / 0.62));
            apply(open);
            setWrite(self.progress > 0.42);
          },
        },
        defaults: { ease: 'none' },
      });
      tl.to('.space__w1', { yPercent: -160, opacity: 0, duration: 0.5 }, 0.1)
        .to('.space__w2', { xPercent: -140, opacity: 0, duration: 0.5 }, 0.12)
        .to('.space__script', { x: () => -(window.innerWidth * 0.18), y: () => -(window.innerHeight * 0.12), scale: 1.35, color: '#fbfaf7', duration: 0.45 }, 0.25)
        .fromTo('.space__media img', { scale: 1.35 }, { scale: 1, duration: 0.8 }, 0.1)
        .to('.space__outline', { opacity: 0, duration: 0.2 }, 0.6)
        .fromTo('.space__caption', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.15 }, 0.82);
    },
    { scope: root },
  );

  return (
    <section ref={root} className="space">
      <div className="space__intro section">
        <Blossom seed={3} className="space__branch" />
        <span className="label section-index">05</span>
        <Reveal as="h2" className="space__statement display">
          {space.statement}
        </Reveal>
      </div>

      <div className="space__stage" data-header-light-when-open>
        <div className="space__media">
          <Image src={space.image} alt={space.alt} fill sizes="100vw" />
        </div>
        <svg className="space__outline" aria-hidden>
          <path fill="none" stroke="currentColor" strokeWidth={1} />
        </svg>
        <h2 className="space__words display" aria-label="The space to breathe">
          <span className="space__w1">{space.words[0]}</span>
          <span className="space__w2">{space.words[1]}</span>
          <ScriptWord word={space.script} className="space__script" play={write} duration={1.3} stroke={2} />
        </h2>
        <p className="space__caption label">Living room, The Lake Villa · seven metres of glass facing the water</p>
      </div>
    </section>
  );
}
