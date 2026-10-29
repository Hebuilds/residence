'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import type { PlanState } from '@/components/three/PlanHouse';
import { useWarmScene } from '@/components/ui/useNearViewport';
import { plan } from '@/lib/content';
import { ROOMS } from '@/components/three/plan-data';

const PlanHouse = dynamic(() => import('@/components/three/PlanHouse'), { ssr: false });

/** scene progress at which every wall of the plan has been drawn in ink */
const DRAWN = 0.33;

export default function Plan() {
  const root = useRef<HTMLElement>(null);
  const state = useRef<PlanState>({ progress: 0, pointer: [0, 0] });
  const labels = useRef<(HTMLElement | null)[]>([]);
  const [phase, setPhase] = useState(0);
  const { mounted, visible } = useWarmScene('plan', root);

  useGSAP(
    () => {
      const go = (p: number) => {
        gsap.to(state.current, { progress: p, duration: 0.5, ease: 'power2.out', overwrite: true });
        setPhase(p < 0.34 ? 0 : p < 0.62 ? 1 : 2);
      };
      // the ink plan draws itself while the section rises into view, so it is complete on arrival
      let pinned: ScrollTrigger | null = null;
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top 85%',
        end: 'top top',
        onUpdate: (self) => {
          if (!pinned?.isActive) go(DRAWN * self.progress);
        },
      });
      // pinned: walls rise, light arrives, then the furniture
      pinned = ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: '+=200%',
        pin: true,
        scrub: true,
        onUpdate: (self) => go(DRAWN + (1 - DRAWN) * self.progress),
      });
      gsap.from('.plan__head > *', {
        yPercent: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'settle',
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 60%', once: true },
      });
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
    <section ref={root} className="plan" id="plan">
      <div className="plan__canvas">
        {mounted && <PlanHouse state={state} labels={labels} active={visible} />}
        <div className={`plan__rooms is-phase-${phase}`} aria-hidden>
          {ROOMS.map(([name], i) => (
            <span key={i} className="plan-room label" ref={(el) => { labels.current[i] = el; }}>
              {name}
            </span>
          ))}
        </div>
      </div>
      <div className="plan__ui">
        <div className="plan__head">
          <span className="label section-index">07</span>
          <h2 className="plan__title display">
            {plan.title[0]}
            <br />
            {plan.title[1]}
          </h2>
        </div>
        <ol className="plan__phases">
          {plan.phases.map((p, i) => (
            <li key={p.k} className={i === phase ? 'is-active' : i < phase ? 'is-past' : ''}>
              <span className="plan__phase-k display">
                <em className="label">{String(i + 1).padStart(2, '0')}</em>
                {p.k}
              </span>
              <p className="plan__phase-text">{p.text}</p>
            </li>
          ))}
        </ol>
        <div className="plan__scale label" aria-hidden>
          <span className="plan__scale-bar">
            <i />
            <i />
            <i />
            <i />
          </span>
          0 · 5 · 10 m
        </div>
      </div>
    </section>
  );
}
