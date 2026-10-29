'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import type { RingState } from '@/components/three/PhotoRing';
import { useWarmScene } from '@/components/ui/useNearViewport';
import { Mark } from '@/components/Header';
import { brand, visit } from '@/lib/content';

const PhotoRing = dynamic(() => import('@/components/three/PhotoRing'), { ssr: false });

export default function Visit() {
  const root = useRef<HTMLElement>(null);
  const state = useRef<RingState>({ velocity: 0, progress: 0, pointer: [0, 0] });
  const { mounted, visible } = useWarmScene('ring', root);
  const [sent, setSent] = useState(false);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          state.current.progress = self.progress;
          state.current.velocity = self.getVelocity();
          gsap.to(state.current, { velocity: 0, duration: 1.2, overwrite: true });
        },
      });
      gsap.from('.visit__center > *', {
        y: 40,
        opacity: 0,
        duration: 1.3,
        ease: 'settle',
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 55%', once: true },
      });
      gsap.fromTo('.visit__ring', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 2, ease: 'settle', scrollTrigger: { trigger: root.current, start: 'top 70%', once: true } });
    },
    { scope: root },
  );

  useEffect(() => {
    const el = root.current!;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      state.current.pointer = [((e.clientX - r.left) / r.width - 0.5) * 2, -((e.clientY - r.top) / r.height - 0.5) * 2];
    };
    el.addEventListener('pointermove', move);
    return () => el.removeEventListener('pointermove', move);
  }, []);

  return (
    <section ref={root} className="visit" id="visit">
      <div className="visit__ring">{mounted && <PhotoRing images={visit.ring} state={state} active={visible} />}</div>
      <div className="visit__center">
        <Mark className="visit__mark" />
        <h2 className="visit__title display">
          {visit.title[0]}
          <br />
          {visit.title[1]}
        </h2>
        <p className="body-copy">{visit.body}</p>
        {sent ? (
          <p className="visit__thanks label">Thank you. We will call you within a day to arrange your visit.</p>
        ) : (
          <form
            className="visit__form"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <label className="sr-only" htmlFor="visit-name">
              Your name
            </label>
            <input id="visit-name" name="name" placeholder="Your name" required autoComplete="name" />
            <label className="sr-only" htmlFor="visit-phone">
              Phone or email
            </label>
            <input id="visit-phone" name="contact" placeholder="Phone or email" required />
            <button type="submit" className="pill label">
              {visit.cta}
              <svg viewBox="0 0 14 10" fill="none" stroke="currentColor">
                <path d="M0 5 H13 M9 1 L13 5 L9 9" />
              </svg>
            </button>
          </form>
        )}
        <a className="visit__wa label" href={brand.whatsapp} target="_blank" rel="noreferrer">
          Or message us on WhatsApp
        </a>
      </div>
    </section>
  );
}
