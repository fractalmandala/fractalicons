// Phase 0 of ANIMATED-MAP.md: the templates work on every icon, on every grid.
// Written before the fixes: each test names the problem the census measured, and fails until it is fixed.
import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { choose, hover, lab, openIcon } from './support/page.js';


describe('phase 0: the generator keeps every real shape', { tags: ['phase0'] }, () => {
	// 1.0.4 deleted every <rect fill="none">, including the stroked outlines that are real shapes; the counts are those in @fractaldesign/icons
	for (const [name, shapes] of [['AddressBook', 6], ['Columns', 2], ['CalendarStar', 4], ['SidebarSimple', 2], ['Jar', 4]] as const) {
		test(`0.0 Phosphor ${name} has all ${shapes} of its shapes`, async (t) => {
			await openIcon(t, 'phosphor', name);
			expect(await lab<number>(t.browser, 'shapeCount', name)).toBe(shapes);
		});
	}

	test('0.0 the light cut keeps its outline too', async (t) => {
		await openIcon(t, 'phosphor', 'AddressBook');
		await choose(t, 'Variant', 'light');
		expect(await lab<number>(t.browser, 'shapeCount', 'AddressBook')).toBe(6);
	});
});

describe('phase 0: templates that work on every icon', { tags: ['phase0'] }, () => {
	test('0.1 glitch visibly shakes the icon', async (t) => {
		await openIcon(t, 'phosphor', 'Heart');
		await choose(t, 'Template', 'glitch');
		await hover(t, 'Heart');
		await lab(t.browser, 'seek', 'Heart', 0.2);

		const style = await lab<{ transform: string; opacity: number }>(t.browser, 'rootStyle', 'Heart');

		// at 20% the keyframe at 15% is in force: the icon is offset and faded, not at rest
		expect(style.transform, 'the icon is moved').not.toBe('none');
		expect(style.transform, 'not the identity').not.toBe('matrix(1, 0, 0, 1, 0, 0)');
		expect(style.opacity, 'and dimmed').toBeLessThan(1);
	});

	// the distances are fixed numbers on a 256 grid: they must scale with the icon's own grid
	const GRIDS: [string, string][] = [['phosphor', 'Heart'], ['remix', 'Heart'], ['hero', 'Heart'], ['ion', 'Heart']];

	for (const [set, name] of GRIDS) {
		test(`0.2 assemble travels the same share of the icon on the ${set} grid`, async (t) => {
			await openIcon(t, set, name);
			await choose(t, 'Template', 'assemble');
			await hover(t, name);

			const w = await lab<number>(t.browser, 'vbWidth', name);
			const frames = await lab<{ frames: { tx: number; ty: number }[] }[]>(t.browser, 'keyframes', name);
			const first = frames[0].frames[0];

			// designed on a 256 grid: 70 units, which is 27% of the icon
			expect(Math.hypot(first.tx, first.ty) / w).toBeGreaterThan(0.2);
			expect(Math.hypot(first.tx, first.ty) / w).toBeLessThan(0.35);
		});

		test(`0.2 wave lifts the same share of the icon on the ${set} grid`, async (t) => {
			await openIcon(t, set, name);
			await choose(t, 'Template', 'wave');
			await hover(t, name);

			const w = await lab<number>(t.browser, 'vbWidth', name);
			const frames = await lab<{ frames: { tx: number; ty: number }[] }[]>(t.browser, 'keyframes', name);
			const peak = Math.max(...frames.flatMap((f) => f.frames.map((k) => Math.abs(k.ty))));

			// 22 units on a 256 grid: 8.6% of the icon
			expect(peak / w).toBeGreaterThan(0.06);
			expect(peak / w).toBeLessThan(0.12);
		});

		test(`0.2 boil jitters the same share of the icon on the ${set} grid`, async (t) => {
			await openIcon(t, set, name);
			await choose(t, 'Template', 'boil');
			await hover(t, name);

			const w = await lab<number>(t.browser, 'vbWidth', name);
			const frames = await lab<{ frames: { tx: number; ty: number }[] }[]>(t.browser, 'keyframes', name);
			const peak = Math.max(...frames.flatMap((f) => f.frames.map((k) => Math.hypot(k.tx, k.ty))));

			// about 2 units on a 256 grid: under 1% of the icon
			expect(peak / w).toBeGreaterThan(0.004);
			expect(peak / w).toBeLessThan(0.014);
		});

		// fill-only icons have no stroke to dash, so there is nothing to measure on them
		if (set !== 'remix') test(`0.2 march keeps its dashes in proportion on the ${set} grid`, async (t) => {
			await openIcon(t, set, name);
			await choose(t, 'Template', 'march');
			await hover(t, name);

			const w = await lab<number>(t.browser, 'vbWidth', name);
			const dashes = await lab<number[]>(t.browser, 'dashes', name);

			// 10 units on a 256 grid: 4% of the icon
			expect(dashes.length).toBeGreaterThan(0);
			for (const d of dashes) {
				expect(d / w).toBeGreaterThan(0.03);
				expect(d / w).toBeLessThan(0.05);
			}
		});
	}

	test('0.2 assemble on a 24 grid does not throw the icon out of its box', async (t) => {
		await openIcon(t, 'remix', 'Heart');
		await choose(t, 'Template', 'assemble');
		await hover(t, 'Heart');
		await lab(t.browser, 'seek', 'Heart', 0.1);
		expect(await lab<number>(t.browser, 'excursion', 'Heart')).toBeLessThan(0.5);
	});
});

describe('phase 0: an animation never alters the icon', { tags: ['phase0'] }, () => {
	for (const name of ['AddressBook', 'Alien']) {
		for (const template of ['cascade', 'pop', 'orbit', 'assemble']) {
			test(`0.3 ${template} returns ${name}'s own transforms to where they were`, async (t) => {
				await openIcon(t, 'phosphor', name);
				const rest = await lab<string[]>(t.browser, 'arrangement', name);

				await choose(t, 'Template', template);
				await hover(t, name);
				await lab(t.browser, 'finish', name);
				expect(await lab<string[]>(t.browser, 'arrangement', name)).toEqual(rest);
			});
		}
	}

	for (const template of ['cascade', 'orbit', 'assemble']) {
		test(`0.3 ${template} leaves a hidden helper shape hidden`, async (t) => {
			await openIcon(t, 'phosphor', 'HighHeel');
			const rest = await lab<string[]>(t.browser, 'arrangement', 'HighHeel');

			expect(rest.some((s) => s.endsWith('|0')), 'the icon has a hidden shape').toBe(true);
			await choose(t, 'Template', template);
			await hover(t, 'HighHeel');
			await lab(t.browser, 'finish', 'HighHeel');
			expect(await lab<string[]>(t.browser, 'arrangement', 'HighHeel')).toEqual(rest);
		});
	}
});

describe('phase 0: no template runs invisibly', { tags: ['phase0'] }, () => {
	for (const [set, name, variant, template] of [
		['phosphor', 'Heart', 'fill', 'draw'],
		['phosphor', 'Heart', 'fill', 'trace'],
		['remix', 'Heart', 'line', 'draw'],
		['hero', 'Heart', 'solid', 'draw']
	] as const) {
		test(`0.4 ${template} on the ${set} ${variant} cut shows something`, async (t) => {
			await openIcon(t, set, name);
			await choose(t, 'Variant', variant);
			await choose(t, 'Template', template);
			await lab(t.browser, 'rest', name);
			await hover(t, name);
			expect(await lab<number>(t.browser, 'visibleAt', name, 0.4), 'share of pixels that differ from rest').toBeGreaterThan(0.01);
		});
	}

	test('0.5 trace on a fifteen-shape icon finishes in about a second and a half', async (t) => {
		await openIcon(t, 'phosphor', 'FediverseLogo');
		expect(await lab<number>(t.browser, 'shapeCount', 'FediverseLogo')).toBeGreaterThanOrEqual(12);
		await choose(t, 'Template', 'trace');
		await hover(t, 'FediverseLogo');

		const live = await lab<{ end: number }[]>(t.browser, 'live', 'FediverseLogo');

		expect(Math.max(...live.map((a) => a.end))).toBeLessThanOrEqual(1600);
	});

	for (const name of ['BookmarkSlash', 'AcademicCap', 'BugAnt']) {
		test(`0.6 native-draw visibly draws ${name}`, async (t) => {
			await openIcon(t, 'hero', name);
			await choose(t, 'Template', 'native-draw');
			await lab(t.browser, 'rest', name);
			await hover(t, name);
			expect(await lab<number>(t.browser, 'visibleAt', name, 0.15)).toBeGreaterThan(0.01);
		});
	}
});
