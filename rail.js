/**
 * RailJS - Lightweight event bus for modular JavaScript applications
 *
 * @class Rail
 * @description Central event bus that enables module-to-module communication through events.
 * Provides data isolation, module lifecycle management, and error handling.
 *
 * @example
 * // Create a Rail instance
 * const rail = new Rail({ name: 'my-app', debug: true, clone: true });
 *
 * // Listen for events
 * rail.on('user.login', (data) => {
 *   console.log('User logged in:', data.username);
 * }, 'auth-module');
 *
 * // Emit events
 * rail.emit('user.login', { username: 'john', timestamp: Date.now() });
 *
 * // Async events
 * const results = await rail.emitAsync('process.data', { value: 42 });
 *
 * @see {@link https://github.com/PxPerfectMike/RailJS|GitHub Repository}
 */
export class Rail {
	/**
	 * Create a new Rail instance
	 *
	 * @constructor
	 * @param {Object} [options={}] - Configuration options
	 * @param {string} [options.name='rail-app'] - Name of the Rail instance (for debugging)
	 * @param {boolean} [options.debug=false] - Enable debug logging
	 * @param {boolean} [options.clone=true] - Enable deep cloning of event data for module isolation
	 *
	 * @example
	 * // Basic usage
	 * const rail = new Rail();
	 *
	 * @example
	 * // With configuration
	 * const rail = new Rail({
	 *   name: 'api-gateway',
	 *   debug: process.env.NODE_ENV !== 'production',
	 *   clone: true
	 * });
	 *
	 * @example
	 * // Performance mode (no cloning)
	 * const fastRail = new Rail({ clone: false });
	 */
	constructor(options = {}) {
		this.name = options.name || 'rail-app';
		this.debug = options.debug || false;
		this.clone = options.clone !== undefined ? options.clone : true; // Deep clone by default
		this.listeners = new Map(); // event -> array of {callback, module, id}
		this.modules = new Map(); // module name -> module instance
		this.eventHistory = []; // For debugging and replay
		this.listenerIdCounter = 0;

		if (this.debug) {
			console.log(`🚂 [${this.name}] Rail started in debug mode`);
			if (!this.clone) {
				console.warn(`⚠️  [${this.name}] Deep cloning is DISABLED - modules can contaminate each other's data`);
			}
		}
	}

	/**
	 * Register an event listener
	 *
	 * @param {string} event - Event name to listen for (e.g., 'user.login', 'data.updated')
	 * @param {function} callback - Function to call when event is emitted. Receives event data as argument.
	 * @param {string} [moduleName='anonymous'] - Name of the module registering the listener (for debugging)
	 * @returns {function} Unsubscribe function - Call to remove this listener
	 *
	 * @example
	 * // Basic listener
	 * rail.on('user.created', (data) => {
	 *   console.log('New user:', data.username);
	 * }, 'user-module');
	 *
	 * @example
	 * // Unsubscribe pattern
	 * const unsubscribe = rail.on('event', handler, 'module');
	 * unsubscribe(); // Remove listener
	 *
	 * @example
	 * // Async handler (use emitAsync to get results)
	 * rail.on('process.data', async (data) => {
	 *   const result = await someAsyncOperation(data);
	 *   return result;
	 * }, 'processor');
	 *
	 * @throws {Error} If callback is not a function
	 */
	on(event, callback, moduleName = 'anonymous') {
		if (typeof callback !== 'function') {
			throw new Error('Callback must be a function');
		}

		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}

		const listenerId = ++this.listenerIdCounter;
		this.listeners.get(event).push({
			callback,
			module: moduleName,
			id: listenerId,
		});

		if (this.debug) {
			console.log(
				`📡 [${this.name}] ${moduleName} listening for '${event}'`
			);
		}

		// Return unsubscribe function
		return () => this.off(event, listenerId);
	}

	/**
	 * Remove an event listener by ID
	 *
	 * @param {string} event - Event name
	 * @param {number} listenerId - Internal listener ID to remove
	 * @returns {boolean} True if listener was found and removed, false otherwise
	 *
	 * @example
	 * // Typically used via the unsubscribe function returned by on()
	 * const unsubscribe = rail.on('event', handler);
	 * unsubscribe(); // Internally calls off()
	 *
	 * @see {@link Rail#on} for the recommended way to unsubscribe
	 */
	off(event, listenerId) {
		const listeners = this.listeners.get(event);
		if (!listeners) return false;

		const filtered = listeners.filter((l) => l.id !== listenerId);
		if (filtered.length === 0) {
			this.listeners.delete(event);
		} else {
			this.listeners.set(event, filtered);
		}
		return true;
	}

	/**
	 * Emit an event synchronously to all registered listeners
	 *
	 * @param {string} event - Event name to emit (e.g., 'user.login', 'data.saved')
	 * @param {*} [data={}] - Data to send with the event. Will be deep cloned if cloning is enabled.
	 * @returns {number} Number of listeners that handled the event
	 *
	 * @example
	 * // Emit a simple event
	 * rail.emit('user.login', { username: 'john', timestamp: Date.now() });
	 *
	 * @example
	 * // Check how many handlers received it
	 * const handlerCount = rail.emit('notification', { message: 'Hello' });
	 * console.log(`Event handled by ${handlerCount} modules`);
	 *
	 * @example
	 * // With deep cloning (default), data is isolated
	 * const data = { counter: 0 };
	 * rail.emit('increment', data);
	 * console.log(data.counter); // Still 0 - modules get cloned copies
	 *
	 * @see {@link Rail#emitAsync} for async event emission with return values
	 */
	emit(event, data = {}) {
		const timestamp = Date.now();

		// Store in history for debugging
		this.eventHistory.push({ event, data, timestamp });

		if (this.debug) {
			console.log(`🔥 [${this.name}] Emitting '${event}':`, data);
		}

		const listeners = this.listeners.get(event) || [];
		let handledCount = 0;

		listeners.forEach(({ callback, module }) => {
			try {
				// Deep clone to prevent contamination between modules (if enabled)
				const eventData = this.clone ? this._deepClone(data) : data;

				if (this.debug) {
					console.log(`   ↳ ${module} handling '${event}'`);
				}

				callback(eventData);
				handledCount++;
			} catch (error) {
				console.error(
					`❌ [${this.name}] Error in module '${module}' handling '${event}':`,
					error
				);

				// Emit error event for error handling modules
				// Note: Always clone error events to prevent recursion issues
				const errorData = {
					module,
					event,
					error: error.message,
					timestamp,
				};

				// Temporarily force cloning for error events to avoid infinite loops
				const originalClone = this.clone;
				this.clone = true;
				this.emit('rail.error', errorData);
				this.clone = originalClone;
			}
		});

		if (this.debug && handledCount === 0) {
			console.warn(
				`⚠️  [${this.name}] No listeners for event '${event}'`
			);
		}

		return handledCount;
	}

	/**
	 * Emit an event asynchronously and wait for all handlers to complete
	 *
	 * Unlike emit(), this method awaits all handlers (including async ones) and returns their results.
	 * Useful for data processing pipelines, validation workflows, and collecting responses.
	 *
	 * @param {string} event - Event name to emit
	 * @param {*} [data={}] - Data to send with the event. Will be deep cloned if cloning is enabled.
	 * @returns {Promise<Array<{module: string, result: *, error: string|null}>}
	 *          Array of results from all handlers, even if some fail
	 *
	 * @example
	 * // Collect results from multiple handlers
	 * const results = await rail.emitAsync('process.order', { orderId: 123 });
	 * results.forEach(({ module, result, error }) => {
	 *   if (error) {
	 *     console.error(`${module} failed:`, error);
	 *   } else {
	 *     console.log(`${module} returned:`, result);
	 *   }
	 * });
	 *
	 * @example
	 * // Validation pipeline
	 * const validations = await rail.emitAsync('validate.input', { email: 'user@example.com' });
	 * const allValid = validations.every(r => r.error === null && r.result === true);
	 *
	 * @example
	 * // Parallel data processing
	 * rail.on('transform.data', async (data) => {
	 *   const processed = await expensiveOperation(data);
	 *   return processed;
	 * }, 'transformer-1');
	 *
	 * const results = await rail.emitAsync('transform.data', rawData);
	 *
	 * @see {@link Rail#emit} for synchronous event emission
	 */
	async emitAsync(event, data = {}) {
		const timestamp = Date.now();

		// Store in history for debugging
		this.eventHistory.push({ event, data, timestamp });

		if (this.debug) {
			console.log(`🔥 [${this.name}] Emitting async '${event}':`, data);
		}

		const listeners = this.listeners.get(event) || [];

		if (this.debug && listeners.length === 0) {
			console.warn(
				`⚠️  [${this.name}] No listeners for event '${event}'`
			);
		}

		// Map all listeners to promises
		const promises = listeners.map(async ({ callback, module }) => {
			try {
				// Deep clone to prevent contamination between modules (if enabled)
				const eventData = this.clone ? this._deepClone(data) : data;

				if (this.debug) {
					console.log(`   ↳ ${module} handling async '${event}'`);
				}

				const result = await callback(eventData);
				return { module, result, error: null };
			} catch (error) {
				console.error(
					`❌ [${this.name}] Error in module '${module}' handling async '${event}':`,
					error
				);

				// Emit error event for error handling modules
				const errorData = {
					module,
					event,
					error: error.message,
					timestamp,
				};

				// Temporarily force cloning for error events to avoid infinite loops
				const originalClone = this.clone;
				this.clone = true;
				this.emit('rail.error', errorData);
				this.clone = originalClone;

				return { module, result: null, error: error.message };
			}
		});

		// Wait for all handlers to complete
		return await Promise.all(promises);
	}

	/**
	 * Attach a module to the Rail instance
	 *
	 * Modules are objects with a `name` property and optional `connect` and `disconnect` methods.
	 * The `connect` method is called immediately and receives the Rail instance as an argument.
	 *
	 * @param {Object} module - Module object to attach
	 * @param {string} module.name - Unique name for the module
	 * @param {function} [module.connect] - Called when module is attached, receives Rail instance
	 * @param {function} [module.disconnect] - Called when module is detached
	 * @returns {Rail} Returns this for method chaining
	 *
	 * @throws {Error} If module is invalid, missing name, or already attached
	 *
	 * @example
	 * // Basic module
	 * const logger = {
	 *   name: 'logger',
	 *   connect(rail) {
	 *     rail.on('*', (data) => console.log(data), 'logger');
	 *   }
	 * };
	 * rail.attach(logger);
	 *
	 * @example
	 * // Module with state
	 * const analytics = {
	 *   name: 'analytics',
	 *   events: [],
	 *   connect(rail) {
	 *     rail.on('user.action', (data) => {
	 *       this.events.push(data);
	 *     }, 'analytics');
	 *   },
	 *   disconnect() {
	 *     console.log('Total events:', this.events.length);
	 *   }
	 * };
	 * rail.attach(analytics);
	 *
	 * @example
	 * // Method chaining
	 * rail.attach(module1).attach(module2).attach(module3);
	 *
	 * @see {@link Rail#detach} to remove a module
	 */
	attach(module) {
		if (!module || typeof module !== 'object') {
			throw new Error('Module must be an object');
		}

		if (!module.name || typeof module.name !== 'string') {
			throw new Error('Module must have a name property');
		}

		if (this.modules.has(module.name)) {
			throw new Error(`Module '${module.name}' is already attached`);
		}

		// Store module
		this.modules.set(module.name, module);

		// Call connect method if it exists
		if (typeof module.connect === 'function') {
			try {
				module.connect(this);
			} catch (error) {
				// Remove module if connection fails
				this.modules.delete(module.name);
				throw new Error(
					`Failed to connect module '${module.name}': ${error.message}`
				);
			}
		}

		if (this.debug) {
			console.log(`🔗 [${this.name}] Attached module '${module.name}'`);
		}

		// Emit module attached event
		this.emit('rail.module.attached', { moduleName: module.name });

		return this; // For chaining
	}

	/**
	 * Detach a module from the Rail instance
	 *
	 * Removes the module and all its event listeners. Calls the module's `disconnect` method if present.
	 *
	 * @param {string} moduleName - Name of the module to detach
	 * @returns {boolean} True if module was found and detached, false if module wasn't attached
	 *
	 * @example
	 * // Detach a module
	 * rail.detach('analytics');
	 *
	 * @example
	 * // Hot-swap modules at runtime
	 * if (rail.detach('old-logger')) {
	 *   rail.attach(newLogger);
	 * }
	 *
	 * @example
	 * // Check if detach succeeded
	 * const removed = rail.detach('optional-module');
	 * if (removed) {
	 *   console.log('Module removed');
	 * }
	 *
	 * @see {@link Rail#attach} to add a module
	 */
	detach(moduleName) {
		const module = this.modules.get(moduleName);
		if (!module) {
			if (this.debug) {
				console.warn(
					`⚠️  [${this.name}] Module '${moduleName}' not found`
				);
			}
			return false;
		}

		// Remove all listeners for this module
		for (const [event, listeners] of this.listeners) {
			const filtered = listeners.filter((l) => l.module !== moduleName);
			if (filtered.length === 0) {
				this.listeners.delete(event);
			} else {
				this.listeners.set(event, filtered);
			}
		}

		// Call disconnect method if it exists
		if (typeof module.disconnect === 'function') {
			try {
				module.disconnect(this);
			} catch (error) {
				console.error(
					`❌ [${this.name}] Error disconnecting module '${moduleName}':`,
					error
				);
			}
		}

		this.modules.delete(moduleName);

		if (this.debug) {
			console.log(`🔓 [${this.name}] Detached module '${moduleName}'`);
		}

		// Emit module detached event
		this.emit('rail.module.detached', { moduleName });

		return true;
	}

	/**
	 * Get list of attached module names
	 *
	 * @returns {string[]} Array of module names currently attached
	 *
	 * @example
	 * const modules = rail.getModules();
	 * console.log('Active modules:', modules);
	 * // ['logger', 'analytics', 'cache']
	 */
	getModules() {
		return Array.from(this.modules.keys());
	}

	/**
	 * Get information about registered event listeners
	 *
	 * @returns {Object<string, string[]>} Object mapping event names to arrays of module names
	 *
	 * @example
	 * const events = rail.getEvents();
	 * console.log(events);
	 * // {
	 * //   'user.login': ['auth', 'analytics'],
	 * //   'data.saved': ['cache', 'logger']
	 * // }
	 */
	getEvents() {
		const events = {};
		for (const [event, listeners] of this.listeners) {
			events[event] = listeners.map((l) => l.module);
		}
		return events;
	}

	/**
	 * Get recent event history for debugging
	 *
	 * @param {number} [limit=10] - Maximum number of recent events to return
	 * @returns {Array<{event: string, data: *, timestamp: number}>} Array of recent events
	 *
	 * @example
	 * // Get last 5 events
	 * const recent = rail.getHistory(5);
	 * recent.forEach(({ event, data, timestamp }) => {
	 *   console.log(`${new Date(timestamp).toISOString()} - ${event}:`, data);
	 * });
	 */
	getHistory(limit = 10) {
		return this.eventHistory.slice(-limit);
	}

	/**
	 * Clear the event history
	 *
	 * Useful to free memory in long-running applications or reset debugging state.
	 *
	 * @example
	 * rail.clearHistory();
	 */
	clearHistory() {
		this.eventHistory = [];
	}

	/**
	 * Wait for a specific event to be emitted (useful for testing)
	 *
	 * Returns a promise that resolves with the event data when the event is emitted,
	 * or rejects if the timeout is reached.
	 *
	 * @param {string} event - Event name to wait for
	 * @param {number} [timeout=5000] - Timeout in milliseconds (default: 5 seconds)
	 * @returns {Promise<*>} Promise that resolves with event data
	 *
	 * @throws {Error} If timeout is reached before event is emitted
	 *
	 * @example
	 * // Wait for event in test
	 * test('emits user.created', async () => {
	 *   const promise = rail.waitFor('user.created', 1000);
	 *   rail.emit('user.created', { id: 1 });
	 *   const data = await promise;
	 *   expect(data.id).toBe(1);
	 * });
	 *
	 * @example
	 * // Wait for async operation
	 * setTimeout(() => rail.emit('delayed', { msg: 'hello' }), 100);
	 * const data = await rail.waitFor('delayed');
	 * console.log(data.msg); // 'hello'
	 */
	waitFor(event, timeout = 5000) {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(new Error(`Timeout waiting for event '${event}'`));
			}, timeout);

			const unsubscribe = this.on(
				event,
				(data) => {
					clearTimeout(timer);
					unsubscribe();
					resolve(data);
				},
				'wait-for'
			);
		});
	}

	/**
	 * Deep clone object to prevent data contamination between modules
	 *
	 * @private
	 * @param {*} obj - Object to clone
	 * @returns {*} Deep cloned copy
	 */
	_deepClone(obj) {
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}

		if (obj instanceof Date) {
			return new Date(obj.getTime());
		}

		if (obj instanceof Array) {
			return obj.map((item) => this._deepClone(item));
		}

		if (obj instanceof RegExp) {
			return new RegExp(obj);
		}

		if (typeof obj === 'object') {
			const cloned = {};
			for (const key in obj) {
				if (obj.hasOwnProperty(key)) {
					cloned[key] = this._deepClone(obj[key]);
				}
			}
			return cloned;
		}

		return obj;
	}

	/**
	 * Enable or disable debug mode
	 *
	 * @param {boolean} enabled - Whether to enable debug logging
	 *
	 * @example
	 * rail.setDebug(true); // Enable verbose logging
	 * rail.emit('test', { msg: 'hello' }); // Logs event details
	 * rail.setDebug(false); // Disable logging
	 */
	setDebug(enabled) {
		this.debug = enabled;
		if (enabled) {
			console.log(`🐛 [${this.name}] Debug mode enabled`);
		}
	}

	/**
	 * Enable or disable deep cloning of event data
	 *
	 * When enabled (default), each module receives a separate clone of event data, preventing
	 * unintended side effects. When disabled, performance improves by ~30-50% but modules
	 * receive shared references.
	 *
	 * @param {boolean} enabled - Whether to enable deep cloning
	 *
	 * @example
	 * // Enable for safety (default)
	 * rail.setClone(true);
	 * const data = { count: 0 };
	 * rail.emit('event', data);
	 * // Modules can modify their copy without affecting others
	 *
	 * @example
	 * // Disable for performance (use with caution)
	 * rail.setClone(false);
	 * const data = { count: 0 };
	 * rail.emit('event', data);
	 * // All modules receive same object reference
	 *
	 * @see {@link https://github.com/PxPerfectMike/RailJS#performance|Performance Guide}
	 */
	setClone(enabled) {
		this.clone = enabled;
		if (this.debug) {
			if (enabled) {
				console.log(`🔒 [${this.name}] Deep cloning enabled - data isolation guaranteed`);
			} else {
				console.warn(`⚠️  [${this.name}] Deep cloning DISABLED - modules can contaminate each other's data`);
			}
		}
	}

	/**
	 * Get Rail instance statistics
	 *
	 * @returns {Object} Statistics object
	 * @returns {string} .name - Rail instance name
	 * @returns {number} .modules - Number of attached modules
	 * @returns {number} .events - Number of unique events with listeners
	 * @returns {number} .totalListeners - Total number of event listeners
	 * @returns {number} .eventsEmitted - Total events emitted (history size)
	 *
	 * @example
	 * const stats = rail.getStats();
	 * console.log(`Rail "${stats.name}" has ${stats.modules} modules`);
	 * console.log(`Listening to ${stats.events} events with ${stats.totalListeners} handlers`);
	 * console.log(`Emitted ${stats.eventsEmitted} events`);
	 */
	getStats() {
		return {
			name: this.name,
			modules: this.modules.size,
			events: this.listeners.size,
			totalListeners: Array.from(this.listeners.values()).reduce(
				(sum, listeners) => sum + listeners.length,
				0
			),
			eventsEmitted: this.eventHistory.length,
		};
	}
}
