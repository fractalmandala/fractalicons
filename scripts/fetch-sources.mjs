#!/usr/bin/env node
// Fetch the upstream SVGs pinned in sources.json and lay them out as a package's vendor inputs.
//   node scripts/fetch-sources.mjs icons            fetch everything for packages/icons
//   node scripts/fetch-sources.mjs icons phosphor   one family
//   node scripts/fetch-sources.mjs icons --check    fetch nothing; compare vendor/ with the manifest's counts
// Needs npm, curl and tar on the PATH. Downloads are cached in .sources/ (not committed).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, statSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const [pkg, ...only] = args.filter((a) => !a.startsWith('--'));
const manifest = JSON.parse(readFileSync(join(root, 'sources.json'), 'utf8'));
const families = manifest[pkg];

if (!pkg || !families) {
	console.error(`usage: fetch-sources.mjs <${Object.keys(manifest).filter((k) => !k.startsWith('_')).join('|')}> [family...] [--check]`);
	process.exit(2);
}

const cacheDir = join(root, '.sources');
const outDir = join(root, 'packages', pkg, 'vendor', 'icons');
const run = (cmd, argv, opts = {}) => execFileSync(cmd, argv, { stdio: ['ignore', 'pipe', 'inherit'], ...opts });
const idOf = (s) => (s.type === 'npm' ? `npm-${s.package.replace(/[@/]/g, '_')}-${s.version}` : `gh-${s.repo.replace('/', '_')}-${s.ref.replace(/[^\w.-]/g, '_')}`);

/** Download and unpack one pinned source; returns the folder holding its files. */
function materialise(source) {
	const dir = join(cacheDir, idOf(source));

	if (existsSync(join(dir, '.done'))) return dir;

	rmSync(dir, { recursive: true, force: true });
	mkdirSync(dir, { recursive: true });

	const tgz = join(dir, 'source.tgz');

	if (source.type === 'npm') {
		const name = run('npm', ['pack', `${source.package}@${source.version}`, '--pack-destination', dir, '--silent']).toString().trim().split('\n').pop();

		copyFileSync(join(dir, name), tgz);
		rmSync(join(dir, name));
	} else {
		run('curl', ['-fsSL', '-o', tgz, `https://codeload.github.com/${source.repo}/tar.gz/${encodeURIComponent(source.ref)}`]);
	}

	// both kinds unpack with one top folder (`package/` or `<repo>-<ref>/`)
	run('tar', ['-xzf', tgz, '-C', dir, '--strip-components=1', '--include=*.svg']);
	rmSync(tgz);
	writeFileSync(join(dir, '.done'), '');

	return dir;
}

function svgsIn(base, dir) {
	// `icons/*` means every folder under icons/ (Remix keeps its icons in category folders)
	const parts = dir.split('/');
	let found = [''];

	for (const part of parts) {
		found = found.flatMap((p) =>
			part === '*' ? readdirSync(join(base, p), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => join(p, e.name)) : [join(p, part)]
		);
	}

	return found.flatMap((p) => (existsSync(join(base, p)) ? readdirSync(join(base, p)).filter((f) => f.endsWith('.svg')).map((f) => join(base, p, f)) : []));
}

let failed = 0;

for (const [family, spec] of Object.entries(families)) {
	if (family.startsWith('_') || (only.length && !only.includes(family))) continue;

	const target = join(outDir, family);

	if (check) {
		const have = existsSync(target) ? readdirSync(target).filter((f) => f.endsWith('.svg')).length : 0;

		console.log(`${have === spec.localCount ? 'ok  ' : 'DIFF'} ${family.padEnd(18)} ${have} files, manifest says ${spec.localCount}`);
		if (have !== spec.localCount) failed++;
		continue;
	}

	const base = materialise(spec.source);
	let files = svgsIn(base, spec.dir);

	const names = new Map();

	for (const file of files) {
		let name = file.split('/').pop().slice(0, -4);

		if (spec.stripPrefix && name.startsWith(spec.stripPrefix)) name = name.slice(spec.stripPrefix.length);
		if (spec.exclude?.some((part) => name.includes(part))) continue;
		if (spec.suffixOnly && !name.endsWith(spec.suffixOnly)) continue;
		if (spec.excludeSuffix?.some((tail) => name.endsWith(tail))) continue;
		if (spec.stripSuffix && name.endsWith(spec.stripSuffix)) name = name.slice(0, -spec.stripSuffix.length);
		if (spec.addSuffix) name += spec.addSuffix;
		if (spec.filter === '-fill' && !name.endsWith('-fill')) continue;
		if (spec.filter === 'not -fill' && name.endsWith('-fill')) continue;

		names.set(name, file);
	}

	rmSync(target, { recursive: true, force: true });
	mkdirSync(target, { recursive: true });

	for (const [name, file] of names) {
		if (spec.replace) {
			// declared text replacements, for upstream files that carry something a plain icon should not
			let text = readFileSync(file, 'utf8');

			for (const [from, to] of spec.replace) text = text.split(from).join(to);
			writeFileSync(join(target, `${name}.svg`), text);
		} else copyFileSync(file, join(target, `${name}.svg`));
	}

	console.log(`${family.padEnd(18)} ${names.size} icons  <- ${idOf(spec.source)}/${spec.dir}`);
}

process.exit(failed ? 1 : 0);
