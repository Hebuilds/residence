'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { useIntro } from '@/components/providers/Providers';
import { scroll, scrollToHash } from '@/lib/scroll';
import { brand, nav } from '@/lib/content';

/** Imigongo-inspired mark: nested diamonds with chevrons, the way the cow dung panels of Nyakarambi step inward. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path d="M20 2 L38 20 L20 38 L2 20 Z" />
      <path d="M20 9 L31 20 L20 31 L9 20 Z" />
      <path d="M20 15 L25 20 L20 25 L15 20 Z" fill="currentColor" />
      <path d="M20 2 V9 M38 20 H31 M20 38 V31 M2 20 H9" />
    </svg>
  );
}

function Badge() {
  const text = 'Ituze · Residence · Lake Kivu · Rwanda · ';
  return (
    <a href="#top" className="badge" aria-label="Ituze Residence, back to top" onClick={(e) => { e.preventDefault(); scrollToHash('#top'); }}>
      <svg className="badge__ring" viewBox="0 0 100 100" aria-hidden>
        <defs>
          <path id="badge-circle" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
        </defs>
        <text>
          <textPath href="#badge-circle" textLength="236">
            {text}
          </textPath>
        </text>
      </svg>
      <Mark className="badge__mark" />
    </a>
  );
}

export default function Header() {
  const root = useRef<HTMLDivElement>(null);
  const { phase } = useIntro();
  const [open, setOpen] = useState(false);
  const menuTl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      gsap.set('.header__item', { opacity: 0, y: -12 });

      // Badge ring turns slowly, faster while scrolling.
      const ring = gsap.to('.badge__ring', { rotate: 360, duration: 28, ease: 'none', repeat: -1 });
      const speed = { v: 1 };
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const v = 1 + Math.min(Math.abs(self.getVelocity()) / 260, 16);
          gsap.to(speed, { v, duration: 0.2, overwrite: true, onUpdate: () => ring.timeScale(speed.v) });
          gsap.to(speed, { v: 1, duration: 1.4, delay: 0.25, ease: 'power2.out', onUpdate: () => ring.timeScale(speed.v) });
        },
      });

      // Page progress on the left rail.
      gsap.to('.rail__fill', {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
      });

      // Menu
      menuTl.current = gsap
        .timeline({ paused: true })
        .set('.menu', { visibility: 'visible' })
        .fromTo('.menu', { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'sharp' })
        .fromTo('.menu__link span', { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'settle', stagger: 0.05 }, 0.35)
        .fromTo('.menu__media', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'sharp' }, 0.3)
        .fromTo('.menu__foot > *', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 }, 0.6);
    },
    { scope: root },
  );

  // Header and rail turn white over photographs.
  useEffect(() => {
    if (phase !== 'done') return;
    const triggers = gsap.utils.toArray<HTMLElement>('[data-header="light"]').map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 64px',
        end: 'bottom 64px',
        toggleClass: { targets: root.current!, className: 'is-light' },
      }),
    );
    ScrollTrigger.refresh();
    return () => triggers.forEach((t) => t.kill());
  }, [phase]);

  useGSAP(() => {
    if (phase === 'loading') return;
    gsap.to('.header__item', { opacity: 1, y: 0, duration: 1.1, ease: 'settle', stagger: 0.08, delay: 0.9 });
  }, [phase]);

  useEffect(() => {
    if (open) {
      scroll.lenis?.stop();
      menuTl.current?.timeScale(1).play();
    } else {
      menuTl.current?.timeScale(1.6).reverse();
      if (phase === 'done') scroll.lenis?.start();
    }
  }, [open, phase]);

  const go = (href: string) => {
    setOpen(false);
    setTimeout(() => scrollToHash(href), 450);
  };

  return (
    <div ref={root} className={`header ${open ? 'is-open' : ''}`}>
      <div className="header__bar">
        <div className="header__item">
          <Badge />
        </div>

        <nav className="header__right">
          <a
            href="#residences"
            className="header__item header__select display"
            onClick={(e) => {
              e.preventDefault();
              go('#residences');
            }}
          >
            <span>Select a</span>
            <span>residence</span>
          </a>
          <div className="header__item header__links label">
            <a href="#visit" onClick={(e) => { e.preventDefault(); go('#visit'); }}>
              Book a visit
            </a>
            <span aria-hidden>·</span>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? 'Close' : 'Menu'}
            </button>
          </div>
        </nav>
      </div>

      <div className="rail header__item" aria-hidden>
        <span className="rail__line">
          <span className="rail__fill" />
        </span>
        <span className="rail__label label">Scroll</span>
        <svg className="rail__arrow" viewBox="0 0 10 30" fill="none" stroke="currentColor">
          <path d="M5 0 V28 M1 24 L5 28 L9 24" />
        </svg>
      </div>

      <div className="menu" role="dialog" aria-modal="true" aria-label="Site menu">
        <div className="menu__inner">
          <ol className="menu__list">
            {nav.map((item, i) => (
              <li key={item.href}>
                <a
                  className="menu__link display"
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.href);
                  }}
                >
                  <span>
                    <em className="label">{String(i + 1).padStart(2, '0')}</em>
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ol>
          <div className="menu__media media">
            <Image src="/images/arches.jpg" alt="White arches over a pool" fill sizes="(max-width: 900px) 0px, 36vw" />
          </div>
        </div>
        <div className="menu__foot label">
          <a href={brand.phoneHref}>{brand.phone}</a>
          <a href={`mailto:${brand.email}`}>{brand.email}</a>
          <span>{brand.town}</span>
        </div>
      </div>
    </div>
  );
}
