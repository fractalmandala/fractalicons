<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	import type { IconData, IconSize } from './types.js';

	interface Props extends SVGAttributes<SVGSVGElement> {
		icon: IconData;
		size?: IconSize;
		title?: string;
		decorative?: boolean;
	}

	let { icon, size = '1em', title, decorative = !title, ...rest }: Props = $props();

	const ariaHidden = $derived(decorative ? 'true' : undefined);
	const role = $derived(decorative ? undefined : 'img');
	const labelledBy = $derived(title && !decorative ? `${icon.set}-${icon.name}-title` : undefined);
	const dimension = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox={icon.viewBox}
	width={dimension}
	height={dimension}
	fill="currentColor"
	aria-hidden={ariaHidden}
	aria-labelledby={labelledBy}
	{role}
	{...rest}
>
	{#if title && !decorative}
		<title id={labelledBy}>{title}</title>
	{/if}
	{@html icon.body}
</svg>
