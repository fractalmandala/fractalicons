// Templated, structure-agnostic icon animations.
//
// Driven by the native Web Animations API (element.animate) — dependency-free.
//
// Every icon is uniform: viewBox 0 0 256 256, known element set.
// That uniformity lets ONE template animate any icon with zero per-icon authoring.
// Each template's run(svg) returns the WAAPI Animation[] it started;
// the AnimatedIcon component cancels those and calls clearProps() on stop.

export interface IconTemplate {
	id: string;
	label: string;
	/** Which weight this suits. Omit = works on both. 'line' needs a stroke; 'fill' suits solid shapes. */
	for?: 'line' | 'fill';
	run: (svg: SVGSVGElement) => Animation[];
}

const BACK = 'cubic-bezier(.34,1.56,.64,1)';

const SVG_NS = 'http://www.w3.org/2000/svg';
const WRAP = 'data-ia-wrap';
/** the grid the fixed distances below were drawn on; every icon is measured against it */
const DESIGN_GRID = 256;

function shapes(svg: SVGSVGElement): SVGGraphicsElement[] {
	return Array.from(svg.querySelectorAll('path,circle,line,polyline,polygon,ellipse,rect')) as SVGGraphicsElement[];
}

/** How many of this icon's own units make one unit of the design grid: distances are written for 256 and scale with the icon. */
function unit(svg: SVGSVGElement): number {
	const w = svg.viewBox?.baseVal?.width;

	return w ? w / DESIGN_GRID : 1;
}

/** Whether any shape in the icon is drawn with a stroke: the dash templates show nothing without one. */
function hasStroke(svg: SVGSVGElement): boolean {
	return shapes(svg).some((el) => {
		const cs = getComputedStyle(el);

		return cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0;
	});
}

/**
 * What a transform or opacity template animates for a shape. A shape with its own transform or opacity would have both replaced
 * while the animation runs, and would end somewhere else; so it is wrapped in a group, and the group is animated instead. The
 * group's transform and opacity combine with the shape's own, which stay as they were. Groups are removed again by clearProps.
 */
function targets(svg: SVGSVGElement): SVGGraphicsElement[] {
	return shapes(svg).map((el) => {
		const parent = el.parentElement;

		if (parent?.hasAttribute(WRAP)) return parent as unknown as SVGGraphicsElement;

		const cs = getComputedStyle(el);

		if (!el.hasAttribute('transform') && cs.transform === 'none' && parseFloat(cs.opacity) === 1) return el;

		const group = document.createElementNS(SVG_NS, 'g');

		group.setAttribute(WRAP, '');
		el.replaceWith(group);
		group.append(el);

		return group as unknown as SVGGraphicsElement;
	});
}

/** True stroke length, or 0 if the element can't be measured (e.g. rect on WebKit). */
function totalLength(el: SVGGraphicsElement): number {
	try {
		return (el as unknown as SVGGeometryElement).getTotalLength?.() ?? 0;
	} catch {
		return 0;
	}
}

/** Strip every inline prop a template may set, returning the icon to rest (fully visible). */
export function clearProps(svg: SVGSVGElement): void {
	const props = ['stroke-dasharray', 'stroke-dashoffset', 'opacity', 'transform', 'transform-box', 'transform-origin', 'fill', 'fill-opacity'];
	for (const el of shapes(svg)) {
		for (const p of props) el.style.removeProperty(p);
		el.removeAttribute('pathLength');
	}
	svg.style.removeProperty('transform');
	svg.style.removeProperty('transform-origin');
	svg.style.removeProperty('clip-path');

	// put back the shapes `targets` wrapped
	for (const group of Array.from(svg.querySelectorAll(`[${WRAP}]`))) group.replaceWith(...Array.from(group.childNodes));
}

/** Templates that animate a stroke's dash. */
const NEEDS_STROKE = new Set(['draw', 'trace', 'march', 'native-draw']);

/** Whether a template can show anything on this icon. The dash templates need a stroked shape; every other template works on any. */
export function supports(id: string, svg: SVGSVGElement): boolean {
	return !NEEDS_STROKE.has(id) || hasStroke(svg);
}

export const TEMPLATES: IconTemplate[] = [
	{
		id: 'draw',
		label: 'Draw on',
		for: 'line',
		run: (svg) => {
			// no stroke to draw: reveal the icon instead of running invisibly
			if (!hasStroke(svg)) return TEMPLATES.find((t) => t.id === 'wipe')!.run(svg);

			const out: Animation[] = [];
			shapes(svg).forEach((el, i) => {
				el.setAttribute('pathLength', '1');
				el.style.strokeDasharray = '1';
				el.style.strokeDashoffset = '1';
				out.push(el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, delay: i * 70, easing: 'ease-in-out', fill: 'forwards' }));
			});
			return out;
		}
	},
	{
		id: 'cascade',
		label: 'Cascade',
		run: (svg) => {
			const out: Animation[] = [];
			targets(svg).forEach((el, i) => {
				el.style.transformBox = 'fill-box';
				el.style.transformOrigin = 'center';
				out.push(el.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 450, delay: i * 60, easing: BACK, fill: 'forwards' }));
			});
			return out;
		}
	},
	{
		id: 'pop',
		label: 'Pop',
		run: (svg) => {
			const out: Animation[] = [];
			targets(svg).forEach((el, i) => {
				el.style.transformBox = 'fill-box';
				el.style.transformOrigin = 'center';
				out.push(el.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 600, delay: i * 60, easing: 'ease-out', fill: 'forwards' }));
			});
			return out;
		}
	},
	{
		id: 'spin',
		label: 'Spin',
		run: (svg) => {
			svg.style.transformOrigin = 'center';
			return [svg.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 900, easing: 'ease-in-out' })];
		}
	},
	{
		id: 'jelly',
		label: 'Jelly',
		run: (svg) => {
			svg.style.transformOrigin = 'center';
			return [svg.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.18,.82)' }, { transform: 'scale(.9,1.1)' }, { transform: 'scale(1.05,.95)' }, { transform: 'scale(1,1)' }], { duration: 700, easing: 'ease-out' })];
		}
	},
	{
		id: 'orbit',
		label: 'Orbit',
		run: (svg) => {
			const out: Animation[] = [];
			targets(svg).forEach((el, i) => {
				el.style.transformBox = 'view-box';
				el.style.transformOrigin = '50% 50%';
				out.push(el.animate([{ transform: 'rotate(-120deg)', opacity: 0 }, { transform: 'rotate(0deg)', opacity: 1 }], { duration: 700, delay: i * 50, easing: BACK, fill: 'forwards' }));
			});
			return out;
		}
	},
	{
		id: 'assemble',
		label: 'Assemble',
		run: (svg) => {
			const out: Animation[] = [];
			const vb = svg.viewBox.baseVal;
			const cx = vb.x + vb.width / 2;
			const cy = vb.y + vb.height / 2;
			const reach = 70 * unit(svg);

			targets(svg).forEach((el, i) => {
				const b = el.getBBox();
				let vx = b.x + b.width / 2 - cx;
				let vy = b.y + b.height / 2 - cy;
				const len = Math.hypot(vx, vy);

				// a shape that sits in the middle has no side to come from: send each one in from its own direction
				if (len < 0.5 * unit(svg)) {
					vx = Math.cos(i * 2.4);
					vy = Math.sin(i * 2.4);
				}

				const k = reach / (Math.hypot(vx, vy) || 1);
				out.push(el.animate([{ transform: `translate(${vx * k}px,${vy * k}px)`, opacity: 0 }, { transform: 'translate(0,0)', opacity: 1 }], { duration: 600, delay: i * 50, easing: BACK, fill: 'forwards' }));
			});
			return out;
		}
	},
	{
		id: 'trace',
		label: 'Trace',
		for: 'line',
		run: (svg) => {
			// no stroke to trace: reveal the icon instead of running invisibly
			if (!hasStroke(svg)) return TEMPLATES.find((t) => t.id === 'wipe')!.run(svg);

			const out: Animation[] = [];
			const all = shapes(svg);
			// one shape after another, 300 ms each, but never longer than about a second and a half in all
			const step = Math.min(300, 1200 / Math.max(1, all.length - 1));

			all.forEach((el, i) => {
				el.setAttribute('pathLength', '1');
				el.style.strokeDasharray = '1';
				el.style.strokeDashoffset = '1';
				out.push(el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 300, delay: i * step, easing: 'ease-in-out', fill: 'forwards' }));
			});
			return out;
		}
	},
	{
		id: 'tada',
		label: 'Tada (loop)',
		run: (svg) => {
			svg.style.transformOrigin = 'center';
			return [
				svg.animate(
					[
						{ transform: 'scale(1) rotate(0deg)', offset: 0 },
						{ transform: 'scale(0.9) rotate(-3deg)', offset: 0.1 },
						{ transform: 'scale(1.12) rotate(3deg)', offset: 0.2 },
						{ transform: 'scale(1.12) rotate(-3deg)', offset: 0.3 },
						{ transform: 'scale(1.12) rotate(3deg)', offset: 0.4 },
						{ transform: 'scale(1) rotate(0deg)', offset: 0.5 },
						{ transform: 'scale(1) rotate(0deg)', offset: 1 }
					],
					{ duration: 2000, iterations: Infinity, easing: 'ease-in-out' }
				)
			];
		}
	},
	{
		id: 'flip',
		label: 'Flip',
		run: (svg) => {
			svg.style.transformOrigin = 'center';
			return [svg.animate([{ transform: 'perspective(400px) rotateY(-90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateY(0deg)', opacity: 1 }], { duration: 600, easing: BACK, fill: 'forwards' })];
		}
	},
	{
		id: 'swing',
		label: 'Swing',
		run: (svg) => {
			svg.style.transformOrigin = '50% 0%';
			return [svg.animate([
				{ transform: 'rotate(0deg)', offset: 0 },
				{ transform: 'rotate(16deg)', offset: 0.2 },
				{ transform: 'rotate(-12deg)', offset: 0.4 },
				{ transform: 'rotate(8deg)', offset: 0.6 },
				{ transform: 'rotate(-4deg)', offset: 0.8 },
				{ transform: 'rotate(0deg)', offset: 1 }
			], { duration: 1000, easing: 'ease-in-out', fill: 'forwards' })];
		}
	},
	{
		id: 'wave',
		label: 'Wave (loop)',
		run: (svg) => {
			const out: Animation[] = [];
			const lift = 22 * unit(svg);

			targets(svg).forEach((el, i) => {
				out.push(el.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-lift}px)` }, { transform: 'translateY(0)' }], { duration: 1200, delay: -i * 90, iterations: Infinity, easing: 'ease-in-out' }));
			});
			return out;
		}
	},
	{
		id: 'march',
		label: 'March (loop)',
		for: 'line',
		run: (svg) => {
			if (!hasStroke(svg)) return [];

			const out: Animation[] = [];
			const u = unit(svg);

			for (const el of shapes(svg)) {
				el.style.strokeDasharray = `${10 * u} ${8 * u}`;
				out.push(el.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -18 * u }], { duration: 600, iterations: Infinity, easing: 'linear' }));
			}
			return out;
		}
	},
	{
		id: 'boil',
		label: 'Boil (loop)',
		run: (svg) => {
			const out: Animation[] = [];
			const u = unit(svg);
			const move = (x: number, y: number, deg: number) => `rotate(${deg}deg) translate(${x * u}px,${y * u}px)`;

			targets(svg).forEach((el, i) => {
				el.style.transformBox = 'fill-box';
				el.style.transformOrigin = 'center';
				out.push(el.animate([
					{ transform: move(2, -1, -2.5) },
					{ transform: move(-2, 2, 2.5) },
					{ transform: move(1, 2, -1.5) },
					{ transform: move(-2, -1, 2) },
					{ transform: move(2, -1, -2.5) }
				], { duration: 360 + (i % 4) * 50, delay: -i * 70, iterations: Infinity, easing: 'ease-in-out' }));
			});
			return out;
		}
	},
	{
		id: 'glitch',
		label: 'Glitch',
		run: (svg) => {
			// each keyframe holds until the next (steps on the keyframe); steps on the whole animation held the first frame all the way through
			svg.style.transformOrigin = 'center';
			return [svg.animate([
				{ transform: 'translate(0,0)', opacity: 1, offset: 0, easing: 'steps(1)' },
				{ transform: 'translate(-3px,1px)', opacity: 0.7, offset: 0.15, easing: 'steps(1)' },
				{ transform: 'translate(3px,-2px)', opacity: 1, offset: 0.3, easing: 'steps(1)' },
				{ transform: 'translate(-2px,-1px)', opacity: 0.6, offset: 0.45, easing: 'steps(1)' },
				{ transform: 'translate(2px,2px)', opacity: 1, offset: 0.6, easing: 'steps(1)' },
				{ transform: 'translate(-1px,0)', opacity: 0.85, offset: 0.75, easing: 'steps(1)' },
				{ transform: 'translate(0,0)', opacity: 1, offset: 1 }
			], { duration: 500, easing: 'linear', fill: 'forwards' })];
		}
	},
	{
		id: 'native-draw',
		label: 'Native draw',
		for: 'line',
		run: (svg) => {
			if (!hasStroke(svg)) return [];

			const out: Animation[] = [];
			for (const el of shapes(svg)) {
				const len = totalLength(el);
				if (!len) continue;
				el.style.strokeDasharray = String(len);
				el.style.strokeDashoffset = String(len);
				// a dash pattern restarts at every subpath, so a sharp ease-out finished icons made of short subpaths almost at once
				out.push(el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1200, easing: 'ease-in-out', fill: 'forwards' }));
			}
			return out;
		}
	},
	{
		id: 'wipe',
		label: 'Wipe',
		for: 'fill',
		run: (svg) => [svg.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 700, easing: 'ease-out', fill: 'forwards' })]
	},
	{
		id: 'rise',
		label: 'Rise',
		for: 'fill',
		run: (svg) => [svg.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 700, easing: 'ease-out', fill: 'forwards' })]
	},
	{
		id: 'iris',
		label: 'Iris',
		for: 'fill',
		run: (svg) => [svg.animate([{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }], { duration: 600, easing: 'ease-out', fill: 'forwards' })]
	},
	{
		id: 'split',
		label: 'Split',
		for: 'fill',
		run: (svg) => [svg.animate([{ clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 600, easing: 'ease-out', fill: 'forwards' })]
	},
	{
		id: 'drop',
		label: 'Drop',
		for: 'fill',
		run: (svg) => {
			svg.style.transformOrigin = 'center';
			return [svg.animate([
				{ transform: 'translateY(-70px) scaleY(1)', offset: 0 },
				{ transform: 'translateY(0) scaleY(.82)', offset: 0.45 },
				{ transform: 'translateY(-16px) scaleY(1)', offset: 0.65 },
				{ transform: 'translateY(0) scaleY(.93)', offset: 0.85 },
				{ transform: 'translateY(0) scaleY(1)', offset: 1 }
			], { duration: 850, easing: 'ease-out', fill: 'forwards' })];
		}
	},
	{
		id: 'stamp',
		label: 'Stamp',
		for: 'fill',
		run: (svg) => {
			svg.style.transformOrigin = 'center';
			return [svg.animate([
				{ transform: 'scale(1.6)', opacity: 0, offset: 0 },
				{ transform: 'scale(.92)', opacity: 1, offset: 0.6 },
				{ transform: 'scale(1)', opacity: 1, offset: 1 }
			], { duration: 450, easing: 'ease-out', fill: 'forwards' })];
		}
	}
];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

export function getTemplate(id: string): IconTemplate {
	return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
