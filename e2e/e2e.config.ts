import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

// No model is configured: these tests are exact checks (`expect`, `browser.evaluate`), not agent steps.
export default {
	tests: 'tests/**/*.e2e.ts',
	actionTimeout: 8_000,
	assertionTimeout: 5_000,
	targets: [
		{
			engine: web(),
			app: {
				url: 'http://127.0.0.1:4174',
				command: { executable: 'node', args: ['serve.mjs'], log: '.e2e/logs/app.log' }
			}
		}
	]
} satisfies E2EConfig;
