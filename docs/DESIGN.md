# ITUZE Residence · design notes

A light, classic real estate site in the language of era-residence.com, with the
image-ring and list interactions of Atelier Meridian, rebuilt from scratch.

**Ituze** means *calm* in Kinyarwanda. The development is fictional: 38 residences
stepped down a hillside above Gisenyi (Rubavu), on the north shore of Lake Kivu.
All copy lives in `lib/content.ts` so the place, brand and numbers can be swapped.

## What we borrowed, and what we changed

| Reference | Mechanic | Ituze version |
| --- | --- | --- |
| ERA loader | plum field, an arch window rises with the photo inside and grows to fill the screen | paper field; a preload first grows the terrace line from the centre while the 3D scenes are built offscreen ("Grading the terraces", "Furnishing the Terrace House"), then an ink elevation of the residence **draws itself outward from the centre** (the house extending), a sun ring counts the load, then the central arch fills with the hero photo and opens to full screen |
| ERA hero | giant condensed didone, script place name, split tagline | ITUZE / RESIDENCE, script *Lake Kivu* written stroke by stroke, "Where the hills · meet the water" |
| ERA "New Golden Mile" | pinned horizontal rail of words and photos | "A day at Ituze": 06:40 to 21:00, a live clock and timeline as you scroll sideways |
| ERA coastline | squiggle coastline with towns and drive times | Lake Kivu shoreline drawn on scroll, Gisenyi, Rubona, Volcanoes N.P., Kigali |
| ERA sky to mountains | clouds at the section edge | a procedural cloud bank (WebGL, drifting right to left) replaces the hard line into the view; it parts on scroll over a zoomed out lake, and a lower mist bank hands back to paper |
| ERA hero sky | title set in the clouds | title sits in a deep blue sky; the photograph is graded (a gentle darkening, deeper at the top and the foot) so the white type always reads in front |
| ERA "The space to" | arch shape grows over an interior | arch mask grows from a doorway to full bleed, words part around it |
| Atelier list | series list with image preview | residences list with cursor image and expanding detail |
| Atelier strip | scroll linked horizontal strip | materials strip: basalt, lime, eucalyptus, terracotta, agaseke weave |
| Atelier ring | 3D ellipse of images around a CTA | Three.js ring of photographs around "Book a private visit" |
| (new) | | **Three.js masterplan**: lawn terraces with basalt walls, 38 detailed villas (framed glazing, pergolas, bougainvillea, plunge pools, roof terraces), stair, pavilion, lap pool, jacaranda and palm trees, people, Kivu fishing boats, birds, animated water, baked occlusion (screen space AO and bloom on strong GPUs); windows glow at 17:30 |
| (new) | | **Painted jacaranda branches** in the section corners: they grow on entry, unfurl fern leaves, open lavender trumpets that glow softly, sway, and drop a flower now and then |
| (new) | | **Floor plan that draws in lines, extrudes into 3D walls, then furnishes itself** (oak floors, sofa, beds, kitchen island, pendants, pergola) |

## System

- **Palette**: paper `#F3F0E9`, sand `#E7E1D5`, ink `#15233A`, mist `#C5D5DD`, jacaranda `#7B6AAE` (petals only).
- **Type**: Melodrama (condensed didone, Fontshare) for display, Great Vibes for the
  script, Archivo at 125 width for labels and Archivo normal for reading text.
- **Line**: everything drawn is 1px ink, the same weight as the type hairlines.
- **Motion**: Lenis smooth scroll, GSAP ScrollTrigger. Ease `sharp` = cubic-bezier(.75,0,.25,1)
  for wipes, `expo.out` for reveals. Text enters from under a mask, never fades alone.
- **Copy**: no em or en dashes, no hyphenated compounds. Use "·" or rewrite.
- **Performance**: 60 fps on phone class GPUs is a requirement, not a nice to have. New 3D
  work goes through the tiers in `lib/gpu.ts`, renders only while visible, and is timed with
  `window.__bench` before it ships. See the README for the budget.

## Stand-ins

Phone, email, prices and the developer are placeholders. Photography is from Unsplash
(free licence) and is illustrative, not the actual site.
