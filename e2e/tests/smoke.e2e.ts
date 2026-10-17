import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('the animated docs site opens', { tags: ['smoke'] }, async ({ app, screen }) => {
	await app.open('/');
	await expect(screen.getByRole('heading', { name: '@fractaldesign/icons-animated', level: 1 })).toBeVisible();
});

test('the static docs site opens', { tags: ['smoke'] }, async ({ app, screen }) => {
	await app.open('http://127.0.0.1:4173/');
	await expect(screen.getByRole('heading', { name: '@fractaldesign/icons', level: 1 })).toBeVisible();
});
