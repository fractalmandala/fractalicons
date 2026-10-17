// Measuring helpers installed in the page before it loads (`browser.addInitScript(labSource)`). They read the browser's own
// animation state, so a test asserts what is really animating, not what the component says it does.
export const labSource = `
(() => {
	const SHAPES = 'path,circle,line,polyline,polygon,ellipse,rect';
	const PX = 64;
	const canvas = document.createElement('canvas');

	canvas.width = canvas.height = PX;

	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	const rests = new WeakMap();

	// an icon is named by its grid cell (data-icon) or, as 'css:<selector>', by any element that holds one
	const svgOf = (name) => name.startsWith('css:') ? document.querySelector(name.slice(4) + ' .animated-icon svg') : (document.querySelector('[data-grid] [data-icon="' + name + '"] .animated-icon svg') ?? document.querySelector('[data-icon="' + name + '"] .animated-icon svg'));
	const animsIn = (root) => document.getAnimations().filter((a) => a.effect?.target && root.contains(a.effect.target));
	const endOf = (a) => {
		const t = a.effect.getTiming();
		const end = a.effect.getComputedTiming().endTime;

		return Number.isFinite(end) ? end : (typeof t.duration === 'number' ? t.duration : 1000) + Math.max(0, t.delay ?? 0);
	};
	const vbWidth = (svg) => Number(svg.getAttribute('viewBox').split(/[ ,]+/)[2]);

	async function raster(svg) {
		const img = new Image();

		img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
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

	window.__lab = {
		vbWidth: (name) => vbWidth(svgOf(name)),
		shapeCount: (name) => svgOf(name).querySelectorAll(SHAPES).length,

		/** what every filled or stroked shape resolves to: the paint a bridged icon really draws with */
		paint(name) {
			return [...svgOf(name).querySelectorAll(SHAPES)].map((s) => { const cs = getComputedStyle(s); return { fill: cs.fill, stroke: cs.stroke }; });
		},

		/** the accessibility attributes of the icon's wrapper */
		a11y(name) {
			const w = svgOf(name).closest('.animated-icon');

			return { role: w.getAttribute('role'), label: w.getAttribute('aria-label'), hidden: w.getAttribute('aria-hidden'), color: getComputedStyle(w).color };
		},

		/** the picture of the icon at rest, taken before it is played */
		async rest(name) {
			const svg = svgOf(name);

			rests.set(svg, await raster(svg));

			return true;
		},

		/** what is animating inside an icon right now */
		live(name) {
			const svg = svgOf(name);

			return animsIn(svg).map((a) => {
				const t = a.effect.getTiming();

				return { duration: t.duration, delay: t.delay, iterations: String(t.iterations), easing: t.easing, end: endOf(a), tag: a.effect.target.tagName, props: Object.keys(a.effect.getKeyframes()[0] ?? {}).filter((k) => !['offset', 'computedOffset', 'easing', 'composite'].includes(k)).sort().join(',') };
			});
		},

		/** the keyframes of every animation in an icon, with transforms read as matrices */
		keyframes(name) {
			const svg = svgOf(name);

			return animsIn(svg).map((a) => ({
				tag: a.effect.target.tagName,
				frames: a.effect.getKeyframes().map((k) => {
					let e = 0, f = 0;

					if (typeof k.transform === 'string' && k.transform !== 'none') {
						const m = new DOMMatrixReadOnly(k.transform);

						e = m.e;
						f = m.f;
					}

					return { offset: k.computedOffset, easing: k.easing, opacity: k.opacity ?? null, tx: e, ty: f };
				})
			}));
		},

		/** pause every animation in an icon and move it to a fraction of its length */
		seek(name, fraction) {
			const anims = animsIn(svgOf(name));
			const T = Math.max(0, ...anims.map(endOf));

			for (const a of anims) {
				a.pause();
				a.currentTime = fraction * T;
			}

			return anims.length;
		},

		/** how far what is drawn reaches outside the icon's own box, in icon widths, at the current moment */
		excursion(name) {
			const svg = svgOf(name);
			const box = svg.getBoundingClientRect();
			const rects = [...svg.querySelectorAll(SHAPES)].map((s) => s.getBoundingClientRect()).filter((r) => r.width || r.height);

			if (!rects.length) return 0;

			const over = Math.max(0, box.left - Math.min(...rects.map((r) => r.left)), Math.max(...rects.map((r) => r.right)) - box.right, box.top - Math.min(...rects.map((r) => r.top)), Math.max(...rects.map((r) => r.bottom)) - box.bottom);

			return over / box.width;
		},

		/** the root transform and opacity of the svg itself at the current moment */
		rootStyle(name) {
			const cs = getComputedStyle(svgOf(name));

			return { transform: cs.transform, opacity: Number(cs.opacity), clipPath: cs.clipPath };
		},

		/** the first number of every shape's dash array, in icon units */
		dashes(name) {
			return [...svgOf(name).querySelectorAll(SHAPES)].map((s) => parseFloat(s.style.strokeDasharray)).filter((n) => !Number.isNaN(n));
		},

		/** every shape's resolved transform and opacity: a fingerprint of the icon's arrangement */
		arrangement(name) {
			return [...svgOf(name).querySelectorAll(SHAPES)].map((s) => { const cs = getComputedStyle(s); return (cs.transform === 'none' ? 'matrix(1, 0, 0, 1, 0, 0)' : cs.transform) + '|' + cs.opacity; });
		},

		/** run every animation to its end (infinite ones are left alone) */
		finish(name) {
			for (const a of animsIn(svgOf(name))) if (Number.isFinite(a.effect.getComputedTiming().endTime)) a.finish();
		},

		/** the share of pixels that differ from the resting picture at a fraction of the animation */
		async visibleAt(name, fraction) {
			const svg = svgOf(name);
			const anims = animsIn(svg);
			const T = Math.max(0, ...anims.map(endOf));
			const els = [...new Set(anims.map((a) => a.effect.target))];
			const saved = new Map(els.map((el) => [el, el.getAttribute('style')]));

			for (const a of anims) {
				a.pause();
				a.currentTime = fraction * T;
			}

			for (const a of anims) {
				try { a.commitStyles(); } catch { /* not rendered */ }
			}

			const d = diff(await raster(svg), rests.get(svg));

			for (const [el, style] of saved) {
				if (style === null) el.removeAttribute('style');
				else el.setAttribute('style', style);
			}

			return d;
		}
	};
})();
`;

export type Lab = {
	vbWidth(name: string): number;
	shapeCount(name: string): number;
	rest(name: string): Promise<boolean>;
	live(name: string): { duration: number; delay: number; iterations: string; easing: string; end: number; tag: string; props: string }[];
	keyframes(name: string): { tag: string; frames: { offset: number; easing: string; opacity: number | null; tx: number; ty: number }[] }[];
	seek(name: string, fraction: number): number;
	excursion(name: string): number;
	rootStyle(name: string): { transform: string; opacity: number; clipPath: string };
	dashes(name: string): number[];
	arrangement(name: string): string[];
	finish(name: string): void;
	visibleAt(name: string, fraction: number): Promise<number>;
	paint(name: string): { fill: string; stroke: string }[];
	a11y(name: string): { role: string | null; label: string | null; hidden: string | null; color: string };
};
