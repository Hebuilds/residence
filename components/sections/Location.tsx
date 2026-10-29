'use client';

import { useMemo, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import ScriptWord from '@/components/ui/ScriptWord';
import Blossom from '@/components/ui/Blossom';
import { Mark } from '@/components/Header';
import { brand, location } from '@/lib/content';
import { round } from '@/lib/random';

const W = 1600;
const H = 240;

// A stylised north shore of Lake Kivu: Gisenyi bay, then the hook of the Rubona peninsula.
function shoreY(t: number) {
  const bay = -26 * Math.exp(-((t - 0.24) ** 2) / 0.006);
  const peninsula = 46 * Math.exp(-((t - 0.655) ** 2) / 0.0009);
  const cove = -18 * Math.exp(-((t - 0.8) ** 2) / 0.004);
  return 128 + 14 * Math.sin(t * 19) + 9 * Math.sin(t * 47 + 1.3) + bay + peninsula + cove - 18 * t;
}

function shorePath() {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    pts.push([t * W, shoreY(t)]);
  }
  return 'M' + pts.map(([x, y]) => `${round(x)} ${round(y)}`).join(' L');
}

export default function Location() {
  const root = useRef<HTMLElement>(null);
  const d = useMemo(shorePath, []);
  const ripples = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < 26; i++) {
      const t = (i * 0.618) % 1;
      const x = t * W;
      const y = shoreY(t) + 24 + ((i * 37) % 70);
      out.push(`M${round(x)} ${round(y)} h${18 + ((i * 13) % 40)}`);
    }
    return out.join(' ');
  }, []);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '.location__map', start: 'top 85%', end: 'bottom 45%', scrub: 0.6 },
        defaults: { ease: 'none' },
      });
      tl.to('.location__shore', { strokeDashoffset: 0, duration: 1 }, 0);
      tl.to('.location__ripples', { opacity: 1, duration: 0.4 }, 0.5);
      gsap.utils.toArray<HTMLElement>('.place').forEach((p) => {
        const x = Number(p.dataset.x);
        tl.fromTo(p, { opacity: 0, scale: 0.7, transformOrigin: '50% 100%' }, { opacity: 1, scale: 1, duration: 0.12 }, x * 0.95);
      });

      gsap.from('.location__badge', {
        rotate: -90,
        opacity: 0,
        duration: 1.6,
        ease: 'settle',
        scrollTrigger: { trigger: '.location__badge', start: 'top 85%', once: true },
      });
      gsap.from('.location__title .line', {
        yPercent: 110,
        duration: 1.3,
        ease: 'settle',
        stagger: 0.12,
        scrollTrigger: { trigger: '.location__title', start: 'top 80%', once: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="section location" id="location">
      <Blossom seed={35} className="location__branch" start="top 75%" />

      <div className="location__head label">
        <span className="section-index">03</span>
        <span>{location.label}</span>
      </div>

      <div className="location__badge">
        <svg viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeOpacity={0.3} />
          <path d="M50 1 A49 49 0 0 1 96 34" fill="none" stroke="currentColor" />
        </svg>
        <span className="location__badge-num display">{brand.available}</span>
        <span className="label">
          Residences
          <br />
          available
        </span>
      </div>

      <h2 className="location__title display">
        <span className="line-mask">
          <span className="line">{location.title[0]}</span>
        </span>
        <ScriptWord word={location.script} className="location__script" duration={1.2} />
        <span className="line-mask">
          <span className="line">{location.title[1]}</span>
        </span>
      </h2>

      <p className="location__body body-copy">{location.body}</p>

      <div className="location__scroller">
      <div className="location__map">
        <svg viewBox={`0 0 ${W} ${H}`} fill="none" stroke="currentColor" aria-hidden>
          <path className="location__ripples" d={ripples} strokeOpacity={0.35} style={{ opacity: 0 }} />
          <path className="location__shore" d={d} strokeWidth={2.4} pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
        </svg>
        {location.places.map((p) => (
          <div
            key={p.name}
            className={`place ${p.home ? 'place--home' : ''}`}
            data-x={p.x}
            style={{ left: `${p.x * 100}%`, top: `${(shoreY(p.x) / H) * 100}%` }}
          >
            <span className="place__text label">
              {p.home ? <Mark className="place__mark" /> : null}
              <strong>{p.name}</strong>
              {p.time && <em>{p.time}</em>}
            </span>
            <span className="place__dot" />
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
