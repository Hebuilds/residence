/**
 * One read of the device decides how hard the 3D and cloud layers may work.
 *  - high: discrete or Apple silicon desktop GPUs, gets ambient occlusion and bloom
 *  - mid: capable integrated GPUs
 *  - low: phones, tablets and older integrated GPUs (Intel UHD / HD)
 * Within a tier, resolution follows a pixel budget (so a small phone screen can
 * render sharper than a large laptop screen), and PerformanceMonitor trims it
 * further at runtime if frames are slow.
 */

export type Tier = 'low' | 'mid' | 'high';

let cached: { tier: Tier; renderer: string } | null = null;

export function gpuInfo() {
  if (cached) return cached;
  if (typeof window === 'undefined') return { tier: 'mid' as Tier, renderer: '' };
  let renderer = '';
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    renderer = '';
  }
  const r = renderer.toLowerCase();
  const touch = window.matchMedia('(pointer: coarse)').matches || /android|iphone|ipad|mobile/i.test(navigator.userAgent);
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

  let tier: Tier = 'mid';
  if (touch || memory <= 4 || /mali|adreno|powervr|apple gpu|swiftshader|llvmpipe|basic render/.test(r)) tier = 'low';
  else if (/intel.*(uhd|hd graphics)/.test(r)) tier = 'low';
  else if (/nvidia|geforce|rtx|gtx|quadro|radeon (rx|pro)|amd radeon|apple m\d/.test(r)) tier = 'high';
  cached = { tier, renderer };
  return cached;
}

type TierSettings = {
  /** most device pixels we will ever render per CSS pixel */
  maxDpr: number;
  /** pixels per frame the GPU can shade comfortably at 60 fps */
  pixelBudget: number;
  shadowMap: number;
  /** VSM samples once per pixel; PCF nine times but with crisper contact */
  shadowType: 'vsm' | 'pcf';
  post: boolean;
  clouds: { res: number; fps: number };
};

export const tierSettings: Record<Tier, TierSettings> = {
  high: { maxDpr: 2, pixelBudget: 3.2e6, shadowMap: 2048, shadowType: 'pcf', post: true, clouds: { res: 0.5, fps: 60 } },
  mid: { maxDpr: 1.5, pixelBudget: 1.6e6, shadowMap: 2048, shadowType: 'vsm', post: false, clouds: { res: 0.42, fps: 60 } },
  low: { maxDpr: 1.5, pixelBudget: 0.9e6, shadowMap: 1024, shadowType: 'vsm', post: false, clouds: { res: 0.34, fps: 30 } },
};

export const settings = () => tierSettings[gpuInfo().tier];

/** Resolution range for a canvas of the given CSS size: [floor, ceiling]. */
export function dprRange(width: number, height: number): [number, number] {
  if (typeof window === 'undefined') return [1, 1];
  const t = settings();
  const fit = Math.sqrt(t.pixelBudget / Math.max(1, width * height));
  const max = Math.max(0.6, Math.min(window.devicePixelRatio, t.maxDpr, fit));
  return [Math.max(0.5, max * 0.7), max];
}
