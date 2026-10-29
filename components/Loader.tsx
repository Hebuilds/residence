'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useIntro } from '@/components/providers/Providers';
import ElevationDrawing from '@/components/ui/ElevationDrawing';
import { archPath, type ArchRect as Rect } from '@/lib/arch';
import { currentJob, markReady, preloadProgress } from '@/lib/preload';

/** the preload never shows for less than this, so a fast connection does not see a flash */
const PREP_MIN = 1400;
/** and never holds anyone longer than this; anything unfinished keeps loading behind the page */
const PREP_MAX = 15000;

const pad = (v: number) => String(Math.round(v * 100)).padStart(3, '0');

function whenLoaded(img: HTMLImageElement) {
  if (img.complete) return Promise.resolve();
  return new Promise<void>((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

export default function Loader() {
  const { setPhase } = useIntro();
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const task = useRef<HTMLSpanElement>(null);
  const horizon = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const outline = useRef<SVGPathElement>(null);
  const [hidden, setHidden] = useState(false);
  const [portrait, setPortrait] = useState(false);

  useLayoutEffect(() => {
    setPortrait(window.innerWidth / window.innerHeight < 0.8);
  }, []);

  useGSAP(
    () => {
      let alive = true;
      const el = root.current!;
      const heroEl = document.querySelector<HTMLElement>('[data-hero]');
      const media = document.querySelector<HTMLElement>('[data-hero-media]');
      const veil = document.querySelector<HTMLElement>('[data-hero-veil]');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // ---- 0a. the work itself: type, the hero photograph, and (from their own sections) every 3D scene ----
      Promise.resolve(document.fonts?.ready).then(() => markReady('type'));
      const photo = media?.querySelector('img');
      if (photo) {
        whenLoaded(photo)
          // decode waits for a rendering opportunity; never let it hold the preload
          .then(() => Promise.race([photo.decode(), new Promise((r) => setTimeout(r, 1500))]))
          .catch(() => {})
          .finally(() => markReady('photos'));
      } else markReady('photos');

      const finish = () => {
        if (!alive) return;
        // Inline 'none' beats the is-loading CSS for the frame before the class is removed.
        if (heroEl) heroEl.style.clipPath = 'none';
        if (veil) veil.style.height = '0px';
        heroEl?.removeAttribute('data-intro');
        setPhase('done');
        setHidden(true);
      };

      if (reduce || !heroEl || !media || !veil) {
        setPhase('reveal');
        finish();
        return;
      }

      heroEl.setAttribute('data-intro', '');
      const svg = el.querySelector<SVGSVGElement>('.loader__drawing')!;
      const sun = el.querySelector<SVGCircleElement>('.loader__sun')!;
      const arch = el.querySelector<SVGPathElement>('#loader-arch')!;
      const q = (s: string) => gsap.utils.toArray<SVGElement>(svg.querySelectorAll(s));
      // the terrace line the house stands on: the preload grows it, the drawing carries on from it
      const terrace = q('[data-stage="0"] > *').slice(0, 2);

      gsap.to(el.querySelectorAll('.loader__meta > *'), { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'settle', delay: 0.15 });

      // ---- 1. draw the house, centre first, wings extending outward (waits for the preload) ----
      const draw = gsap.timeline({ paused: true, defaults: { strokeDashoffset: 0, ease: 'power2.inOut' } });
      draw
        .to(q('[data-stage="0"] > *'), { duration: 1.1, stagger: 0.05 }, 0)
        .to(q('[data-stage="1"] > *'), { duration: 0.9, stagger: 0.07 }, 0.3)
        .to(q('[data-stage="hills"] > *'), { duration: 1.8, stagger: 0.2, ease: 'power1.inOut' }, 0.5)
        .to(q('[data-stage="2"] > *'), { duration: 0.7, stagger: 0.05 }, 0.85)
        .to(q('[data-stage="3"] > *'), { duration: 0.7, stagger: 0.05 }, 1.2)
        .to(q('[data-stage="4"] > *'), { duration: 0.8, stagger: 0.06 }, 1.5)
        .to(q('[data-stage="5"] > *'), { duration: 0.8, stagger: 0.08 }, 1.8);

      // ---- 0b. the preload: the terrace line grows from the centre as the work lands ----
      const line = horizon.current!;
      const bar = fill.current!;
      const place = () => {
        const a = terrace[0].getBoundingClientRect();
        const b = terrace[1].getBoundingClientRect();
        const k = svg.getScreenCTM()?.a ?? 1;
        const thick = Math.max(1, (parseFloat(getComputedStyle(terrace[0]).strokeWidth) || 1) * k);
        const left = Math.min(a.left, b.left);
        line.style.left = `${left}px`;
        line.style.width = `${Math.max(a.right, b.right) - left}px`;
        line.style.top = `${a.top - thick / 2}px`;
        line.style.height = `${thick}px`;
      };
      window.addEventListener('resize', place);

      const prep = { shown: 0, job: '', since: performance.now(), ticks: 0 };
      const started = performance.now();
      let prepared = false;
      const prepTick = (_time: number, deltaMs: number) => {
        // the drawing switches to its portrait framing after the first render, so measure on the first ticks
        if (prep.ticks++ < 3) place();
        const now = performance.now();
        const job = currentJob();
        if ((job?.id ?? '') !== prep.job) {
          prep.job = job?.id ?? '';
          prep.since = now;
          if (task.current) task.current.textContent = job ? job.label : 'Ready';
        }
        // inside a long job, creep toward most of its share so the line never sits dead still
        const creep = job ? job.share * 0.85 * (1 - Math.exp(-(now - prep.since) / 2200)) : 0;
        const target = Math.min(1, preloadProgress() + creep);
        // a CSS transition carries the line, so it keeps moving even while a scene build holds the main thread
        bar.style.transform = `scaleX(${target})`;
        prep.shown += (target - prep.shown) * (1 - Math.exp(-deltaMs / 240));
        if (!job && prep.shown > 0.995) prep.shown = 1;
        if (counter.current) counter.current.textContent = pad(prep.shown);
        const elapsed = now - started;
        if (!prepared && ((prep.shown === 1 && elapsed > PREP_MIN) || elapsed > PREP_MAX)) {
          prepared = true;
          gsap.ticker.remove(prepTick);
          gsap.delayedCall(0.25, beginDrawing);
        }
      };
      gsap.ticker.add(prepTick);

      function beginDrawing() {
        if (!alive) return;
        window.removeEventListener('resize', place);
        bar.style.transition = 'none';
        bar.style.transform = 'scaleX(1)';
        // hand the line over to the drawing: the same stroke, now part of the house
        gsap.set(terrace, { strokeDashoffset: 0 });
        gsap.set(line, { autoAlpha: 0 });
        if (task.current) task.current.textContent = 'Drawing the residence';
        if (counter.current) counter.current.textContent = '000';
        draw.play();
        gsap.ticker.add(tick);
      }

      // ---- 2. the counter and sun ring follow the drawing ----
      let shown = 0;
      let revealing = false;
      const tick = (_time: number, deltaMs: number) => {
        const target = draw.progress();
        shown += (target - shown) * (1 - Math.exp(-deltaMs / 220));
        if (target === 1 && shown > 0.996) shown = 1;
        if (counter.current) counter.current.textContent = pad(shown);
        sun.style.strokeDashoffset = String(1 - shown);
        if (shown === 1 && !revealing) {
          revealing = true;
          gsap.ticker.remove(tick);
          gsap.delayedCall(0.25, reveal);
        }
      };

      // ---- 3. the arch fills with the photograph, then opens to the room ----
      function reveal() {
        if (!alive || !heroEl || !media || !veil) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const a = arch.getBoundingClientRect();
        const r: Rect = { l: a.left, t: a.top, w: a.width, b: a.bottom };
        const W = Math.max(vw, vh) * 1.9;
        const end: Rect = { l: (vw - W) / 2, t: -W / 2 - 60, w: W, b: vh + 2 };

        const apply = () => {
          heroEl.style.clipPath = `path('${archPath(r)}')`;
          outline.current?.setAttribute('d', archPath({ l: r.l - 12, t: r.t - 12, w: r.w + 24, b: r.b }));
        };
        apply();
        gsap.set(veil, { height: a.bottom });
        gsap.set(media, { scale: 1.4, transformOrigin: `50% ${((a.top + a.height * 0.6) / vh) * 100}%` });
        gsap.set(outline.current, { opacity: 0 });

        const cx = a.left + a.width / 2;
        const cy = a.top + a.height / 2;

        gsap
          .timeline({ onComplete: finish })
          .to(q('[data-stage]:not([data-keep])'), { opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.02 }, 0)
          .to(el.querySelectorAll('.loader__meta > *'), { opacity: 0, y: -8, duration: 0.5, stagger: 0.04 }, 0)
          .to(outline.current, { opacity: 1, duration: 0.6 }, 0.2)
          .to(veil, { height: a.top, duration: 1.15, ease: 'sharp' }, 0.2)
          .add(() => setPhase('reveal'), 1.25)
          .to(
            r,
            {
              ...end,
              duration: 1.6,
              ease: 'sharp',
              onUpdate: () => {
                apply();
                // nothing inside the arch sits above its crown, so the veil follows the crown up and out
                veil.style.height = `${Math.max(0, r.t)}px`;
              },
            },
            1.3,
          )
          .to(media, { scale: 1, duration: 1.8, ease: 'sharp' }, 1.2)
          .to(svg, { scale: 1.6, opacity: 0, transformOrigin: `${cx}px ${cy}px`, duration: 1.3, ease: 'sharp' }, 1.3)
          .to(outline.current, { opacity: 0, duration: 0.5 }, 2.3)
          .to(el, { backgroundColor: 'rgba(243,240,233,0)', duration: 0.3 }, 2.6);
      }

      return () => {
        alive = false;
        window.removeEventListener('resize', place);
        gsap.ticker.remove(prepTick);
        gsap.ticker.remove(tick);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className="loader" style={hidden ? { display: 'none' } : undefined} aria-hidden>
      <ElevationDrawing className="loader__drawing" portrait={portrait} />

      <div ref={horizon} className="loader__horizon">
        <span ref={fill} className="loader__horizon-fill" />
      </div>

      <svg className="loader__outline" aria-hidden>
        <path ref={outline} fill="none" stroke="currentColor" strokeWidth={1} />
      </svg>

      <div className="loader__meta">
        <span className="loader__brand display">Ituze Residence</span>
        <span className="loader__coords label">1°42′ S · 29°15′ E</span>
        <span className="loader__place label">Lake Kivu · Rubavu</span>
        <span className="loader__count label">
          <span ref={task}>Preparing</span>
          <span ref={counter} className="loader__num">
            000
          </span>
        </span>
      </div>
    </div>
  );
}
