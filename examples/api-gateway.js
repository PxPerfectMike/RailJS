/**
 * Example: API Gateway with RailJS
 * Demonstrates request/response pattern with multiple services
 */

import { Rail } from '../rail.js';

const rail = new Rail({ debug: true });

// API Gateway Module
const apiGatewayModule = {
	name: 'api-gateway',

	connect(rail) {
		// Simulate HTTP request
		rail.on('http.request', async (data) => {
			const { method, path, body } = data;
			console.log(`📥 ${method} ${path}`);

			// Route to appropriate service
			if (path.startsWith('/users')) {
				rail.emit('service.users.request', { method, path, body });
			} else if (path.startsWith('/products')) {
				rail.emit('service.products.request', { method, path, body });
			} else {
				rail.emit('http.response', { status: 404, body: 'Not Found' });
			}
		}, 'api-gateway');
	}
};

// User Service Module
const userServiceModule = {
	name: 'user-service',
	users: new Map([
		[1, { id: 1, name: 'Alice', email: 'alice@example.com' }],
		[2, { id: 2, name: 'Bob', email: 'bob@example.com' }]
	]),

	connect(rail) {
		rail.on('service.users.request', (data) => {
			const { method, path } = data;

			if (method === 'GET' && path === '/users') {
				rail.emit('http.response', {
					status: 200,
					body: Array.from(this.users.values())
				});
			} else if (method === 'GET' && path.match(/\/users\/\d+/)) {
				const id = parseInt(path.split('/')[2]);
				const user = this.users.get(id);

				if (user) {
					rail.emit('http.response', { status: 200, body: user });
				} else {
					rail.emit('http.response', { status: 404, body: 'User not found' });
				}
			}
		}, 'user-service');
	}
};

// Analytics Module
const analyticsModule = {
	name: 'analytics',
	requests: [],

	connect(rail) {
		rail.on('http.request', (data) => {
			this.requests.push({
				...data,
				timestamp: new Date()
			});
			console.log(`📊 Total requests: ${this.requests.length}`);
		}, 'analytics');
	}
};

// Rate Limiter Module
const rateLimiterModule = {
	name: 'rate-limiter',
	limits: new Map(),

	connect(rail) {
		rail.on('http.request', (data) => {
			const ip = data.ip || 'unknown';
			const now = Date.now();

			if (!this.limits.has(ip)) {
				this.limits.set(ip, []);
			}

			const requests = this.limits.get(ip).filter(t => now - t < 60000);
			requests.push(now);
			this.limits.set(ip, requests);

			if (requests.length > 100) {
				console.warn(`⚠️  Rate limit exceeded for ${ip}`);
				rail.emit('rate-limit.exceeded', { ip, requests: requests.length });
			}
		}, 'rate-limiter');
	}
};

// Attach all modules
rail.attach(apiGatewayModule);
rail.attach(userServiceModule);
rail.attach(analyticsModule);
rail.attach(rateLimiterModule);

// Listen for responses
rail.on('http.response', (data) => {
	console.log(`📤 ${data.status}:`, data.body);
}, 'response-logger');

// Simulate API requests
console.log('\n=== Simulating API Gateway ===\n');

rail.emit('http.request', {
	method: 'GET',
	path: '/users',
	ip: '192.168.1.1'
});

setTimeout(() => {
	rail.emit('http.request', {
		method: 'GET',
		path: '/users/1',
		ip: '192.168.1.1'
	});
}, 100);

setTimeout(() => {
	rail.emit('http.request', {
		method: 'GET',
		path: '/users/999',
		ip: '192.168.1.1'
	});
}, 200);
