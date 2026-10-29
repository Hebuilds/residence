import type Lenis from 'lenis';

// Module level handle so the loader and menu can pause smooth scroll.
export const scroll: { lenis: Lenis | null } = { lenis: null };

export function scrollToHash(hash: string) {
  const el = document.querySelector(hash);
  if (!el) return;
  if (scroll.lenis) scroll.lenis.scrollTo(el as HTMLElement, { duration: 1.6 });
  else el.scrollIntoView({ behavior: 'smooth' });
}
