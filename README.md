# Ituze Residence

A light, editorial real estate site for a fictional development of 38 homes above
Lake Kivu, built in the spirit of era-residence.com and Atelier Meridian.
Next.js 16, React 19, GSAP + ScrollTrigger + SplitText, Lenis, Three.js via
React Three Fiber.

```bash
npm install
npm run dev -- --port 3210
```

Then open http://localhost:3210.

## What happens as you scroll

| # | Section | File | What it does |
| --- | --- | --- | --- |
| | Loader | `components/Loader.tsx`, `components/ui/ElevationDrawing.tsx`, `lib/preload.ts` | First the terrace line grows from the centre while the type, the hero photo and all three 3D scenes are built and drawn once offscreen, naming each job as it goes. Then the ink elevation of the residence draws itself on that line, and the central arch fills with the photo and opens to full screen. |
| | Hero | `components/sections/Hero.tsx` | Title rises letter by letter over a graded photograph, *Lake Kivu* is written stroke by stroke. |
| 01 | The residence | `Manifesto.tsx`, `components/ui/Blossom.tsx` | Words brighten as you read; painted jacaranda branches grow into the corners, flower, glow and drop the odd blossom. |
| 02 | A day at Ituze | `DayRail.tsx` | Pinned horizontal rail, 06:40 to 21:00, with a live clock and sun arc. |
| 03 | Location | `Location.tsx` | Lake Kivu's north shore drawn on scroll with drive times. |
| | The view | `Panorama.tsx` | Pull back from the clouds to the whole lake. |
| 04 | The grounds | `Grounds.tsx`, `components/three/Masterplan.tsx` | A white clay site model built in code: contour terraces, 38 houses, pool, pavilion, jetty. Four camera stops and a sun study. |
| 05 | The space to breathe | `Space.tsx` | A doorway arch grows until the room fills the screen. |
| 06 | Interiors | `Interiors.tsx` | Editorial grid with parallax and mask reveals. |
| 07 | Inside the Terrace House | `Plan.tsx`, `components/three/PlanHouse.tsx` | The floor plan draws in ink as the section rises, then (pinned) walls extrude into 3D and furniture and light arrive. |
| 08 | Select a residence | `Residences.tsx` | Filterable list, cursor image preview, expanding detail rows. |
| 09 | Architecture | `Architecture.tsx` | Big word reveal, then a materials strip that drifts sideways, including a procedural Imigongo panel. |
| 10 | Book a visit | `Visit.tsx`, `components/three/PhotoRing.tsx` | Photographs orbit the call to action in 3D. |

## Performance

Every 3D and cloud layer is built to hold 60 fps on phones and older laptops. The test
machine is an Intel UHD 620 laptop, which the site treats as a phone class GPU.

- **Quality tiers** (`lib/gpu.ts`): the GPU is read once and sorted into low, mid or high.
  Tiers set the resolution ceiling, a pixel budget per frame, the shadow type and size,
  whether ambient occlusion and bloom run (high only) and the cloud resolution and frame rate.
- **Adaptive resolution** (`components/three/perf.tsx`): each canvas starts inside its
  pixel budget, then drei's PerformanceMonitor lowers or raises resolution with the frame rate.
- **Built before you arrive**: the opening loader mounts the grounds, then the floor plan and the
  photo ring, and waits until each has compiled its shaders and drawn a frame
  (`components/three/Ready.tsx`). The plan's first frame is fully furnished so nothing compiles
  mid scroll. The wait is capped at 15 seconds; anything unfinished keeps loading behind the page.
- **Render only when seen**: scenes mount once you come near and render continuously only
  while on screen (`components/ui/useNearViewport.ts`). Shadow maps redraw only when the sun
  or the build animation moves.
- **Cheap materials, baked light**: Lambert and Phong materials, ambient occlusion baked into
  vertex colours, geometry merged per material, furniture merged per item.
- **Blossoms**: canvas 2D with cached sprites. While a branch grows, finished pieces go to a
  cache so a frame redraws only what is still moving (about 1 ms). Once bloomed it is a still
  image plus a small sparkle layer; sway and glow are CSS animations.

Cost per frame on the UHD 620 at 1440 × 900, GPU included: grounds about 11 ms, floor plan
about 5 ms, photo ring about 2 ms, each cloud layer under 1 ms, a growing blossom about 1 ms.
In development, `window.__bench` and `window.__blossom` expose these timings.

## Editing

- **All copy, prices and contacts**: `lib/content.ts`.
- **Script words** (the handwritten ones) are real glyph outlines. To add a word, put it in
  `WORDS` in `scripts/build-script-paths.mjs` and run `npm run script-paths`.
- **Design rules**: `docs/DESIGN.md`.

## Stand-ins

Ituze, Atelier Kivu, the phone number, email, prices and availability are placeholders.
Photographs are from Unsplash (free licence) and are illustrative. Display type is
Melodrama from Fontshare (free for commercial use); script is Great Vibes and body type
is Archivo, both from Google Fonts.
