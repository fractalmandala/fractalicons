# @fractaldesign/icons-animated

Animated icons for **Svelte 5**: over 4,000 icons from Phosphor, Remix, Flowbite, Heroicons and Ionicons, each one a component, each one animated by one of 22 templates. The animation is the browser's Web Animations API: no animation library, no keyframes to write.

```sh
pnpm add @fractaldesign/icons-animated
```

```svelte
<script lang="ts">
	import { Heart } from '@fractaldesign/icons-animated/phosphor';
</script>

<Heart template="draw" size={32} />
```

Hover the icon and it draws itself on. Every icon takes the same props.

## Sets

| Import | Icons | Variants |
| --- | --- | --- |
| `@fractaldesign/icons-animated/phosphor` | 1,512 | `regular` (default), `light`, `fill` |
| `@fractaldesign/icons-animated/remix` | 1,437 | `line` (default), `fill` |
| `@fractaldesign/icons-animated/flowbite` | 444 | `outline` (default), `solid` |
| `@fractaldesign/icons-animated/hero` | 324 | `outline` (default), `solid` |
| `@fractaldesign/icons-animated/ion` | 515 | `outline` (default), `filled` |

Pick a variant with `variant`: `<Heart variant="fill" />`. An icon that a set has in only one variant uses that one.

## Props

| Prop | Default | |
| --- | --- | --- |
| `template` | `'draw'` | One of the 22 templates (`draw`, `pop`, `spin`, `tada`, `wave`, …). |
| `variant` | the set's default | Which cut of the icon. |
| `trigger` | `'hover'` | `hover`, `mount`, or `controlled` (you drive it with `active`). |
| `active` | `false` | With `trigger="controlled"`, animate while true. |
| `loop` | `false` | Repeat forever. |
| `speed` | `1` | A multiplier: 2 is twice as fast. |
| `easing` | the template's own | Any CSS easing string. |
| `size` | `24` | Pixels. |
| `label` | none | The accessible name. Without one the icon is hidden from assistive technology. |
| `color` | `currentColor` | Any CSS colour. |

Everything else lands on the wrapping element. The full API, every template running live, and every icon are on the docs site.

## Notes

- `AnimatedIcon`, `TEMPLATES`, `TEMPLATE_IDS`, `getTemplate` and `clearProps` are exported from the package root, so you can animate an SVG of your own.
- Templates marked for line icons need a stroke to draw on; the fill templates suit solid shapes.
- When the system asks for reduced motion, the icons stay in their resting state and nothing animates.

## Licence

The code is MIT. The icons are not covered by it: each set keeps its own licence (MIT for Phosphor, Flowbite, Heroicons and Ionicons; Apache 2.0 for Remix). See `NOTICE.md`.
