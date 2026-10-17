// The transform the generator applies to every icon: strip the <svg> wrapper, normalise colours, name the component.
// Kept apart from the CLI so it can be tested and so a candidate source can be compared against a published build.

// ── The sets: which folders of SVGs make one set, and how a file name becomes an icon name ──
/**
 * The icon name for a file: its name without `.svg` and without the variant word on the END.
 * (The first version removed the first "-light" or "-line" anywhere, so `cloud-lightning-light` became `cloudning`.)
 */
function stripVariant(filename, variant) {
	const base = filename.replace(/\.svg$/, '');
	const tail = `-${variant}`;

	return base.endsWith(tail) ? base.slice(0, -tail.length) : base;
}

export const SETS = [
	{
		name: 'phosphor',
		variants: {
			regular: 'vendor/icons/phosphor-regular',
			light: 'vendor/icons/phosphor-light',
			fill: 'vendor/icons/phosphor-fill',
		},
		defaultVariant: 'regular',
		nameFromFile: stripVariant,
		stripSuffix: { fill: '-fill', light: '' },
	},
	{
		name: 'remix',
		variants: {
			fill: 'vendor/icons/remixicons-fill',
			line: 'vendor/icons/remixicons-line',
		},
		defaultVariant: 'line',
		nameFromFile: stripVariant,
		stripSuffix: {},
	},
	{
		name: 'flowbite',
		variants: {
			outline: 'vendor/icons/flowbite-outline',
			solid: 'vendor/icons/flowbite-solid',
		},
		defaultVariant: 'outline',
		nameFromFile: stripVariant,
		stripSuffix: {},
	},
	{
		name: 'hero',
		variants: {
			outline: 'vendor/icons/hero-outline',
			solid: 'vendor/icons/hero-solid',
		},
		defaultVariant: 'outline',
		nameFromFile: stripVariant,
		stripSuffix: {},
	},
	{
		name: 'ion',
		variants: {
			outline: 'vendor/icons/ion-outline',
			filled: 'vendor/icons/ion-filled',
		},
		defaultVariant: 'outline',
		nameFromFile: stripVariant,
		stripSuffix: {},
	},
];

// ── Helpers ───────────────────────────────────────────────────────────

export function toPascalCase(str) {
	return str
		.split('-')
		.map((s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : ''))
		.join('');
}

/**
 * Turn an icon name into a valid JS component identifier. JS identifiers can't
 * start with a digit (e.g. "24-hours" → "24Hours" is invalid in an export), so
 * digit-leading names are prefixed with "Icon" → "Icon24Hours".
 */
export function toComponentName(str) {
	const pascal = toPascalCase(str);
	return /^[0-9]/.test(pascal) ? `Icon${pascal}` : pascal;
}

// Hardcoded foreground colors used by each library — normalized to currentColor so
// icons respond to the CSS `color` property (and therefore to theme tokens).
export const ICON_HARDCODED_COLORS = ['#000', '#000000', '#0F172A', '#0f172a'];

/**
 * A bounding box some sets draw (Phosphor's \`<rect width="256" height="256" fill="none"/>\`) is invisible and goes. A rect with
 * \`fill="none"\` that also has a stroke is a real outline (the cover of a book, a calendar's frame) and stays: removing it, as
 * the first version did for every such rect, deleted a shape from 288 Phosphor icons and 7 Ionicons.
 */
const INVISIBLE_RECT = /<rect\b[^>]*\bfill="none"[^>]*?(?:\/>|><\/rect>)\s*/gi;
const dropIfInvisible = (tag) => (/\bstroke\s*=/.test(tag) || /style="[^"]*stroke\s*:/.test(tag) ? tag : '');

/** Strip the <svg> wrapper and any <rect fill="none" …> bounding rect from raw SVG.
 *  Also:
 *  - Preserves any fill="…" on <svg> via a <g> wrapper (fill="none" for outline libs,
 *    fill="currentColor" for Remix — without this, child paths default to fill="black").
 *  - Removes "px" from stroke-width in inline styles: ion-outline uses stroke-width:32px
 *    (CSS px, absolute) which at 28px display size makes a 512-viewBox icon a solid blob.
 *    Dropping the unit makes it 32 SVG user units — thin and viewBox-relative.
 *  - Replaces hardcoded dark icon colors with currentColor so icons follow CSS `color`. */
export function stripSvgWrapper(raw) {
	const svgFillMatch = raw.match(/<svg[^>]*\bfill="([^"]+)"/i);
	const svgFill = svgFillMatch ? svgFillMatch[1] : null;

	let inner = raw
		.replace(/<svg[^>]*>/i, '')
		.replace(/<\/svg>/i, '')
		
		.replace(INVISIBLE_RECT, dropIfInvisible)
		.trim();

	// Fix stroke-width:Npx → stroke-width:N (user units, scales with viewBox).
	inner = inner.replace(/\bstroke-width:(\d+(?:\.\d+)?)px/g, 'stroke-width:$1');

	// Normalize hardcoded foreground colors → currentColor.
	for (const color of ICON_HARDCODED_COLORS) {
		inner = inner.replaceAll(`stroke="${color}"`, 'stroke="currentColor"');
		inner = inner.replaceAll(`fill="${color}"`, 'fill="currentColor"');
		inner = inner.replaceAll(`stroke:${color}`, 'stroke:currentColor');
		inner = inner.replaceAll(`fill:${color}`, 'fill:currentColor');
	}

	// If the SVG had an explicit fill, preserve it via a <g> wrapper.
	// If it had no fill, default to currentColor so fill-type icons (phosphor-fill,
	// ion-filled, etc.) whose paths have no fill attribute don't render as SVG-default black.
	return `<g fill="${svgFill ?? 'currentColor'}">${inner}</g>`;
}

/** Pull the viewBox from the source <svg> so the icon renders in its own coordinate space
 *  (Phosphor is 256×256, Remix/Lucide are 24×24). Falls back to Phosphor's box. */
export function extractViewBox(raw) {
	const m = raw.match(/<svg[^>]*\bviewBox="([^"]+)"/i);
	return m ? m[1] : '0 0 256 256';
}


/** The Svelte component written for one icon: every variant's SVG body, and the default variant. */
export function renderComponent(variantSvgs, viewBox, defaultVariant) {
	const variantsEntries = Object.entries(variantSvgs).map(([k, v]) => `\t\t${k}: \`${v}\``);
	const variantsObj = `{\n${variantsEntries.join(',\n')}\n\t}`;
	const presentVariants = Object.keys(variantSvgs);
	const defaultV = presentVariants.includes(defaultVariant) ? defaultVariant : presentVariants[0];

	return `<script lang="ts">
\timport AnimatedIcon from '../../core/AnimatedIcon.svelte';

\tconst VARIANTS: Record<string, string> = ${variantsObj};

\tinterface Props {
\t\tvariant?: string;
\t\t[key: string]: unknown;
\t}

\tlet { variant = '${defaultV}', ...rest }: Props = $props();
</script>

<AnimatedIcon svg={VARIANTS[variant] ?? VARIANTS['${defaultV}']} viewBox="${viewBox}" {...rest} />
`;
}

/** The icon name a file stands for, given its set and variant. */
export function iconNameOf(set, variant, file) {
	let name = file;
	const suffix = set.stripSuffix?.[variant];

	if (suffix) {
		const dotIndex = name.lastIndexOf('.svg');
		const base = dotIndex !== -1 ? name.slice(0, dotIndex) : name;

		if (base.endsWith(suffix)) name = base.slice(0, -suffix.length) + '.svg';
	}

	return set.nameFromFile(name, variant);
}
