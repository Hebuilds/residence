'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  /** lines rise from under a mask; words brighten as you scroll through them */
  mode?: 'lines' | 'scrub';
  start?: string;
  id?: string;
};

export default function Reveal({ as: Tag = 'p', children, className, delay = 0, mode = 'lines', start = 'top 88%', id }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      if (mode === 'scrub') {
        SplitText.create(el, {
          type: 'words',
          autoSplit: true,
          onSplit: (self) =>
            gsap.fromTo(
              self.words,
              { opacity: 0.14 },
              {
                opacity: 1,
                ease: 'none',
                stagger: 0.12,
                scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: true },
              },
            ),
        });
        return;
      }
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'reveal-line',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.25,
            ease: 'settle',
            stagger: 0.09,
            delay,
            scrollTrigger: { trigger: el, start, once: true },
          }),
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  );
}

/** A number that counts up once it scrolls into view. */
export function Counter({ value, decimals = 0, plain = false }: { value: number; decimals?: number; plain?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const el = ref.current!;
    const o = { v: plain ? value - 6 : 0 };
    gsap.to(o, {
      v: value,
      duration: 2.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => {
        el.textContent = o.v.toFixed(decimals);
      },
    });
  });
  return <span ref={ref}>{plain ? value - 6 : (0).toFixed(decimals)}</span>;
}
