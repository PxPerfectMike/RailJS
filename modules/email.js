/**
 * Email Module - Handle email notifications
 * Listens: auth.success, auth.registration.success, email.send, email.get.history
 * Emits: email.sent, email.failed, email.history
 */

export const emailModule = {
	name: 'email',

	sentEmails: [],
	templates: {
		welcome: (user) => ({
			subject: `Welcome back, ${user.name}!`,
			body: `Hello ${user.name},\n\nWelcome back to RailJS Demo!\n\nBest regards,\nThe RailJS Team`,
		}),
		registration: (user) => ({
			subject: 'Welcome to RailJS Demo!',
			body: `Hello ${user.name},\n\nThank you for registering with RailJS Demo!\n\nYour account has been created successfully.\n\nBest regards,\nThe RailJS Team`,
		}),
		passwordReset: (user) => ({
			subject: 'Password Reset Request',
			body: `Hello ${user.name},\n\nYou requested a password reset.\n\nClick here to reset: [Reset Link]\n\nBest regards,\nThe RailJS Team`,
		}),
	},

	connect(rail) {
		// Send welcome email on login
		rail.on(
			'auth.success',
			(data) => {
				const template = this.templates.welcome(data.user);
				this.sendEmail(
					data.user.email,
					template.subject,
					template.body,
					'welcome'
				);

				rail.emit('email.sent', {
					to: data.user.email,
					type: 'welcome',
					messageId: this.generateMessageId(),
				});
			},
			'email'
		);

		// Send registration confirmation
		rail.on(
			'auth.registration.success',
			(data) => {
				const template = this.templates.registration(data.user);
				this.sendEmail(
					data.user.email,
					template.subject,
					template.body,
					'registration'
				);

				rail.emit('email.sent', {
					to: data.user.email,
					type: 'registration',
					messageId: this.generateMessageId(),
				});
			},
			'email'
		);

		// Handle email requests
		rail.on(
			'email.send',
			(data) => {
				const { to, subject, body, type = 'custom' } = data;

				if (this.isValidEmail(to)) {
					this.sendEmail(to, subject, body, type);
					rail.emit('email.sent', {
						to,
						type,
						messageId: this.generateMessageId(),
					});
				} else {
					rail.emit('email.failed', {
						to,
						error: 'Invalid email address',
					});
				}
			},
			'email'
		);

		// Get email history
		rail.on(
			'email.get.history',
			(data) => {
				const limit = data.limit || 10;
				rail.emit('email.history', {
					emails: this.sentEmails.slice(-limit),
				});
			},
			'email'
		);
	},

	sendEmail(to, subject, body, type) {
		const email = {
			id: this.generateMessageId(),
			to,
			subject,
			body,
			type,
			sentAt: new Date(),
			status: 'sent',
		};

		this.sentEmails.push(email);

		// Simulate email sending delay
		console.log(`📧 Email sent to ${to}: ${subject}`);

		return email.id;
	},

	generateMessageId() {
		return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	},

	isValidEmail(email) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	},
};

export default emailModule;
