/**
 * The opening preload. The loader waits for these jobs before it draws the
 * residence, so the type, the hero photograph and every 3D scene are built,
 * compiled and drawn once before a visitor can scroll to them.
 *
 * Scenes report in from inside their canvas (components/three/Ready.tsx) and
 * are mounted grounds first, then the rest (useWarmScene), so the heavy builds never
 * pile into a single long freeze.
 */

export type JobId = 'type' | 'photos' | 'grounds' | 'plan' | 'ring';

export const SCENES = ['grounds', 'plan', 'ring'] as const;
export type SceneJob = (typeof SCENES)[number];

/** weight: rough share of the wait, so the counter moves at an honest pace */
export const JOBS: { id: JobId; label: string; weight: number }[] = [
  { id: 'type', label: 'Setting the type', weight: 1 },
  { id: 'photos', label: 'Developing the photographs', weight: 2 },
  { id: 'grounds', label: 'Grading the terraces', weight: 4 },
  { id: 'plan', label: 'Furnishing the Terrace House', weight: 3 },
  { id: 'ring', label: 'Hanging the gallery', weight: 1 },
];

const TOTAL = JOBS.reduce((s, j) => s + j.weight, 0);
const ready = new Set<JobId>();
const listeners = new Set<() => void>();

export const isReady = (id: JobId) => ready.has(id);

export function markReady(id: JobId) {
  if (ready.has(id)) return;
  ready.add(id);
  // visible in the browser's performance panel: how long each part of the preload took
  performance.mark(`preload:${id}`);
  listeners.forEach((fn) => fn());
}

export function onPreloadChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** finished share of the work, 0..1 */
export function preloadProgress() {
  let got = 0;
  for (const j of JOBS) if (ready.has(j.id)) got += j.weight;
  return got / TOTAL;
}

/** the first job still running, and its share of the whole */
export function currentJob() {
  const job = JOBS.find((j) => !ready.has(j.id));
  return job ? { ...job, share: job.weight / TOTAL } : null;
}
