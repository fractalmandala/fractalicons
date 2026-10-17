<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	/** The shape of an icon from `@fractaldesign/icons` (`IconData`); only `body` and `viewBox` are read. */
	export interface AnimatedIconData {
		/** SVG inner content (no <svg> wrapper). */
		body: string;
		/** SVG coordinate space of `body`, e.g. `0 0 24 24`. */
		viewBox: string;
		/** Icon name, informational only. */
		name?: string;
	}

	export interface Props extends HTMLAttributes<HTMLDivElement> {
		/** Pre-stripped SVG inner content (no <svg> wrapper, no bounding rect). Ignored when `icon` is set. */
		svg?: string;
		/** An icon from `@fractaldesign/icons`; its viewBox is used and its body is drawn with `currentColor`. Takes precedence over `svg`. */
		icon?: AnimatedIconData;
		/** SVG coordinate space of `svg`. Phosphor is 256; Remix/Lucide are 24. Ignored when `icon` is set. */
		viewBox?: string;
		/** Template id: draw | cascade | pop | spin | jelly | orbit | assemble | trace | tada | flip | swing | wave | march | boil | glitch | native-draw | wipe | rise | iris | split | drop | stamp */
		template?: string;
		/** Width and height in pixels. */
		size?: number;
		/**
		 * hover → animate on the icon's own mouseenter/leave.
		 * mount → animate once when loaded.
		 * controlled → parent drives via `active` prop.
		 */
		trigger?: 'hover' | 'mount' | 'controlled';
		/** When trigger === 'controlled', animate while true. */
		active?: boolean;
		/** Force the template to repeat forever. */
		loop?: boolean;
		/** Speed multiplier; 2 = twice as fast. */
		speed?: number;
		/** Override the timing easing (any CSS easing string); null = keep the template's own. */
		easing?: string | null;
		/** The accessible name. When set the icon gets `role="img"` and this label; without it the icon is hidden from assistive technology. */
		label?: string;
		/** Extra classes on the wrapping element. */
		class?: string;
		/** Any CSS colour for the icon. Without one it follows the surrounding text colour. */
		color?: string;
	}
</script>

<script lang="ts">
	import { getTemplate, clearProps } from '$lib/core/templates.svelte';

	let {
		svg: svgProp,
		icon,
		viewBox: viewBoxProp = '0 0 256 256',
		template = 'draw',
		size = 24,
		trigger = 'hover',
		active = false,
		loop = false,
		speed = 1,
		easing = null,
		label,
		class: className = '',
		color,
		...rest
	}: Props = $props();

	// An `icon` from @fractaldesign/icons has no fill attribute on most bodies; the group supplies currentColor.
	const svg = $derived(icon ? `<g fill="currentColor">${icon.body}</g>` : (svgProp ?? ''));
	const viewBox = $derived(icon ? icon.viewBox : viewBoxProp);

	let svgEl = $state<SVGSVGElement | null>(null);
	let anims: Animation[] = [];

	// Animations stay still for people who ask their system for less motion: the icon simply sits in its resting state.
	const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	export function startAnimation(): void {
		stopAnimation();
		if (!svgEl || reducedMotion()) return;
		anims = getTemplate(template).run(svgEl);
		for (const a of anims) {
			const eff = a.effect;
			if (!eff) continue;
			const patch: OptionalEffectTiming = {};
			if (loop) patch.iterations = Infinity;
			if (easing) patch.easing = easing;
			if (speed !== 1) {
				const t = eff.getComputedTiming();
				if (typeof t.duration === 'number') patch.duration = t.duration / speed;
				patch.delay = (t.delay ?? 0) / speed;
			}
			if (Object.keys(patch).length) eff.updateTiming(patch);
		}
	}

	export function stopAnimation(): void {
		for (const a of anims) {
			try {
				a.cancel();
			} catch {
				/* already finished */
			}
		}
		anims = [];
		if (svgEl) clearProps(svgEl);
	}

	$effect(() => {
		if (trigger === 'mount' && svg) startAnimation();
	});

	$effect(() => {
		if (trigger !== 'controlled' || !svg) return;
		if (active) startAnimation();
		else stopAnimation();
		// Cancel any running (possibly looping) animation when the trigger mode
		// changes away from 'controlled' (or when active/svg change), so it doesn't
		// keep playing after the box is unchecked.
		return () => stopAnimation();
	});
</script>

<div
	{...rest}
	class="animated-icon {className}"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
	onmouseenter={(e) => {
		if (trigger === 'hover') startAnimation();
		if (typeof rest.onmouseenter === 'function') rest.onmouseenter(e);
	}}
	onmouseleave={(e) => {
		if (trigger === 'hover') stopAnimation();
		if (typeof rest.onmouseleave === 'function') rest.onmouseleave(e);
	}}
	style:color={color}
>
	<svg
		bind:this={svgEl}
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		{viewBox}
		style="overflow: visible; display: block"
	>
		{@html svg}
	</svg>
</div>

