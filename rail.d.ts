/**
 * RailJS TypeScript Definitions
 */

/**
 * Configuration options for creating a Rail instance
 */
export interface RailOptions {
	/** Optional name for the rail (used in debug messages) */
	name?: string;
	/** Enable debug logging (default: false) */
	debug?: boolean;
	/** Enable deep cloning of event data (default: true) */
	clone?: boolean;
}

/**
 * A module that can be attached to a Rail
 */
export interface RailModule {
	/** Unique name for the module */
	name: string;
	/** Called when the module is attached to a rail */
	connect?(rail: Rail): void;
	/** Called when the module is detached from a rail */
	disconnect?(rail: Rail): void;
}

/**
 * Event handler callback function
 */
export type EventHandler<T = any> = (data: T) => void | Promise<void> | any;

/**
 * Unsubscribe function returned by rail.on()
 */
export type UnsubscribeFunction = () => void;

/**
 * Result from an async event handler
 */
export interface AsyncEventResult<T = any> {
	/** Name of the module that handled the event */
	module: string;
	/** Result returned by the handler (null if error occurred) */
	result: T | null;
	/** Error message if handler threw an error (null if successful) */
	error: string | null;
}

/**
 * Event history entry
 */
export interface EventHistoryEntry {
	/** Event name */
	event: string;
	/** Event data */
	data: any;
	/** Timestamp when event was emitted */
	timestamp: number;
}

/**
 * Rail statistics
 */
export interface RailStats {
	/** Name of the rail */
	name: string;
	/** Number of attached modules */
	modules: number;
	/** Number of unique events with listeners */
	events: number;
	/** Total number of event listeners across all events */
	totalListeners: number;
	/** Total number of events emitted */
	eventsEmitted: number;
}

/**
 * Map of events to their listening modules
 */
export type EventListenersMap = Record<string, string[]>;

/**
 * Main Rail class - Event bus for modular applications
 */
export class Rail {
	/** Rail instance name */
	name: string;
	/** Debug mode enabled */
	debug: boolean;
	/** Deep cloning enabled */
	clone: boolean;

	/**
	 * Create a new Rail instance
	 * @param options Configuration options
	 */
	constructor(options?: RailOptions);

	/**
	 * Listen for events
	 * @param event Event name to listen for
	 * @param callback Function to call when event is emitted
	 * @param moduleName Name of the module (for debugging/cleanup)
	 * @returns Unsubscribe function to stop listening
	 */
	on<T = any>(
		event: string,
		callback: EventHandler<T>,
		moduleName?: string
	): UnsubscribeFunction;

	/**
	 * Remove event listener by ID
	 * @param event Event name
	 * @param listenerId Listener ID to remove
	 * @returns True if listener was removed
	 */
	off(event: string, listenerId: number): boolean;

	/**
	 * Emit an event to all listeners (synchronous)
	 * @param event Event name to emit
	 * @param data Data to send with the event
	 * @returns Number of handlers that were called
	 */
	emit<T = any>(event: string, data?: T): number;

	/**
	 * Emit an event and wait for all async handlers to complete
	 * @param event Event name to emit
	 * @param data Data to send with the event
	 * @returns Promise that resolves with array of handler results
	 */
	emitAsync<T = any, R = any>(
		event: string,
		data?: T
	): Promise<AsyncEventResult<R>[]>;

	/**
	 * Attach a module to the rail
	 * @param module Module object with name and connect method
	 * @returns The rail instance (for chaining)
	 */
	attach(module: RailModule): this;

	/**
	 * Detach a module from the rail
	 * @param moduleName Name of the module to detach
	 * @returns True if module was detached
	 */
	detach(moduleName: string): boolean;

	/**
	 * Get list of attached module names
	 * @returns Array of module names
	 */
	getModules(): string[];

	/**
	 * Get map of events to their listening modules
	 * @returns Object mapping event names to arrays of module names
	 */
	getEvents(): EventListenersMap;

	/**
	 * Get recent event history
	 * @param limit Number of recent events to return (default: 10)
	 * @returns Array of recent event history entries
	 */
	getHistory(limit?: number): EventHistoryEntry[];

	/**
	 * Clear event history
	 */
	clearHistory(): void;

	/**
	 * Wait for a specific event (useful for testing)
	 * @param event Event to wait for
	 * @param timeout Timeout in milliseconds (default: 5000)
	 * @returns Promise that resolves with event data
	 */
	waitFor<T = any>(event: string, timeout?: number): Promise<T>;

	/**
	 * Enable/disable debug mode
	 * @param enabled Whether to enable debug mode
	 */
	setDebug(enabled: boolean): void;

	/**
	 * Enable/disable deep cloning of event data
	 * WARNING: Disabling cloning improves performance but allows modules to contaminate each other's data
	 * @param enabled Whether to enable deep cloning
	 */
	setClone(enabled: boolean): void;

	/**
	 * Get rail statistics
	 * @returns Statistics about the rail
	 */
	getStats(): RailStats;
}

/**
 * Default export for CommonJS compatibility
 */
export default Rail;
