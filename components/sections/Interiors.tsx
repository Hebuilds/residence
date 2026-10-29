'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import Reveal from '@/components/ui/Reveal';
import { interiors } from '@/lib/content';

const SPEEDS = [-14, 10, -22, 6, -10];

export default function Interiors() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>('.interiors__item').forEach((item, i) => {
        gsap.fromTo(
          item,
          { yPercent: -SPEEDS[i] / 2 },
          { yPercent: SPEEDS[i] / 2, ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true } },
        );
        gsap.fromTo(
          item.querySelector('.media'),
          { clipPath: 'inset(18% 10% 18% 10%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'sharp', duration: 1.4, scrollTrigger: { trigger: item, start: 'top 88%', once: true } },
        );
        gsap.fromTo(
          item.querySelector('img'),
          { scale: 1.3 },
          { scale: 1, ease: 'sharp', duration: 1.6, scrollTrigger: { trigger: item, start: 'top 88%', once: true } },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="section interiors">
      <div className="interiors__head">
        <span className="label section-index">06</span>
        <Reveal as="h2" className="interiors__title display">
          Rooms that open to the weather
        </Reveal>
        <Reveal className="body-copy">
          Lime walls, basalt floors, eucalyptus joinery. Every room has a door to the outside, and every door is tall enough to walk through with a tray of coffee.
        </Reveal>
      </div>
      <div className="interiors__grid">
        {interiors.images.map((im, i) => (
          <figure key={im.src} className={`interiors__item interiors__item--${i}`}>
            <div className="media">
              <Image src={im.src} alt={im.alt} fill sizes="(max-width: 760px) 90vw, 40vw" />
            </div>
            <figcaption className="label">{im.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
