# fractalicons

[![npm version](https://img.shields.io/npm/v/fractalicons.svg)](https://www.npmjs.com/package/fractalicons)
[![license](https://img.shields.io/npm/l/fractalicons.svg)](https://opensource.org/licenses/MIT)

A comprehensive, tree-shakeable icon library for **Svelte 5** featuring **9,800+ icons across 9 popular open-source icon families** with short, ergonomic import prefixes.

I built this to be able to sample and use multiple icon families through a single workflow and pipeline. Built with love on SvelteKit.

- **Svelte 5 Runes** — built specifically for Svelte 5 with native rune reactivity.
- **Tree-Shakeable** — each icon is compiled to a lightweight TypeScript module (`IconData` payload); you only ship what you import.
- **Prefix-cased** — fast to type (`lu` for Lucide, `ph` for Phosphor, `re` for Remix, etc.) with full-name aliases preserved.
- **Color & Stroke Preserved** — colors are normalized to `currentColor` and presentation attributes (strokes, stroke-widths, animations, fill styles) are kept intact.
- **Animated icons** — the Material Animated family plays CSS animations with a configurable `trigger` (hover, click, on-view, loop…).
- **Accessible** — automatic `role="img"`, `aria-hidden`, and `<title>` / `aria-labelledby` handling.
- **TypeScript-first** — every icon and prop is fully typed.

---

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Supported Families & Prefix Reference](#supported-families--prefix-reference)
- [Naming & Aliases](#naming--aliases)
- [`<Icon />` Component Props](#-icon---component-props)
- [Animation Triggers](#animation-triggers)
- [Styling & Interaction](#styling--interaction)
- [Advanced Usage](#advanced-usage)
- [How It Works — `IconData`](#how-it-works--icondata)
- [Local Development & Contributing](#local-development--contributing)
- [Upstream Licenses & Attribution](#upstream-licenses--attribution)
- [Package License](#package-license)

---

## Requirements

- **Svelte 5** (`svelte@^5.0.0`, declared as a peer dependency) — the `Icon` component uses runes.
- **ESM only** — the package ships as ES modules (`"type": "module"`). Works out of the box with SvelteKit, Vite, and any modern bundler.

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

## Quick Start

Import the `Icon` component once, then import individual icons from any family's subpath. Icons are plain data objects — you pass them to `Icon`.

```svelte
<script lang="ts">
	import { Icon } from 'fractalicons';
	import { luActivity, luSparkles } from 'fractalicons/lucide';
	import { phHeart, phAcorn } from 'fractalicons/phosphor';
	import { reFireLine } from 'fractalicons/remix';
	import { icAccessibilitySign } from 'fractalicons/iconoir';
	import { anAccountBook } from 'fractalicons/anticons';
	import { maaLoadingLoop } from 'fractalicons/materialanim';
</script>

<!-- Basic icon (defaults to 1em, follows font-size and color) -->
<Icon icon={luActivity} />

<!-- Custom size (number for px, or a string with units) -->
<Icon icon={phHeart} size={24} />
<Icon icon={reFireLine} size="1.5rem" />

<!-- Accessible with a title (sets role="img" + <title>) -->
<Icon icon={luActivity} title="Activity" />

<!-- Any standard SVG attribute passes through (class, style, stroke, …) -->
<Icon icon={maaLoadingLoop} size={32} class="text-blue-500" />

<!-- Animated icon with a play trigger -->
<Icon icon={maaLoadingLoop} size={32} trigger="hover" />
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
| **Material Animated** | `maa` | 545 | `fractalicons/materialanim` | `maaLoadingLoop`, `maaAccountAlertLoop` | `materialanimLoadingLoop` |
| **Ant Design Icons** | `an` | 150 | `fractalicons/anticons` | `anAccountBook`, `anAlert` | `anticonsAccountBook` |

**Total: 9,869 icons across 9 families.**

---

## Naming & Aliases

Every icon is exported under **two names**, both pointing at the same `IconData` object:

- **Prefix name** (short, ergonomic): `luActivity`, `phHeart`, `maaLoadingLoop`.
- **Full-name alias** (explicit family): `lucideActivity`, `phosphorHeart`, `materialanimLoadingLoop`.

Use whichever reads better in your codebase — they are interchangeable. Names are derived from the upstream icon file name in `camelCase`; icons that begin with a digit are prefixed with `icon` (e.g. a `24-hours` icon becomes `re24HoursLine`).

---

## `<Icon />` Component Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `icon` | `IconData` | **(required)** | The icon data object imported from any family. |
| `size` | `number \| string` | `'1em'` | Size of the icon. Numbers are treated as `px` (e.g. `24` → `24px`); strings pass through (`'1.5rem'`). Defaulting to `1em` makes icons scale with `font-size`. |
| `title` | `string` | `undefined` | Accessible label for screen readers. Sets `role="img"`, `aria-labelledby`, and a `<title>`. |
| `decorative` | `boolean` | `!title` | When `true`, adds `aria-hidden="true"`. Automatically `false` when a `title` is provided. |
| `trigger` | `'load' \| 'hover' \| 'click' \| 'visible' \| 'loop' \| 'none'` | `'load'` | When an **animated** icon (`materialanim`) plays. No effect on static icons. See below. |
| `...rest` | `SVGAttributes` | `{}` | All standard SVG element attributes (`class`, `style`, `stroke`, `fill`, `transform`, data attributes, event handlers, …) are forwarded to the `<svg>`. |

Types are exported from the package root for convenience:

```ts
import type { IconData, IconSize, AnimationTrigger } from 'fractalicons';
```

---

## Animation Triggers

The animated family (`materialanim`) accepts a `trigger` prop controlling **when** the animation runs. Non-playing icons render their finished (fully drawn) state, and `prefers-reduced-motion` is always respected.

| `trigger` | Behavior |
| :--- | :--- |
| `load` | Play once when the icon mounts *(default — matches prior behavior)* |
| `hover` | Replay each time the pointer enters |
| `click` | Replay on click |
| `visible` | Play once when scrolled into view |
| `loop` | Play continuously |
| `none` | Never animate; show the finished state |

```svelte
<script lang="ts">
	import { Icon } from 'fractalicons';
	import { maaLoadingLoop } from 'fractalicons/materialanim';
</script>

<Icon icon={maaLoadingLoop} size={32} trigger="hover" />
<Icon icon={maaLoadingLoop} size={32} trigger="loop" />
```

> The `trigger` prop is a no-op on static families, so it's always safe to pass.

---

## Styling & Interaction

Icons are unstyled SVG primitives, so you drive color, size, and motion entirely from CSS — including reacting to a **parent** element like a button.

- **Color is automatic.** Every icon paints with `currentColor` (both fill and stroke), so it inherits the surrounding text color. Change `color` anywhere up the tree and the icon follows.
- **A stable `.fractalicon` class** is on every icon's `<svg>` (plus `part="icon"` for shadow-DOM `::part()` styling), so you can target it without `:global` gymnastics.
- Anything you pass through — `class`, `style`, `stroke`, `transform`, data attributes — lands on the `<svg>`.

```svelte
<script lang="ts">
	import { Icon } from 'fractalicons';
	import { luHeart, luSettings, luBell } from 'fractalicons/lucide';

	let ringing = $state(false);
</script>

<!-- 1. Recolor on hover — nothing but currentColor -->
<button class="like"><Icon icon={luHeart} /> Like</button>

<!-- 2. Scale + spin the icon when the BUTTON is hovered -->
<button class="settings"><Icon icon={luSettings} /> Settings</button>

<!-- 3. Animate on click via a toggled state class -->
<button class="bell" class:ringing onclick={() => (ringing = !ringing)}>
	<Icon icon={luBell} /> {ringing ? 'Ring!' : 'Notify'}
</button>

<style>
	button { display: inline-flex; align-items: center; gap: 0.5rem; }

	/* smooth transitions on the icon */
	button :global(.fractalicon) { transition: transform 0.2s ease, color 0.2s ease; }

	/* 1. color inherits — just set it on hover */
	.like:hover { color: crimson; }

	/* 2. transform the icon based on the parent's hover */
	.settings:hover :global(.fractalicon) { transform: scale(1.3) rotate(45deg); color: #2563eb; }

	/* 3. react to a state class */
	.bell.ringing :global(.fractalicon) { transform: rotate(360deg); color: #d97706; }
</style>
```

> In a plain (non-Svelte-scoped) stylesheet you can drop the `:global(...)` wrapper: `.settings:hover .fractalicon { … }`.

---

## Advanced Usage

### Passing icons as data

Because each icon is just an `IconData` object, you can store icons in variables, arrays, maps, or props and render them dynamically:

```svelte
<script lang="ts">
	import { Icon } from 'fractalicons';
	import { luSun, luMoon } from 'fractalicons/lucide';

	let dark = $state(false);
	const current = $derived(dark ? luMoon : luSun);
</script>

<button onclick={() => (dark = !dark)}>
	<Icon icon={current} /> {dark ? 'Dark' : 'Light'}
</button>
```

### Building a browser / gallery

To render a whole family (for an icon picker or docs page), import the family namespace and iterate. Each icon is exported twice (prefix + alias) pointing at the same object, so dedupe by identity:

```svelte
<script lang="ts">
	import { Icon } from 'fractalicons';
	import * as lucide from 'fractalicons/lucide';

	// dedupe the prefix/alias pairs, keep the shorter name
	const entries = (() => {
		const byRef = new Map<unknown, string>();
		for (const [name, data] of Object.entries(lucide)) {
			const prev = byRef.get(data);
			if (!prev || name.length < prev.length) byRef.set(data, name);
		}
		return [...byRef].map(([data, name]) => ({ name, data }));
	})();
</script>

{#each entries as { name, data } (name)}
	<Icon icon={data} title={name} />
{/each}
```

> Namespace-importing a whole family pulls in that entire set (it opts out of tree-shaking) — great for a gallery, but for app UI prefer named imports.

### Tree-shaking

Named imports (`import { luActivity } from 'fractalicons/lucide'`) are individually tree-shakeable: each icon is its own module, so your bundle contains only the icons you actually reference — no matter how large the family is.

---

## How It Works — `IconData`

Every icon compiles to a tiny, serializable data object:

```ts
export interface IconData {
	name: string; // e.g. "activity"
	set: string; // e.g. "lucide"
	viewBox: string; // e.g. "0 0 24 24"
	body: string; // inner SVG markup, with colors normalized to currentColor
}
```

The `Icon` component wraps `body` in an `<svg>` with the right `viewBox`, size, accessibility attributes, and the `.fractalicon` class. Colors are normalized to `currentColor` at generation time and presentation attributes (stroke widths, line caps, embedded `<style>`/`@keyframes` for animated sets) are preserved.

---

## Local Development & Contributing

Icons are generated from raw SVG source folders under `src/lib/icons/<family>/` into typed modules under `src/lib/<family>/`.

```sh
pnpm install
pnpm dev          # run the demo site (src/routes)
pnpm generate     # regenerate icon modules from src/lib/icons/**
pnpm build        # generate + build + package for publishing
pnpm check        # svelte-check
pnpm lint         # prettier + eslint
```

To add or update a family, drop its `.svg` files into `src/lib/icons/<family>/`, add the family's short prefix to `familyPrefixMap` in `scripts/generate-icons.js`, and run `pnpm generate`. Colors are normalized to `currentColor` and export names are derived automatically.

---

## Upstream Licenses & Attribution

All icons included in this library belong to their respective creators and open-source projects. We are immensely grateful to the open-source icon design community:

| Icon Family | Author / Organization | License | Repository & License File |
| :--- | :--- | :--- | :--- |
| **Lucide** | Lucide Contributors / Cole Bemis | **ISC License** | [lucide-icons/lucide LICENSE](https://github.com/lucide-icons/lucide/blob/main/LICENSE) |
| **Phosphor Icons** | Tobias Fried & Helena Zhang | **MIT License** | [phosphor-icons/core LICENSE](https://github.com/phosphor-icons/core/blob/main/LICENSE) |
| **Remix Icon** | Remix Design | **Apache License 2.0** | [Remix-Design/RemixIcon License](https://github.com/Remix-Design/RemixIcon/blob/master/License) |
| **Iconoir** | Luca Burgio & Iconoir Team | **MIT License** | [iconoir-icons/iconoir LICENSE](https://github.com/iconoir-icons/iconoir/blob/main/LICENSE) |
| **Ant Design Icons** | Ant Financial / Ant Design Team | **MIT License** | [ant-design/ant-design-icons LICENSE](https://github.com/ant-design/ant-design-icons/blob/master/LICENSE) |
| **Material Design Icons** | Google LLC | **Apache License 2.0** | [google/material-design-icons LICENSE](https://github.com/google/material-design-icons/blob/master/LICENSE) |

Each family remains under its original license; retain the relevant attribution when redistributing.

---

## Package License

The wrapping code, Svelte components, and generation tooling in this repository are licensed under the [MIT License](https://opensource.org/licenses/MIT).

---
