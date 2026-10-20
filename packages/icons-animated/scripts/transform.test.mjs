import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SETS, extractViewBox, iconNameOf, renderComponent, stripSvgWrapper, toComponentName } from './transform.mjs';

const set = (name) => SETS.find((s) => s.name === name);

test('an icon name loses its variant only at the end', () => {
	assert.equal(iconNameOf(set('phosphor'), 'light', 'cloud-lightning-light.svg'), 'cloud-lightning');
	assert.equal(iconNameOf(set('phosphor'), 'fill', 'heart-fill.svg'), 'heart');
	assert.equal(iconNameOf(set('phosphor'), 'regular', 'heart.svg'), 'heart');
	assert.equal(iconNameOf(set('remix'), 'line', 'line-height-line.svg'), 'line-height');
	assert.equal(iconNameOf(set('remix'), 'line', 'a-b.svg'), 'a-b');
	assert.equal(iconNameOf(set('flowbite'), 'outline', 'address-book-outline.svg'), 'address-book');
	assert.equal(iconNameOf(set('ion'), 'filled', 'heart.svg'), 'heart');
});

test('component names are valid identifiers', () => {
	assert.equal(toComponentName('arrow-left'), 'ArrowLeft');
	assert.equal(toComponentName('24-hours'), 'Icon24Hours');
	assert.equal(toComponentName('4k'), 'Icon4k');
});

test('the svg wrapper and its bounding rect are removed, and the fill is kept', () => {
	const body = stripSvgWrapper('<svg viewBox="0 0 256 256" fill="currentColor"><rect width="256" height="256" fill="none"/><path d="M1 1"/></svg>');

	assert.equal(body, '<g fill="currentColor"><path d="M1 1"/></g>');
	assert.equal(stripSvgWrapper('<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>'), '<g fill="currentColor"><path d="M1 1"/></g>');
});

test('hardcoded dark colours become currentColor, and stroke widths lose their px', () => {
	const body = stripSvgWrapper('<svg fill="none"><path stroke="#000" fill="#000000" style="stroke-width:32px"/></svg>');

	assert.ok(body.includes('stroke="currentColor"') && body.includes('fill="currentColor"') && body.includes('stroke-width:32') && !body.includes('32px'));
});

test('the viewBox is read from the source, with a Phosphor-sized fallback', () => {
	assert.equal(extractViewBox('<svg viewBox="0 0 24 24"></svg>'), '0 0 24 24');
	assert.equal(extractViewBox('<svg></svg>'), '0 0 256 256');
});

test('a component carries every variant and defaults to the set default when present', () => {
	const c = renderComponent({ outline: '<g/>', solid: '<g fill="x"/>' }, '0 0 24 24', 'outline');

	assert.ok(c.includes("variant = 'outline'") && c.includes('outline: `<g/>`') && c.includes('solid: `<g fill="x"/>`') && c.includes('viewBox="0 0 24 24"'));
	assert.ok(renderComponent({ solid: '<g/>' }, '0 0 24 24', 'outline').includes("variant = 'solid'"), 'falls back to the variant it has');
});

test('a generated component types its variant from its artwork and re-exports the engine methods', () => {
	const c = renderComponent({ outline: '<g/>', solid: '<g/>' }, '0 0 24 24', 'outline');

	assert.ok(c.includes("type Variant = keyof typeof VARIANTS;"));
	assert.ok(c.includes("Omit<AnimatedIconProps, 'svg' | 'icon' | 'viewBox'> & { variant?: Variant }"));
	assert.ok(c.includes('export function startAnimation'));
	assert.ok(c.includes('export function stopAnimation'));
	assert.ok(c.includes('bind:this={engine}'));
});

test('only an invisible bounding rect is removed: a stroked rect with fill none is a real shape', () => {
	const bounding = '<rect width="256" height="256" fill="none"/>';
	const outline = '<rect x="40" y="40" width="176" height="176" rx="8" fill="none" stroke="currentColor" stroke-width="16"/>';
	const body = stripSvgWrapper(`<svg viewBox="0 0 256 256">${bounding}${outline}<path d="M1 1"/></svg>`);

	assert.ok(!body.includes('width="256" height="256"'), 'the bounding box goes');
	assert.ok(body.includes('rx="8"') && body.includes('stroke="currentColor"'), 'the outline stays');
	assert.ok(stripSvgWrapper(`<svg>${outline.replace('/>', '></rect>')}</svg>`).includes('rx="8"'), 'also in its long form');
});
