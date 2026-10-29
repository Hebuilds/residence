'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import Reveal from '@/components/ui/Reveal';
import { residences, brand } from '@/lib/content';

const FILTERS = [
  { label: 'All', test: () => true },
  { label: '2 bedrooms', test: (b: number) => b === 2 },
  { label: '3 bedrooms', test: (b: number) => b === 3 },
  { label: '4 bedrooms', test: (b: number) => b === 4 },
];

export default function Residences() {
  const root = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const follow = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);

  useGSAP(
    () => {
      follow.current = {
        x: gsap.quickTo('.res__float', 'x', { duration: 0.6, ease: 'power3' }),
        y: gsap.quickTo('.res__float', 'y', { duration: 0.6, ease: 'power3' }),
      };
      gsap.utils.toArray<HTMLElement>('.res__row').forEach((row, i) => {
        const line = row.querySelector('.res__line');
        const cells = row.querySelectorAll('.res__cell');
        const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 92%', once: true } });
        tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'sharp' }, i * 0.04).fromTo(
          cells,
          { yPercent: 60, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 1, ease: 'settle', stagger: 0.05 },
          0.15 + i * 0.04,
        );
      });
    },
    { scope: root },
  );

  // expanding rows
  useGSAP(
    () => {
      const details = gsap.utils.toArray<HTMLElement>('.res__detail');
      details.forEach((d, i) => {
        const isOpen = d.dataset.open === 'true';
        gsap.to(d, {
          height: isOpen ? 'auto' : 0,
          duration: 0.9,
          ease: 'sharp',
          // the page below just changed height: re-measure every pinned section
          onComplete: i === details.length - 1 ? () => ScrollTrigger.refresh() : undefined,
        });
        if (isOpen) gsap.fromTo(d.querySelectorAll('.res__detail-in > *'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'settle', stagger: 0.07, delay: 0.25 });
      });
    },
    { scope: root, dependencies: [open, filter] },
  );

  const onMove = (e: React.PointerEvent) => {
    const r = root.current!.querySelector('.res__list')!.getBoundingClientRect();
    follow.current?.x(e.clientX - r.left);
    follow.current?.y(e.clientY - r.top);
  };

  const list = residences.map((r, i) => ({ r, i })).filter(({ r }) => FILTERS[filter].test(r.beds));

  return (
    <section ref={root} className="section res" id="residences">
      <div className="res__head">
        <div>
          <span className="label section-index">08</span>
          <Reveal as="h2" className="res__title display">
            Select a residence
          </Reveal>
        </div>
        <div className="res__aside">
          <p className="body-copy">
            {brand.available} of 38 homes are available in the current release. Every residence comes with a parking bay, a storeroom and a share of the jetty.
          </p>
          <div className="res__filters" role="tablist" aria-label="Filter by bedrooms">
            {FILTERS.map((f, i) => (
              <button
                key={f.label}
                type="button"
                role="tab"
                aria-selected={filter === i}
                className={`res__filter label ${filter === i ? 'is-on' : ''}`}
                onClick={() => {
                  setFilter(i);
                  setOpen(null);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="res__cols label" aria-hidden>
        <span>No.</span>
        <span>Residence</span>
        <span>Bedrooms</span>
        <span>Interior</span>
        <span>Outside</span>
        <span>From</span>
        <span>Status</span>
      </div>

      <div className="res__list" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <div className={`res__float ${hover !== null && open === null ? 'is-on' : ''}`} aria-hidden>
          {residences.map((r, i) => (
            <div key={r.name} className={`res__float-img ${hover === i ? 'is-on' : ''}`}>
              <Image src={r.image} alt="" fill sizes="22vw" />
            </div>
          ))}
        </div>

        {list.map(({ r, i }) => (
          <article key={r.name} className={`res__row ${open === i ? 'is-open' : ''} ${r.left === 0 ? 'is-sold' : ''}`}>
            <span className="res__line" />
            <button
              type="button"
              className="res__summary"
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
              onPointerEnter={() => setHover(i)}
            >
              <span className="res__cell label">{String(i + 1).padStart(2, '0')}</span>
              <span className="res__cell res__name display">
                <span className="res__name-in">{r.name}</span>
              </span>
              <span className="res__cell">{r.beds}</span>
              <span className="res__cell">{r.interior} m²</span>
              <span className="res__cell res__outside">{r.outside}</span>
              <span className="res__cell">{r.price}</span>
              <span className="res__cell res__status label">{r.left === 0 ? 'Waiting list' : `${r.left} left`}</span>
              <span className="res__plus" aria-hidden />
            </button>
            <div className="res__detail" data-open={open === i} style={{ height: 0 }}>
              <div className="res__detail-in">
                <div className="res__detail-media media">
                  <Image src={r.image} alt={r.alt} fill sizes="(max-width: 760px) 90vw, 40vw" />
                </div>
                <div className="res__detail-text">
                  <p className="res__detail-lead display">{r.name}</p>
                  <p className="body-copy">{r.text}</p>
                  <dl className="res__specs">
                    <div>
                      <dt className="label">Bedrooms</dt>
                      <dd>{r.beds}</dd>
                    </div>
                    <div>
                      <dt className="label">Interior</dt>
                      <dd>{r.interior} m²</dd>
                    </div>
                    <div>
                      <dt className="label">Outside</dt>
                      <dd>{r.outside}</dd>
                    </div>
                    <div>
                      <dt className="label">From</dt>
                      <dd>{r.price}</dd>
                    </div>
                  </dl>
                  <a className="pill label" href="#visit">
                    {r.left === 0 ? 'Join the waiting list' : 'Request the floor plan'}
                    <svg viewBox="0 0 14 10" fill="none" stroke="currentColor">
                      <path d="M0 5 H13 M9 1 L13 5 L9 9" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
        <span className="res__line res__line--end" />
      </div>
    </section>
  );
}
