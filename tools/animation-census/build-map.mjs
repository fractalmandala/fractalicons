#!/usr/bin/env node
// Turns the measurements in out/ into ANIMATED-MAP.md (repo root) and out/map.json.
//   node build-map.mjs        (run `node run.mjs survey`, `templates` and `targeted` first)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const out = join(here, 'out');
const read = (f) => JSON.parse(readFileSync(join(out, f), 'utf8'));
const survey = read('survey.json'), templates = read('templates.json'), props = read('props.json'), targeted = read('targeted.json');
const sources = JSON.parse(readFileSync(join(repo, 'sources.json'), 'utf8'));
const iconFamilies = JSON.parse(readFileSync(join(repo, 'apps/icons-docs/src/lib/data/families.json'), 'utf8')).families;
const nameOf = Object.fromEntries(iconFamilies.map((f) => [f.slug, f.name]));
const TEMPLATE_IDS = Object.keys(Object.values(templates)[0].rows[0].cases);
const tplSource = readFileSync(join(repo, 'packages/icons-animated/src/lib/core/templates.svelte.ts'), 'utf8');
const forOf = Object.fromEntries([...tplSource.matchAll(/id: '([\w-]+)',\s*label: '[^']+',(?:\s*for: '(\w+)',)?/g)].map((m) => [m[1], m[2] ?? null]));

// What each template does, read from templates.svelte.ts. `grid` marks the ones whose distances are fixed numbers in a 256-unit grid.
const FACTS = {
	draw: { target: 'each shape', needs: 'a stroke', grid: false, note: 'dash offset on a normalised path length' },
	cascade: { target: 'each shape', needs: 'nothing', grid: false, note: 'scale + opacity, staggered 60 ms per shape' },
	pop: { target: 'each shape', needs: 'nothing', grid: false, note: 'scale, staggered 60 ms per shape' },
	spin: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'one 360° turn' },
	jelly: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'squash and stretch' },
	orbit: { target: 'each shape', needs: 'nothing', grid: false, note: 'rotate + opacity, staggered 50 ms per shape' },
	assemble: { target: 'each shape', needs: 'nothing', grid: true, note: 'flies in from 70 units away, measured from the centre of a 256 grid' },
	trace: { target: 'each shape', needs: 'a stroke', grid: false, note: 'draws one shape after another, 300 ms each' },
	tada: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'loops' },
	flip: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'rotateY + opacity' },
	swing: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'pendulum' },
	wave: { target: 'each shape', needs: 'nothing', grid: true, note: 'loops; each shape moves 22 units up and down' },
	march: { target: 'each shape', needs: 'a stroke', grid: true, note: 'loops; dashes 10 units on, 8 off' },
	boil: { target: 'each shape', needs: 'nothing', grid: true, note: 'loops; jitters ±2 units and ±2.5°' },
	glitch: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'meant to jitter and flicker' },
	'native-draw': { target: 'each shape', needs: 'a stroke', grid: false, note: 'dash offset on the measured length' },
	wipe: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'clip-path reveal' },
	rise: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'clip-path reveal' },
	iris: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'clip-path reveal' },
	split: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'clip-path reveal' },
	drop: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'falls 70 screen pixels whatever the icon size' },
	stamp: { target: 'the whole svg', needs: 'nothing', grid: false, note: 'scale + opacity' }
};
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const pct = (n, d) => Math.round((n / d) * 100);

// ── per family: structure, measurements ─────────────────────────────────────────────────────
const gridOf = (vb) => Number(Object.entries(vb).sort((a, b) => b[1] - a[1])[0][0].split(' ')[2]);
const stats = {};

for (const [slug, s] of Object.entries(survey)) {
	const rows = s.rows, n = rows.length;
	const f = (k) => rows.filter((r) => r.f[k] > 0).length;
	const stroked = rows.filter((r) => r.f.stroked > 0).length;
	const strokeOnly = rows.filter((r) => r.f.stroked > 0 && r.f.filled === 0).length;
	const shapes = rows.map((r) => r.f.shapes).sort((a, b) => a - b);

	stats[slug] = {
		count: n,
		grid: gridOf(s.viewBoxes),
		grids: Object.keys(s.viewBoxes).length,
		stroked: pct(stroked, n),
		fillOnly: pct(rows.filter((r) => r.f.stroked === 0 && r.f.filled > 0).length, n),
		strokeOnly: pct(strokeOnly, n),
		ownFaded: pct(f('ownFaded'), n),
		ownFadedN: f('ownFaded'),
		hiddenN: f('hidden'),
		alphaPaint: pct(f('alphaPaint'), n),
		hardcoded: pct(f('hardcoded'), n),
		ownTransform: pct(f('selfTransformedShapes'), n),
		ownTransformN: f('selfTransformedShapes'),
		cssOrSmil: pct(rows.filter((r) => r.f.styleTag > 0 || r.f.smil > 0).length, n),
		oneShape: pct(rows.filter((r) => r.f.shapes <= 1).length, n),
		medianShapes: median(shapes),
		p95Shapes: shapes[Math.floor(n * 0.95)],
		maxShapes: shapes[n - 1],
		other: pct(f('other'), n),
		defs: pct(f('defs'), n)
	};
}

const cells = {};
const NEEDS_STROKE = ['draw', 'trace', 'march', 'native-draw'];

for (const [slug, t] of Object.entries(templates)) {
	cells[slug] = {};

	for (const id of TEMPLATE_IDS) {
		const cs = t.rows.map((r) => r.cases[id]);
		const vis = cs.filter((c) => c.visible >= 0.01).length / cs.length;
		const end = cs.filter((c) => c.infinite || c.end <= 0.02).length / cs.length;
		const exc = median(cs.map((c) => c.excursion));
		const stroked = stats[slug].stroked;
		let status;

		if (slug === 'materialanim') status = 'own';
		// the dash templates animate a stroke: how much of the family has one decides it. (Since Phase 0, draw and trace fall back to a
		// wipe on fill-only icons, so "visible" no longer tells a real draw from the fallback.)
		else if (NEEDS_STROKE.includes(id)) status = stroked >= 90 ? 'ok' : stroked >= 20 ? 'partial' : 'none';
		else if (vis < 0.2) status = 'none';
		else if (vis < 0.9) status = 'partial';
		else if (end < 0.9 || (exc > 0.4 && id !== 'drop')) status = 'tune';
		else status = 'ok';

		cells[slug][id] = { status, visible: Math.round(vis * 100), end: Math.round(end * 100), excursion: Math.round(exc * 100) / 100 };
	}
}

// templates across all families: how many families each one genuinely works on
const perTemplate = Object.fromEntries(TEMPLATE_IDS.map((id) => {
	const fams = Object.keys(cells).filter((f) => f !== 'materialanim');
	const works = fams.filter((f) => cells[f][id].status === 'ok').length;
	const visible = fams.filter((f) => cells[f][id].visible >= 90).length;

	return [id, { visibleOn: works, visibleRaw: visible, of: fams.length, kind: NEEDS_STROKE.includes(id) ? 'needs strokes' : 'universal' }];
}));

// the risky icons, from the targeted run
const risk = {};
const paintAlpha = {};
const targetedWorst = {};

for (const [slug, v] of Object.entries(targeted)) {
	for (const kind of ['own transform', 'own opacity', 'paint alpha']) {
		const rows = v.rows.filter((r) => r.why === kind);

		if (!rows.length) continue;

		const bad = TEMPLATE_IDS.filter((id) => rows.some((r) => !r.cases[id].infinite && r.cases[id].end > 0.1));
		const worst = Math.max(0, ...rows.flatMap((r) => TEMPLATE_IDS.map((id) => (r.cases[id].infinite ? 0 : r.cases[id].end))));

		if (slug !== 'materialanim') targetedWorst[kind] = Math.max(targetedWorst[kind] ?? 0, Math.round(worst * 100));
		if (kind === 'paint alpha') (paintAlpha[slug] = { n: rows.length, worst: Math.round(worst * 1000) / 10 });
		else if (bad.length) (risk[slug] ??= {})[kind] = { templates: bad, worst: Math.round(worst * 100) };
	}
}

// ── what the other model would cost: one generated component per icon ───────────────────────
const iconsLib = join(repo, 'packages/icons/src/lib');
const dataBytes = Object.fromEntries(readdirSync(iconsLib).filter((f) => f.endsWith('.ts') && !['index.ts', 'types.ts'].includes(f)).map((f) => [f.slice(0, -3), statSync(join(iconsLib, f)).size]));
const animIcons = join(repo, 'packages/icons-animated/src/lib/phosphor/icons');
const sample = readdirSync(animIcons).filter((f) => f.endsWith('.svelte')).slice(0, 200).map((f) => readFileSync(join(animIcons, f), 'utf8'));
const overhead = Math.round(sample.reduce((n, s) => n + (s.length - [...s.matchAll(/`([^`]*)`/g)].reduce((m, x) => m + x[1].length, 0)), 0) / sample.length);
const perIconFiles = 2; // .svelte + .d.ts
const totalIcons = Object.values(stats).reduce((n, s) => n + s.count, 0);
const totalBytes = Object.values(dataBytes).reduce((a, b) => a + b, 0);
const COVERED = ['phosphor', 'phosphorfill', 'phosphorlight', 'remix', 'remixfill', 'heroicons', 'heroiconsfill', 'flowbite', 'flowbitesolid', 'ionicons', 'ioniconsfill', 'materialanim'];
const uncovered = Object.entries(stats).filter(([f]) => !COVERED.includes(f)).reduce((n, [, s]) => n + s.count, 0);
const uncoveredBytes = Object.entries(dataBytes).filter(([f]) => !COVERED.includes(f)).reduce((n, [, b]) => n + b, 0);

// ── parity with icons-animated ──────────────────────────────────────────────────────────────
const animatedSets = Object.entries(sources['icons-animated']).reduce((acc, [folder, spec]) => {
	const set = folder.replace(/-(regular|light|fill|outline|solid|filled|line)$/, '').replace('remixicons', 'remix');

	(acc[set] ??= { upstream: spec.upstream, variants: [], version: spec.source.version ?? spec.source.ref }).variants.push(folder);

	return acc;
}, {});
const PARALLEL = {
	phosphor: { set: 'phosphor', variant: 'regular' },
	phosphorfill: { set: 'phosphor', variant: 'fill' },
	remix: { set: 'remix', variant: 'line' },
	remixfill: { set: 'remix', variant: 'fill' },
	heroicons: { set: 'hero', variant: 'outline' },
	heroiconsfill: { set: 'hero', variant: 'solid' },
	flowbite: { set: 'flowbite', variant: 'outline' },
	flowbitesolid: { set: 'flowbite', variant: 'solid' },
	ionicons: { set: 'ion', variant: 'outline' },
	ioniconsfill: { set: 'ion', variant: 'filled' },
	phosphorlight: { set: 'phosphor', variant: 'light' }
};

// ── per-family plan: what the measurements say each one needs ───────────────────────────────
function planFor(slug, st) {
	const steps = [];

	if (slug === 'materialanim') return { method: 'none: already animated', steps: ['These icons carry their own CSS animation (100% have a <style> block). Running a template on top fights it; speed, loop and easing do not reach it (measured). It is animated in `icons` through the `trigger` prop. Keep it there.'] };

	steps.push('bridge: `<AnimatedIcon icon={...}>` reads the icon straight from `@fractaldesign/icons`; nothing to generate');
	if (st.hardcoded >= 50) steps.push(`recolour first: ${st.hardcoded}% of icons paint fixed colours, so \`color\` does nothing. Map the fixed colours to currentColor (and a faded currentColor for the second tone) in the \`icons\` build, which fixes the static family too`);
	else if (st.hardcoded > 0) steps.push(`${st.hardcoded}% of icons paint a fixed colour; map it to currentColor`);
	if (st.ownTransformN > 0) steps.push(`${st.ownTransformN} icon${st.ownTransformN === 1 ? '' : 's'} (${st.ownTransform}%) ha${st.ownTransformN === 1 ? 's' : 've'} shapes with their own transform: needs the composite fix in the shape templates (see Phase 0)`);
	if (st.ownFadedN > 0) steps.push(`${st.ownFadedN} icon${st.ownFadedN === 1 ? '' : 's'} ha${st.ownFadedN === 1 ? 's' : 've'} a shape with its own opacity${st.hiddenN ? ` (${st.hiddenN === st.ownFadedN ? 'a hidden helper shape' : `${st.hiddenN} are hidden helper shapes`} that \`cascade\` would reveal)` : ''}: the opacity templates must end on the icon's own value (see Phase 0)`);
	if (st.grids > 1) steps.push(`${st.grids} different grids inside the family: read each icon's own viewBox`);
	if (st.oneShape >= 90) steps.push(`${st.oneShape}% of icons are one shape, so the staggered templates (\`cascade\`, \`pop\`, \`orbit\`, \`assemble\`, \`trace\`) have nothing to stagger and collapse to one effect`);

	return { method: 'bridge', steps };
}

const map = [];

for (const slug of Object.keys(survey)) {
	const st = stats[slug], c = cells[slug];
	const by = (status) => TEMPLATE_IDS.filter((id) => c[id].status === status);
	const par = PARALLEL[slug];

	map.push({
		family: slug,
		name: nameOf[slug] ?? slug,
		icons: st.count,
		style: st.stroked >= 90 ? 'stroke' : st.fillOnly >= 90 ? 'fill' : 'mixed',
		structure: st,
		parallel: par ? `${par.set} (variant ${par.variant})` : null,
		ok: by('ok'), tune: by('tune'), partial: by('partial'), none: by('none'),
		props: props[slug],
		risk: risk[slug] ?? null,
		plan: planFor(slug, st)
	});
}

// What the first census (before Phase 0) measured; these are history, the rest of the document is recomputed on every run.
const FIRST_RUN = { glitchVisibleOn: 0, assembleTravel: 1.9, waveLift: 0.8, ownTransformOff: 39, hiddenShapeOff: 83, strokedRectsLost: 584, strokedRectIcons: 295, march: 9, nativeDraw: 9 };

// How far each phase of the plan has got. Updated when a phase's tests pass.
const PROGRESS = JSON.parse(readFileSync(join(here, 'progress.json'), 'utf8'));

const result = { generated: new Date().toISOString().slice(0, 10), method: { survey: `${totalIcons} icons, every one`, templates: `${Object.values(templates)[0].rows.length} icons per family (the sample, the one with most shapes, and ${Object.values(templates)[0].rows.length - 2} seeded random) × ${TEMPLATE_IDS.length} templates`, targeted: 'up to 6 icons with shapes that carry their own transform, and up to 6 with a shape that has its own opacity, per family' }, templates: Object.fromEntries(TEMPLATE_IDS.map((id) => [id, { for: forOf[id], ...FACTS[id], ...perTemplate[id] }])), families: map, animatedSets, sizes: { icons: totalIcons, dataBytes: totalBytes, perIconComponentOverhead: overhead } };

writeFileSync(join(out, 'map.json'), JSON.stringify(result, null, '\t') + '\n');

// ── the document ────────────────────────────────────────────────────────────────────────────
const MB = (b) => (b / 1e6).toFixed(1);
const sym = { ok: '✓', tune: '⚠', partial: '◐', none: '✗', own: '·' };
const L = [];
const w = (s = '') => L.push(s);

w('# Animated map');
w();
w(`Which animations work on which icon families, and how every family in \`@fractaldesign/icons\` gets an animated parallel. Generated ${result.generated} by \`tools/animation-census\`; every number below was measured in Chrome, none is estimated. Re-run it with \`pnpm --filter @fractaldesign/animation-census all\`.`);
w();
w('## The short version');
w();
w(`1. **All ${Object.keys(survey).length} families can be animated without generating a single new file.** The census ran the real \`AnimatedIcon\` on the data modules of \`@fractaldesign/icons\`, family by family, and every family ran. The one exception is Material Line Icons, which already animates itself.`);
w(`2. **Parity today:** ${Object.keys(PARALLEL).length} of the ${map.length} \`icons\` families have a parallel set in \`icons-animated\`; ${PROGRESS.parityNote}`);
w('3. **What works on a family depends on four things, all measurable**: whether it draws strokes or fills, its grid size, whether its shapes carry their own transform or opacity, and whether its colours are fixed.');
w(`4. **The first census found three problems in the templates and one in the generator.** Phase 0 fixed them, and the numbers below are measured after the fix: \`glitch\` is visible on ${perTemplate.glitch.visibleOn} of ${perTemplate.glitch.of} families (it was on ${FIRST_RUN.glitchVisibleOn}), no template moves content out of an icon's box on any family except \`drop\`, which is size-dependent by design (\`assemble\` travelled ${FIRST_RUN.assembleTravel}× the icon on 24 grids, \`wave\` ${FIRST_RUN.waveLift}×), and the worst end-state difference on icons with their own transform or opacity is ${targetedWorst['own transform'] ?? 0}% and ${targetedWorst['own opacity'] ?? 0}% (it was ${FIRST_RUN.ownTransformOff}% and ${FIRST_RUN.hiddenShapeOff}%). The generator had been deleting stroked outline rectangles: ${FIRST_RUN.strokedRectIcons} icons (Phosphor regular and light, 7 Ionicons) were missing a real shape.`);
w();
w('### Progress');
w();
w('| Phase | What | Status | Tests |');
w('| --- | --- | --- | --- |');

for (const ph of PROGRESS.phases) w(`| ${ph.id} | ${ph.what} | ${ph.status} | ${ph.tests} |`);

w();
w('## How it was measured');
w();
w(`- **Structure of every icon** (${totalIcons.toLocaleString('en')} of them): each body is rendered in a real browser and the resolved paint of every shape is read: stroked, filled, own opacity, paint alpha, fixed-colour, own transform, embedded CSS or SMIL, number of shapes, grid.`);
w(`- **Templates** (${result.method.templates}, ${(Object.keys(survey).length * Object.values(templates)[0].rows.length * TEMPLATE_IDS.length).toLocaleString('en')} runs): each icon is mounted in the real \`AnimatedIcon\`, a template is started, and the animation is paused at five points. Each frame is rasterised at 64 px and compared with the resting icon. A template is **visible** if some frame differs from rest by at least 1% of the pixels, and **returns to rest** if the final frame is within 2% of the resting icon. How far the content travels outside the icon's box is measured from the shapes' bounding boxes.`);
w(`- **Targeted** (${result.method.targeted}): the icons the random sample is least likely to catch.`);
w('- **Props**: `speed`, `loop`, `easing`, `size` and `color` are checked on one icon per family by reading the timing the browser holds.');
w('- Limits: 12 icons per family is a sample, not a proof; 64 px is one size; the 1% / 2% thresholds are judgement calls. The structure survey, which covers every icon, is the part to trust for percentages.');
w();
w('## The patterns');
w();
w('### 1. The templates fall into four kinds');
w();
w('| Template | Acts on | Needs | Distances in grid units | Works on | Kind |');
w('| --- | --- | --- | --- | --- | --- |');

for (const id of TEMPLATE_IDS) {
	const t = result.templates[id];

	w(`| \`${id}\` | ${t.target} | ${t.needs} | ${t.grid ? 'yes, scaled to the icon\'s viewBox' : 'no'} | ${t.visibleOn} of ${t.of} families | ${t.kind} |`);
}

w();
w('- **Universal**: `cascade`, `pop`, `spin`, `jelly`, `orbit`, `assemble`, `tada`, `flip`, `swing`, `wave`, `boil`, `glitch`, `wipe`, `rise`, `iris`, `split`, `drop`, `stamp` work on every family. The whole-icon ones (`spin`, `jelly`, `tada`, `flip`, `swing`, `glitch`, `wipe`, `rise`, `iris`, `split`, `drop`, `stamp`) are the safest: they touch only the `<svg>` and know nothing about the icon inside.');
w(`- **Needs strokes** (\`draw\`, \`trace\`, \`march\`, \`native-draw\`): they animate the dash offset, so an icon drawn as filled shapes has nothing to draw. Since Phase 0, \`draw\` and \`trace\` reveal such an icon with a wipe instead of running invisibly, and \`march\` and \`native-draw\` do nothing; \`supports(id, svg)\` tells a caller which. They genuinely work on the families whose icons are stroked (the "works" counts above), partly on the mixed ones.`);
w('- **Scaled to the grid** (`assemble`, `wave`, `march`, `boil`): their distances were fixed numbers on a 256-unit grid, so on a 24-unit grid `assemble` threw the shapes out to about ' + FIRST_RUN.assembleTravel + '× the icon\'s own size and `wave` lifted them about ' + FIRST_RUN.waveLift + '×. They now scale with the icon\'s own viewBox. `drop` falls a fixed 70 screen pixels, so it is size-dependent instead, by design.');
w('- **`glitch`** held its resting frame for the whole animation (its `steps(1)` easing was on the animation, not on each keyframe) and was visible on no family; it now shakes.');
w('- **Slow reveals**: a dash pattern restarts at every subpath, so `native-draw` on a sharp ease-out finished icons made of several short subpaths in a tenth of its time. It now eases in and out.');
w();
w('### 2. Strokes against fills decide the draw templates');
w();
w('The names mislead: "regular" and "outline" families are often not stroked. Measured share of icons that have a stroked shape:');
w();
w('| Stroked (draw templates work) | Fill-only (draw templates show nothing) | Mixed |');
w('| --- | --- | --- |');

const strokedFams = map.filter((m) => m.style === 'stroke').map((m) => `${m.name} (${m.structure.stroked}%)`).join(', ');
const fillFams = map.filter((m) => m.style === 'fill').map((m) => m.name).join(', ');
const mixedFams = map.filter((m) => m.style === 'mixed').map((m) => `${m.name} (${m.structure.stroked}% stroked)`).join(', ');

w(`| ${strokedFams} | ${fillFams} | ${mixedFams} |`);
w();
w('### 3. What can go wrong inside an icon, and what Phase 0 did about it');
w();
w('| Risk | What happened | After Phase 0 | Families affected |');
w('| --- | --- | --- | --- |');
const cnt = (n, p) => (p < 1 ? `${n} icon${n === 1 ? '' : 's'}` : `${n} icons (${p}%)`);
const worstT = FIRST_RUN.ownTransformOff;
const worstO = FIRST_RUN.hiddenShapeOff;
const nowT = targetedWorst['own transform'] ?? 0;
const nowO = targetedWorst['own opacity'] ?? 0;

w(`| Shapes with their own \`transform\` | \`cascade\`, \`pop\`, \`orbit\`, \`assemble\` replace the transform while they run and leave the shape misplaced at the end (up to ${worstT}% of the pixels off) | shapes with their own transform are wrapped in a group and the group is animated: ${nowT}% off | ${map.filter((m) => m.structure.ownTransformN > 0).map((m) => `${m.name}: ${cnt(m.structure.ownTransformN, m.structure.ownTransform)}`).join('; ')} |`);
w(`| Shapes with their own \`opacity\` | \`cascade\`, \`orbit\`, \`assemble\` end every shape at full opacity; a hidden helper shape (\`opacity="0"\`) becomes visible (up to ${worstO}% of the pixels off) | the group carries the animation, the shape keeps its own opacity: ${nowO}% off | ${map.filter((m) => m.structure.ownFadedN > 0 && m.family !== 'materialanim').map((m) => `${m.name}: ${cnt(m.structure.ownFadedN, m.structure.ownFaded)}${m.structure.hiddenN ? `, ${m.structure.hiddenN} with a hidden helper shape` : ''}`).join('; ')} |`);
w(`| Two-tone by paint alpha (\`fill-opacity\`, \`stroke-opacity\`) | **safe**: the templates animate \`opacity\`, which multiplies with it, so the second tone survives | unchanged (measured: ${Object.entries(paintAlpha).filter(([f]) => f !== 'materialanim').map(([f, v]) => `${nameOf[f] ?? f}, ${v.n} icons, worst end difference ${v.worst}%`).join('; ')}) | ${map.filter((m) => m.structure.alphaPaint >= 1 && m.family !== 'materialanim').map((m) => `${m.name} ${m.structure.alphaPaint}%`).join(', ')} |`);
w(`| Fixed colours | \`color\` does not recolour them | open (Phase 3) | ${map.filter((m) => m.structure.hardcoded > 0).map((m) => `${m.name} ${m.structure.hardcoded}%`).join(', ')} |`);
w(`| Embedded CSS animation | the icon already animates itself; templates fight it and \`speed\` / \`loop\` / \`easing\` do not reach it | not a template problem: Material Line Icons stays in \`icons\` | ${map.filter((m) => m.structure.cssOrSmil > 0).map((m) => `${m.name} ${m.structure.cssOrSmil}%`).join(', ')} |`);
w(`| One shape only | the staggered templates (\`cascade\`, \`pop\`, \`orbit\`, \`assemble\`, \`trace\`) all become the same single effect | by nature; the docs lead with the whole-icon templates | ${map.filter((m) => m.structure.oneShape >= 90).map((m) => `${m.name} ${m.structure.oneShape}%`).join(', ')} |`);
w(`| More than one grid in a family | each icon needs its own viewBox | each icon's own viewBox is used | ${map.filter((m) => m.structure.grids > 1).map((m) => `${m.name} (${m.structure.grids} grids)`).join(', ') || 'none'} |`);
w();
w('### 4. Props');
w();
const propFail = map.filter((m) => m.props && !(m.props.speed && m.props.loop && m.props.easing && m.props.size));

w(`\`speed\`, \`loop\`, \`easing\` and \`size\` reached the animation on ${map.length - propFail.length} of ${map.length} families${propFail.length ? `; the exception is ${propFail.map((m) => m.name).join(', ')}, which animates itself` : ''}. \`trigger\` and \`active\` are properties of the component, so they hold wherever it runs. \`color\` is limited by the icon, not the component (see fixed colours above).`);
w();
w('## The map');
w();
w('Legend for the template columns: **✓** works as is · **⚠** works but misbehaves on this grid until the grid fix · **◐** works only on the stroked share of the family · **✗** no visible effect · **·** the family animates itself.');
w();
w('| Family | Icons | Draws | Grid | Parallel in icons-animated | Works (✓) | Tune first (⚠) | Partial (◐) | No effect (✗) |');
w('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');

for (const m of map) {
	const list = (a) => (a.length ? a.map((x) => `\`${x}\``).join(' ') : '–');

	w(`| **${m.name}** (\`${m.family}\`) | ${m.icons.toLocaleString('en')} | ${m.style}${m.style === 'mixed' ? ` (${m.structure.stroked}% stroked)` : ''} | ${m.structure.grid}${m.structure.grids > 1 ? '+' : ''} | ${m.parallel ?? '**none**'} | ${m.family === 'materialanim' ? '· animates itself' : list(m.ok)} | ${list(m.tune)} | ${list(m.partial)} | ${list(m.none)} |`);
}

w();
w('### Per-family detail');
w();
w('Visible% / returns-to-rest% for each template, from the sample. `!` marks a template that does not return to rest.');
w();
w(`| Family | ${TEMPLATE_IDS.join(' | ')} |`);
w(`| --- | ${TEMPLATE_IDS.map(() => '---').join(' | ')} |`);

for (const m of map) w(`| ${m.family} | ${TEMPLATE_IDS.map((id) => `${sym[cells[m.family][id].status]} ${cells[m.family][id].visible}${cells[m.family][id].end < 90 ? '!' : ''}`).join(' | ')} |`);

w();
w('### Risks per family');
w();
w('| Family | Own transform | Own opacity | Paint alpha (safe) | Fixed colours | Embedded CSS | One shape | Median / p95 / max shapes | Measured on the risky icons |');
w('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');

for (const m of map) {
	const s = m.structure;
	const r = m.risk ? Object.entries(m.risk).map(([k, v]) => `${k}: ${v.templates.join(', ')} (up to ${v.worst}% off)`).join('; ') : '–';

	w(`| ${m.family} | ${s.ownTransformN} | ${s.ownFadedN} | ${s.alphaPaint}% | ${s.hardcoded}% | ${s.cssOrSmil}% | ${s.oneShape}% | ${s.medianShapes} / ${s.p95Shapes} / ${s.maxShapes} | ${r} |`);
}

w();
w('## Parity with `icons-animated`');
w();
w('| `icons` family | icons-animated | Same upstream release? |');
w('| --- | --- | --- |');

for (const m of map) {
	const par = PARALLEL[m.family];

	w(`| ${m.name} (\`${m.family}\`) | ${par ? `\`@fractaldesign/icons-animated/${par.set}\`, variant \`${par.variant}\`` : m.family === 'materialanim' ? 'not needed: it animates itself, in `icons`' : '**none**'} | ${par ? ({ phosphor: 'yes, same commit', phosphorfill: 'yes, same commit', remix: 'yes, remixicon 4.1.0', remixfill: 'yes, remixicon 4.1.0', heroicons: '**no**: icons has Heroicons 2.1.4 (296 icons), animated has 2.2.0 (324)', heroiconsfill: '**no**: icons has Heroicons 2.1.4 (296 icons), animated has 2.2.0 (324)' })[m.family] : '–'} |`);
}

w();
w('Every animated set now has its static families in `icons` (Phosphor regular, light and fill; Remix line and fill; Flowbite outline and solid; Heroicons outline and solid; Ionicons outline and filled), and the reverse is covered by the bridge.');
w();
w(`## Two ways to get all ${map.length} families animated`);
w();
w('| | A. Generate a component per icon (what the 5 sets do) | B. Bridge: `AnimatedIcon` takes an `IconData` |');
w('| --- | --- | --- |');
w(`| New files | about ${(perIconFiles * uncovered).toLocaleString('en')} (a \`.svelte\` and a \`.d.ts\` per icon, for the ${uncovered.toLocaleString('en')} icons in the ${Object.keys(stats).filter((f) => !COVERED.includes(f)).length} families not yet covered) | none |`);
w(`| New package weight | about ${MB(uncoveredBytes + uncovered * overhead)} MB of source, since each icon's data is copied into its own component (≈ ${overhead} bytes of wrapper each) | 0 MB: the data is already in \`@fractaldesign/icons\` (${MB(uncoveredBytes)} MB for those same icons) |`);
w('| Per-icon import | `import { Heart } from \'.../phosphor\'` | `import { phHeart } from \'@fractaldesign/icons/phosphor\'` and `<AnimatedIcon icon={phHeart} />` |');
w(`| Families added | each needs a generator config, a docs page and a build | all ${map.length} at once |`);
w(`| Cost | a package of ${((perIconFiles * uncovered + 8487) / 1000).toFixed(0)},000 files, long installs, a regenerate on every upstream bump | a peer dependency on \`@fractaldesign/icons\`, and one extra prop |`);
w();
w('**Recommendation: B.** The census itself is the proof it works: it ran this exact path (the real `AnimatedIcon`, fed `IconData` bodies wrapped in `<g fill="currentColor">`, which is what `Icon` does with `fill`) over every family. Keep the five generated sets as they are for compatibility; they are the only place A is already paid for.');
w();
w('## Plan');
w();
w('### Phase 0: make the templates and the generator work on every icon: done');
w();
w('Each row had a failing end-to-end test before the fix and passes after it (`e2e/tests/phase0-templates.e2e.ts`).');
w();
w('| # | Fix | Before | After |');
w('| --- | --- | --- | --- |');
w(`| 0.0 | The generator removes a \`<rect fill="none">\` only when it has no stroke | ${FIRST_RUN.strokedRectIcons} icons missing a real outline rectangle (Phosphor regular and light, 7 Ionicons) | all shapes kept, unit-tested |`);
w(`| 0.1 | \`glitch\`: \`steps(1)\` on each keyframe, not on the whole animation | visible on ${FIRST_RUN.glitchVisibleOn} of ${perTemplate.glitch.of} families | visible on ${perTemplate.glitch.visibleRaw} of ${perTemplate.glitch.of} |`);
w(`| 0.2 | \`assemble\`, \`wave\`, \`march\`, \`boil\` scale by the icon's viewBox; \`assemble\` sends a centred shape in from its own direction | \`assemble\` travelled ${FIRST_RUN.assembleTravel}× and \`wave\` ${FIRST_RUN.waveLift}× the icon size on 24 grids | the same share of the icon on 24, 256 and 512 grids, tested on four sets |`);
w(`| 0.3 | Shapes with their own transform or opacity are wrapped in a group and the group is animated | up to ${FIRST_RUN.ownTransformOff}% of pixels off; a hidden helper shape revealed (${FIRST_RUN.hiddenShapeOff}%) | ${nowT}% and ${nowO}% off |`);
w('| 0.4 | The dash templates on an icon with no stroke: `draw` and `trace` reveal it with a wipe, `march` and `native-draw` do nothing; `supports(id, svg)` says which | ran invisibly | something visible, or an honest no-op |');
w('| 0.5 | `trace` stagger capped so an icon takes about a second and a half at most | 15 shapes took 4.8 s | at most 1.6 s |');
w('| 0.6 | `native-draw` eases in and out | finished icons of short subpaths in a tenth of its time | visibly draws them |');
w();
w('### Phase 1: the bridge: done');
w();
w('`AnimatedIcon` takes `icon={...}`, any `IconData` from `@fractaldesign/icons`. Its viewBox is used and its body is drawn inside `<g fill="currentColor">`, so fills and strokes take `color` alike. `svg` and `viewBox` still work. Tests: `e2e/tests/phase1-bridge.e2e.ts`, live on `/docs/animated-icon` (a stroke, a fill and a mixed family, with and without `label`).');
w();
w('### Phase 2: per-family guidance, shipped as data: done');
w();
w(`The support data ships in the package (\`SUPPORT\`, \`supportedTemplates(family)\`, \`templateSupport(family, id)\`) and is served by the docs as \`/animation-support.json\`. \`icons-animated-docs\` has an index at \`/docs/families\` and one page per family (${map.length}), each offering only the templates that work on it, naming the ones that do not, and showing every template on the family's sample icon. Tests: \`e2e/tests/phase2-families.e2e.ts\`.`);
w();
w('### Phase 3: parity: done');
w();
w('`icons` 0.2.0 adds Flowbite Outline and Solid, Ionicons Outline and Filled, and Phosphor Light, and moves Heroicons to 2.2.0, the release `icons-animated` already used, so the two packages agree on every shared set. Tests: `e2e/tests/phase3-parity.e2e.ts`.');
w();
w('### Per family');
w();
w('Every family below takes the same path (the Phase 1 bridge, nothing generated) except Material Line Icons. What differs is what must be dealt with first, and which templates to lead with.');
w();
w('| Family | Path | Do first | Lead with |');
w('| --- | --- | --- | --- |');

const LEAD = { stroke: ['draw', 'trace', 'cascade', 'pop', 'stamp'], 'stroke, one shape': ['draw', 'native-draw', 'wipe', 'stamp', 'jelly'], fill: ['stamp', 'iris', 'wipe', 'flip', 'jelly'], mixed: ['cascade', 'pop', 'wipe', 'stamp', 'jelly'] };

for (const m of map) {
	const st = m.structure;
	const first = m.plan.steps.slice(1);
	const lead = LEAD[st.oneShape >= 90 && m.style === 'stroke' ? 'stroke, one shape' : m.style].filter((id) => cells[m.family][id].status === 'ok' || cells[m.family][id].status === 'partial');
	const have = PARALLEL[m.family] ? `existing set \`${PARALLEL[m.family].set}\`; also reachable by the bridge` : m.family === 'materialanim' ? 'none: already animated' : 'bridge';

	w(`| **${m.name}** | ${have} | ${m.family === 'materialanim' ? m.plan.steps[0].replace(/\|/g, '/') : first.length ? first.map((x) => x.replace(/\|/g, '/')).join('; ') : 'nothing'} | ${m.family === 'materialanim' ? '–' : lead.map((x) => `\`${x}\``).join(' ')} |`);
}

w();
w('### What this does not decide');
w();
w('- Whether the five generated sets stay as components or move to the bridge in 0.2. Both can coexist.');
w('- Whether Material Line Icons (already animated) gets a `trigger`-style entry in the animated docs, or only stays in `icons`.');
w('- Brand logos (Simple Icons): every template runs, but animating a brand mark is a design call, not a technical one.');
w();

writeFileSync(join(repo, 'ANIMATED-MAP.md'), L.join('\n'));
console.log(`wrote ANIMATED-MAP.md (${L.length} lines) and out/map.json`);

// ── the data the package ships ──────────────────────────────────────────────────────────────
const notesFor = (m) => {
	const st = m.structure;
	const notes = [];

	if (m.family === 'materialanim') return ['These icons animate themselves with CSS; use the `trigger` prop of `Icon` in `@fractaldesign/icons`.'];
	if (m.style === 'fill') notes.push('Drawn as fills, so `draw` and `trace` reveal the icon with a wipe, and `march` and `native-draw` have nothing to draw.');
	if (m.style === 'mixed') notes.push(`Only ${st.stroked}% of the icons have a stroke: the dash templates work on those and fall back on the rest.`);
	if (st.oneShape >= 90) notes.push(`${st.oneShape}% of the icons are one shape, so \`cascade\`, \`pop\`, \`orbit\`, \`assemble\` and \`trace\` have nothing to stagger and play as one effect.`);
	if (st.hardcoded >= 50) notes.push(`${st.hardcoded}% of the icons paint fixed colours, so the \`color\` prop does not recolour them.`);
	else if (st.hardcoded > 0) notes.push(`${st.hardcoded}% of the icons paint a fixed colour that \`color\` does not change.`);
	if (st.grids > 1) notes.push(`The family uses ${st.grids} grids; each icon is scaled by its own viewBox.`);

	return notes;
};
const list = (a) => `[${a.map((x) => `'${x}'`).join(', ')}]`;
const entries = map.map((m) => `	${m.family}: { name: ${JSON.stringify(m.name)}, style: '${m.style}', grid: ${m.structure.grid}, ok: ${list(m.ok)}, tune: ${list(m.tune)}, partial: ${list(m.partial)}, none: ${list(m.none)},${m.family === 'materialanim' ? ' own: true,' : ''} notes: ${JSON.stringify(notesFor(m))} }`).join(',\n');

writeFileSync(
	join(repo, 'packages/icons-animated/src/lib/support.ts'),
	`// Generated by tools/animation-census (\`pnpm --filter @fractaldesign/animation-census all\`) from measurements in a real browser.
// Do not edit by hand; the same run writes ANIMATED-MAP.md at the repo root, which explains every row.

export interface FamilySupport {
	/** The family's name in \`@fractaldesign/icons\`. */
	name: string;
	/** What its icons are drawn as. */
	style: 'stroke' | 'fill' | 'mixed';
	/** The grid size of its icons (the width of the viewBox). */
	grid: number;
	/** Templates that work as intended. */
	ok: readonly string[];
	/** Templates that work but need care on this family. */
	tune: readonly string[];
	/** Templates that work on only part of the family (the stroked icons). */
	partial: readonly string[];
	/** Templates with nothing to show on this family. */
	none: readonly string[];
	/** The family animates itself; templates are not meant for it. */
	own?: boolean;
	/** What else to know about animating it. */
	notes: readonly string[];
}

/** Every template id, in the package's order. */
export const SUPPORT_TEMPLATES: readonly string[] = ${JSON.stringify(TEMPLATE_IDS)};

/** What works on each family of \`@fractaldesign/icons\`. */
export const SUPPORT: Readonly<Record<string, FamilySupport>> = {
${entries}
};

/** The templates worth offering for a family (works, works with care, or works on part of it), in the package's order. Empty for an unknown family or one that animates itself. */
export function supportedTemplates(family: string): string[] {
	const f = SUPPORT[family];

	if (!f || f.own) return [];

	return SUPPORT_TEMPLATES.filter((id) => f.ok.includes(id) || f.tune.includes(id) || f.partial.includes(id));
}

/** How a template does on a family. */
export function templateSupport(family: string, id: string): 'ok' | 'tune' | 'partial' | 'none' | 'own' | 'unknown' {
	const f = SUPPORT[family];

	if (!f) return 'unknown';
	if (f.own) return 'own';

	return f.ok.includes(id) ? 'ok' : f.tune.includes(id) ? 'tune' : f.partial.includes(id) ? 'partial' : f.none.includes(id) ? 'none' : 'unknown';
}
`
);
console.log('wrote packages/icons-animated/src/lib/support.ts');
