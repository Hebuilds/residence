'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import { useIntro } from '@/components/providers/Providers';
import ScriptWord from '@/components/ui/ScriptWord';
import { hero } from '@/lib/content';

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const { phase } = useIntro();
  const intro = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const ituze = new SplitText('.hero__ituze', { type: 'chars', mask: 'chars' });
      const residence = new SplitText('.hero__residence', { type: 'chars', mask: 'chars' });

      gsap.set([ituze.chars, residence.chars], { yPercent: 115 });
      gsap.set('.hero__tag > *', { opacity: 0, y: 14 });
      gsap.set('.hero__rule', { scaleX: 0 });

      intro.current = gsap
        .timeline({ paused: true })
        .to(ituze.chars, { yPercent: 0, duration: 1.4, ease: 'settle', stagger: 0.06 }, 0)
        .to(residence.chars, { yPercent: 0, duration: 1.4, ease: 'settle', stagger: 0.045 }, 0.12)
        .fromTo(
          residence.chars,
          { filter: 'blur(10px)', opacity: 0.2 },
          { filter: 'blur(0px)', opacity: 1, duration: 1.2, ease: 'power2.out', stagger: 0.045, clearProps: 'filter' },
          0.12,
        )
        .to('.hero__rule', { scaleX: 1, duration: 1.2, ease: 'sharp' }, 0.6)
        .to('.hero__tag > *', { opacity: 1, y: 0, duration: 1, ease: 'settle', stagger: 0.08 }, 0.7);

      // Leaving the hero: the title lifts away faster than the photo.
      gsap
        .timeline({
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        })
        .to('.hero__media-inner', { yPercent: 18, scale: 1.08, ease: 'none' }, 0)
        .to('.hero__titles', { yPercent: -40, opacity: 0, ease: 'none' }, 0)
        .to('.hero__tag', { yPercent: -120, opacity: 0, ease: 'none' }, 0);

      return () => {
        ituze.revert();
        residence.revert();
      };
    },
    { scope: root },
  );

  useGSAP(() => {
    if (phase !== 'loading') intro.current?.play();
  }, [phase]);

  return (
    <section ref={root} className="hero" data-hero data-header="light" id="top">
      <div className="hero__media" data-hero-media>
        <div className="hero__media-inner">
          <Image src={hero.image} alt={hero.alt} fill priority sizes="100vw" />
        </div>
      </div>
      <div className="hero__shade" />
      <div className="hero__veil" data-hero-veil />

      <div className="hero__titles">
        <h1 className="hero__title display">
          <span className="hero__ituze">Ituze</span>
          <span className="hero__residence">Residence</span>
        </h1>
        <ScriptWord word="Lake Kivu" className="hero__script" play={phase !== 'loading'} delay={0.9} duration={1.8} stroke={1.6} />
      </div>

      <div className="hero__tag">
        <span className="hero__tag-side display">{hero.left}</span>
        <span className="hero__tag-mid">
          <span className="hero__rule" />
          <span className="label">{hero.mid[0]}</span>
          <span className="label">{hero.mid[1]}</span>
          <span className="hero__rule" />
        </span>
        <span className="hero__tag-side display">{hero.right}</span>
      </div>
    </section>
  );
}
