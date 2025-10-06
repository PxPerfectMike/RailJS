/**
 * RailJS - Event-driven architecture for AI-assisted development
 * Core Rail implementation
 */

export class Rail {
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
	 * Listen for events
	 * @param {string} event - Event name to listen for
	 * @param {function} callback - Function to call when event is emitted
	 * @param {string} moduleName - Name of the module (for debugging/cleanup)
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
	 * Remove event listener
	 * @param {string} event - Event name
	 * @param {number} listenerId - Listener ID to remove
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
	 * Emit an event to all listeners (synchronous)
	 * @param {string} event - Event name to emit
	 * @param {any} data - Data to send with the event
	 * @returns {number} Number of handlers that were called
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
	 * Emit an event to all listeners and wait for all async handlers to complete
	 * @param {string} event - Event name to emit
	 * @param {any} data - Data to send with the event
	 * @returns {Promise<Array>} Promise that resolves with array of handler results
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
	 * Attach a module to the rail
	 * @param {object} module - Module object with name and connect method
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
	 * Detach a module from the rail
	 * @param {string} moduleName - Name of the module to detach
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
	 * Get information about attached modules
	 */
	getModules() {
		return Array.from(this.modules.keys());
	}

	/**
	 * Get information about event listeners
	 */
	getEvents() {
		const events = {};
		for (const [event, listeners] of this.listeners) {
			events[event] = listeners.map((l) => l.module);
		}
		return events;
	}

	/**
	 * Get recent event history (for debugging)
	 * @param {number} limit - Number of recent events to return
	 */
	getHistory(limit = 10) {
		return this.eventHistory.slice(-limit);
	}

	/**
	 * Clear event history
	 */
	clearHistory() {
		this.eventHistory = [];
	}

	/**
	 * Wait for a specific event (useful for testing)
	 * @param {string} event - Event to wait for
	 * @param {number} timeout - Timeout in milliseconds
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
	 * Deep clone object to prevent contamination
	 * @private
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
	 * Enable/disable debug mode
	 */
	setDebug(enabled) {
		this.debug = enabled;
		if (enabled) {
			console.log(`🐛 [${this.name}] Debug mode enabled`);
		}
	}

	/**
	 * Enable/disable deep cloning of event data
	 * WARNING: Disabling cloning improves performance but allows modules to contaminate each other's data
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
	 * Get rail statistics
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

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { Rail };
}
