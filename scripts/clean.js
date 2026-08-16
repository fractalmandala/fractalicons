import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');

function safeRm(targetPath) {
	for (let attempt = 0; attempt < 10; attempt++) {
		try {
			if (fs.existsSync(targetPath)) {
				fs.rmSync(targetPath, { recursive: true, force: true });
			}
			return;
		} catch {
			// Wait 100ms on filesystem lock/race on macOS APFS
			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
		}
	}
}

safeRm(path.join(packageDir, '.svelte-kit/__package__'));
safeRm(path.join(packageDir, 'dist'));
