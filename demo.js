/**
 * RailJS Demo - Complete working example
 * Shows modules communicating through events only
 */

// Import the Rail (adjust for your environment)
import { Rail } from './rail.js';
// OR for Node.js: const { Rail } = require('./rail.js');

// Create the main rail
const rail = new Rail({
	name: 'demo-app',
	debug: true,
});

// ===== AUTH MODULE =====
const authModule = {
	name: 'auth',
	users: new Map([
		['demo@example.com', { password: 'demo123', id: 1, name: 'Demo User' }],
		[
			'admin@example.com',
			{ password: 'admin456', id: 2, name: 'Admin User' },
		],
	]),

	connect(rail) {
		// Handle login attempts
		rail.on(
			'user.login',
			(data) => {
				console.log('🔐 Auth: Processing login attempt...');

				const { email, password } = data;
				const user = this.users.get(email);

				// Simulate async validation
				setTimeout(() => {
					if (user && user.password === password) {
						rail.emit('auth.success', {
							token: `jwt-${Date.now()}`,
							user: { id: user.id, email, name: user.name },
						});
					} else {
						rail.emit('auth.failed', {
							email,
							error: 'Invalid email or password',
						});
					}
				}, 100);
			},
			'auth'
		);

		// Handle logout
		rail.on(
			'user.logout',
			(data) => {
				console.log('🚪 Auth: Processing logout...');
				rail.emit('auth.logout.success', { userId: data.userId });
			},
			'auth'
		);

		// Handle registration
		rail.on(
			'user.register',
			(data) => {
				console.log('📝 Auth: Processing registration...');

				const { email, password, name } = data;

				if (this.users.has(email)) {
					rail.emit('auth.registration.failed', {
						email,
						error: 'Email already exists',
					});
				} else {
					const newUser = {
						id: this.users.size + 1,
						password,
						name,
					};

					this.users.set(email, newUser);

					rail.emit('auth.registration.success', {
						user: { id: newUser.id, email, name },
					});
				}
			},
			'auth'
		);
	},
};

// ===== DATABASE MODULE =====
const databaseModule = {
	name: 'database',
	sessions: new Map(),
	loginHistory: [],

	connect(rail) {
		// Save successful login sessions
		rail.on(
			'auth.success',
			(data) => {
				console.log('💾 Database: Saving login session...');

				const sessionId = `session-${Date.now()}`;
				this.sessions.set(sessionId, {
					userId: data.user.id,
					token: data.token,
					createdAt: new Date(),
					lastActivity: new Date(),
				});

				this.loginHistory.push({
					userId: data.user.id,
					email: data.user.email,
					loginTime: new Date(),
					sessionId,
				});

				rail.emit('database.session.created', {
					sessionId,
					userId: data.user.id,
				});
			},
			'database'
		);

		// Clean up sessions on logout
		rail.on(
			'auth.logout.success',
			(data) => {
				console.log('🗑️  Database: Cleaning up session...');

				// Find and remove session
				for (const [sessionId, session] of this.sessions) {
					if (session.userId === data.userId) {
						this.sessions.delete(sessionId);
						rail.emit('database.session.removed', { sessionId });
						break;
					}
				}
			},
			'database'
		);

		// Handle data queries
		rail.on(
			'data.get.sessions',
			() => {
				rail.emit('data.sessions', {
					active: this.sessions.size,
					history: this.loginHistory.slice(-5), // Last 5 logins
				});
			},
			'database'
		);
	},
};

// ===== EMAIL MODULE =====
const emailModule = {
	name: 'email',
	sentEmails: [],

	connect(rail) {
		// Send welcome email on successful login
		rail.on(
			'auth.success',
			(data) => {
				console.log('📧 Email: Sending welcome email...');

				const email = {
					to: data.user.email,
					subject: 'Welcome back!',
					type: 'welcome',
					sentAt: new Date(),
				};

				this.sentEmails.push(email);

				rail.emit('email.sent', {
					to: data.user.email,
					type: 'welcome',
					messageId: `msg-${Date.now()}`,
				});
			},
			'email'
		);

		// Send registration confirmation
		rail.on(
			'auth.registration.success',
			(data) => {
				console.log('📧 Email: Sending registration confirmation...');

				const email = {
					to: data.user.email,
					subject: 'Welcome to RailJS Demo!',
					type: 'registration',
					sentAt: new Date(),
				};

				this.sentEmails.push(email);

				rail.emit('email.sent', {
					to: data.user.email,
					type: 'registration',
					messageId: `msg-${Date.now()}`,
				});
			},
			'email'
		);

		// Get email history
		rail.on(
			'email.get.history',
			() => {
				rail.emit('email.history', {
					emails: this.sentEmails.slice(-10), // Last 10 emails
				});
			},
			'email'
		);
	},
};

// ===== LOGGER MODULE =====
const loggerModule = {
	name: 'logger',
	logs: [],

	connect(rail) {
		// Log all authentication events
		rail.on(
			'auth.success',
			(data) => {
				this.log('LOGIN_SUCCESS', `User ${data.user.email} logged in`);
			},
			'logger'
		);

		rail.on(
			'auth.failed',
			(data) => {
				this.log(
					'LOGIN_FAILED',
					`Failed login attempt for ${data.email}: ${data.error}`
				);
			},
			'logger'
		);

		rail.on(
			'auth.registration.success',
			(data) => {
				this.log(
					'REGISTRATION_SUCCESS',
					`New user registered: ${data.user.email}`
				);
			},
			'logger'
		);

		// Log email events
		rail.on(
			'email.sent',
			(data) => {
				this.log('EMAIL_SENT', `${data.type} email sent to ${data.to}`);
			},
			'logger'
		);

		// Log system events
		rail.on(
			'rail.module.attached',
			(data) => {
				this.log('SYSTEM', `Module ${data.moduleName} attached`);
			},
			'logger'
		);

		rail.on(
			'rail.module.detached',
			(data) => {
				this.log('SYSTEM', `Module ${data.moduleName} detached`);
			},
			'logger'
		);

		// Handle log queries
		rail.on(
			'logs.get',
			(data) => {
				const limit = data.limit || 20;
				rail.emit('logs.data', {
					logs: this.logs.slice(-limit),
				});
			},
			'logger'
		);
	},

	log(level, message) {
		const entry = {
			timestamp: new Date(),
			level,
			message,
			id: this.logs.length + 1,
		};

		this.logs.push(entry);
		console.log(`📝 Logger: [${level}] ${message}`);
	},
};

// ===== NOTIFICATION MODULE =====
const notificationModule = {
	name: 'notifications',

	connect(rail) {
		// Show success notifications
		rail.on(
			'auth.success',
			(data) => {
				this.notify('success', `Welcome back, ${data.user.name}!`);
			},
			'notifications'
		);

		rail.on(
			'email.sent',
			(data) => {
				this.notify('info', `${data.type} email sent`);
			},
			'notifications'
		);

		// Show error notifications
		rail.on(
			'auth.failed',
			(data) => {
				this.notify('error', `Login failed: ${data.error}`);
			},
			'notifications'
		);
	},

	notify(type, message) {
		const notification = {
			type,
			message,
			timestamp: new Date(),
			id: Date.now(),
		};

		console.log(`🔔 Notification [${type.toUpperCase()}]: ${message}`);

		rail.emit('notification.shown', notification);
	},
};

// ===== ATTACH ALL MODULES =====
console.log('🚂 Starting RailJS Demo Application...\n');

rail.attach(authModule);
rail.attach(databaseModule);
rail.attach(emailModule);
rail.attach(loggerModule);
rail.attach(notificationModule);

console.log('\n' + '='.repeat(50));
console.log('🎯 DEMO: Testing successful login');
console.log('='.repeat(50));

rail.emit('user.login', {
	email: 'demo@example.com',
	password: 'demo123',
});

// Test failed login after a delay
setTimeout(() => {
	console.log('\n' + '='.repeat(50));
	console.log('🎯 DEMO: Testing failed login');
	console.log('='.repeat(50));

	rail.emit('user.login', {
		email: 'wrong@example.com',
		password: 'wrongpass',
	});
}, 500);

// Test registration after another delay
setTimeout(() => {
	console.log('\n' + '='.repeat(50));
	console.log('🎯 DEMO: Testing user registration');
	console.log('='.repeat(50));

	rail.emit('user.register', {
		email: 'newuser@example.com',
		password: 'newpass123',
		name: 'New User',
	});
}, 1000);

// Test module detachment after everything
setTimeout(() => {
	console.log('\n' + '='.repeat(50));
	console.log('🎯 DEMO: Testing module detachment');
	console.log('='.repeat(50));

	console.log('Detaching email module...');
	rail.detach('email');

	console.log('\nTrying login without email module:');
	rail.emit('user.login', {
		email: 'demo@example.com',
		password: 'demo123',
	});
}, 1500);

// Show stats at the end
setTimeout(() => {
	console.log('\n' + '='.repeat(50));
	console.log('📊 FINAL STATS');
	console.log('='.repeat(50));

	const stats = rail.getStats();
	console.log('Rail Stats:', stats);
	console.log('Active Modules:', rail.getModules());
	console.log('Event Listeners:', rail.getEvents());

	// Get some data
	rail.emit('data.get.sessions');
	rail.emit('logs.get', { limit: 5 });
}, 2000);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { rail, authModule, databaseModule, emailModule };
}
