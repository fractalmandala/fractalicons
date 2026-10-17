// Starts the two built docs sites for the tests and stays up until it is stopped.
//   icons-docs           http://127.0.0.1:4173
//   icons-animated-docs  http://127.0.0.1:4174   (the target's app url)
// Build them first: `pnpm --filter @fractaldesign/e2e prepare:apps`.
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apps = [
	['icons-docs', 4173],
	['icons-animated-docs', 4174]
];
const children = apps.map(([name, port]) =>
	spawn('pnpm', ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: resolve(repo, 'apps', name), stdio: 'inherit' })
);
const stop = () => children.forEach((c) => c.kill('SIGTERM'));

process.on('SIGTERM', () => { stop(); process.exit(0); });
process.on('SIGINT', () => { stop(); process.exit(0); });
children.forEach((c) => c.on('exit', (code) => { if (code) { stop(); process.exit(code); } }));
