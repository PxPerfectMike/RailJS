/**
 * Example: Plugin System with RailJS
 * Demonstrates hot-swappable plugins
 */

import { Rail } from '../rail.js';

const rail = new Rail({ debug: true });

// Core Application
const appModule = {
	name: 'app-core',

	connect(rail) {
		rail.on('app.start', () => {
			console.log('🚀 Application started');
			rail.emit('app.ready');
		}, 'app-core');

		rail.on('app.process', (data) => {
			console.log('⚙️  Processing:', data.text);
			rail.emit('app.processed', { ...data, processed: true });
		}, 'app-core');
	}
};

// Plugin: Spell Checker
const spellCheckPlugin = {
	name: 'plugin-spellcheck',

	connect(rail) {
		console.log('✅ Spell Check Plugin loaded');

		rail.on('app.process', (data) => {
			const errors = this.checkSpelling(data.text);
			if (errors.length > 0) {
				rail.emit('spellcheck.errors', { text: data.text, errors });
			}
		}, 'plugin-spellcheck');
	},

	disconnect(rail) {
		console.log('❌ Spell Check Plugin unloaded');
	},

	checkSpelling(text) {
		const mistakes = ['teh', 'recieve', 'occured'];
		return mistakes.filter(word => text.toLowerCase().includes(word));
	}
};

// Plugin: Word Counter
const wordCountPlugin = {
	name: 'plugin-wordcount',

	connect(rail) {
		console.log('✅ Word Count Plugin loaded');

		rail.on('app.processed', (data) => {
			const count = data.text.split(/\s+/).length;
			rail.emit('wordcount.result', { text: data.text, count });
		}, 'plugin-wordcount');
	},

	disconnect(rail) {
		console.log('❌ Word Count Plugin unloaded');
	}
};

// Plugin: Analytics
const analyticsPlugin = {
	name: 'plugin-analytics',
	events: [],

	connect(rail) {
		console.log('✅ Analytics Plugin loaded');

		// Track all events
		const originalEmit = rail.emit.bind(rail);
		rail.emit = (event, data) => {
			this.events.push({ event, timestamp: Date.now() });
			return originalEmit(event, data);
		};
	},

	disconnect(rail) {
		console.log('❌ Analytics Plugin unloaded');
		console.log(`   Tracked ${this.events.length} events`);
	}
};

// Attach core
rail.attach(appModule);

// Load plugins dynamically
console.log('\n=== Loading Plugins ===\n');
rail.attach(spellCheckPlugin);
rail.attach(wordCountPlugin);
rail.attach(analyticsPlugin);

// Listen for plugin events
rail.on('spellcheck.errors', (data) => {
	console.log('❌ Spelling errors found:', data.errors);
}, 'error-handler');

rail.on('wordcount.result', (data) => {
	console.log(`📊 Word count: ${data.count} words`);
}, 'stats-display');

// Start app
console.log('\n=== Running Application ===\n');
rail.emit('app.start');

setTimeout(() => {
	rail.emit('app.process', { text: 'This is teh example text to process' });
}, 500);

// Hot-swap: Remove spell check, add new plugin
setTimeout(() => {
	console.log('\n=== Hot-swapping Plugins ===\n');
	rail.detach('plugin-spellcheck');

	const sentimentPlugin = {
		name: 'plugin-sentiment',
		connect(rail) {
			console.log('✅ Sentiment Analysis Plugin loaded');
			rail.on('app.processed', (data) => {
				const sentiment = data.text.includes('!') ? 'excited' : 'neutral';
				console.log(`😊 Sentiment: ${sentiment}`);
			}, 'plugin-sentiment');
		}
	};

	rail.attach(sentimentPlugin);
}, 1500);

setTimeout(() => {
	rail.emit('app.process', { text: 'Another example with excitement!' });
}, 2000);

// Cleanup
setTimeout(() => {
	console.log('\n=== Unloading All Plugins ===\n');
	rail.detach('plugin-wordcount');
	rail.detach('plugin-analytics');
	rail.detach('plugin-sentiment');
}, 3000);
