// Main package entry — re-exports core utilities.
// Icon libraries are available via subpath imports:
//   import { Gear } from 'svelte-animated-icon/phosphor'
export { AnimatedIcon, TEMPLATES, TEMPLATE_IDS, getTemplate, clearProps, supports } from '$lib/core/index.svelte';
export type { AnimatedIconProps, AnimatedIconData, IconTemplate } from '$lib/core/index.svelte';
export { SUPPORT, SUPPORT_TEMPLATES, supportedTemplates, templateSupport } from './support.js';
export type { FamilySupport } from './support.js';
