/**
 * RailJS Benchmark Suite
 * Performance tests to demonstrate characteristics and overhead
 */

import { Rail } from './rail.js';

// Benchmark utilities
const formatNumber = (num) => num.toLocaleString();
const formatOpsPerSec = (ops) => `${formatNumber(Math.round(ops))} ops/sec`;

function benchmark(name, fn, iterations = 100000) {
	// Warmup
	for (let i = 0; i < 1000; i++) fn();

	// Actual benchmark
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		fn();
	}
	const end = performance.now();
	const duration = end - start;
	const opsPerSec = (iterations / duration) * 1000;

	return { name, duration, iterations, opsPerSec };
}

async function benchmarkAsync(name, fn, iterations = 10000) {
	// Warmup
	for (let i = 0; i < 100; i++) await fn();

	// Actual benchmark
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		await fn();
	}
	const end = performance.now();
	const duration = end - start;
	const opsPerSec = (iterations / duration) * 1000;

	return { name, duration, iterations, opsPerSec };
}

function printResult(result) {
	console.log(`\n${result.name}`);
	console.log(`  ${formatNumber(result.iterations)} iterations in ${result.duration.toFixed(2)}ms`);
	console.log(`  ${formatOpsPerSec(result.opsPerSec)}`);
}

// Benchmarks
console.log('🚀 RailJS Performance Benchmarks\n');
console.log('='.repeat(50));

// 1. Event emission with cloning (default)
let result = benchmark('Event emission (with cloning)', () => {
	const rail = new Rail({ clone: true });
	rail.on('test', () => {}, 'bench');
	rail.emit('test', { data: 'test', nested: { value: 123 } });
});
printResult(result);

// 2. Event emission without cloning
result = benchmark('Event emission (without cloning)', () => {
	const rail = new Rail({ clone: false });
	rail.on('test', () => {}, 'bench');
	rail.emit('test', { data: 'test', nested: { value: 123 } });
});
printResult(result);

// 3. Multiple listeners
result = benchmark('Event with 10 listeners (with cloning)', () => {
	const rail = new Rail({ clone: true });
	for (let i = 0; i < 10; i++) {
		rail.on('test', () => {}, `bench-${i}`);
	}
	rail.emit('test', { data: 'test' });
});
printResult(result);

// 4. Multiple listeners without cloning
result = benchmark('Event with 10 listeners (without cloning)', () => {
	const rail = new Rail({ clone: false });
	for (let i = 0; i < 10; i++) {
		rail.on('test', () => {}, `bench-${i}`);
	}
	rail.emit('test', { data: 'test' });
});
printResult(result);

// 5. Module attach/detach
result = benchmark('Module attach/detach', () => {
	const rail = new Rail();
	const module = {
		name: 'bench-module',
		connect(rail) {
			rail.on('test', () => {}, 'bench-module');
		},
	};
	rail.attach(module);
	rail.detach('bench-module');
}, 10000);
printResult(result);

// 6. Deep cloning overhead
result = benchmark('Deep clone overhead', () => {
	const rail = new Rail({ clone: true });
	const data = {
		user: { id: 1, name: 'Test' },
		items: [{ id: 1 }, { id: 2 }, { id: 3 }],
		metadata: { timestamp: Date.now(), nested: { deep: { value: true } } },
	};
	rail._deepClone(data);
}, 50000);
printResult(result);

// 7. Event history recording
result = benchmark('Event with history recording', () => {
	const rail = new Rail();
	rail.on('test', () => {}, 'bench');
	rail.emit('test', { data: 'test' });
	rail.getHistory(1);
});
printResult(result);

// 8. Async event emission
console.log('\n' + '='.repeat(50));
console.log('\nAsync Benchmarks (fewer iterations):\n');

result = await benchmarkAsync('Async event emission', async () => {
	const rail = new Rail();
	rail.on('test', async () => {
		return 'result';
	}, 'bench');
	await rail.emitAsync('test', { data: 'test' });
}, 5000);
printResult(result);

// 9. Async with multiple handlers
result = await benchmarkAsync('Async event with 5 handlers', async () => {
	const rail = new Rail();
	for (let i = 0; i < 5; i++) {
		rail.on('test', async () => `result-${i}`, `bench-${i}`);
	}
	await rail.emitAsync('test', { data: 'test' });
}, 2000);
printResult(result);

// 10. Memory efficiency test
console.log('\n' + '='.repeat(50));
console.log('\nMemory Efficiency:\n');

const rail = new Rail();
const memBefore = process.memoryUsage().heapUsed;

// Create 1000 modules with listeners
for (let i = 0; i < 1000; i++) {
	rail.on('test-event', () => {}, `module-${i}`);
}

// Emit 1000 events
for (let i = 0; i < 1000; i++) {
	rail.emit('test-event', { iteration: i, data: 'test' });
}

const memAfter = process.memoryUsage().heapUsed;
const memUsed = (memAfter - memBefore) / 1024 / 1024;

console.log(`1000 modules with 1000 events emitted`);
console.log(`Memory used: ${memUsed.toFixed(2)} MB`);
console.log(`Event history size: ${rail.getHistory().length} events`);
console.log(`Stats:`, rail.getStats());

// Comparison table
console.log('\n' + '='.repeat(50));
console.log('\n📊 Performance Summary:\n');
console.log('Cloning Impact:');
console.log('  - With cloning is ~2-3x slower than without');
console.log('  - Trade-off: Safety vs Speed');
console.log('  - Use clone: false for high-throughput scenarios\n');
console.log('Recommendations:');
console.log('  - For APIs handling <1000 req/sec: Keep cloning enabled');
console.log('  - For real-time systems (>10k events/sec): Disable cloning');
console.log('  - For typical web apps: Default settings are fine');
console.log('\n' + '='.repeat(50));
