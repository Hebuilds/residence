'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { settings as gpuSettings } from '@/lib/gpu';

/**
 * Procedural clouds drawn in a fragment shader: domain warped fractal noise,
 * lit from above, drifting right to left. Three modes:
 *  - 'bank-top'    solid paper at the top edge that breaks into billows below it
 *  - 'bank-bottom' the same, rising from the bottom edge
 *  - 'sky'         loose clouds floating in the middle of the canvas
 * `progress` (0..1) thins and lifts a bank, so scroll can part the clouds.
 */

type Mode = 'bank-top' | 'bank-bottom' | 'sky';

type Props = {
  className?: string;
  mode: Mode;
  progress?: MutableRefObject<number>;
  scale?: number;
  cover?: number;
  speed?: number;
  seed?: number;
  /** clouds thin out toward the horizontal centre, to keep a title clear */
  clearCenter?: number;
  shadow?: [number, number, number];
};

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSeed;
uniform float uScale;
uniform float uCover;
uniform float uProg;
uniform float uMode;
uniform float uClear;
uniform vec3 uPaper;
uniform vec3 uLight;
uniform vec3 uShadow;

// hash without sine (Dave Hoskins): cheaper and steadier than sin() on mobile GPUs
vec2 hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y);
}

const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);

float fbm4(vec2 p) {
  float v = 0.5 * noise(p); p = ROT * p;
  v += 0.25 * noise(p); p = ROT * p;
  v += 0.125 * noise(p); p = ROT * p;
  v += 0.0625 * noise(p);
  return v;
}

float fbm3(vec2 p) {
  float v = 0.5 * noise(p); p = ROT * p;
  v += 0.25 * noise(p); p = ROT * p;
  v += 0.125 * noise(p);
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float e = 1.0;
  if (uMode < 1.5) {
    e = uMode < 0.5 ? 1.0 - uv.y : uv.y;
    // solid paper at the edge and empty sky past the furthest lobe need no noise at all
    if (e < 0.05 * (1.0 - uProg * 0.6)) { gl_FragColor = vec4(uPaper, 1.0); return; }
    if (e > mix(0.95, 0.46, uProg) * 1.3) { gl_FragColor = vec4(0.0); return; }
  } else if (uv.y < 0.02 || uv.y > 0.98) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec2 p = vec2(uv.x * aspect, uv.y) * uScale + vec2(uSeed, uSeed * 0.37);
  vec2 wind = vec2(uTime, 0.0);
  // one domain warp shared by the density and the lighting sample
  vec2 q = vec2(fbm3(p * 0.55 + wind * 0.5), fbm3(p * 0.55 + vec2(3.1, 7.4) - wind * 0.25));
  vec2 w = p + q * 1.5 + wind;
  float n = fbm4(w) * 0.5 + 0.5;
  float nUp = fbm4(w + vec2(0.0, 0.07)) * 0.5 + 0.5;
  float alpha;

  if (uMode < 1.5) {
    // banks: e is the distance from the solid edge (0 at the edge, 1 at the far side)
    // big slow lobes along the edge so the bank reads as cumulus, not a torn strip
    float lobes = fbm3(vec2(uv.x * aspect * 1.1 + uTime * 0.7 + uSeed, uSeed * 1.3)) * 0.5 + 0.5;
    float reach = mix(0.95, 0.46, uProg) * (0.42 + 0.85 * lobes);
    float base = 1.0 - smoothstep(0.0, reach, e);
    float nc = smoothstep(0.28, 0.72, n);
    float d = nc * 0.95 + base * 0.95 - 0.8;
    alpha = smoothstep(0.0, 0.2, d);
    alpha = max(alpha, 1.0 - smoothstep(0.0, 0.13 * (1.0 - uProg * 0.4), e));
  } else {
    float band = smoothstep(0.0, 0.3, uv.y) * (1.0 - smoothstep(0.7, 1.0, uv.y));
    float centre = mix(1.0 - uClear, 1.0, smoothstep(0.08, 0.42, abs(uv.x - 0.5)));
    float d = n - (1.0 - uCover) * 0.6 - 0.28 + band * 0.12;
    alpha = smoothstep(0.0, 0.26, d) * band * centre;
  }

  // lit from above: brighter where the cloud thins toward the light
  float shade = clamp(0.62 + (n - nUp) * 7.0, 0.0, 1.0);
  vec3 col = mix(uShadow, uLight, shade);
  if (uMode < 1.5) col = mix(col, uPaper, 1.0 - smoothstep(0.0, 0.32, e));
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

const MODE: Record<Mode, number> = { 'bank-top': 0, 'bank-bottom': 1, sky: 2 };
// Pass shadow colours as module constants: a new array each render would rebuild the GL context.
const SKY_SHADOW: [number, number, number] = [0.8, 0.84, 0.88];

export default function CloudLayer({
  className,
  mode,
  progress,
  scale = 2.4,
  cover = 0.5,
  speed = 0.035,
  seed = 3,
  clearCenter = 0,
  shadow = SKY_SHADOW,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current!;
    const gl = el.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u('uRes');
    const uTime = u('uTime');
    const uProg = u('uProg');
    gl.uniform1f(u('uSeed'), seed);
    gl.uniform1f(u('uScale'), scale);
    gl.uniform1f(u('uCover'), cover);
    gl.uniform1f(u('uMode'), MODE[mode]);
    gl.uniform1f(u('uClear'), clearCenter);
    gl.uniform3f(u('uPaper'), 243 / 255, 240 / 255, 233 / 255);
    gl.uniform3f(u('uLight'), 0.99, 0.99, 0.985);
    gl.uniform3f(u('uShadow'), shadow[0], shadow[1], shadow[2]);

    const budget = gpuSettings().clouds;
    const frameGap = 1000 / budget.fps - 2;
    // Clouds are soft, so render well below screen resolution and let the browser scale up.
    const fit = () => {
      // a fraction of CSS pixels, never device pixels: clouds are soft, the browser upscales smoothly
      const k = budget.res;
      el.width = Math.max(2, Math.round(el.clientWidth * k));
      el.height = Math.max(2, Math.round(el.clientHeight * k));
      gl.viewport(0, 0, el.width, el.height);
      gl.uniform2f(uRes, el.width, el.height);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = false;
    let raf = 0;
    let last = performance.now();
    let t = seed * 10;
    const frame = (now: number) => {
      if (now - last < frameGap) {
        if (visible) raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!reduce) t += dt * speed;
      gl.uniform1f(uTime, t);
      gl.uniform1f(uProg, progress?.current ?? 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (visible) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was) {
        last = performance.now() - 1000;
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(el);
    frame(performance.now());

    // development only: synchronous cost per frame, see components/three/Bench.tsx
    const benchKey = `clouds-${mode}-${seed}`;
    if (process.env.NODE_ENV !== 'production') {
      window.__bench ??= {};
      window.__bench[benchKey] = {
        run: (frames = 60) => {
          const px = new Uint8Array(4);
          const t0 = performance.now();
          for (let i = 0; i < frames; i++) {
            gl.uniform1f(uTime, t + i * 0.01);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
          }
          return { ms: Math.round(((performance.now() - t0) / frames) * 100) / 100, calls: 1, triangles: el.width * el.height };
        },
      };
    }

    return () => {
      delete window.__bench?.[benchKey];
      visible = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      // Free GPU objects but keep the context: React's dev double mount reuses this canvas.
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [mode, scale, cover, speed, seed, clearCenter, progress, shadow]);

  return <canvas ref={canvas} className={className} aria-hidden />;
}
