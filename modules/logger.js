/**
 * Logger Module - Handle application logging
 * Listens: auth.success, auth.failed, auth.registration.success, email.sent, email.failed,
 *          database.user.created, database.login.recorded, rail.module.attached, rail.module.detached,
 *          rail.error, logs.get, logs.set.level
 * Emits: logs.data, logs.level.changed, logs.level.invalid
 */

export const loggerModule = {
	name: 'logger',

	logs: [],
	logLevels: {
		ERROR: 0,
		WARN: 1,
		INFO: 2,
		DEBUG: 3,
	},
	currentLevel: 2, // INFO level

	connect(rail) {
		// Log all authentication events
		rail.on(
			'auth.success',
			(data) => {
				this.log(
					'INFO',
					'AUTH',
					`User ${data.user.email} logged in successfully`
				);
			},
			'logger'
		);

		rail.on(
			'auth.failed',
			(data) => {
				this.log(
					'WARN',
					'AUTH',
					`Failed login attempt for ${data.email}: ${data.error}`
				);
			},
			'logger'
		);

		rail.on(
			'auth.registration.success',
			(data) => {
				this.log(
					'INFO',
					'AUTH',
					`New user registered: ${data.user.email}`
				);
			},
			'logger'
		);

		// Log email events
		rail.on(
			'email.sent',
			(data) => {
				this.log(
					'INFO',
					'EMAIL',
					`${data.type} email sent to ${data.to} (${data.messageId})`
				);
			},
			'logger'
		);

		rail.on(
			'email.failed',
			(data) => {
				this.log(
					'ERROR',
					'EMAIL',
					`Failed to send email to ${data.to}: ${data.error}`
				);
			},
			'logger'
		);

		// Log database events
		rail.on(
			'database.user.created',
			(data) => {
				this.log(
					'INFO',
					'DATABASE',
					`User record created for ID ${data.userId}`
				);
			},
			'logger'
		);

		rail.on(
			'database.login.recorded',
			(data) => {
				this.log(
					'DEBUG',
					'DATABASE',
					`Login recorded for user ${data.userId}`
				);
			},
			'logger'
		);

		// Log system events
		rail.on(
			'rail.module.attached',
			(data) => {
				this.log(
					'INFO',
					'SYSTEM',
					`Module ${data.moduleName} attached to rail`
				);
			},
			'logger'
		);

		rail.on(
			'rail.module.detached',
			(data) => {
				this.log(
					'INFO',
					'SYSTEM',
					`Module ${data.moduleName} detached from rail`
				);
			},
			'logger'
		);

		rail.on(
			'rail.error',
			(data) => {
				this.log(
					'ERROR',
					'SYSTEM',
					`Error in module ${data.module} handling ${data.event}: ${data.error}`
				);
			},
			'logger'
		);

		// Handle log queries
		rail.on(
			'logs.get',
			(data) => {
				const { level, category, limit = 50 } = data;
				let filtered = this.logs;

				if (level) {
					const minLevel = this.logLevels[level.toUpperCase()] || 0;
					filtered = filtered.filter(
						(log) => this.logLevels[log.level] <= minLevel
					);
				}

				if (category) {
					filtered = filtered.filter(
						(log) => log.category === category.toUpperCase()
					);
				}

				rail.emit('logs.data', {
					logs: filtered.slice(-limit),
					total: this.logs.length,
				});
			},
			'logger'
		);

		// Handle log level changes
		rail.on(
			'logs.set.level',
			(data) => {
				const { level } = data;
				if (this.logLevels.hasOwnProperty(level.toUpperCase())) {
					this.currentLevel = this.logLevels[level.toUpperCase()];
					this.log(
						'INFO',
						'LOGGER',
						`Log level changed to ${level.toUpperCase()}`
					);
					rail.emit('logs.level.changed', {
						level: level.toUpperCase(),
					});
				} else {
					rail.emit('logs.level.invalid', { level });
				}
			},
			'logger'
		);
	},

	log(level, category, message, metadata = {}) {
		const levelNum = this.logLevels[level] || 0;

		// Only log if level is enabled
		if (levelNum <= this.currentLevel) {
			const entry = {
				id: this.logs.length + 1,
				timestamp: new Date(),
				level,
				category,
				message,
				metadata,
			};

			this.logs.push(entry);

			// Console output with colors
			const colors = {
				ERROR: '\x1b[31m', // Red
				WARN: '\x1b[33m', // Yellow
				INFO: '\x1b[32m', // Green
				DEBUG: '\x1b[36m', // Cyan
			};

			const reset = '\x1b[0m';
			const color = colors[level] || '';

			console.log(
				`${color}📝 [${level}] ${category}: ${message}${reset}`
			);

			// Keep only last 1000 logs to prevent memory issues
			if (this.logs.length > 1000) {
				this.logs = this.logs.slice(-1000);
			}
		}
	},
};

export default loggerModule;
