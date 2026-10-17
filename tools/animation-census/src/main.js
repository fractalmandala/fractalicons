// The measuring harness. It runs inside a real browser (see ../run.mjs): it looks at the structure of icon bodies, and runs the
// package's own templates on them and measures what the browser actually draws.
import { mount, unmount } from 'svelte';
import { AnimatedIcon, TEMPLATE_IDS, getTemplate } from '@fractaldesign/icons-animated';
import { loaders } from './loaders.js';

const SHAPES = 'path,circle,line,polyline,polygon,ellipse,rect'; // what the templates animate (templates.svelte.ts)
const stage = document.getElementById('stage');
const COLOR = 'rgb(1, 2, 3)';

/** every icon of a family, once each */
async function entriesOf(slug) {
	const mod = await loaders[slug]();
	const seen = new Map();

	for (const [key, value] of Object.entries(mod)) {
		if (!value || typeof value !== 'object' || !value.body) continue;

		const prev = seen.get(value);

		if (!prev || key.length < prev.length) seen.set(value, key);
	}

	return [...seen].map(([icon, exportName]) => ({ exportName, name: icon.name, viewBox: icon.viewBox, body: `<g fill="currentColor">${icon.body}</g>`, raw: icon.body }));
}

// ── structure of one icon body, read from how the browser resolves it ───────────────────────
function features(host, entry) {
	host.setAttribute('viewBox', entry.viewBox);
	host.innerHTML = entry.body;

	const shapes = [...host.querySelectorAll(SHAPES)];
	const paint = (el) => {
		const cs = getComputedStyle(el);

		return { fill: cs.fill, stroke: cs.stroke, sw: parseFloat(cs.strokeWidth) || 0, opacity: parseFloat(cs.opacity), fo: parseFloat(cs.fillOpacity), so: parseFloat(cs.strokeOpacity) };
	};
	let stroked = 0, filled = 0, ownFaded = 0, hidden = 0, alphaPaint = 0, hardcoded = 0, gradient = 0;

	for (const el of shapes) {
		const p = paint(el);
		const hasStroke = p.stroke !== 'none' && p.sw > 0;
		const hasFill = p.fill !== 'none';

		if (hasStroke) stroked++;
		if (hasFill) filled++;
		// a shape with its own opacity is what the opacity templates overwrite; paint alpha (fill-opacity) they never touch
		if (p.opacity < 1) ownFaded++;
		if (p.opacity === 0) hidden++;
		if (p.fo < 1 || p.so < 1) alphaPaint++;
		if ((hasStroke && !p.stroke.startsWith('rgb(1,') && p.stroke !== COLOR && !p.stroke.startsWith('url')) || (hasFill && p.fill !== COLOR && !p.fill.startsWith('url'))) hardcoded++;
		if (p.stroke.startsWith('url') || p.fill.startsWith('url')) gradient++;
	}

	return {
		shapes: shapes.length,
		stroked,
		filled,
		ownFaded,
		hidden,
		alphaPaint,
		hardcoded,
		gradient,
		transformAttr: host.querySelectorAll('[transform]').length,
		selfTransformedShapes: shapes.filter((el) => el.hasAttribute('transform')).length,
		styleTag: host.querySelectorAll('style').length,
		smil: host.querySelectorAll('animate,animateTransform,animateMotion,set').length,
		defs: host.querySelectorAll('defs,clipPath,mask,filter').length,
		other: host.querySelectorAll('text,use,image,foreignObject').length,
		paths: host.querySelectorAll('path').length
	};
}

function newMeasureHost() {
	const ns = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(ns, 'svg');

	svg.setAttribute('width', '64');
	svg.setAttribute('height', '64');
	svg.style.color = COLOR;
	svg.style.position = 'absolute';
	stage.append(svg);

	return svg;
}

/** a census of every icon in a family */
async function survey(slug, progress) {
	const entries = await entriesOf(slug);
	const host = newMeasureHost();
	const rows = [];
	const viewBoxes = {};

	for (let i = 0; i < entries.length; i++) {
		const e = entries[i];

		rows.push({ i, name: e.name, f: features(host, e) });
		viewBoxes[e.viewBox] = (viewBoxes[e.viewBox] ?? 0) + 1;
		if (i % 400 === 0) progress?.(`survey ${slug} ${i}/${entries.length}`);
	}

	host.remove();

	return { slug, count: entries.length, viewBoxes, rows };
}

// ── running a template and looking at the pixels ────────────────────────────────────────────
const PX = 64;
const canvas = document.createElement('canvas');

canvas.width = canvas.height = PX;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

async function raster(svgEl) {
	const xml = new XMLSerializer().serializeToString(svgEl);
	const img = new Image();

	img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
	await img.decode();
	ctx.clearRect(0, 0, PX, PX);
	ctx.drawImage(img, 0, 0, PX, PX);

	const d = ctx.getImageData(0, 0, PX, PX).data;
	const a = new Uint8Array(PX * PX);

	for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];

	return a;
}

const diff = (a, b) => {
	let n = 0;

	for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 40) n++;

	return n / a.length;
};

const FRACTIONS = [0.12, 0.35, 0.6, 0.85, 1];

async function runCase(entry, template, options = {}) {
	const target = document.createElement('div');

	stage.append(target);

	const instance = mount(AnimatedIcon, { target, props: { svg: entry.body, viewBox: entry.viewBox, template, size: PX, trigger: 'controlled', color: COLOR, ...options } });

	await new Promise((r) => requestAnimationFrame(() => r()));

	const svgEl = target.querySelector('svg');
	const wrapper = target.firstElementChild;
	const box = svgEl.getBoundingClientRect();
	const rest = await raster(svgEl);
	const result = { started: 0, visible: 0, end: 0, excursion: 0, infinite: false, error: null };

	try {
		instance.startAnimation();

		const anims = document.getAnimations().filter((a) => a.effect?.target && target.contains(a.effect.target));

		result.started = anims.length;

		if (anims.length) {
			result.infinite = anims.some((a) => a.effect.getTiming().iterations === Infinity);

			const T = Math.max(...anims.map((a) => {
				const t = a.effect.getTiming();
				const end = a.effect.getComputedTiming().endTime;

				return Number.isFinite(end) ? end : (typeof t.duration === 'number' ? t.duration : 1000) + Math.max(0, t.delay ?? 0);
			}));
			const els = [...new Set(anims.map((a) => a.effect.target))];

			for (const a of anims) a.pause();

			const saved = new Map(els.map((el) => [el, el.getAttribute('style')]));
			const shapes = [...svgEl.querySelectorAll(SHAPES)];

			for (const f of FRACTIONS) {
				for (const a of anims) a.currentTime = f * T;

				// bounding box of what is drawn, relative to the icon's own box: how far does it travel outside it?
				const rects = shapes.map((s) => s.getBoundingClientRect()).filter((r) => r.width || r.height);

				if (rects.length) {
					const left = Math.min(...rects.map((r) => r.left)), right = Math.max(...rects.map((r) => r.right));
					const top = Math.min(...rects.map((r) => r.top)), bottom = Math.max(...rects.map((r) => r.bottom));
					const over = Math.max(0, box.left - left, right - box.right, box.top - top, bottom - box.bottom);

					result.excursion = Math.max(result.excursion, over / PX);
				}

				for (const a of anims) {
					try {
						a.commitStyles();
					} catch {
						/* not rendered */
					}
				}

				const frame = await raster(svgEl);
				const d = diff(frame, rest);

				result.visible = Math.max(result.visible, d);
				if (f === 1) result.end = d;

				for (const [el, style] of saved) {
					if (style === null) el.removeAttribute('style');
					else el.setAttribute('style', style);
				}
			}
		}
	} catch (e) {
		result.error = String(e).slice(0, 120);
	}

	for (const a of document.getAnimations()) if (a.effect?.target && target.contains(a.effect.target)) a.cancel();
	unmount(instance);
	target.remove();
	void wrapper;

	return result;
}

// ── the template measurements for one family ────────────────────────────────────────────────
function rng(seed) {
	let s = seed >>> 0;

	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;

		return s / 2 ** 32;
	};
}

async function templatesFor(slug, picks, sampleName, progress) {
	const entries = await entriesOf(slug);
	const byIndex = (i) => entries[i];
	const rows = [];

	for (const pick of picks) {
		const entry = byIndex(pick.i);
		const cases = {};

		for (const id of TEMPLATE_IDS) cases[id] = await runCase(entry, id);

		rows.push({ i: pick.i, name: entry.name, why: pick.why, cases });
		progress?.(`templates ${slug} ${rows.length}/${picks.length}`);
	}

	return { slug, rows };
}

/** props that act on the component, checked on one icon per family */
async function propsFor(slug, i) {
	const entry = (await entriesOf(slug))[i];
	const live = (target) => document.getAnimations().filter((a) => a.effect?.target && target.contains(a.effect.target));
	const out = {};

	async function probe(props, run = 'pop') {
		const target = document.createElement('div');

		stage.append(target);
		const inst = mount(AnimatedIcon, { target, props: { svg: entry.body, viewBox: entry.viewBox, template: run, size: 64, trigger: 'controlled', ...props } });

		await new Promise((r) => requestAnimationFrame(() => r()));
		inst.startAnimation();
		const anims = live(target).map((a) => ({ d: a.effect.getTiming().duration, it: String(a.effect.getTiming().iterations), e: a.effect.getTiming().easing }));
		const w = target.querySelector('svg').getAttribute('width');
		const color = getComputedStyle(target.firstElementChild).color;

		for (const a of live(target)) a.cancel();
		unmount(inst);
		target.remove();

		return { anims, w, color };
	}

	const base = await probe({});
	const fast = await probe({ speed: 2 });
	const loop = await probe({ loop: true });
	const eased = await probe({ easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)' });
	const small = await probe({ size: 16 });
	const colored = await probe({ color: 'rgb(200, 10, 20)' });

	out.speed = base.anims.length > 0 && fast.anims.length === base.anims.length && fast.anims.every((a, k) => Math.abs(a.d * 2 - base.anims[k].d) < 1);
	out.loop = loop.anims.length > 0 && loop.anims.every((a) => a.it === 'Infinity');
	out.easing = eased.anims.length > 0 && eased.anims.every((a) => a.e.includes('0.1, 0.9, 0.2, 1'));
	out.size = small.w === '16';
	out.colorProp = colored.color === 'rgb(200, 10, 20)';

	return out;
}

window.census = { getTemplate, survey, templatesFor, propsFor, entriesOf, templateIds: TEMPLATE_IDS, rng };
window.__ready = true;
