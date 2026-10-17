// Phase 1 of ANIMATED-MAP.md: AnimatedIcon takes an icon straight from @fractaldesign/icons, so any family can be animated
// without a generated component. The docs page /docs/animated-icon carries live demos of it.
import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { hoverBy, lab, openPage } from './support/page.js';

// one family that draws strokes, one that draws fills, one that mixes the two
const DEMOS = [
	['lucide', 'stroke'],
	['phosphorfill', 'fill'],
	['famicons', 'mixed']
] as const;

describe('phase 1: AnimatedIcon takes an icon from @fractaldesign/icons', { tags: ['phase1'] }, () => {
	test('1.1 the page documents the icon prop and shows the bridge', async (t) => {
		await openPage(t, '/docs/animated-icon');
		await expect(t.screen.getByRole('heading', { name: 'From @fractaldesign/icons', level: 2 })).toBeVisible();
		await expect(t.screen.getByRole('cell', { name: 'icon', exact: true })).toBeVisible();
		await expect(t.screen.getByText('<AnimatedIcon icon={', { exact: false })).toBeVisible();
	});

	for (const [family, kind] of DEMOS) {
		const sel = `css:[data-bridge="${family}"]`;

		test(`1.2 a ${kind} icon from ${family} renders and plays its template`, async (t) => {
			await openPage(t, '/docs/animated-icon');
			await t.browser.locator(`[data-bridge="${family}"]`).scrollIntoViewIfNeeded?.();
			expect(await lab<number>(t.browser, 'shapeCount', sel), 'the icon drew shapes').toBeGreaterThan(0);
			await lab(t.browser, 'rest', sel);
			await hoverBy(t, sel);
			expect(await lab<number>(t.browser, 'visibleAt', sel, 0.35), 'share of pixels that differ from rest').toBeGreaterThan(0.01);
		});

		test(`1.3 the ${family} icon takes its colour from the prop, filled or stroked`, async (t) => {
			await openPage(t, '/docs/animated-icon');

			const { color } = await lab<{ color: string }>(t.browser, 'a11y', sel);
			const paint = await lab<{ fill: string; stroke: string }[]>(t.browser, 'paint', sel);

			expect(color, 'the demo sets a colour').not.toBe('rgb(0, 0, 0)');
			// every painted shape resolves to that colour: a fill-only icon is not left black
			for (const p of paint) {
				const painted = [p.fill, p.stroke].filter((v) => v !== 'none');

				expect(painted.length).toBeGreaterThan(0);
				for (const v of painted) expect(v).toBe(color);
			}
		});

		test(`1.4 the ${family} icon is named for assistive technology`, async (t) => {
			await openPage(t, '/docs/animated-icon');

			const a = await lab<{ role: string | null; label: string | null }>(t.browser, 'a11y', sel);

			expect(a.role).toBe('img');
			expect(a.label).toBeTruthy();
		});
	}

	test('1.5 an icon with no label is hidden from assistive technology', async (t) => {
		await openPage(t, '/docs/animated-icon');

		const a = await lab<{ role: string | null; hidden: string | null }>(t.browser, 'a11y', 'css:[data-bridge="unlabelled"]');

		expect(a.hidden).toBe('true');
		expect(a.role).toBeNull();
	});
});
