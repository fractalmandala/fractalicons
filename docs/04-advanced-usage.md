---
title: Advanced Usage
description: Icon pickers, dynamic imports, tree-shaking, and adding new icon families.
type: fractalicons
---

## Passing icons as data

Because each icon is just an `IconData` object, you can store icons in variables, arrays, maps, or props and render them dynamically:

```svelte
<script lang="ts">
	import { Icon } from 'fractalicons';
	import { luSun, luMoon } from 'fractalicons/lucide';

	let dark = $state(false);
	const current = $derived(dark ? luMoon : luSun);
</script>

<button onclick={() => (dark = !dark)}>
	<Icon icon={current} />
	{dark ? 'Dark' : 'Light'}
</button>
```

## Building a browser / gallery

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

## Tree-shaking

Named imports (`import { luActivity } from 'fractalicons/lucide'`) are individually tree-shakeable: each family is a single module of top-level icon declarations, so bundlers drop everything you don't reference — your bundle contains only the icons you actually import, no matter how large the family is.
