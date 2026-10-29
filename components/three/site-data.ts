// Camera shots and hotspots for the masterplan tour. Kept free of three.js so the
// page can import it without pulling the 3D bundle forward.

// Where each step of the tour looks. Camera positions are tuned by eye.
export const SHOTS = [
  { pos: [40, 31, 47], target: [0, 1.2, -3] },
  { pos: [25, 14.5, 24], target: [5, 1.8, -2.5] },
  { pos: [-31, 18, 14], target: [-13, 3, -8.5] },
  { pos: [30, 9, 38], target: [8, 0.6, 11] },
] as const;

export const HOTSPOTS = [
  { label: 'The hillside', pos: [-3, 4.8, -7] },
  { label: 'Pool terrace', pos: [6, 2.9, -1.6] },
  { label: 'The pavilion', pos: [-14, 4.9, -9] },
  { label: 'The jetty', pos: [10.5, 0.9, 19] },
] as const;
