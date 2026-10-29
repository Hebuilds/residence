'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import CloudLayer from '@/components/ui/CloudLayer';
import { panorama } from '@/lib/content';

const WARM_SHADOW: [number, number, number] = [0.84, 0.86, 0.88];

/**
 * The page dissolves into a bank of cloud, which parts on scroll to show the
 * whole lake. A second, lower bank of mist hands over to the next section.
 */
export default function Panorama() {
  const root = useRef<HTMLElement>(null);
  const lift = useRef(0);
  const settle = useRef(1);

  useGSAP(
    () => {
      const proxy = { lift: 0, settle: 1 };
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=160%',
          pin: true,
          scrub: 0.8,
        },
        defaults: { ease: 'none' },
        onUpdate: () => {
          lift.current = proxy.lift;
          settle.current = proxy.settle;
        },
      });
      tl.to(proxy, { lift: 1, duration: 0.6, ease: 'power2.inOut' }, 0)
        .fromTo('.pano__media', { scale: 1 }, { scale: 1.14, duration: 1 }, 0)
        .fromTo('.pano__line--1', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.16 }, 0.14)
        .to('.pano__line--1', { opacity: 0, y: -30, duration: 0.14 }, 0.46)
        .fromTo('.pano__line--2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.16 }, 0.58)
        .to(proxy, { settle: 0.25, duration: 0.3, ease: 'power2.in' }, 0.7);

    },
    { scope: root },
  );

  return (
    <section ref={root} className="pano" aria-label={panorama.label}>
      <div className="pano__media">
        <Image src={panorama.image} alt={panorama.alt} fill sizes="100vw" />
      </div>
      <div className="pano__shade" />
      <CloudLayer className="pano__clouds pano__clouds--top" mode="bank-top" progress={lift} scale={1.7} speed={0.03} seed={11} shadow={WARM_SHADOW} />
      <CloudLayer className="pano__clouds pano__clouds--bottom" mode="bank-bottom" progress={settle} scale={2.1} speed={0.022} seed={23} shadow={WARM_SHADOW} />
      <p className="pano__line pano__line--1 display">{panorama.lines[0]}</p>
      <p className="pano__line pano__line--2 display">{panorama.lines[1]}</p>
    </section>
  );
}
