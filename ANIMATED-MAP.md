# Animated map

Which animations work on which icon families, and how every family in `@fractaldesign/icons` gets an animated parallel. Generated 2026-10-08 by `tools/animation-census`; every number below was measured in Chrome, none is estimated. Re-run it with `pnpm --filter @fractaldesign/animation-census all`.

## The short version

1. **All 34 families can be animated without generating a single new file.** The census ran the real `AnimatedIcon` on the data modules of `@fractaldesign/icons`, family by family, and every family ran. The one exception is Material Line Icons, which already animates itself.
2. **Parity today:** 11 of the 34 `icons` families have a parallel set in `icons-animated`; every animated set now has its static families in `icons`, and every `icons` family can be animated through the bridge.
3. **What works on a family depends on four things, all measurable**: whether it draws strokes or fills, its grid size, whether its shapes carry their own transform or opacity, and whether its colours are fixed.
4. **The first census found three problems in the templates and one in the generator.** Phase 0 fixed them, and the numbers below are measured after the fix: `glitch` is visible on 33 of 33 families (it was on 0), no template moves content out of an icon's box on any family except `drop`, which is size-dependent by design (`assemble` travelled 1.9× the icon on 24 grids, `wave` 0.8×), and the worst end-state difference on icons with their own transform or opacity is 0% and 0% (it was 39% and 83%). The generator had been deleting stroked outline rectangles: 295 icons (Phosphor regular and light, 7 Ionicons) were missing a real shape.

### Progress

| Phase | What | Status | Tests |
| --- | --- | --- | --- |
| 0 | Templates and generator work on every icon | **done** | e2e `tests/phase0-templates.e2e.ts` (42), unit `scripts/transform.test.mjs` (7) |
| 1 | `AnimatedIcon` takes an icon from `@fractaldesign/icons` | **done** | e2e `tests/phase1-bridge.e2e.ts` |
| 2 | Per-family guidance as data, and a docs page per family | **done** | e2e `tests/phase2-families.e2e.ts` |
| 3 | Parity: the missing families in `icons`, one Heroicons release | **done** | e2e `tests/phase3-parity.e2e.ts` |

## How it was measured

- **Structure of every icon** (35,400 of them): each body is rendered in a real browser and the resolved paint of every shape is read: stroked, filled, own opacity, paint alpha, fixed-colour, own transform, embedded CSS or SMIL, number of shapes, grid.
- **Templates** (12 icons per family (the sample, the one with most shapes, and 10 seeded random) × 22 templates, 8,976 runs): each icon is mounted in the real `AnimatedIcon`, a template is started, and the animation is paused at five points. Each frame is rasterised at 64 px and compared with the resting icon. A template is **visible** if some frame differs from rest by at least 1% of the pixels, and **returns to rest** if the final frame is within 2% of the resting icon. How far the content travels outside the icon's box is measured from the shapes' bounding boxes.
- **Targeted** (up to 6 icons with shapes that carry their own transform, and up to 6 with a shape that has its own opacity, per family): the icons the random sample is least likely to catch.
- **Props**: `speed`, `loop`, `easing`, `size` and `color` are checked on one icon per family by reading the timing the browser holds.
- Limits: 12 icons per family is a sample, not a proof; 64 px is one size; the 1% / 2% thresholds are judgement calls. The structure survey, which covers every icon, is the part to trust for percentages.

## The patterns

### 1. The templates fall into four kinds

| Template | Acts on | Needs | Distances in grid units | Works on | Kind |
| --- | --- | --- | --- | --- | --- |
| `draw` | each shape | a stroke | no | 12 of 33 families | needs strokes |
| `cascade` | each shape | nothing | no | 33 of 33 families | universal |
| `pop` | each shape | nothing | no | 33 of 33 families | universal |
| `spin` | the whole svg | nothing | no | 33 of 33 families | universal |
| `jelly` | the whole svg | nothing | no | 33 of 33 families | universal |
| `orbit` | each shape | nothing | no | 33 of 33 families | universal |
| `assemble` | each shape | nothing | yes, scaled to the icon's viewBox | 33 of 33 families | universal |
| `trace` | each shape | a stroke | no | 12 of 33 families | needs strokes |
| `tada` | the whole svg | nothing | no | 33 of 33 families | universal |
| `flip` | the whole svg | nothing | no | 33 of 33 families | universal |
| `swing` | the whole svg | nothing | no | 33 of 33 families | universal |
| `wave` | each shape | nothing | yes, scaled to the icon's viewBox | 33 of 33 families | universal |
| `march` | each shape | a stroke | yes, scaled to the icon's viewBox | 12 of 33 families | needs strokes |
| `boil` | each shape | nothing | yes, scaled to the icon's viewBox | 33 of 33 families | universal |
| `glitch` | the whole svg | nothing | no | 33 of 33 families | universal |
| `native-draw` | each shape | a stroke | no | 12 of 33 families | needs strokes |
| `wipe` | the whole svg | nothing | no | 33 of 33 families | universal |
| `rise` | the whole svg | nothing | no | 33 of 33 families | universal |
| `iris` | the whole svg | nothing | no | 33 of 33 families | universal |
| `split` | the whole svg | nothing | no | 33 of 33 families | universal |
| `drop` | the whole svg | nothing | no | 33 of 33 families | universal |
| `stamp` | the whole svg | nothing | no | 33 of 33 families | universal |

- **Universal**: `cascade`, `pop`, `spin`, `jelly`, `orbit`, `assemble`, `tada`, `flip`, `swing`, `wave`, `boil`, `glitch`, `wipe`, `rise`, `iris`, `split`, `drop`, `stamp` work on every family. The whole-icon ones (`spin`, `jelly`, `tada`, `flip`, `swing`, `glitch`, `wipe`, `rise`, `iris`, `split`, `drop`, `stamp`) are the safest: they touch only the `<svg>` and know nothing about the icon inside.
- **Needs strokes** (`draw`, `trace`, `march`, `native-draw`): they animate the dash offset, so an icon drawn as filled shapes has nothing to draw. Since Phase 0, `draw` and `trace` reveal such an icon with a wipe instead of running invisibly, and `march` and `native-draw` do nothing; `supports(id, svg)` tells a caller which. They genuinely work on the families whose icons are stroked (the "works" counts above), partly on the mixed ones.
- **Scaled to the grid** (`assemble`, `wave`, `march`, `boil`): their distances were fixed numbers on a 256-unit grid, so on a 24-unit grid `assemble` threw the shapes out to about 1.9× the icon's own size and `wave` lifted them about 0.8×. They now scale with the icon's own viewBox. `drop` falls a fixed 70 screen pixels, so it is size-dependent instead, by design.
- **`glitch`** held its resting frame for the whole animation (its `steps(1)` easing was on the animation, not on each keyframe) and was visible on no family; it now shakes.
- **Slow reveals**: a dash pattern restarts at every subpath, so `native-draw` on a sharp ease-out finished icons made of several short subpaths in a tenth of its time. It now eases in and out.

### 2. Strokes against fills decide the draw templates

The names mislead: "regular" and "outline" families are often not stroked. Measured share of icons that have a stroked shape:

| Stroked (draw templates work) | Fill-only (draw templates show nothing) | Mixed |
| --- | --- | --- |
| Feather (100%), Heroicons Outline (100%), Iconoir (100%), Keyline Duo (100%), Keyline Sharp (100%), Keyline Stroke (100%), Lucide (100%), Material Line Icons (100%), Phosphor (99%), Tabler (100%), Flowbite Outline (100%), Ionicons Outline (97%), Phosphor Light (99%) | Ant Design Icons, Boxicons Regular, Boxicons Solid, Circum Icons, CoreUI Icons, css.gg, Font Awesome Regular, Font Awesome Solid, Heroicons Solid, Octicons, Phosphor Fill, Remix Icon, Remix Icon Fill, Simple Icons, Simple Line Icons, Tabler Fill, Flowbite Solid | Famicons (39% stroked), Iconoir Fill (23% stroked), Keyline Fill (63% stroked), Ionicons Filled (13% stroked) |

### 3. What can go wrong inside an icon, and what Phase 0 did about it

| Risk | What happened | After Phase 0 | Families affected |
| --- | --- | --- | --- |
| Shapes with their own `transform` | `cascade`, `pop`, `orbit`, `assemble` replace the transform while they run and leave the shape misplaced at the end (up to 39% of the pixels off) | shapes with their own transform are wrapped in a group and the group is animated: 0% off | Circum Icons: 1 icon; CoreUI Icons: 2 icons; Famicons: 22 icons (2%); Iconoir: 3 icons; Iconoir Fill: 3 icons (1%); Phosphor: 53 icons (4%); Ionicons Outline: 8 icons (2%); Ionicons Filled: 2 icons; Phosphor Light: 53 icons (4%) |
| Shapes with their own `opacity` | `cascade`, `orbit`, `assemble` end every shape at full opacity; a hidden helper shape (`opacity="0"`) becomes visible (up to 83% of the pixels off) | the group carries the animation, the shape keeps its own opacity: 0% off | css.gg: 8 icons (1%); Phosphor: 1 icon, 1 with a hidden helper shape; Tabler: 1 icon; Phosphor Light: 1 icon |
| Two-tone by paint alpha (`fill-opacity`, `stroke-opacity`) | **safe**: the templates animate `opacity`, which multiplies with it, so the second tone survives | unchanged (measured: css.gg, 6 icons, worst end difference 0%; Keyline Duo, 6 icons, worst end difference 0%) | css.gg 3%, Keyline Duo 93% |
| Fixed colours | `color` does not recolour them | open (Phase 3) | Ant Design Icons 100%, Iconoir Fill 5%, Material Line Icons 38% |
| Embedded CSS animation | the icon already animates itself; templates fight it and `speed` / `loop` / `easing` do not reach it | not a template problem: Material Line Icons stays in `icons` | Material Line Icons 100% |
| One shape only | the staggered templates (`cascade`, `pop`, `orbit`, `assemble`, `trace`) all become the same single effect | by nature; the docs lead with the whole-icon templates | Font Awesome Regular 100%, Font Awesome Solid 100%, Heroicons Outline 93%, Phosphor Fill 99%, Remix Icon 100%, Remix Icon Fill 100%, Simple Icons 100%, Simple Line Icons 100%, Flowbite Outline 96% |
| More than one grid in a family | each icon needs its own viewBox | each icon's own viewBox is used | Octicons (8 grids), Ionicons Filled (2 grids) |

### 4. Props

`speed`, `loop`, `easing` and `size` reached the animation on 33 of 34 families; the exception is Material Line Icons, which animates itself. `trigger` and `active` are properties of the component, so they hold wherever it runs. `color` is limited by the icon, not the component (see fixed colours above).

## The map

Legend for the template columns: **✓** works as is · **⚠** works but misbehaves on this grid until the grid fix · **◐** works only on the stroked share of the family · **✗** no visible effect · **·** the family animates itself.

| Family | Icons | Draws | Grid | Parallel in icons-animated | Works (✓) | Tune first (⚠) | Partial (◐) | No effect (✗) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Ant Design Icons** (`anticons`) | 150 | fill | 1024 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Boxicons Regular** (`boxregular`) | 814 | fill | 24 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Boxicons Solid** (`boxsolid`) | 665 | fill | 24 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Circum Icons** (`circum`) | 288 | fill | 24 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **CoreUI Icons** (`coreui`) | 562 | fill | 512 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **css.gg** (`cssgg`) | 704 | fill | 24 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Famicons** (`famicons`) | 1,342 | mixed (39% stroked) | 512 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | `draw` `trace` `march` `native-draw` | – |
| **Feather** (`feathericons`) | 287 | stroke | 24 | **none** | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |
| **Font Awesome Regular** (`fontawesome`) | 273 | fill | 640 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Font Awesome Solid** (`fontawesomesolid`) | 2,001 | fill | 640 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Heroicons Outline** (`heroicons`) | 324 | stroke | 24 | hero (variant outline) | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |
| **Heroicons Solid** (`heroiconsfill`) | 324 | fill | 24 | hero (variant solid) | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Iconoir** (`iconoir`) | 1,383 | stroke | 24 | **none** | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |
| **Iconoir Fill** (`iconoirfill`) | 288 | mixed (23% stroked) | 24 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | `draw` `trace` `march` `native-draw` | – |
| **Keyline Duo** (`keylineduo`) | 1,000 | stroke | 24 | **none** | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |
| **Keyline Fill** (`keylinefill`) | 1,000 | mixed (63% stroked) | 24 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | `draw` `trace` `march` `native-draw` | – |
| **Keyline Sharp** (`keylinesharp`) | 1,000 | stroke | 24 | **none** | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |
| **Keyline Stroke** (`keylinestroke`) | 1,000 | stroke | 24 | **none** | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |
| **Lucide** (`lucide`) | 1,744 | stroke | 24 | **none** | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |
| **Material Line Icons** (`materialanim`) | 1,222 | stroke | 24 | **none** | · animates itself | – | – | – |
| **Octicons** (`octicons`) | 604 | fill | 16+ | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Phosphor** (`phosphor`) | 1,512 | stroke | 256 | phosphor (variant regular) | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |
| **Phosphor Fill** (`phosphorfill`) | 1,512 | fill | 256 | phosphor (variant fill) | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Remix Icon** (`remix`) | 1,437 | fill | 24 | remix (variant line) | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Remix Icon Fill** (`remixfill`) | 1,299 | fill | 24 | remix (variant fill) | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Simple Icons** (`simple`) | 3,093 | fill | 24 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Simple Line Icons** (`simpleline`) | 189 | fill | 1024 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Tabler** (`tabler`) | 5,130 | stroke | 24 | **none** | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |
| **Tabler Fill** (`tablerfill`) | 1,054 | fill | 24 | **none** | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Flowbite Outline** (`flowbite`) | 411 | stroke | 24 | flowbite (variant outline) | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |
| **Flowbite Solid** (`flowbitesolid`) | 340 | fill | 24 | flowbite (variant solid) | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Ionicons Outline** (`ionicons`) | 421 | stroke | 512 | ion (variant outline) | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |
| **Ionicons Filled** (`ioniconsfill`) | 515 | mixed (13% stroked) | 512+ | ion (variant filled) | `cascade` `pop` `spin` `jelly` `orbit` `assemble` `tada` `flip` `swing` `wave` `boil` `glitch` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | `draw` `trace` `march` `native-draw` |
| **Phosphor Light** (`phosphorlight`) | 1,512 | stroke | 256 | phosphor (variant light) | `draw` `cascade` `pop` `spin` `jelly` `orbit` `assemble` `trace` `tada` `flip` `swing` `wave` `march` `boil` `glitch` `native-draw` `wipe` `rise` `iris` `split` `drop` `stamp` | – | – | – |

### Per-family detail

Visible% / returns-to-rest% for each template, from the sample. `!` marks a template that does not return to rest.

| Family | draw | cascade | pop | spin | jelly | orbit | assemble | trace | tada | flip | swing | wave | march | boil | glitch | native-draw | wipe | rise | iris | split | drop | stamp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| anticons | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| boxregular | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| boxsolid | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| circum | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| coreui | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| cssgg | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| famicons | ◐ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ◐ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ◐ 33 | ✓ 100 | ✓ 100 | ◐ 33 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| feathericons | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 67 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| fontawesome | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| fontawesomesolid | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| heroicons | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| heroiconsfill | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| iconoir | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| iconoirfill | ◐ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ◐ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ◐ 42 | ✓ 100 | ✓ 100 | ◐ 50 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| keylineduo | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 33 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| keylinefill | ◐ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ◐ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ◐ 42 | ✓ 100 | ✓ 100 | ◐ 67 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| keylinesharp | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| keylinestroke | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 67 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| lucide | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 75 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| materialanim | · 100! | · 92! | · 92! | · 92! | · 92! | · 92! | · 92! | · 100! | · 92 | · 92! | · 92! | · 92 | · 92 | · 92 | · 92! | · 100! | · 92! | · 92! | · 92! | · 92! | · 92! | · 92! |
| octicons | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| phosphor | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| phosphorfill | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| remix | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| remixfill | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| simple | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| simpleline | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| tabler | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 92 | ✓ 100 | ✓ 100 | ✓ 92 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| tablerfill | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| flowbite | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 75 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| flowbitesolid | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 8 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| ionicons | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 75 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| ioniconsfill | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✗ 0 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |
| phosphorlight | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 | ✓ 100 |

### Risks per family

| Family | Own transform | Own opacity | Paint alpha (safe) | Fixed colours | Embedded CSS | One shape | Median / p95 / max shapes | Measured on the risky icons |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| anticons | 0 | 0 | 0% | 100% | 0% | 0% | 3 / 4 / 5 | – |
| boxregular | 0 | 0 | 0% | 0% | 0% | 53% | 1 / 3 / 8 | – |
| boxsolid | 0 | 0 | 0% | 0% | 0% | 85% | 1 / 2 / 4 | – |
| circum | 1 | 0 | 0% | 0% | 0% | 39% | 2 / 5 / 10 | – |
| coreui | 2 | 0 | 0% | 0% | 0% | 61% | 1 / 3 / 10 | – |
| cssgg | 0 | 8 | 3% | 0% | 0% | 34% | 2 / 5 / 22 | – |
| famicons | 22 | 0 | 0% | 0% | 0% | 35% | 2 / 7 / 23 | – |
| feathericons | 0 | 0 | 0% | 0% | 0% | 18% | 2 / 6 / 10 | – |
| fontawesome | 0 | 0 | 0% | 0% | 0% | 100% | 1 / 1 / 1 | – |
| fontawesomesolid | 0 | 0 | 0% | 0% | 0% | 100% | 1 / 1 / 1 | – |
| heroicons | 0 | 0 | 0% | 0% | 0% | 93% | 1 / 2 / 11 | – |
| heroiconsfill | 0 | 0 | 0% | 0% | 0% | 65% | 1 / 4 / 13 | – |
| iconoir | 3 | 0 | 0% | 0% | 0% | 9% | 3 / 9 / 20 | – |
| iconoirfill | 3 | 0 | 0% | 5% | 0% | 53% | 1 / 5 / 17 | – |
| keylineduo | 0 | 0 | 93% | 0% | 0% | 7% | 2 / 3 / 4 | – |
| keylinefill | 0 | 0 | 0% | 0% | 0% | 56% | 1 / 2 / 3 | – |
| keylinesharp | 0 | 0 | 0% | 0% | 0% | 75% | 1 / 2 / 3 | – |
| keylinestroke | 0 | 0 | 0% | 0% | 0% | 76% | 1 / 2 / 3 | – |
| lucide | 0 | 0 | 0% | 0% | 0% | 5% | 4 / 8 / 15 | – |
| materialanim | 0 | 342 | 54% | 38% | 100% | 6% | 4 / 9 / 19 | own opacity: draw, cascade, pop, spin, jelly, orbit, assemble, trace, flip, swing, glitch, native-draw, wipe, rise, iris, split, drop, stamp (up to 37% off) |
| octicons | 0 | 0 | 0% | 0% | 0% | 75% | 1 / 2 / 3 | – |
| phosphor | 53 | 1 | 0% | 0% | 0% | 8% | 4 / 8 / 15 | – |
| phosphorfill | 0 | 0 | 0% | 0% | 0% | 99% | 1 / 1 / 7 | – |
| remix | 0 | 0 | 0% | 0% | 0% | 100% | 1 / 1 / 1 | – |
| remixfill | 0 | 0 | 0% | 0% | 0% | 100% | 1 / 1 / 1 | – |
| simple | 0 | 0 | 0% | 0% | 0% | 100% | 1 / 1 / 1 | – |
| simpleline | 0 | 0 | 0% | 0% | 0% | 100% | 1 / 1 / 1 | – |
| tabler | 0 | 1 | 0% | 0% | 0% | 7% | 4 / 9 / 21 | – |
| tablerfill | 0 | 0 | 0% | 0% | 0% | 78% | 1 / 4 / 11 | – |
| flowbite | 0 | 0 | 0% | 0% | 0% | 96% | 1 / 1 / 4 | – |
| flowbitesolid | 0 | 0 | 0% | 0% | 0% | 68% | 1 / 3 / 4 | – |
| ionicons | 8 | 0 | 0% | 0% | 0% | 12% | 3 / 8 / 23 | – |
| ioniconsfill | 2 | 0 | 0% | 0% | 0% | 46% | 2 / 6 / 21 | – |
| phosphorlight | 53 | 1 | 0% | 0% | 0% | 8% | 4 / 8 / 15 | – |

## Parity with `icons-animated`

| `icons` family | icons-animated | Same upstream release? |
| --- | --- | --- |
| Ant Design Icons (`anticons`) | **none** | – |
| Boxicons Regular (`boxregular`) | **none** | – |
| Boxicons Solid (`boxsolid`) | **none** | – |
| Circum Icons (`circum`) | **none** | – |
| CoreUI Icons (`coreui`) | **none** | – |
| css.gg (`cssgg`) | **none** | – |
| Famicons (`famicons`) | **none** | – |
| Feather (`feathericons`) | **none** | – |
| Font Awesome Regular (`fontawesome`) | **none** | – |
| Font Awesome Solid (`fontawesomesolid`) | **none** | – |
| Heroicons Outline (`heroicons`) | `@fractaldesign/icons-animated/hero`, variant `outline` | **no**: icons has Heroicons 2.1.4 (296 icons), animated has 2.2.0 (324) |
| Heroicons Solid (`heroiconsfill`) | `@fractaldesign/icons-animated/hero`, variant `solid` | **no**: icons has Heroicons 2.1.4 (296 icons), animated has 2.2.0 (324) |
| Iconoir (`iconoir`) | **none** | – |
| Iconoir Fill (`iconoirfill`) | **none** | – |
| Keyline Duo (`keylineduo`) | **none** | – |
| Keyline Fill (`keylinefill`) | **none** | – |
| Keyline Sharp (`keylinesharp`) | **none** | – |
| Keyline Stroke (`keylinestroke`) | **none** | – |
| Lucide (`lucide`) | **none** | – |
| Material Line Icons (`materialanim`) | not needed: it animates itself, in `icons` | – |
| Octicons (`octicons`) | **none** | – |
| Phosphor (`phosphor`) | `@fractaldesign/icons-animated/phosphor`, variant `regular` | yes, same commit |
| Phosphor Fill (`phosphorfill`) | `@fractaldesign/icons-animated/phosphor`, variant `fill` | yes, same commit |
| Remix Icon (`remix`) | `@fractaldesign/icons-animated/remix`, variant `line` | yes, remixicon 4.1.0 |
| Remix Icon Fill (`remixfill`) | `@fractaldesign/icons-animated/remix`, variant `fill` | yes, remixicon 4.1.0 |
| Simple Icons (`simple`) | **none** | – |
| Simple Line Icons (`simpleline`) | **none** | – |
| Tabler (`tabler`) | **none** | – |
| Tabler Fill (`tablerfill`) | **none** | – |
| Flowbite Outline (`flowbite`) | `@fractaldesign/icons-animated/flowbite`, variant `outline` | undefined |
| Flowbite Solid (`flowbitesolid`) | `@fractaldesign/icons-animated/flowbite`, variant `solid` | undefined |
| Ionicons Outline (`ionicons`) | `@fractaldesign/icons-animated/ion`, variant `outline` | undefined |
| Ionicons Filled (`ioniconsfill`) | `@fractaldesign/icons-animated/ion`, variant `filled` | undefined |
| Phosphor Light (`phosphorlight`) | `@fractaldesign/icons-animated/phosphor`, variant `light` | undefined |

Every animated set now has its static families in `icons` (Phosphor regular, light and fill; Remix line and fill; Flowbite outline and solid; Heroicons outline and solid; Ionicons outline and filled), and the reverse is covered by the bridge.

## Two ways to get all 34 families animated

| | A. Generate a component per icon (what the 5 sets do) | B. Bridge: `AnimatedIcon` takes an `IconData` |
| --- | --- | --- |
| New files | about 49,142 (a `.svelte` and a `.d.ts` per icon, for the 24,571 icons in the 22 families not yet covered) | none |
| New package weight | about 29.3 MB of source, since each icon's data is copied into its own component (≈ 401 bytes of wrapper each) | 0 MB: the data is already in `@fractaldesign/icons` (19.5 MB for those same icons) |
| Per-icon import | `import { Heart } from '.../phosphor'` | `import { phHeart } from '@fractaldesign/icons/phosphor'` and `<AnimatedIcon icon={phHeart} />` |
| Families added | each needs a generator config, a docs page and a build | all 34 at once |
| Cost | a package of 58,000 files, long installs, a regenerate on every upstream bump | a peer dependency on `@fractaldesign/icons`, and one extra prop |

**Recommendation: B.** The census itself is the proof it works: it ran this exact path (the real `AnimatedIcon`, fed `IconData` bodies wrapped in `<g fill="currentColor">`, which is what `Icon` does with `fill`) over every family. Keep the five generated sets as they are for compatibility; they are the only place A is already paid for.

## Plan

### Phase 0: make the templates and the generator work on every icon: done

Each row had a failing end-to-end test before the fix and passes after it (`e2e/tests/phase0-templates.e2e.ts`).

| # | Fix | Before | After |
| --- | --- | --- | --- |
| 0.0 | The generator removes a `<rect fill="none">` only when it has no stroke | 295 icons missing a real outline rectangle (Phosphor regular and light, 7 Ionicons) | all shapes kept, unit-tested |
| 0.1 | `glitch`: `steps(1)` on each keyframe, not on the whole animation | visible on 0 of 33 families | visible on 33 of 33 |
| 0.2 | `assemble`, `wave`, `march`, `boil` scale by the icon's viewBox; `assemble` sends a centred shape in from its own direction | `assemble` travelled 1.9× and `wave` 0.8× the icon size on 24 grids | the same share of the icon on 24, 256 and 512 grids, tested on four sets |
| 0.3 | Shapes with their own transform or opacity are wrapped in a group and the group is animated | up to 39% of pixels off; a hidden helper shape revealed (83%) | 0% and 0% off |
| 0.4 | The dash templates on an icon with no stroke: `draw` and `trace` reveal it with a wipe, `march` and `native-draw` do nothing; `supports(id, svg)` says which | ran invisibly | something visible, or an honest no-op |
| 0.5 | `trace` stagger capped so an icon takes about a second and a half at most | 15 shapes took 4.8 s | at most 1.6 s |
| 0.6 | `native-draw` eases in and out | finished icons of short subpaths in a tenth of its time | visibly draws them |

### Phase 1: the bridge: done

`AnimatedIcon` takes `icon={...}`, any `IconData` from `@fractaldesign/icons`. Its viewBox is used and its body is drawn inside `<g fill="currentColor">`, so fills and strokes take `color` alike. `svg` and `viewBox` still work. Tests: `e2e/tests/phase1-bridge.e2e.ts`, live on `/docs/animated-icon` (a stroke, a fill and a mixed family, with and without `label`).

### Phase 2: per-family guidance, shipped as data: done

The support data ships in the package (`SUPPORT`, `supportedTemplates(family)`, `templateSupport(family, id)`) and is served by the docs as `/animation-support.json`. `icons-animated-docs` has an index at `/docs/families` and one page per family (34), each offering only the templates that work on it, naming the ones that do not, and showing every template on the family's sample icon. Tests: `e2e/tests/phase2-families.e2e.ts`.

### Phase 3: parity: done

`icons` 0.2.0 adds Flowbite Outline and Solid, Ionicons Outline and Filled, and Phosphor Light, and moves Heroicons to 2.2.0, the release `icons-animated` already used, so the two packages agree on every shared set. Tests: `e2e/tests/phase3-parity.e2e.ts`.

### Per family

Every family below takes the same path (the Phase 1 bridge, nothing generated) except Material Line Icons. What differs is what must be dealt with first, and which templates to lead with.

| Family | Path | Do first | Lead with |
| --- | --- | --- | --- |
| **Ant Design Icons** | bridge | recolour first: 100% of icons paint fixed colours, so `color` does nothing. Map the fixed colours to currentColor (and a faded currentColor for the second tone) in the `icons` build, which fixes the static family too | `stamp` `iris` `wipe` `flip` `jelly` |
| **Boxicons Regular** | bridge | nothing | `stamp` `iris` `wipe` `flip` `jelly` |
| **Boxicons Solid** | bridge | nothing | `stamp` `iris` `wipe` `flip` `jelly` |
| **Circum Icons** | bridge | 1 icon (0%) has shapes with their own transform: needs the composite fix in the shape templates (see Phase 0) | `stamp` `iris` `wipe` `flip` `jelly` |
| **CoreUI Icons** | bridge | 2 icons (0%) have shapes with their own transform: needs the composite fix in the shape templates (see Phase 0) | `stamp` `iris` `wipe` `flip` `jelly` |
| **css.gg** | bridge | 8 icons have a shape with its own opacity: the opacity templates must end on the icon's own value (see Phase 0) | `stamp` `iris` `wipe` `flip` `jelly` |
| **Famicons** | bridge | 22 icons (2%) have shapes with their own transform: needs the composite fix in the shape templates (see Phase 0) | `cascade` `pop` `wipe` `stamp` `jelly` |
| **Feather** | bridge | nothing | `draw` `trace` `cascade` `pop` `stamp` |
| **Font Awesome Regular** | bridge | 100% of icons are one shape, so the staggered templates (`cascade`, `pop`, `orbit`, `assemble`, `trace`) have nothing to stagger and collapse to one effect | `stamp` `iris` `wipe` `flip` `jelly` |
| **Font Awesome Solid** | bridge | 100% of icons are one shape, so the staggered templates (`cascade`, `pop`, `orbit`, `assemble`, `trace`) have nothing to stagger and collapse to one effect | `stamp` `iris` `wipe` `flip` `jelly` |
| **Heroicons Outline** | existing set `hero`; also reachable by the bridge | 93% of icons are one shape, so the staggered templates (`cascade`, `pop`, `orbit`, `assemble`, `trace`) have nothing to stagger and collapse to one effect | `draw` `native-draw` `wipe` `stamp` `jelly` |
| **Heroicons Solid** | existing set `hero`; also reachable by the bridge | nothing | `stamp` `iris` `wipe` `flip` `jelly` |
| **Iconoir** | bridge | 3 icons (0%) have shapes with their own transform: needs the composite fix in the shape templates (see Phase 0) | `draw` `trace` `cascade` `pop` `stamp` |
| **Iconoir Fill** | bridge | 5% of icons paint a fixed colour; map it to currentColor; 3 icons (1%) have shapes with their own transform: needs the composite fix in the shape templates (see Phase 0) | `cascade` `pop` `wipe` `stamp` `jelly` |
| **Keyline Duo** | bridge | nothing | `draw` `trace` `cascade` `pop` `stamp` |
| **Keyline Fill** | bridge | nothing | `cascade` `pop` `wipe` `stamp` `jelly` |
| **Keyline Sharp** | bridge | nothing | `draw` `trace` `cascade` `pop` `stamp` |
| **Keyline Stroke** | bridge | nothing | `draw` `trace` `cascade` `pop` `stamp` |
| **Lucide** | bridge | nothing | `draw` `trace` `cascade` `pop` `stamp` |
| **Material Line Icons** | none: already animated | These icons carry their own CSS animation (100% have a <style> block). Running a template on top fights it; speed, loop and easing do not reach it (measured). It is animated in `icons` through the `trigger` prop. Keep it there. | – |
| **Octicons** | bridge | 8 different grids inside the family: read each icon's own viewBox | `stamp` `iris` `wipe` `flip` `jelly` |
| **Phosphor** | existing set `phosphor`; also reachable by the bridge | 53 icons (4%) have shapes with their own transform: needs the composite fix in the shape templates (see Phase 0); 1 icon has a shape with its own opacity (a hidden helper shape that `cascade` would reveal): the opacity templates must end on the icon's own value (see Phase 0) | `draw` `trace` `cascade` `pop` `stamp` |
| **Phosphor Fill** | existing set `phosphor`; also reachable by the bridge | 99% of icons are one shape, so the staggered templates (`cascade`, `pop`, `orbit`, `assemble`, `trace`) have nothing to stagger and collapse to one effect | `stamp` `iris` `wipe` `flip` `jelly` |
| **Remix Icon** | existing set `remix`; also reachable by the bridge | 100% of icons are one shape, so the staggered templates (`cascade`, `pop`, `orbit`, `assemble`, `trace`) have nothing to stagger and collapse to one effect | `stamp` `iris` `wipe` `flip` `jelly` |
| **Remix Icon Fill** | existing set `remix`; also reachable by the bridge | 100% of icons are one shape, so the staggered templates (`cascade`, `pop`, `orbit`, `assemble`, `trace`) have nothing to stagger and collapse to one effect | `stamp` `iris` `wipe` `flip` `jelly` |
| **Simple Icons** | bridge | 100% of icons are one shape, so the staggered templates (`cascade`, `pop`, `orbit`, `assemble`, `trace`) have nothing to stagger and collapse to one effect | `stamp` `iris` `wipe` `flip` `jelly` |
| **Simple Line Icons** | bridge | 100% of icons are one shape, so the staggered templates (`cascade`, `pop`, `orbit`, `assemble`, `trace`) have nothing to stagger and collapse to one effect | `stamp` `iris` `wipe` `flip` `jelly` |
| **Tabler** | bridge | 1 icon has a shape with its own opacity: the opacity templates must end on the icon's own value (see Phase 0) | `draw` `trace` `cascade` `pop` `stamp` |
| **Tabler Fill** | bridge | nothing | `stamp` `iris` `wipe` `flip` `jelly` |
| **Flowbite Outline** | existing set `flowbite`; also reachable by the bridge | 96% of icons are one shape, so the staggered templates (`cascade`, `pop`, `orbit`, `assemble`, `trace`) have nothing to stagger and collapse to one effect | `draw` `native-draw` `wipe` `stamp` `jelly` |
| **Flowbite Solid** | existing set `flowbite`; also reachable by the bridge | nothing | `stamp` `iris` `wipe` `flip` `jelly` |
| **Ionicons Outline** | existing set `ion`; also reachable by the bridge | 8 icons (2%) have shapes with their own transform: needs the composite fix in the shape templates (see Phase 0) | `draw` `trace` `cascade` `pop` `stamp` |
| **Ionicons Filled** | existing set `ion`; also reachable by the bridge | 2 icons (0%) have shapes with their own transform: needs the composite fix in the shape templates (see Phase 0); 2 different grids inside the family: read each icon's own viewBox | `cascade` `pop` `wipe` `stamp` `jelly` |
| **Phosphor Light** | existing set `phosphor`; also reachable by the bridge | 53 icons (4%) have shapes with their own transform: needs the composite fix in the shape templates (see Phase 0); 1 icon has a shape with its own opacity: the opacity templates must end on the icon's own value (see Phase 0) | `draw` `trace` `cascade` `pop` `stamp` |

### What this does not decide

- Whether the five generated sets stay as components or move to the bridge in 0.2. Both can coexist.
- Whether Material Line Icons (already animated) gets a `trigger`-style entry in the animated docs, or only stays in `icons`.
- Brand logos (Simple Icons): every template runs, but animating a brand mark is a design call, not a technical one.
