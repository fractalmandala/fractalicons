// Phase 2 of ANIMATED-MAP.md: guidance per family, shipped as data and used by the docs. One docs page per family in
// icons-animated-docs, whose template list is filtered by what works on that family.
import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { choose, lab, openPage } from './support/page.js';

type Support = { templates: string[]; families: Record<string, { name: string; ok: string[]; tune: string[]; partial: string[]; none: string[]; own?: boolean }> };

async function support(baseUrl: string | undefined): Promise<Support> {
	const res = await fetch(new URL('/animation-support.json', baseUrl));

	expect(res.status, '/animation-support.json').toBe(200);

	return (await res.json()) as Support;
}

describe('phase 2: a docs page per family', { tags: ['phase2'] }, () => {
	test('2.1 the support data covers all 34 families and every template', async ({ app }) => {
		const data = await support(app.baseUrl);

		expect(Object.keys(data.families)).toHaveLength(34);
		expect(data.templates).toHaveLength(22);

		for (const [slug, f] of Object.entries(data.families)) {
			if (f.own) continue;

			// every template is in exactly one bucket
			const all = [...f.ok, ...f.tune, ...f.partial, ...f.none];

			expect(new Set(all).size, `${slug}: no template twice`).toBe(all.length);
			expect([...all].sort(), `${slug}: every template placed`).toEqual([...data.templates].sort());
		}
	});

	test('2.2 the families index links every family', async (t) => {
		await openPage(t, '/docs/families');
		await expect(t.screen.getByRole('heading', { name: 'Families', level: 1 })).toBeVisible();
		expect(await t.browser.evaluate(() => document.querySelectorAll('[data-family-card]').length)).toBe(34);
	});

	test('2.3 Material Line Icons says it animates itself and offers no templates', async (t) => {
		await openPage(t, '/docs/families/materialanim');
		await expect(t.screen.getByRole('heading', { name: 'Material Line Icons', level: 1 })).toBeVisible();
		await expect(t.screen.getByText('animates itself', { exact: false })).toBeVisible();
		await expect(t.screen.getByRole('combobox', 'Template')).toBeHidden();
	});

	test('2.4 AnimatedIcon documents supportedTemplates', async (t) => {
		await openPage(t, '/docs/animated-icon');
		await expect(t.screen.getByText('supportedTemplates', { exact: false })).toBeVisible();
	});

	const FAMILIES = ['anticons', 'boxregular', 'boxsolid', 'circum', 'coreui', 'cssgg', 'famicons', 'feathericons', 'flowbite', 'flowbitesolid', 'fontawesome', 'fontawesomesolid', 'heroicons', 'heroiconsfill', 'iconoir', 'iconoirfill', 'ionicons', 'ioniconsfill', 'keylineduo', 'keylinefill', 'keylinesharp', 'keylinestroke', 'lucide', 'octicons', 'phosphor', 'phosphorfill', 'phosphorlight', 'remix', 'remixfill', 'simple', 'simpleline', 'tabler', 'tablerfill'];

	for (const slug of FAMILIES) {
		test(`2.5 ${slug}: the page offers exactly the templates that work on it, and each one plays`, async (t) => {
			const data = await support(t.app.baseUrl);
			const f = data.families[slug];
			// templates that work, in the package's order; "partial" ones work only on part of the family, so they are offered but not asserted
			const offered = data.templates.filter((id) => [...f.ok, ...f.tune, ...f.partial].includes(id));

			await openPage(t, `/docs/families/${slug}`);
			await expect(t.screen.getByRole('heading', { level: 1, name: f.name })).toBeVisible();
			await t.browser.waitForURL(new RegExp(`/docs/families/${slug}`));
			await expect(t.browser.locator(`[data-demo="${slug}"][data-status="ready"]`)).toBeAttached();

			const options = await t.browser.evaluate(() => [...document.querySelectorAll('select[aria-label="Template"] option')].map((o) => (o as HTMLOptionElement).value));

			expect(options, 'the template list').toEqual(offered);

			const note = await t.browser.evaluate(() => document.querySelector('[data-unsupported]')?.textContent ?? '');

			for (const id of f.none) expect(note, `names ${id} as not for this family`).toContain(id);

			// every template that is meant to work shows something on the sample icon
			const sample = await t.browser.evaluate(() => document.querySelector('[data-selected]')?.getAttribute('data-selected') ?? '');

			expect(sample).toBeTruthy();

			for (const id of [...f.ok, ...f.tune]) {
				await choose(t, 'Template', id);
				await lab(t.browser, 'rest', 'css:[data-preview]');
				await t.browser.locator('[data-preview] .animated-icon').hover();
				// the most any of three moments differs from rest: easings that settle early (flip) show little at one fixed moment
				await expect
					.poll(async () => Math.max(...(await Promise.all([0.1, 0.25, 0.4].map((f) => lab<number>(t.browser, 'visibleAt', 'css:[data-preview]', f))))), { timeout: 4000, message: `${slug} ${id}` })
					.toBeGreaterThan(0.005);
				await t.browser.mouse.move(2, 2);
			}
		});
	}
});
