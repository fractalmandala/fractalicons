import { svelte } from '@sveltejs/vite-plugin-svelte';

export default { plugins: [svelte()], server: { port: 5199, strictPort: true, fs: { allow: ['../..'] } }, optimizeDeps: { exclude: ['@fractaldesign/icons', '@fractaldesign/icons-animated'] } };
