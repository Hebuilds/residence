'use client';

import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import ScriptWord from '@/components/ui/ScriptWord';
import { Mark } from '@/components/Header';
import { scrollToHash } from '@/lib/scroll';
import { brand, footer, nav } from '@/lib/content';

export default function Footer() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const split = new SplitText('.footer__word', { type: 'chars', mask: 'chars' });
      gsap.from(split.chars, {
        yPercent: 105,
        duration: 1.6,
        ease: 'settle',
        stagger: 0.07,
        scrollTrigger: { trigger: '.footer__word', start: 'top 98%', once: true },
      });
      gsap.from('.footer__phone', {
        yPercent: 40,
        opacity: 0,
        duration: 1.3,
        ease: 'settle',
        scrollTrigger: { trigger: '.footer__phone', start: 'top 90%', once: true },
      });
      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="footer">
      <div className="footer__top section">
        <Mark className="footer__mark" />
        <a className="footer__phone display" href={brand.phoneHref}>
          {brand.phone}
        </a>
        <p className="footer__meaning label">
          {brand.meaning}
          <ScriptWord word="calm" className="footer__script" />
        </p>
      </div>

      <div className="footer__cols section">
        {footer.columns.map((c) => (
          <div key={c.title}>
            <span className="label footer__col-title">{c.title}</span>
            {c.lines.map((l) =>
              l === brand.email ? (
                <a key={l} href={`mailto:${l}`}>
                  {l}
                </a>
              ) : l === 'WhatsApp' ? (
                <a key={l} href={brand.whatsapp} target="_blank" rel="noreferrer">
                  {l}
                </a>
              ) : (
                <span key={l}>{l}</span>
              ),
            )}
          </div>
        ))}
        <nav>
          <span className="label footer__col-title">Explore</span>
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToHash(n.href);
              }}
            >
              {n.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="footer__legal section label">
        <span>{footer.legal}</span>
        <span>{footer.credit}</span>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollToHash('#top');
          }}
        >
          Back to top ↑
        </a>
      </div>

      <p className="footer__word display" aria-hidden>
        Ituze
      </p>
    </footer>
  );
}
