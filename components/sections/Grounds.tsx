'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import type { MasterplanState } from '@/components/three/Masterplan';
import { grounds } from '@/lib/content';
import { HOTSPOTS } from '@/components/three/site-data';
import { useWarmScene } from '@/components/ui/useNearViewport';

const Masterplan = dynamic(() => import('@/components/three/Masterplan'), { ssr: false });

export default function Grounds() {
  const root = useRef<HTMLElement>(null);
  // built from the start: the loader has already assembled the model, so it is whole when you arrive
  const state = useRef<MasterplanState>({ progress: 0, sun: 0.5, build: 1, pointer: [0, 0], step: 0 });
  const labels = useRef<(HTMLElement | null)[]>([]);
  const [built, setBuilt] = useState(false);
  const [step, setStep] = useState(0);
  const [hour, setHour] = useState(1);
  const { mounted, visible } = useWarmScene('grounds', root);

  useGSAP(
    () => {
      const n = grounds.steps.length;
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: `+=${n * 75}%`,
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          state.current.progress = self.progress;
          const s = Math.min(n - 1, Math.floor(self.progress * n + 0.15));
          if (s !== state.current.step) {
            state.current.step = s;
            setStep(s);
          }
        },
      });
      // the hotspot labels arrive with the section; the model is already there
      ScrollTrigger.create({ trigger: root.current, start: 'top 55%', once: true, onEnter: () => setBuilt(true) });
      gsap.from('.grounds__head > *', {
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

  const pickHour = (i: number) => {
    setHour(i);
    gsap.to(state.current, { sun: grounds.hours[i].value, duration: 1.6, ease: 'power2.inOut' });
  };

  return (
    <section ref={root} className="grounds" id="grounds">
      <div className="grounds__canvas">{mounted && <Masterplan state={state} labels={labels} active={visible} />}</div>
      <div className={`grounds__spots ${built ? 'is-built' : ''}`} aria-hidden>
        {HOTSPOTS.map((h, i) => (
          <div key={h.label} className={`hotspot ${i === step ? 'is-active' : ''}`} ref={(el) => { labels.current[i] = el; }}>
            <span className="hotspot__num">{String(i + 1).padStart(2, '0')}</span>
            <span className="hotspot__label label">{h.label}</span>
          </div>
        ))}
      </div>

      <div className="grounds__ui">
        <div className="grounds__head">
          <span className="label section-index">04</span>
          <h2 className="grounds__title display">{grounds.title}</h2>
          <p className="body-copy">{grounds.intro}</p>
        </div>

        <ol className="grounds__steps">
          {grounds.steps.map((s, i) => (
            <li key={s.title} className={i === step ? 'is-active' : ''}>
              <span className="grounds__step-num label">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="grounds__step-title display">{s.title}</h3>
                <p className="grounds__step-text">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="grounds__sun">
          <span className="label">Sun study</span>
          <div className="grounds__hours" role="radiogroup" aria-label="Time of day">
            {grounds.hours.map((h, i) => (
              <button
                key={h.label}
                type="button"
                role="radio"
                aria-checked={hour === i}
                className={`grounds__hour label ${hour === i ? 'is-on' : ''}`}
                onClick={() => pickHour(i)}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grounds__count label" aria-hidden>
          <span>{String(step + 1).padStart(2, '0')}</span>
          <span className="grounds__count-bar">
            <span style={{ transform: `scaleX(${(step + 1) / grounds.steps.length})` }} />
          </span>
          <span>{String(grounds.steps.length).padStart(2, '0')}</span>
        </div>
      </div>
    </section>
  );
}
