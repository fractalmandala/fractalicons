# fractalicons

A comprehensive, tree-shakeable icon library for **Svelte 5** featuring **11,800+ icons across 11 popular open-source icon families** with short, ergonomic import prefixes.

---

## Features

- 🚀 **Svelte 5 Runes**: Built specifically for Svelte 5 with native rune reactivity.
- 🌳 **Fully Tree-Shakeable**: Each icon is compiled to a lightweight TypeScript module (`IconData` payload).
- ⚡ **Short Ergonomic Prefixes**: Fast to type (`lu` for Lucide, `ph` for Phosphor, `re` for Remix, `bo` for Boxicons, `fa` for FontAwesome, etc.) with full-name aliases preserved.
- 🎨 **Color & Stroke Preserved**: Automatically normalizes colors to `currentColor` and preserves presentation attributes (strokes, stroke-widths, animations, and fill styles).
- ♿ **Accessible**: Automatic `role="img"`, `aria-hidden`, and `<title>` / `aria-labelledby` handling.

---

## Installation

```sh
pnpm add fractalicons
# or
npm install fractalicons
# or
yarn add fractalicons
```

---

## Quickstart

```svelte
<script lang="ts">
	import { Icon } from 'fractalicons';
	import { luActivity, luSparkles } from 'fractalicons/lucide';
	import { phHeart, phAcorn } from 'fractalicons/phosphor';
	import { reFireLine } from 'fractalicons/remix';
	import { boBxAlarm } from 'fractalicons/boxicons';
	import { faBolt } from 'fractalicons/fontawesome';
	import { icAccessibilitySign } from 'fractalicons/iconoir';
	import { anAccountBook } from 'fractalicons/anticons';
	import { maaLoadingLoop } from 'fractalicons/materialanim';
</script>

<!-- Basic icon -->
<Icon icon={luActivity} />

<!-- Custom size (number for px, or string with units) -->
<Icon icon={phHeart} size={24} />
<Icon icon={reFireLine} size="1.5rem" />

<!-- Accessible with title -->
<Icon icon={faBolt} title="Lightning Bolt" />

<!-- Any standard SVG attributes (class, style, stroke, etc.) -->
<Icon icon={maaLoadingLoop} size={32} class="text-blue-500" />
```

---

## Supported Families & Prefix Reference

| Family | Prefix | Icons | Import Path | Primary Export Example | Alias Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lucide** | `lu` | 1,743 | `fractalicons/lucide` | `luActivity`, `luSparkles` | `lucideActivity` |
| **Phosphor** | `ph` | 1,512 | `fractalicons/phosphor` | `phAcorn`, `phHeart` | `phosphorAcorn` |
| **Phosphor Fill** | `phf` | 1,512 | `fractalicons/phosphorfill` | `phfAcornFill`, `phfHeartFill` | `phosphorfillAcornFill` |
| **Remix Icon** | `re` | 1,444 | `fractalicons/remix` | `reFireLine`, `re24HoursLine` | `remixFireLine` |
| **Remix Icon Fill** | `ref` | 1,292 | `fractalicons/remixfill` | `refFireFill`, `ref24HoursFill` | `remixfillFireFill` |
| **Iconoir** | `ic` | 1,383 | `fractalicons/iconoir` | `icAccessibilitySign`, `icActivity` | `iconoirAccessibilitySign` |
| **Iconoir Fill** | `icf` | 288 | `fractalicons/iconoirfill` | `icfAdobeAfterEffects` | `iconoirfillAdobeAfterEffects` |
| **Boxicons** | `bo` | 1,000 | `fractalicons/boxicons` | `boBxAlarm`, `boBxsAlarm`, `boBxlApple` | `boxiconsBxAlarm` |
| **Font Awesome Free** | `fa` | 1,000 | `fractalicons/fontawesome` | `faBolt`, `faHeart`, `fa0` | `fontawesomeBolt` |
| **Material Animated** | `maa` | 545 | `fractalicons/materialanim` | `maaLoadingLoop`, `maaAccountAlertLoop` | `materialanimLoadingLoop` |
| **Ant Design Icons** | `an` | 150 | `fractalicons/anticons` | `anAccountBook`, `anAlert` | `anticonsAccountBook` |
| **Lucide Animated** | `lua` | — | `fractalicons/lucidenim` | `lua...` | `lucidenim...` |

---

## `<Icon />` Component Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `icon` | `IconData` | **(required)** | The icon data object imported from any family. |
| `size` | `number \| string` | `'1em'` | Size of the icon. Numbers are treated as `px` (e.g. `24` -> `24px`). |
| `title` | `string` | `undefined` | Accessible title for screen readers. Sets `aria-labelledby` and `<title>`. |
| `decorative` | `boolean` | `!title` | When `true`, adds `aria-hidden="true"`. Defaults to `false` if `title` is provided. |
| `...rest` | `SVGAttributes` | `{}` | All standard SVG element attributes (`class`, `style`, `stroke`, `fill`, etc.). |

---

## Upstream Licenses & Attribution

All icons included in this library belong to their respective creators and open-source projects. We are immensely grateful to the open-source icon design community:

| Icon Family | Author / Organization | License | Repository & License File |
| :--- | :--- | :--- | :--- |
| **Lucide** | Lucide Contributors / Cole Bemis | **ISC License** | [lucide-icons/lucide LICENSE](https://github.com/lucide-icons/lucide/blob/main/LICENSE) |
| **Phosphor Icons** | Tobias Fried & Helena Zhang | **MIT License** | [phosphor-icons/core LICENSE](https://github.com/phosphor-icons/core/blob/main/LICENSE) |
| **Font Awesome Free** | Fonticons, Inc. | **CC BY 4.0** (Icons) / **MIT** (Code) | [FortAwesome/Font-Awesome LICENSE.txt](https://github.com/FortAwesome/Font-Awesome/blob/6.x/LICENSE.txt) |
| **Remix Icon** | Remix Design | **Apache License 2.0** | [Remix-Design/RemixIcon License](https://github.com/Remix-Design/RemixIcon/blob/master/License) |
| **Boxicons** | Aniket Suvarna (atisawd) | **CC BY 4.0** / **MIT** | [atisawd/boxicons LICENSE](https://github.com/atisawd/boxicons/blob/master/LICENSE) |
| **Iconoir** | Luca Burgio & Iconoir Team | **MIT License** | [iconoir-icons/iconoir LICENSE](https://github.com/iconoir-icons/iconoir/blob/main/LICENSE) |
| **Ant Design Icons** | Ant Financial / Ant Design Team | **MIT License** | [ant-design/ant-design-icons LICENSE](https://github.com/ant-design/ant-design-icons/blob/master/LICENSE) |
| **Material Design Icons** | Google LLC | **Apache License 2.0** | [google/material-design-icons LICENSE](https://github.com/google/material-design-icons/blob/master/LICENSE) |

---

## Package License

The wrapping code, Svelte components, and generation tooling in this repository are licensed under the [MIT License](https://opensource.org/licenses/MIT).
