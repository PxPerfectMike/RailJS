/**
 * Notifications Module - Handle user notifications
 * Listens: auth.success, auth.registration.success, email.sent, auth.failed, auth.registration.failed,
 *          email.failed, rail.module.attached, rail.module.detached, notification.send,
 *          notification.subscribe, notification.get.history
 * Emits: notification.created, notification.subscribed, notification.history
 */

export const notificationModule = {
	name: 'notifications',

	notifications: [],
	subscribers: new Map(), // userId -> preferences

	connect(rail) {
		// Success notifications
		rail.on(
			'auth.success',
			(data) => {
				this.notify(
					'success',
					`Welcome back, ${data.user.name}!`,
					data.user.id
				);
			},
			'notifications'
		);

		rail.on(
			'auth.registration.success',
			(data) => {
				this.notify(
					'success',
					`Registration successful! Welcome ${data.user.name}`,
					data.user.id
				);
			},
			'notifications'
		);

		rail.on(
			'email.sent',
			(data) => {
				this.notify('info', `Email sent to ${data.to}`, null, {
					quiet: true,
				});
			},
			'notifications'
		);

		// Error notifications
		rail.on(
			'auth.failed',
			(data) => {
				this.notify('error', `Login failed: ${data.error}`);
			},
			'notifications'
		);

		rail.on(
			'auth.registration.failed',
			(data) => {
				this.notify('error', `Registration failed: ${data.error}`);
			},
			'notifications'
		);

		rail.on(
			'email.failed',
			(data) => {
				this.notify('error', `Failed to send email: ${data.error}`);
			},
			'notifications'
		);

		// System notifications
		rail.on(
			'rail.module.attached',
			(data) => {
				this.notify(
					'info',
					`Module ${data.moduleName} is now active`,
					null,
					{ system: true }
				);
			},
			'notifications'
		);

		rail.on(
			'rail.module.detached',
			(data) => {
				this.notify(
					'warning',
					`Module ${data.moduleName} has been disconnected`,
					null,
					{ system: true }
				);
			},
			'notifications'
		);

		// Handle notification requests
		rail.on(
			'notification.send',
			(data) => {
				const { type, message, userId, options } = data;
				this.notify(type, message, userId, options);
			},
			'notifications'
		);

		// Handle subscription management
		rail.on(
			'notification.subscribe',
			(data) => {
				const { userId, preferences } = data;
				this.subscribers.set(userId, preferences);
				rail.emit('notification.subscribed', { userId });
			},
			'notifications'
		);

		// Get notification history
		rail.on(
			'notification.get.history',
			(data) => {
				const { userId, limit = 20 } = data;
				let filtered = this.notifications;

				if (userId) {
					filtered = filtered.filter(
						(n) => n.userId === userId || !n.userId
					);
				}

				rail.emit('notification.history', {
					notifications: filtered.slice(-limit),
				});
			},
			'notifications'
		);
	},

	notify(type, message, userId = null, options = {}) {
		const notification = {
			id: Date.now() + Math.random(),
			type,
			message,
			userId,
			timestamp: new Date(),
			read: false,
			options: {
				quiet: false,
				system: false,
				persistent: false,
				...options,
			},
		};

		// Check user preferences
		if (userId) {
			const prefs = this.subscribers.get(userId);
			if (prefs && prefs[type] === false) {
				return; // User has disabled this type of notification
			}
		}

		this.notifications.push(notification);

		// Console output with emoji and colors
		const icons = {
			success: '✅',
			error: '❌',
			warning: '⚠️',
			info: 'ℹ️',
		};

		const colors = {
			success: '\x1b[32m',
			error: '\x1b[31m',
			warning: '\x1b[33m',
			info: '\x1b[36m',
		};

		const icon = icons[type] || '🔔';
		const color = colors[type] || '';
		const reset = '\x1b[0m';

		if (!options.quiet) {
			console.log(
				`${color}${icon} Notification [${type.toUpperCase()}]: ${message}${reset}`
			);
		}

		// Emit notification event for other systems to handle
		rail.emit('notification.created', notification);

		// Auto-cleanup old notifications
		if (this.notifications.length > 500) {
			this.notifications = this.notifications.slice(-500);
		}

		return notification.id;
	},
};

export default notificationModule;
