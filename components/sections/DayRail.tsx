'use client';

import Image from 'next/image';
import { Fragment, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { day } from '@/lib/content';

const START = 6 * 60 + 40; // 06:40
const END = 21 * 60; // 21:00
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

export default function DayRail() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const track = el.querySelector<HTMLElement>('.day__track')!;
      const clock = el.querySelector<HTMLElement>('.day__clock-time')!;
      const arc = el.querySelector<SVGPathElement>('.day__sun-arc')!;
      const dot = el.querySelector<SVGCircleElement>('.day__sun-dot')!;
      const trail = el.querySelector<SVGPathElement>('.day__sun-trail')!;
      const fill = el.querySelector<HTMLElement>('.day__bar-fill')!;
      const arcLen = arc.getTotalLength();
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const setTime = (p: number) => {
        clock.textContent = hhmm(START + p * (END - START));
        const pt = arc.getPointAtLength(p * arcLen);
        dot.setAttribute('cx', String(pt.x));
        dot.setAttribute('cy', String(pt.y));
        trail.style.strokeDashoffset = String(1 - p);
        fill.style.transform = `scaleX(${p})`;
      };
      setTime(0);

      const move = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => setTime(self.progress),
        },
      });

      // Photographs slide inside their frames, words drift at their own speed.
      gsap.utils.toArray<HTMLElement>('.day__media img', el).forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -6 },
          {
            xPercent: 6,
            ease: 'none',
            scrollTrigger: { trigger: img.parentElement, containerAnimation: move, start: 'left right', end: 'right left', scrub: true },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>('.day__word', el).forEach((w) => {
        gsap.fromTo(
          w,
          { xPercent: 35 },
          {
            xPercent: -35,
            ease: 'none',
            scrollTrigger: { trigger: w, containerAnimation: move, start: 'left right', end: 'right left', scrub: true },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>('.day__card', el).forEach((card) => {
        gsap.fromTo(
          card.querySelector('.day__media'),
          { clipPath: 'inset(0% 0% 0% 100%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: move, start: 'left 98%', end: 'left 55%', scrub: true },
          },
        );
        gsap.from(card.querySelectorAll('figcaption > *'), {
          y: 24,
          opacity: 0,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: card, containerAnimation: move, start: 'left 80%', end: 'left 45%', scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="day" id="day">
      <div className="day__track">
        <div className="day__intro">
          <div className="label">
            <span className="section-index">02</span>
          </div>
          <h2 className="day__title display">
            A day
            <br />
            at Ituze
          </h2>
          <p className="body-copy">{day.intro}</p>
          <span className="day__hint label">Keep scrolling →</span>
        </div>

        {day.moments.map((m, i) => (
          <Fragment key={m.time}>
            <figure className={`day__card day__card--${m.shape}`}>
              <div className="day__media media">
                <Image src={m.image} alt={m.alt} fill sizes="(max-width: 760px) 80vw, 46vw" />
              </div>
              <figcaption>
                <span className="label">{m.time}</span>
                <span className="day__card-title display">{m.title}</span>
                <span className="day__card-text">{m.text}</span>
              </figcaption>
            </figure>
            {day.words[i] && (
              <span className={`day__word display ${i % 2 ? 'is-low' : 'is-high'}`} aria-hidden>
                {day.words[i]}
              </span>
            )}
          </Fragment>
        ))}
        <div className="day__end" />
      </div>

      <div className="day__hud">
        <div className="day__clock">
          <svg className="day__sun" viewBox="0 0 140 76" fill="none" stroke="currentColor" aria-hidden>
            <path d="M2 72 H138" strokeOpacity={0.4} />
            <path className="day__sun-arc" d="M10 72 A60 60 0 0 1 130 72" strokeOpacity={0.25} strokeDasharray="2 4" />
            <path className="day__sun-trail" d="M10 72 A60 60 0 0 1 130 72" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
            <circle className="day__sun-dot" r="5" fill="var(--paper)" cx="10" cy="72" />
          </svg>
          <span className="day__clock-time display">06:40</span>
        </div>
        <div className="day__bar">
          <span className="day__bar-fill" />
          {day.moments.map((m) => (
            <span key={m.time} className="day__bar-tick label">
              {m.time}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
