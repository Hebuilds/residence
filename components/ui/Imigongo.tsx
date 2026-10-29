import { mulberry32 } from '@/lib/random';

/**
 * A panel in the manner of Imigongo, the raised geometric relief of eastern Rwanda:
 * nested diamonds and zigzag bands in black, chalk white and ochre red.
 */
const COLORS = ['#1a1714', '#efe8da', '#9a3b22'];

export default function Imigongo({ seed = 3, className }: { seed?: number; className?: string }) {
  const rnd = mulberry32(seed);
  const cols = 3;
  const rows = 4;
  const cw = 100 / cols;
  const ch = 132 / rows;
  const shapes: { d: string; fill: string }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw;
      const y = r * ch;
      const cx = x + cw / 2;
      const cy = y + ch / 2;
      const kind = (r + c) % 2 === 0 ? 'diamond' : rnd() < 0.5 ? 'zigzag' : 'chevron';
      const base = Math.floor(rnd() * 3);
      shapes.push({ d: `M${x} ${y} h${cw} v${ch} h${-cw} Z`, fill: COLORS[base] });
      if (kind === 'diamond') {
        for (let k = 0; k < 4; k++) {
          const s = 1 - k * 0.24;
          shapes.push({
            d: `M${cx} ${cy - (ch / 2) * s} L${cx + (cw / 2) * s} ${cy} L${cx} ${cy + (ch / 2) * s} L${cx - (cw / 2) * s} ${cy} Z`,
            fill: COLORS[(base + k + 1) % 3],
          });
        }
      } else if (kind === 'zigzag') {
        const bands = 5;
        for (let k = 0; k < bands; k++) {
          const by = y + (k * ch) / bands;
          const bh = ch / bands;
          let d = `M${x} ${by + bh}`;
          const teeth = 4;
          for (let t = 0; t <= teeth * 2; t++) d += ` L${x + (t * cw) / (teeth * 2)} ${by + (t % 2 ? bh * 0.15 : bh)}`;
          d += ` L${x + cw} ${by + bh} Z`;
          shapes.push({ d, fill: COLORS[(base + k + 1) % 3] });
        }
      } else {
        for (let k = 0; k < 4; k++) {
          const off = (k * ch) / 4;
          shapes.push({
            d: `M${x} ${y + off} L${cx} ${y + off + ch * 0.22} L${x + cw} ${y + off} L${x + cw} ${y + off + ch * 0.1} L${cx} ${y + off + ch * 0.32} L${x} ${y + off + ch * 0.1} Z`,
            fill: COLORS[(base + k + 1) % 3],
          });
        }
      }
    }
  }

  return (
    <svg className={className} viewBox="0 0 100 132" preserveAspectRatio="xMidYMid slice" aria-label="Imigongo pattern panel" role="img">
      {shapes.map((s, i) => (
        <path key={i} d={s.d} fill={s.fill} />
      ))}
      <rect width="100" height="132" fill="none" stroke="#1a1714" strokeWidth="1.2" />
    </svg>
  );
}
