/**
 * RailJS Test Suite
 * Basic tests to verify core functionality
 */

import { Rail } from './rail.js';
// OR for Node.js: const { Rail } = require('./rail.js');

class TestRail extends Rail {
	constructor(options = {}) {
		super({ ...options, debug: false });
		this.emittedEvents = [];
		this.testResults = [];
	}

	emit(event, data) {
		this.emittedEvents.push({
			event,
			data: this._deepClone(data),
			timestamp: Date.now(),
		});
		return super.emit(event, data);
	}

	getEmitted(event) {
		return this.emittedEvents.filter((e) => e.event === event);
	}

	getLastEmitted(event) {
		const events = this.getEmitted(event);
		return events.length > 0 ? events[events.length - 1] : null;
	}

	clearEmitted() {
		this.emittedEvents = [];
	}

	// Test assertion helpers
	assert(condition, message) {
		if (!condition) {
			throw new Error(`Assertion failed: ${message}`);
		}
	}

	assertEquals(actual, expected, message) {
		if (actual !== expected) {
			throw new Error(`${message}: expected ${expected}, got ${actual}`);
		}
	}

	assertDeepEquals(actual, expected, message) {
		if (JSON.stringify(actual) !== JSON.stringify(expected)) {
			throw new Error(`${message}: objects not equal`);
		}
	}

	async runTest(name, testFn) {
		try {
			console.log(`🧪 Running: ${name}`);
			await testFn();
			console.log(`✅ Passed: ${name}`);
			this.testResults.push({ name, status: 'PASSED' });
		} catch (error) {
			console.error(`❌ Failed: ${name} - ${error.message}`);
			this.testResults.push({
				name,
				status: 'FAILED',
				error: error.message,
			});
		}
	}

	printResults() {
		console.log('\n' + '='.repeat(50));
		console.log('📊 TEST RESULTS');
		console.log('='.repeat(50));

		const passed = this.testResults.filter(
			(r) => r.status === 'PASSED'
		).length;
		const failed = this.testResults.filter(
			(r) => r.status === 'FAILED'
		).length;

		console.log(
			`Total: ${this.testResults.length}, Passed: ${passed}, Failed: ${failed}`
		);

		if (failed > 0) {
			console.log('\nFailed tests:');
			this.testResults
				.filter((r) => r.status === 'FAILED')
				.forEach((r) => console.log(`  ❌ ${r.name}: ${r.error}`));
		}

		console.log(
			failed === 0 ? '\n🎉 All tests passed!' : '\n💥 Some tests failed!'
		);
	}
}

// ===== TEST SUITES =====

async function testBasicEventSystem() {
	const rail = new TestRail();

	await rail.runTest('Basic event emission and listening', () => {
		let received = null;

		rail.on('test.event', (data) => {
			received = data;
		});

		rail.emit('test.event', { message: 'hello world' });

		rail.assert(received !== null, 'Event was not received');
		rail.assertEquals(
			received.message,
			'hello world',
			'Event data incorrect'
		);
	});

	await rail.runTest('Multiple listeners for same event', () => {
		let count = 0;

		rail.on('test.multi', () => count++);
		rail.on('test.multi', () => count++);
		rail.on('test.multi', () => count++);

		rail.emit('test.multi');

		rail.assertEquals(count, 3, 'All listeners should be called');
	});

	await rail.runTest('Event with no listeners', () => {
		rail.clearEmitted();
		const result = rail.emit('nonexistent.event', { data: 'test' });
		rail.assertEquals(
			result,
			0,
			'Should return 0 for events with no listeners'
		);
	});

	return rail.testResults;
}

async function testDataIsolation() {
	const rail = new TestRail();

	await rail.runTest('Data contamination prevention', () => {
		rail.clearEmitted();
		const original = { count: 1, nested: { value: 'original' } };
		let received1Initial = null;
		let received2Initial = null;

		rail.on(
			'test.contamination',
			(data) => {
				// Capture the clean state immediately when received
				received1Initial = JSON.parse(JSON.stringify(data));
				// Then try to contaminate the data
				data.count = 999;
				data.nested.value = 'modified1';
				data.newProp = 'added1';
			},
			'test-module-1'
		);

		rail.on(
			'test.contamination',
			(data) => {
				// Capture the clean state immediately when received
				received2Initial = JSON.parse(JSON.stringify(data));
				// Then try to contaminate the data differently
				data.count = 888;
				data.nested.value = 'modified2';
				data.newProp = 'added2';
			},
			'test-module-2'
		);

		rail.emit('test.contamination', original);

		// Original should be unchanged
		rail.assertEquals(
			original.count,
			1,
			'Original object should not be modified'
		);
		rail.assertEquals(
			original.nested.value,
			'original',
			'Original nested should not be modified'
		);

		// Each listener should receive clean copy (before they modify it)
		rail.assertEquals(
			received1Initial.count,
			1,
			'First listener should receive clean data'
		);
		rail.assertEquals(
			received2Initial.count,
			1,
			'Second listener should receive clean data'
		);
		rail.assertEquals(
			received1Initial.nested.value,
			'original',
			'First listener nested should be clean'
		);
		rail.assertEquals(
			received2Initial.nested.value,
			'original',
			'Second listener nested should be clean'
		);
	});

	await rail.runTest('Deep cloning of complex objects', () => {
		const testDate = new Date();
		testDate.setFullYear(2023, 0, 1); // Set to Jan 1, 2023 explicitly

		const complex = {
			date: testDate,
			array: [1, 2, { nested: 'value' }],
			null: null,
			undefined: undefined,
			boolean: true,
			number: 42,
		};

		let received = null;

		rail.on(
			'test.complex',
			(data) => {
				received = data;
				// Try to modify everything
				data.date.setFullYear(2024);
				data.array.push(4);
				data.array[2].nested = 'modified';
				data.boolean = false;
			},
			'test-complex'
		);

		rail.emit('test.complex', complex);

		// Original should be unchanged
		rail.assertEquals(
			complex.date.getFullYear(),
			2023,
			'Original date should not be modified'
		);
		rail.assertEquals(
			complex.array.length,
			3,
			'Original array length should not change'
		);
		rail.assertEquals(
			complex.array[2].nested,
			'value',
			'Original nested value should not change'
		);
		rail.assertEquals(
			complex.boolean,
			true,
			'Original boolean should not change'
		);

		// Received copy should be modifiable
		rail.assertEquals(
			received.date.getFullYear(),
			2024,
			'Received date should be modifiable'
		);
		rail.assertEquals(
			received.array.length,
			4,
			'Received array should be modifiable'
		);
		rail.assertEquals(
			received.array[2].nested,
			'modified',
			'Received nested should be modifiable'
		);
		rail.assertEquals(
			received.boolean,
			false,
			'Received boolean should be modifiable'
		);
	});

	return rail.testResults;
}

async function testModuleLifecycle() {
	const rail = new TestRail();

	await rail.runTest('Module attachment and connection', () => {
		let connected = false;

		const testModule = {
			name: 'test-module',
			connect(rail) {
				connected = true;
				rail.on('ping', () => rail.emit('pong'), 'test-module');
			},
		};

		rail.attach(testModule);

		rail.assert(connected, 'Module connect method should be called');
		rail.assert(
			rail.getModules().includes('test-module'),
			'Module should be in modules list'
		);

		rail.emit('ping');
		const pongEvents = rail.getEmitted('pong');
		rail.assertEquals(
			pongEvents.length,
			1,
			'Module should respond to events'
		);
	});

	await rail.runTest('Module detachment and cleanup', () => {
		const testModule = {
			name: 'detach-test',
			disconnected: false,
			connect(rail) {
				rail.on(
					'test.event',
					() => rail.emit('test.response'),
					'detach-test'
				);
			},
			disconnect(rail) {
				this.disconnected = true;
			},
		};

		rail.attach(testModule);
		rail.clearEmitted();

		// Test that module responds before detachment
		rail.emit('test.event');
		rail.assertEquals(
			rail.getEmitted('test.response').length,
			1,
			'Module should respond before detachment'
		);

		// Detach module
		const detached = rail.detach('detach-test');
		rail.assert(detached, 'Detachment should succeed');
		rail.assert(
			testModule.disconnected,
			'Disconnect method should be called'
		);
		rail.assert(
			!rail.getModules().includes('detach-test'),
			'Module should be removed from list'
		);

		// Test that module no longer responds
		rail.clearEmitted();
		rail.emit('test.event');
		rail.assertEquals(
			rail.getEmitted('test.response').length,
			0,
			'Module should not respond after detachment'
		);
	});

	await rail.runTest('Module name conflicts', () => {
		const module1 = { name: 'conflict-test', connect() {} };
		const module2 = { name: 'conflict-test', connect() {} };

		rail.attach(module1);

		try {
			rail.attach(module2);
			rail.assert(false, 'Should throw error for duplicate module names');
		} catch (error) {
			rail.assert(
				error.message.includes('already attached'),
				'Should throw appropriate error'
			);
		}
	});

	return rail.testResults;
}

async function testErrorHandling() {
	const rail = new TestRail();

	await rail.runTest('Error isolation between modules', () => {
		let module1Called = false;
		let module2Called = false;
		let errorEmitted = false;

		rail.on(
			'test.error',
			() => {
				module1Called = true;
				throw new Error('Module 1 error');
			},
			'error-module-1'
		);

		rail.on(
			'test.error',
			() => {
				module2Called = true;
				// This should still execute despite module1 error
			},
			'error-module-2'
		);

		rail.on('rail.error', () => {
			errorEmitted = true;
		});

		rail.emit('test.error');

		rail.assert(module1Called, 'First module should be called');
		rail.assert(
			module2Called,
			'Second module should still be called despite first module error'
		);
		rail.assert(errorEmitted, 'Error event should be emitted');
	});

	await rail.runTest('Module connection errors', () => {
		const badModule = {
			name: 'bad-module',
			connect(rail) {
				throw new Error('Connection failed');
			},
		};

		try {
			rail.attach(badModule);
			rail.assert(false, 'Should throw error for failed connection');
		} catch (error) {
			rail.assert(
				error.message.includes('Failed to connect'),
				'Should throw appropriate error'
			);
			rail.assert(
				!rail.getModules().includes('bad-module'),
				'Module should not be attached after connection failure'
			);
		}
	});

	return rail.testResults;
}

async function testAsyncHandlers() {
	const rail = new TestRail();

	await rail.runTest('emitAsync waits for all async handlers', async () => {
		const testRail = new Rail();
		const results = [];

		testRail.on('test.async', async (data) => {
			await new Promise(resolve => setTimeout(resolve, 50));
			results.push('handler1');
			return 'result1';
		}, 'module1');

		testRail.on('test.async', async (data) => {
			await new Promise(resolve => setTimeout(resolve, 30));
			results.push('handler2');
			return 'result2';
		}, 'module2');

		const emitResults = await testRail.emitAsync('test.async', { test: 'data' });

		rail.assertEquals(results.length, 2, 'Both async handlers should execute');
		rail.assert(results.includes('handler1'), 'Handler 1 should execute');
		rail.assert(results.includes('handler2'), 'Handler 2 should execute');
		rail.assertEquals(emitResults.length, 2, 'Should return results from all handlers');
		rail.assertEquals(emitResults[0].module, 'module1', 'First result should be from module1');
		rail.assertEquals(emitResults[0].result, 'result1', 'First result should be result1');
		rail.assertEquals(emitResults[1].module, 'module2', 'Second result should be from module2');
		rail.assertEquals(emitResults[1].result, 'result2', 'Second result should be result2');
	});

	await rail.runTest('emitAsync handles errors gracefully', async () => {
		const testRail = new Rail();
		let errorEventReceived = false;

		testRail.on('rail.error', () => {
			errorEventReceived = true;
		});

		testRail.on('test.async.error', async () => {
			throw new Error('Handler error');
		}, 'error-module');

		testRail.on('test.async.error', async () => {
			return 'success';
		}, 'good-module');

		const results = await testRail.emitAsync('test.async.error', {});

		rail.assertEquals(results.length, 2, 'Should return results from all handlers');
		rail.assertEquals(results[0].error, 'Handler error', 'First result should contain error');
		rail.assertEquals(results[1].result, 'success', 'Second handler should succeed');
		rail.assert(errorEventReceived, 'Error event should be emitted');
	});

	await rail.runTest('emitAsync works with synchronous handlers', async () => {
		const testRail = new Rail();

		testRail.on('test.sync', (data) => {
			return 'sync-result';
		}, 'sync-module');

		testRail.on('test.sync', async (data) => {
			return 'async-result';
		}, 'async-module');

		const results = await testRail.emitAsync('test.sync', {});

		rail.assertEquals(results.length, 2, 'Should handle both sync and async handlers');
		rail.assertEquals(results[0].result, 'sync-result', 'Sync handler should return result');
		rail.assertEquals(results[1].result, 'async-result', 'Async handler should return result');
	});

	await rail.runTest('emitAsync returns empty array when no listeners', async () => {
		const testRail = new Rail();
		const results = await testRail.emitAsync('nonexistent.event', {});

		rail.assertEquals(results.length, 0, 'Should return empty array for no listeners');
	});

	await rail.runTest('emit still works synchronously with async handlers', () => {
		const testRail = new Rail();
		let handlerCalled = false;

		testRail.on('test.sync.emit', async (data) => {
			handlerCalled = true;
			return 'async-value';
		}, 'async-module');

		const count = testRail.emit('test.sync.emit', {});

		rail.assertEquals(count, 1, 'emit should call async handlers synchronously');
		rail.assert(handlerCalled, 'Async handler should be called (but not awaited)');
	});

	return rail.testResults;
}

async function testPerformanceOptions() {
	const rail = new TestRail();

	await rail.runTest('Cloning can be disabled for performance', () => {
		const railNoClone = new Rail({ clone: false });
		const original = { value: 'original', nested: { data: 'test' } };
		let receivedData = null;

		railNoClone.on('test.noclone', (data) => {
			receivedData = data;
			// Modify the data
			data.value = 'modified';
			data.nested.data = 'changed';
		}, 'test-module');

		railNoClone.emit('test.noclone', original);

		// Without cloning, original should be modified
		rail.assertEquals(
			original.value,
			'modified',
			'Original should be modified when cloning is disabled'
		);
		rail.assertEquals(
			original.nested.data,
			'changed',
			'Original nested should be modified when cloning is disabled'
		);
		rail.assert(
			receivedData === original,
			'Received data should be the same reference as original'
		);
	});

	await rail.runTest('Cloning is enabled by default', () => {
		const railWithClone = new Rail(); // clone: true by default
		const original = { value: 'original', nested: { data: 'test' } };

		railWithClone.on('test.withclone', (data) => {
			data.value = 'modified';
			data.nested.data = 'changed';
		}, 'test-module');

		railWithClone.emit('test.withclone', original);

		// With cloning (default), original should NOT be modified
		rail.assertEquals(
			original.value,
			'original',
			'Original should not be modified when cloning is enabled'
		);
		rail.assertEquals(
			original.nested.data,
			'test',
			'Original nested should not be modified when cloning is enabled'
		);
	});

	await rail.runTest('Cloning can be toggled at runtime', () => {
		const railToggle = new Rail({ clone: true });
		let test1Original = { value: 'test1' };
		let test2Original = { value: 'test2' };

		railToggle.on('test.toggle', (data) => {
			data.value = 'modified';
		}, 'test-module');

		// First emit with cloning enabled
		railToggle.emit('test.toggle', test1Original);
		rail.assertEquals(
			test1Original.value,
			'test1',
			'Original should not be modified with cloning enabled'
		);

		// Disable cloning
		railToggle.setClone(false);

		// Second emit with cloning disabled
		railToggle.emit('test.toggle', test2Original);
		rail.assertEquals(
			test2Original.value,
			'modified',
			'Original should be modified with cloning disabled'
		);
	});

	return rail.testResults;
}

async function testUtilityMethods() {
	const rail = new TestRail();

	await rail.runTest('waitFor method', async () => {
		setTimeout(() => {
			rail.emit('delayed.event', { data: 'delayed' });
		}, 100);

		const result = await rail.waitFor('delayed.event');
		rail.assertEquals(
			result.data,
			'delayed',
			'waitFor should receive correct data'
		);
	});

	await rail.runTest('waitFor timeout', async () => {
		try {
			await rail.waitFor('nonexistent.event', 100);
			rail.assert(false, 'Should timeout and throw error');
		} catch (error) {
			rail.assert(
				error.message.includes('Timeout'),
				'Should throw timeout error'
			);
		}
	});

	await rail.runTest('Rail statistics', () => {
		// Create a fresh rail for this test
		const freshRail = new TestRail();

		const module1 = {
			name: 'stats-1',
			connect(rail) {
				rail.on('test', () => {}, 'stats-1');
			},
		};
		const module2 = {
			name: 'stats-2',
			connect(rail) {
				rail.on('test', () => {}, 'stats-2');
				rail.on('other', () => {}, 'stats-2');
			},
		};

		freshRail.attach(module1);
		freshRail.attach(module2);
		freshRail.emit('test.stat');

		const stats = freshRail.getStats();
		rail.assertEquals(stats.modules, 2, 'Should count modules correctly');
		rail.assertEquals(
			stats.events,
			2,
			'Should count unique events correctly'
		); // 'test' and 'other'
		rail.assertEquals(
			stats.totalListeners,
			3,
			'Should count total listeners correctly'
		);
		rail.assert(stats.eventsEmitted > 0, 'Should count emitted events');
	});

	return rail.testResults;
}

// ===== RUN ALL TESTS =====

async function runAllTests() {
	console.log('🚀 Starting RailJS Test Suite...\n');

	const testRail = new TestRail();
	let allResults = [];

	// Run test suites
	allResults = allResults.concat(await testBasicEventSystem());
	allResults = allResults.concat(await testDataIsolation());
	allResults = allResults.concat(await testModuleLifecycle());
	allResults = allResults.concat(await testErrorHandling());
	allResults = allResults.concat(await testAsyncHandlers());
	allResults = allResults.concat(await testPerformanceOptions());
	allResults = allResults.concat(await testUtilityMethods());

	// Print summary
	testRail.testResults = allResults;
	testRail.printResults();

	return allResults;
}

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined') {
	runAllTests().catch(console.error);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { runAllTests, TestRail };
}

export { runAllTests, TestRail };
