/**
 * Build script for RailJS
 * Generates multiple build formats: ESM, CJS, UMD, and minified versions
 */

import * as esbuild from 'esbuild';
import { readFileSync, mkdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version info
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
const banner = `/**
 * RailJS v${pkg.version}
 * ${pkg.description}
 * @license ${pkg.license}
 */`;

// Clean dist directory
try {
	rmSync(resolve(__dirname, 'dist'), { recursive: true, force: true });
} catch (e) {
	// Directory might not exist
}
mkdirSync(resolve(__dirname, 'dist'), { recursive: true });

// Common build options
const commonOptions = {
	entryPoints: ['rail.js'],
	bundle: true,
	banner: { js: banner },
	platform: 'neutral',
	target: 'es2020',
};

// Build configurations
const builds = [
	// ESM build (unminified)
	{
		...commonOptions,
		format: 'esm',
		outfile: 'dist/rail.esm.js',
	},
	// ESM build (minified)
	{
		...commonOptions,
		format: 'esm',
		outfile: 'dist/rail.esm.min.js',
		minify: true,
	},
	// CJS build (unminified)
	{
		...commonOptions,
		format: 'cjs',
		outfile: 'dist/rail.cjs.js',
		platform: 'node',
	},
	// CJS build (minified)
	{
		...commonOptions,
		format: 'cjs',
		outfile: 'dist/rail.cjs.min.js',
		platform: 'node',
		minify: true,
	},
	// UMD build for browsers (unminified)
	{
		...commonOptions,
		format: 'iife',
		globalName: 'RailJS',
		outfile: 'dist/rail.umd.js',
		platform: 'browser',
	},
	// UMD build for browsers (minified)
	{
		...commonOptions,
		format: 'iife',
		globalName: 'RailJS',
		outfile: 'dist/rail.umd.min.js',
		platform: 'browser',
		minify: true,
	},
];

// Execute builds
console.log('🔨 Building RailJS...\n');

for (const config of builds) {
	try {
		await esbuild.build(config);
		const size = await getFileSize(config.outfile);
		console.log(`✅ ${config.outfile.padEnd(30)} (${size})`);
	} catch (error) {
		console.error(`❌ Failed to build ${config.outfile}:`, error);
		process.exit(1);
	}
}

console.log('\n✨ Build completed successfully!\n');

// Helper to get file size
async function getFileSize(filePath) {
	const fs = await import('fs/promises');
	const stats = await fs.stat(filePath);
	const bytes = stats.size;

	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
