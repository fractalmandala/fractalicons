#!/usr/bin/env node
// Turns the vendored SVGs into one Svelte component per icon, per set.
//   node scripts/generate.mjs                  vendor/icons/*  ->  src/lib/<set>/icons/*.svelte + src/lib/<set>/index.ts
//   node scripts/generate.mjs --from <dir> --out <dir>      read and write somewhere else (used to compare a candidate source)
// The SVGs come from `pnpm sources` (pinned in the repo's sources.json); nothing here is committed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SETS, extractViewBox, iconNameOf, renderComponent, stripSvgWrapper, toComponentName } from './transform.mjs';

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name) => {
	const i = process.argv.indexOf(name);

	return i === -1 ? null : path.resolve(process.argv[i + 1]);
};
const from = arg('--from') ?? pkgDir;
const out = arg('--out') ?? path.join(pkgDir, 'src/lib');
let total = 0;

for (const set of SETS) {
	/** baseIconName -> { variants: { variantKey: svgBody }, viewBox } */
	const icons = new Map();

	for (const [variant, relDir] of Object.entries(set.variants)) {
		const absDir = path.resolve(from, relDir);

		if (!fs.existsSync(absDir)) {
			console.warn(`  missing: ${absDir}`);
			continue;
		}

		for (const file of fs.readdirSync(absDir).filter((f) => f.endsWith('.svg')).sort()) {
			const iconName = iconNameOf(set, variant, file);
			const raw = fs.readFileSync(path.join(absDir, file), 'utf-8');

			if (!icons.has(iconName)) icons.set(iconName, { variants: {}, viewBox: '0 0 256 256' });

			const entry = icons.get(iconName);

			entry.viewBox = extractViewBox(raw);
			entry.variants[variant] = stripSvgWrapper(raw);
		}
	}

	const outDir = path.join(out, set.name, 'icons');

	fs.rmSync(outDir, { recursive: true, force: true });
	fs.mkdirSync(outDir, { recursive: true });

	const exportLines = [];

	for (const [iconName, { variants, viewBox }] of icons) {
		const pascal = toComponentName(iconName);

		fs.writeFileSync(path.join(outDir, `${pascal}.svelte`), renderComponent(variants, viewBox, set.defaultVariant), 'utf-8');
		exportLines.push(`export { default as ${pascal} } from './icons/${pascal}.svelte';`);
	}

	fs.writeFileSync(path.join(out, set.name, 'index.ts'), exportLines.join('\n') + '\n', 'utf-8');
	console.log(`${set.name.padEnd(10)} ${icons.size} icons`);
	total += icons.size;
}

console.log(`${total} icons across ${SETS.length} sets`);
