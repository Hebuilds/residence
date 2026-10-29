'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import Reveal from '@/components/ui/Reveal';
import Imigongo from '@/components/ui/Imigongo';
import { architecture } from '@/lib/content';

export default function Architecture() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const word = new SplitText('.archi__word', { type: 'chars' });
      gsap
        .timeline({
          scrollTrigger: { trigger: '.archi__hero', start: 'top top', end: '+=120%', pin: true, scrub: 0.6 },
          defaults: { ease: 'none' },
        })
        .fromTo('.archi__media img', { scale: 1.25 }, { scale: 1, duration: 1 }, 0)
        .fromTo(
          word.chars,
          { yPercent: 70, opacity: 0, filter: 'blur(14px)' },
          { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.5, stagger: 0.035 },
          0.05,
        )
        .fromTo('.archi__word', { letterSpacing: '0.12em' }, { letterSpacing: '-0.005em', duration: 0.8 }, 0.05)
        .fromTo('.archi__meta', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.2 }, 0.75);

      // materials drift sideways while the section scrolls past
      const track = root.current!.querySelector<HTMLElement>('.archi__track')!;
      gsap.fromTo(
        track,
        { x: () => window.innerWidth * 0.25 },
        {
          x: () => -(track.scrollWidth - window.innerWidth * 0.85),
          ease: 'none',
          scrollTrigger: { trigger: '.archi__strip', start: 'top bottom', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true },
        },
      );
      gsap.utils.toArray<HTMLElement>('.mat').forEach((m) => {
        gsap.fromTo(
          m.querySelector('.mat__media'),
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'sharp', scrollTrigger: { trigger: '.archi__strip', start: 'top 80%', once: true }, delay: Number(m.dataset.i) * 0.08 },
        );
      });

      return () => word.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="archi" id="architecture">
      <div className="archi__hero" data-header="light">
        <div className="archi__media">
          <Image src={architecture.image} alt={architecture.alt} fill sizes="100vw" />
        </div>
        <div className="archi__shade" />
        <h2 className="archi__word display">{architecture.word}</h2>
        <div className="archi__meta label">
          <span>Atelier Kivu</span>
          <span>Lime · Basalt · Eucalyptus</span>
          <span>2026 to 2028</span>
        </div>
      </div>

      <div className="archi__body section">
        <span className="label section-index">09</span>
        <Reveal className="archi__lead display">{architecture.body}</Reveal>
        <figure className="archi__quote">
          <Reveal as="blockquote" className="archi__quote-text">
            “{architecture.quote}”
          </Reveal>
          <figcaption className="label">{architecture.quoteBy}</figcaption>
        </figure>
      </div>

      <div className="archi__strip">
        <div className="archi__strip-head section label">
          <span>Materials</span>
          <span>All from within a day’s drive</span>
        </div>
        <div className="archi__track">
          {architecture.materials.map((m, i) => (
            <article key={m.name} className="mat" data-i={i}>
              <div className="mat__media media">
                {m.image ? <Image src={m.image} alt={`${m.name} texture`} fill sizes="(max-width: 760px) 70vw, 24vw" /> : <Imigongo className="mat__svg" seed={9} />}
              </div>
              <div className="mat__text">
                <span className="label">{String(i + 1).padStart(2, '0')} · {m.origin}</span>
                <h3 className="mat__name display">{m.name}</h3>
                <p>{m.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
