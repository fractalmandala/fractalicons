#!/usr/bin/env node
// Write packages/<pkg>/NOTICE.md from sources.json: one row per icon family with its author, licence and pinned source.
//   node scripts/notice.mjs icons
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = process.argv[2];
const manifest = JSON.parse(readFileSync(join(root, 'sources.json'), 'utf8'));
const families = manifest[pkg];

if (!families) {
	console.error('usage: notice.mjs <package>');
	process.exit(2);
}

const LICENCE = {
	MIT: 'MIT',
	ISC: 'ISC',
	'MPL-2.0': 'MPL 2.0',
	'CC-BY-4.0': 'CC BY 4.0',
	'CC0-1.0': 'CC0 1.0',
	'Apache-2.0': 'Apache 2.0'
};
const link = (s) => (s.type === 'npm' ? `[${s.package}@${s.version}](https://www.npmjs.com/package/${s.package}/v/${s.version})` : `[${s.repo}@${s.ref.slice(0, 12)}](https://github.com/${s.repo}/tree/${encodeURIComponent(s.ref)})`);

// one row per upstream project, listing the families drawn from it
const byUpstream = new Map();

for (const [family, spec] of Object.entries(families)) {
	if (family.startsWith('_')) continue;

	const key = `${spec.upstream}|${spec.license}`;
	const row = byUpstream.get(key) ?? { upstream: spec.upstream, license: spec.license, families: [], sources: new Set() };

	row.families.push(family);
	row.sources.add(link(spec.source));
	byUpstream.set(key, row);
}

const rows = [...byUpstream.values()].sort((a, b) => a.upstream.localeCompare(b.upstream));
const lines = [
	'# Notice',
	'',
	`The code in this package is MIT licensed (see LICENSE). The icons are not: every family below is the work of its own authors and keeps its own licence. They are bundled here unmodified except for the build step that turns each SVG into an icon module.`,
	'',
	'| Icons | Families | Licence | Source |',
	'| --- | --- | --- | --- |',
	...rows.map((r) => `| ${r.upstream} | ${r.families.map((f) => `\`${f}\``).join(', ')} | ${LICENCE[r.license] ?? r.license} | ${[...r.sources].join(', ')} |`),
	'',
	'Licence terms to know about:',
	'',
	'- **CC BY 4.0** (CoreUI, Font Awesome Free icons): attribution is required. This notice is that attribution; keep it with the package.',
	'- **MPL 2.0** (Circum Icons): the files stay under MPL 2.0, and the source is available at the link above.',
	'- **Apache 2.0** (Remix Icon): keep the licence and notices when you redistribute.',
	'- **CC0** (Simple Icons): the drawings are public domain, but the brands they show are trademarks of their owners. Use them to refer to a brand, not to suggest endorsement.',
	'- **Keyline Icons**: the MIT licence covers the drawings, not the name "Keyline Icons".',
	''
];

writeFileSync(join(root, 'packages', pkg, 'NOTICE.md'), lines.join('\n'));
console.log(`wrote packages/${pkg}/NOTICE.md (${rows.length} upstream projects)`);
