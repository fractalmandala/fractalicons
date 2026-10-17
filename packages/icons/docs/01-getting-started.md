---
title: Getting Started
description: Install @fractaldesign/icons, import the Icon component, and render icons from any family, including the four Keyline cuts.
type: fractalicons
---

- **Svelte 5** (`svelte@^5.0.0`, declared as a peer dependency) — the `Icon` component uses runes.
- **ESM only** — the package ships as ES modules (`"type": "module"`). Works out of the box with SvelteKit, Vite, and any modern bundler.

## Installation

```sh
pnpm add @fractaldesign/icons
# or
npm install @fractaldesign/icons
# or
yarn add @fractaldesign/icons
```

## Quick Start

Import the `Icon` component once, then import individual icons from any family's subpath. Icons are plain data objects — you pass them to `Icon`.

```svelte
<script lang="ts">
	import { Icon } from '@fractaldesign/icons';
	import { luActivity, luSparkles } from '@fractaldesign/icons/lucide';
	import { phHeart, phAcorn } from '@fractaldesign/icons/phosphor';
	import { reFireLine } from '@fractaldesign/icons/remix';
	import { icAccessibilitySign } from '@fractaldesign/icons/iconoir';
	import { anAccountBook } from '@fractaldesign/icons/anticons';
	import { cuSpeedometer } from '@fractaldesign/icons/coreui';
	import { faFlameOutline } from '@fractaldesign/icons/famicons';
	import { ciCoffeeCup } from '@fractaldesign/icons/circum';
	import { tbArrowMerge } from '@fractaldesign/icons/tabler';
	import { heAcademicCap } from '@fractaldesign/icons/heroicons';
	import { feActivity } from '@fractaldesign/icons/feathericons';
	import { maaLoadingLoop } from '@fractaldesign/icons/materialanim';
	import { klHeart } from '@fractaldesign/icons/keylinestroke';
	import { klfHeart } from '@fractaldesign/icons/keylinefill';
	import { kldHeart } from '@fractaldesign/icons/keylineduo';
	import { klsHeart } from '@fractaldesign/icons/keylinesharp';
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

<!-- Keyline: same drawing, four cuts -->
<Icon icon={klHeart} />
<Icon icon={klfHeart} />
<Icon icon={kldHeart} />
<Icon icon={klsHeart} />
```

## Keyline Icons

Keyline is one 24×24 drawing in four families, 1,000 icons each. The file name is shared across the cuts.

| Style      | Prefix | Import                       | Drawing                                                        |
| :--------- | :----- | :--------------------------- | :------------------------------------------------------------- |
| **Stroke** | `kl`   | `@fractaldesign/icons/keylinestroke` | 2px keyline, rounded caps and corners                          |
| **Fill**   | `klf`  | `@fractaldesign/icons/keylinefill`   | Solid. A glyph with no interior keeps its stroke drawing       |
| **Duo**    | `kld`  | `@fractaldesign/icons/keylineduo`    | The keyline over a plate at 40% opacity (`fill-opacity="0.4"`) |
| **Sharp**  | `kls`  | `@fractaldesign/icons/keylinesharp`  | The stroke cut with square corners and butt caps               |

`klHeart`, `klfHeart`, `kldHeart`, and `klsHeart` are the same heart. The plate and the keyline both use `currentColor`. Prefixes for every family are in [Naming, Aliases, Props](./02-naming-aliases-props.md).

## Upgrading to 0.4.0

V0.4.0 adds 4 new icon packs from the Keyline icons set. To upgrade:

```
pnpm add @fractaldesign/icons@0.4.0
```

## Migrating 0.2.x → 0.3.0

- **Per-icon deep imports are gone.** Each family is now a single module, so `@fractaldesign/icons/lucide/activity` no longer resolves. Import from the family subpath instead: `import { luActivity } from '@fractaldesign/icons/lucide'`.
- **The `"./*"` wildcard export was replaced with explicit per-family subpaths.** All documented `fractalicons/<family>` imports and `fractalicons/Icon.svelte` work unchanged — use extensionless subpaths (`@fractaldesign/icons/lucide`, not `@fractaldesign/icons/lucide.js`) so types resolve.
- Export names, aliases, `IconData`, and the `<Icon />` API are unchanged.
