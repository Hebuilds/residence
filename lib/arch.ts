export type ArchRect = { l: number; t: number; w: number; b: number };

/** Arch outline as an SVG path: straight sides, semicircular top, flat base. */
export function archPath({ l, t, w, b }: ArchRect) {
  const r = w / 2;
  const spring = Math.min(t + r, b);
  return `M${l},${b} V${spring} A${r},${r} 0 0 1 ${l + w},${spring} V${b} Z`;
}
