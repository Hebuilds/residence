// Converts script words into SVG glyph outlines so they can be "written" with
// stroke-dashoffset, then filled. Run with `npm run script-paths`.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import opentype from 'opentype.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const font = opentype.parse(readFileSync(join(root, 'scripts/fonts/GreatVibes-Regular.ttf')).buffer);

const WORDS = ['Lake Kivu', 'yours', 'breathe', 'slowly', 'come home', 'calm', 'with light'];
const SIZE = 200;

// opentype's own toPathData emits NaN for some implied points in this font, so serialise by hand.
const n = (v) => Math.round(v * 10) / 10;
function toD(commands) {
  return commands
    .map((c) => {
      if (c.type === 'M' || c.type === 'L') return `${c.type}${n(c.x)} ${n(c.y)}`;
      if (c.type === 'Q') return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
      if (c.type === 'C') return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
      return 'Z';
    })
    .join('');
}

const out = {};
// Lay glyphs out by hand: opentype's shaper trips over this font's GSUB tables.
function layout(text) {
  const scale = SIZE / font.unitsPerEm;
  let x = 0;
  let prev = null;
  const paths = [];
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    if (prev) x += font.getKerningValue(prev, g) * scale;
    paths.push(g.getPath(x, SIZE, SIZE));
    x += g.advanceWidth * scale;
    prev = g;
  }
  return paths;
}

for (const word of WORDS) {
  const paths = layout(word);
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  const glyphs = [];
  for (const p of paths) {
    const d = p.commands.length ? toD(p.commands) : '';
    if (!d) continue;
    const b = p.getBoundingBox();
    x1 = Math.min(x1, b.x1); y1 = Math.min(y1, b.y1);
    x2 = Math.max(x2, b.x2); y2 = Math.max(y2, b.y2);
    glyphs.push(d);
  }
  const pad = 6;
  out[word] = {
    viewBox: [x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2].map((n) => Math.round(n)),
    glyphs,
  };
}

writeFileSync(join(root, 'lib/script-paths.json'), JSON.stringify(out));
console.log('wrote', Object.keys(out).length, 'words');
