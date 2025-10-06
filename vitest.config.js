import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['**/*.test.js'],
		exclude: ['**/node_modules/**', '**/dist/**', 'type-check.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			include: ['rail.js'],
			exclude: ['test.js', 'demo.js', 'benchmark.js', 'build.js', 'type-check.test.ts'],
			all: true,
			lines: 80,
			functions: 80,
			branches: 80,
			statements: 80,
		},
	},
});
