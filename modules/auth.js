/**
 * Auth Module - Handle user authentication
 * Listens: user.login, user.logout, user.register, auth.validate
 * Emits: auth.success, auth.failed, auth.logout.success, auth.registration.success, auth.registration.failed, auth.valid, auth.invalid
 */

export const authModule = {
	name: 'auth',

	// Simple in-memory user store
	users: new Map([
		[
			'demo@example.com',
			{ password: 'demo123', id: 1, name: 'Demo User', role: 'user' },
		],
		[
			'admin@example.com',
			{ password: 'admin456', id: 2, name: 'Admin User', role: 'admin' },
		],
	]),

	activeSessions: new Map(),

	connect(rail) {
		// Handle login attempts
		rail.on(
			'user.login',
			(data) => {
				const { email, password, rememberMe = false } = data;
				const user = this.users.get(email);

				if (user && user.password === password) {
					const token = this.generateToken();
					const sessionData = {
						userId: user.id,
						email: user.email,
						name: user.name,
						role: user.role,
						token,
						createdAt: new Date(),
						expiresAt: new Date(
							Date.now() +
								(rememberMe
									? 30 * 24 * 60 * 60 * 1000
									: 24 * 60 * 60 * 1000)
						),
					};

					this.activeSessions.set(token, sessionData);

					rail.emit('auth.success', {
						token,
						user: {
							id: user.id,
							email: user.email,
							name: user.name,
							role: user.role,
						},
						expiresAt: sessionData.expiresAt,
					});
				} else {
					rail.emit('auth.failed', {
						email,
						error: 'Invalid email or password',
						timestamp: new Date(),
					});
				}
			},
			'auth'
		);

		// Handle token validation
		rail.on(
			'auth.validate',
			(data) => {
				const { token } = data;
				const session = this.activeSessions.get(token);

				if (session && session.expiresAt > new Date()) {
					rail.emit('auth.valid', {
						token,
						user: {
							id: session.userId,
							email: session.email,
							name: session.name,
							role: session.role,
						},
					});
				} else {
					if (session) {
						this.activeSessions.delete(token);
					}
					rail.emit('auth.invalid', { token });
				}
			},
			'auth'
		);

		// Handle logout
		rail.on(
			'user.logout',
			(data) => {
				const { token } = data;
				const session = this.activeSessions.get(token);

				if (session) {
					this.activeSessions.delete(token);
					rail.emit('auth.logout.success', {
						userId: session.userId,
						email: session.email,
					});
				} else {
					rail.emit('auth.logout.failed', {
						error: 'Invalid session',
					});
				}
			},
			'auth'
		);

		// Handle registration
		rail.on(
			'user.register',
			(data) => {
				const { email, password, name } = data;

				if (this.users.has(email)) {
					rail.emit('auth.registration.failed', {
						email,
						error: 'Email already exists',
					});
				} else if (!this.isValidEmail(email)) {
					rail.emit('auth.registration.failed', {
						email,
						error: 'Invalid email format',
					});
				} else if (!this.isValidPassword(password)) {
					rail.emit('auth.registration.failed', {
						email,
						error: 'Password must be at least 6 characters',
					});
				} else {
					const newUser = {
						id: this.users.size + 1,
						password,
						name,
						role: 'user',
						createdAt: new Date(),
					};

					this.users.set(email, newUser);

					rail.emit('auth.registration.success', {
						user: {
							id: newUser.id,
							email,
							name,
							role: newUser.role,
						},
					});
				}
			},
			'auth'
		);
	},

	generateToken() {
		return `jwt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	},

	isValidEmail(email) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	},

	isValidPassword(password) {
		return password && password.length >= 6;
	},
};

export default authModule;
