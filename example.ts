/**
 * TypeScript usage example for RailJS
 * This file demonstrates type-safe usage of the Rail API
 */

import { Rail, RailModule, RailOptions } from './rail.js';

// Define typed event data interfaces
interface UserLoginData {
	email: string;
	password: string;
}

interface AuthSuccessData {
	token: string;
	user: {
		id: number;
		email: string;
		name: string;
	};
}

interface AuthFailedData {
	email: string;
	error: string;
}

// Create a typed Rail instance
const options: RailOptions = {
	name: 'typed-app',
	debug: true,
	clone: true,
};

const rail = new Rail(options);

// Define a typed module
const authModule: RailModule = {
	name: 'auth',

	connect(rail: Rail) {
		// Type-safe event listener
		rail.on<UserLoginData>(
			'user.login',
			(data) => {
				console.log('Login attempt:', data.email);
				// TypeScript knows data has email and password properties

				// Emit typed response
				const response: AuthSuccessData = {
					token: 'jwt-token',
					user: {
						id: 1,
						email: data.email,
						name: 'John Doe',
					},
				};

				rail.emit<AuthSuccessData>('auth.success', response);
			},
			'auth'
		);
	},

	disconnect(rail: Rail) {
		console.log('Auth module disconnecting');
	},
};

// Define an async module
const databaseModule: RailModule = {
	name: 'database',

	connect(rail: Rail) {
		// Async event handler with typed data
		rail.on<AuthSuccessData>(
			'auth.success',
			async (data) => {
				console.log('Saving session for user:', data.user.id);

				// Simulate async database operation
				await new Promise((resolve) => setTimeout(resolve, 100));

				return { sessionId: 'session-123', userId: data.user.id };
			},
			'database'
		);
	},
};

// Attach modules with chaining
rail.attach(authModule).attach(databaseModule);

// Emit events with type safety
const loginData: UserLoginData = {
	email: 'user@example.com',
	password: 'secret',
};

rail.emit<UserLoginData>('user.login', loginData);

// Use async emit with typed results
async function loginUser(email: string, password: string) {
	const loginData: UserLoginData = { email, password };

	const results = await rail.emitAsync<
		UserLoginData,
		{ sessionId: string; userId: number }
	>('user.login', loginData);

	// TypeScript knows the shape of results
	results.forEach((result) => {
		if (result.error) {
			console.error(`Module ${result.module} failed:`, result.error);
		} else if (result.result) {
			console.log(
				`Module ${result.module} returned:`,
				result.result.sessionId
			);
		}
	});
}

// Wait for events with types
async function waitForAuth() {
	const authData = await rail.waitFor<AuthSuccessData>('auth.success', 5000);
	console.log('Auth succeeded for user:', authData.user.name);
}

// Get statistics with proper typing
const stats = rail.getStats();
console.log(`Rail has ${stats.modules} modules and ${stats.events} events`);

// Get module list
const modules: string[] = rail.getModules();
console.log('Attached modules:', modules);

// Type-safe unsubscribe
const unsubscribe = rail.on<UserLoginData>('user.login', (data) => {
	console.log('This handler will be removed');
});
unsubscribe(); // Type-safe unsubscribe function

// Export for other files
export { rail, authModule, databaseModule };
