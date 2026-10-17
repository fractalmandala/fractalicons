// What the tests do on the docs pages: open a set, find an icon, set the controls, play it.
import type { Browser, Screen } from 'e2e';
import { labSource } from './lab.js';

type Fixtures = { app: { open(path?: string): Promise<void> }; screen: Screen; browser: Browser };

/** open a set page with the measuring helpers installed, and narrow the grid to one icon */
export async function openIcon({ app, screen, browser }: Fixtures, set: string, name: string) {
	await browser.addInitScript(labSource);
	await app.open(`/docs/${set}`);
	await screen.getByRole('searchbox', 'Search icons').fill(name);
	await screen.getByRole('button', { name, exact: true }).waitFor({ state: 'visible' });
}

export async function choose({ screen }: Fixtures, label: string, value: string) {
	await screen.getByRole('combobox', label).selectOption({ value });
}

/** hover the icon so its animation starts, then wait until the browser reports animations running inside it */
export async function hover({ screen, browser }: Fixtures, name: string) {
	await screen.getByRole('button', { name, exact: true }).hover();
	await expect_(browser, name);
}

async function expect_(browser: Browser, name: string) {
	for (let i = 0; i < 50; i++) {
		if ((await browser.evaluate((n: string) => (window as unknown as { __lab: { live(n: string): unknown[] } }).__lab.live(n).length, name)) > 0) return;
		await new Promise((r) => setTimeout(r, 40));
	}
	throw new Error(`no animation started on ${name}`);
}

export const lab = <T>(browser: Browser, fn: string, ...args: unknown[]) =>
	browser.evaluate(({ fn, args }: { fn: string; args: unknown[] }) => (window as unknown as { __lab: Record<string, (...a: unknown[]) => unknown> }).__lab[fn](...args), { fn, args }) as Promise<T>;

/** the same, for an icon named by a selector rather than a grid cell: 'css:[data-bridge="lucide"]' */
export async function hoverBy({ browser }: Fixtures, selector: string) {
	await browser.locator(selector.replace(/^css:/, '') + ' .animated-icon').hover();
	for (let i = 0; i < 50; i++) {
		if ((await browser.evaluate((n: string) => (window as unknown as { __lab: { live(n: string): unknown[] } }).__lab.live(n).length, selector)) > 0) return;
		await new Promise((r) => setTimeout(r, 40));
	}
	throw new Error(`no animation started on ${selector}`);
}

export async function openPage({ app, browser }: Fixtures, path: string) {
	await browser.addInitScript(labSource);
	await app.open(path);
}
