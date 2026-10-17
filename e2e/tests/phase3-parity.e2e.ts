// Phase 3 of ANIMATED-MAP.md: the same icon families in `icons` and `icons-animated`.
import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { openPage } from './support/page.js';

const STATIC = 'http://127.0.0.1:4173';

async function count(t: Parameters<typeof openPage>[0], url: string) {
	await t.app.open(url);
	await t.browser.locator('[data-status="ready"]').waitFor?.({ state: 'attached' });
	await expect.poll(() => t.browser.evaluate(() => document.querySelector('[data-count]')?.getAttribute('data-count') ?? ''), { timeout: 15000 }).not.toBe('');

	return Number(await t.browser.evaluate(() => document.querySelector('[data-count]')!.getAttribute('data-count')));
}

describe('phase 3: the missing families exist in icons', { tags: ['phase3'] }, () => {
	for (const [slug, name, n] of [
		['flowbite', 'Flowbite Outline', 411],
		['flowbitesolid', 'Flowbite Solid', 340],
		['ionicons', 'Ionicons Outline', 421],
		['ioniconsfill', 'Ionicons Filled', 515],
		['phosphorlight', 'Phosphor Light', 1512]
	] as const) {
		test(`3.1 ${slug} has a page with its ${n} icons`, async (t) => {
			await t.app.open(`${STATIC}/docs/${slug}`);
			await expect(t.screen.getByRole('heading', { level: 1, name })).toBeVisible();
			expect(await count(t, `${STATIC}/docs/${slug}`), 'icons in the demo').toBe(n);
		});
	}

	test('3.2 the landing page lists 34 families', async (t) => {
		await t.app.open(`${STATIC}/`);
		expect(await t.browser.evaluate(() => document.querySelectorAll('[data-families] a').length)).toBe(34);
	});

	test('3.3 Heroicons is one release in both packages', async (t) => {
		expect(await count(t, `${STATIC}/docs/heroicons`)).toBe(324);
		expect(await count(t, `${STATIC}/docs/heroiconsfill`)).toBe(324);
		expect(await count(t, '/docs/hero')).toBe(324);
	});
});

describe('phase 3: every animated set has its static families', { tags: ['phase3'] }, () => {
	// animated set -> the families in icons it is made of
	const PAIRS: [string, string[]][] = [
		['phosphor', ['phosphor', 'phosphorfill', 'phosphorlight']],
		['remix', ['remix', 'remixfill']],
		['flowbite', ['flowbite', 'flowbitesolid']],
		['hero', ['heroicons', 'heroiconsfill']],
		['ion', ['ionicons', 'ioniconsfill']]
	];

	for (const [set, families] of PAIRS) {
		test(`3.4 animated ${set} holds the icons of ${families.join(' and ')}`, async (t) => {
			const animated = await count(t, `/docs/${set}`);
			const counts: number[] = [];

			for (const f of families) counts.push(await count(t, `${STATIC}/docs/${f}`));

			// an icon that has two variants is one icon in the animated set: it is at least the largest family and at most the sum
			expect(animated).toBeGreaterThanOrEqual(Math.max(...counts));
			expect(animated).toBeLessThanOrEqual(counts.reduce((a, b) => a + b, 0));
		});
	}

	test('3.5 both sites list the same families', async (t) => {
		await t.app.open(`${STATIC}/`);

		const fromHref = (links: string[]) => links.map((h) => h.split('/').pop()).sort();
		const staticSlugs = fromHref(await t.browser.evaluate(() => [...document.querySelectorAll('[data-families] a')].map((a) => a.getAttribute('href') ?? '')));

		await t.app.open('/docs/families');

		const animatedSlugs = (await t.browser.evaluate(() => [...document.querySelectorAll('[data-family-card]')].map((a) => a.getAttribute('data-family-card') ?? ''))).sort();

		expect(staticSlugs).toHaveLength(34);
		expect(animatedSlugs).toEqual(staticSlugs);
	});
});
