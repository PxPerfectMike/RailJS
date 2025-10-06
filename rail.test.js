/**
 * RailJS Test Suite - Vitest format
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Rail } from './rail.js';

describe('Basic event system', () => {
	it('should emit and listen for events', () => {
		const rail = new Rail();
		let received = null;

		rail.on('test.event', (data) => {
			received = data;
		});

		rail.emit('test.event', { message: 'hello world' });

		expect(received).not.toBeNull();
		expect(received.message).toBe('hello world');
	});

	it('should handle multiple listeners for same event', () => {
		const rail = new Rail();
		let count = 0;

		rail.on('test.multi', () => count++);
		rail.on('test.multi', () => count++);
		rail.on('test.multi', () => count++);

		rail.emit('test.multi');

		expect(count).toBe(3);
	});

	it('should return 0 for events with no listeners', () => {
		const rail = new Rail();
		const result = rail.emit('nonexistent.event', { data: 'test' });
		expect(result).toBe(0);
	});
});

describe('Data isolation', () => {
	it('should prevent data contamination between modules', () => {
		const rail = new Rail();
		const original = { count: 1, nested: { value: 'original' } };
		let received1, received2;

		rail.on(
			'test.contamination',
			(data) => {
				received1 = { ...data };
				data.count = 999;
				data.nested.value = 'modified1';
			},
			'module-1'
		);

		rail.on(
			'test.contamination',
			(data) => {
				received2 = { ...data };
				data.count = 888;
				data.nested.value = 'modified2';
			},
			'module-2'
		);

		rail.emit('test.contamination', original);

		expect(original.count).toBe(1);
		expect(original.nested.value).toBe('original');
		expect(received1.count).toBe(1);
		expect(received2.count).toBe(1);
	});

	it('should deep clone complex objects', () => {
		const rail = new Rail();
		const testDate = new Date(2023, 0, 1); // Jan 1, 2023 in local time
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
				data.date.setFullYear(2024);
				data.array.push(4);
				data.array[2].nested = 'modified';
			},
			'test-complex'
		);

		rail.emit('test.complex', complex);

		expect(complex.date.getFullYear()).toBe(2023);
		expect(complex.array.length).toBe(3);
		expect(complex.array[2].nested).toBe('value');
		expect(received.date.getFullYear()).toBe(2024);
		expect(received.array.length).toBe(4);
	});
});

describe('Module lifecycle', () => {
	it('should attach and connect modules', () => {
		const rail = new Rail();
		let connected = false;

		const testModule = {
			name: 'test-module',
			connect(rail) {
				connected = true;
				rail.on('ping', () => rail.emit('pong'), 'test-module');
			},
		};

		rail.attach(testModule);

		expect(connected).toBe(true);
		expect(rail.getModules()).toContain('test-module');

		rail.emit('ping');
		// Can't easily test emit result in this format, but module is working
	});

	it('should detach modules and clean up', () => {
		const rail = new Rail();
		let disconnected = false;

		const testModule = {
			name: 'detach-test',
			connect(rail) {
				rail.on('test.event', () => {}, 'detach-test');
			},
			disconnect() {
				disconnected = true;
			},
		};

		rail.attach(testModule);
		const detached = rail.detach('detach-test');

		expect(detached).toBe(true);
		expect(disconnected).toBe(true);
		expect(rail.getModules()).not.toContain('detach-test');
	});

	it('should throw error for duplicate module names', () => {
		const rail = new Rail();
		const module1 = { name: 'conflict-test', connect() {} };
		const module2 = { name: 'conflict-test', connect() {} };

		rail.attach(module1);

		expect(() => rail.attach(module2)).toThrow('already attached');
	});
});

describe('Error handling', () => {
	it('should isolate errors between modules', () => {
		const rail = new Rail();
		let module1Called = false;
		let module2Called = false;
		let errorEmitted = false;

		rail.on('rail.error', () => {
			errorEmitted = true;
		});

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
			},
			'error-module-2'
		);

		rail.emit('test.error');

		expect(module1Called).toBe(true);
		expect(module2Called).toBe(true);
		expect(errorEmitted).toBe(true);
	});

	it('should handle module connection errors', () => {
		const rail = new Rail();
		const badModule = {
			name: 'bad-module',
			connect() {
				throw new Error('Connection failed');
			},
		};

		expect(() => rail.attach(badModule)).toThrow('Failed to connect');
		expect(rail.getModules()).not.toContain('bad-module');
	});
});

describe('Async handlers', () => {
	it('should wait for all async handlers', async () => {
		const rail = new Rail();
		const results = [];

		rail.on('test.async', async (data) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			results.push('handler1');
			return 'result1';
		}, 'module1');

		rail.on('test.async', async (data) => {
			await new Promise((resolve) => setTimeout(resolve, 5));
			results.push('handler2');
			return 'result2';
		}, 'module2');

		const emitResults = await rail.emitAsync('test.async', { test: 'data' });

		expect(results.length).toBe(2);
		expect(results).toContain('handler1');
		expect(results).toContain('handler2');
		expect(emitResults.length).toBe(2);
		expect(emitResults[0].module).toBe('module1');
		expect(emitResults[0].result).toBe('result1');
	});

	it('should handle errors gracefully in async', async () => {
		const rail = new Rail();
		let errorEventReceived = false;

		rail.on('rail.error', () => {
			errorEventReceived = true;
		});

		rail.on('test.async.error', async () => {
			throw new Error('Handler error');
		}, 'error-module');

		rail.on('test.async.error', async () => {
			return 'success';
		}, 'good-module');

		const results = await rail.emitAsync('test.async.error', {});

		expect(results.length).toBe(2);
		expect(results[0].error).toBe('Handler error');
		expect(results[1].result).toBe('success');
		expect(errorEventReceived).toBe(true);
	});

	it('should work with synchronous handlers', async () => {
		const rail = new Rail();

		rail.on('test.sync', () => 'sync-result', 'sync-module');
		rail.on('test.sync', async () => 'async-result', 'async-module');

		const results = await rail.emitAsync('test.sync', {});

		expect(results.length).toBe(2);
		expect(results[0].result).toBe('sync-result');
		expect(results[1].result).toBe('async-result');
	});

	it('should return empty array when no listeners', async () => {
		const rail = new Rail();
		const results = await rail.emitAsync('nonexistent.event', {});
		expect(results.length).toBe(0);
	});
});

describe('Performance options', () => {
	it('should allow disabling cloning for performance', () => {
		const rail = new Rail({ clone: false });
		const original = { value: 'original' };

		rail.on('test.noclone', (data) => {
			data.value = 'modified';
		}, 'test-module');

		rail.emit('test.noclone', original);

		expect(original.value).toBe('modified');
	});

	it('should have cloning enabled by default', () => {
		const rail = new Rail();
		const original = { value: 'original' };

		rail.on('test.withclone', (data) => {
			data.value = 'modified';
		}, 'test-module');

		rail.emit('test.withclone', original);

		expect(original.value).toBe('original');
	});

	it('should toggle cloning at runtime', () => {
		const rail = new Rail({ clone: true });
		const test1 = { value: 'test1' };
		const test2 = { value: 'test2' };

		rail.on('test.toggle', (data) => {
			data.value = 'modified';
		}, 'test-module');

		rail.emit('test.toggle', test1);
		expect(test1.value).toBe('test1');

		rail.setClone(false);
		rail.emit('test.toggle', test2);
		expect(test2.value).toBe('modified');
	});
});

describe('Utility methods', () => {
	it('should wait for specific events', async () => {
		const rail = new Rail();

		setTimeout(() => {
			rail.emit('delayed.event', { data: 'delayed' });
		}, 10);

		const result = await rail.waitFor('delayed.event');
		expect(result.data).toBe('delayed');
	});

	it('should timeout when waiting for events', async () => {
		const rail = new Rail();

		await expect(rail.waitFor('nonexistent.event', 50)).rejects.toThrow('Timeout');
	});

	it('should provide rail statistics', () => {
		const rail = new Rail();

		const module1 = {
			name: 'stats-1',
			connect(rail) {
				rail.on('test', () => {}, 'stats-1');
			},
		};

		rail.attach(module1);
		rail.emit('test.stat');

		const stats = rail.getStats();
		expect(stats.modules).toBe(1);
		expect(stats.events).toBeGreaterThan(0);
	});
});
