/**
 * Example: State Management with RailJS
 * Similar to Redux but with isolated modules
 */

import { Rail } from '../rail.js';

const rail = new Rail({ debug: false });

// State Store Module
const storeModule = {
	name: 'store',
	state: {
		todos: [],
		user: null,
		theme: 'light'
	},

	connect(rail) {
		// Handle state updates
		rail.on('state.update', (data) => {
			const { key, value } = data;
			const oldValue = this.state[key];
			this.state[key] = value;

			// Emit state change event
			rail.emit('state.changed', {
				key,
				oldValue,
				newValue: value,
				state: { ...this.state }
			});
		}, 'store');

		// Handle state queries
		rail.on('state.get', (data) => {
			const { key } = data;
			rail.emit('state.value', {
				key,
				value: this.state[key]
			});
		}, 'store');
	}
};

// Todo Module
const todoModule = {
	name: 'todos',

	connect(rail) {
		rail.on('todo.add', (data) => {
			rail.on('state.value', (stateData) => {
				if (stateData.key === 'todos') {
					const newTodos = [...stateData.value, {
						id: Date.now(),
						text: data.text,
						completed: false
					}];
					rail.emit('state.update', { key: 'todos', value: newTodos });
				}
			}, 'todos-temp');

			rail.emit('state.get', { key: 'todos' });
		}, 'todos');

		rail.on('todo.toggle', (data) => {
			rail.on('state.value', (stateData) => {
				if (stateData.key === 'todos') {
					const newTodos = stateData.value.map(todo =>
						todo.id === data.id ? { ...todo, completed: !todo.completed } : todo
					);
					rail.emit('state.update', { key: 'todos', value: newTodos });
				}
			}, 'todos-temp');

			rail.emit('state.get', { key: 'todos' });
		}, 'todos');
	}
};

// UI Module (simulated)
const uiModule = {
	name: 'ui',

	connect(rail) {
		rail.on('state.changed', (data) => {
			console.log('\n🎨 UI Update:');
			console.log(`  ${data.key} changed`);
			console.log(`  Old:`, data.oldValue);
			console.log(`  New:`, data.newValue);
		}, 'ui');
	}
};

// Logger Module
const loggerModule = {
	name: 'logger',
	history: [],

	connect(rail) {
		rail.on('state.changed', (data) => {
			const entry = {
				timestamp: new Date(),
				action: `${data.key}.update`,
				oldValue: data.oldValue,
				newValue: data.newValue
			};
			this.history.push(entry);
			console.log('📝 Action logged:', entry.action);
		}, 'logger');
	}
};

// Attach modules
rail.attach(storeModule);
rail.attach(todoModule);
rail.attach(uiModule);
rail.attach(loggerModule);

// Simulate user interactions
console.log('=== State Management Example ===\n');

console.log('Adding todos...');
rail.emit('todo.add', { text: 'Learn RailJS' });

setTimeout(() => {
	rail.emit('todo.add', { text: 'Build an app' });
}, 500);

setTimeout(() => {
	console.log('\nToggling first todo...');
	rail.emit('todo.toggle', { id: Date.now() - 500 });
}, 1000);

setTimeout(() => {
	rail.emit('state.update', { key: 'theme', value: 'dark' });
}, 1500);
