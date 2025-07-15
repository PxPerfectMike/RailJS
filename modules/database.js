/**
 * Database Module - Handle data storage and retrieval
 * Listens: auth.registration.success, auth.success, auth.logout.success, data.get.user, data.get.sessions, data.get.audit
 * Emits: database.user.created, database.login.recorded, database.session.removed, data.user, data.user.not_found, data.sessions, data.audit
 */

export const databaseModule = {
	name: 'database',

	// Simulated database tables
	users: new Map(),
	sessions: new Map(),
	loginHistory: [],
	auditLog: [],

	connect(rail) {
		// Store user data on successful registration
		rail.on(
			'auth.registration.success',
			(data) => {
				const userData = {
					...data.user,
					createdAt: new Date(),
					lastLogin: null,
					loginCount: 0,
				};

				this.users.set(data.user.id, userData);
				this.auditLog.push({
					action: 'USER_CREATED',
					userId: data.user.id,
					details: { email: data.user.email },
					timestamp: new Date(),
				});

				rail.emit('database.user.created', { userId: data.user.id });
			},
			'database'
		);

		// Track successful logins
		rail.on(
			'auth.success',
			(data) => {
				const loginRecord = {
					userId: data.user.id,
					email: data.user.email,
					loginTime: new Date(),
					token: data.token,
					ipAddress: '127.0.0.1', // Would be real IP in production
					userAgent: 'RailJS Demo',
				};

				this.loginHistory.push(loginRecord);
				this.sessions.set(data.token, loginRecord);

				// Update user login stats
				const user = this.users.get(data.user.id);
				if (user) {
					user.lastLogin = new Date();
					user.loginCount = (user.loginCount || 0) + 1;
				}

				this.auditLog.push({
					action: 'USER_LOGIN',
					userId: data.user.id,
					details: { email: data.user.email },
					timestamp: new Date(),
				});

				rail.emit('database.login.recorded', {
					userId: data.user.id,
					sessionToken: data.token,
				});
			},
			'database'
		);

		// Clean up on logout
		rail.on(
			'auth.logout.success',
			(data) => {
				// Find and remove session by userId
				for (const [token, session] of this.sessions) {
					if (session.userId === data.userId) {
						this.sessions.delete(token);
						break;
					}
				}

				this.auditLog.push({
					action: 'USER_LOGOUT',
					userId: data.userId,
					details: { email: data.email },
					timestamp: new Date(),
				});

				rail.emit('database.session.removed', { userId: data.userId });
			},
			'database'
		);

		// Handle data queries
		rail.on(
			'data.get.user',
			(data) => {
				const user = this.users.get(data.userId);
				if (user) {
					rail.emit('data.user', { user });
				} else {
					rail.emit('data.user.not_found', { userId: data.userId });
				}
			},
			'database'
		);

		rail.on(
			'data.get.sessions',
			() => {
				rail.emit('data.sessions', {
					active: this.sessions.size,
					recent: this.loginHistory.slice(-10),
				});
			},
			'database'
		);

		rail.on(
			'data.get.audit',
			(data) => {
				const limit = data.limit || 20;
				rail.emit('data.audit', {
					logs: this.auditLog.slice(-limit),
				});
			},
			'database'
		);
	},
};

export default databaseModule;
