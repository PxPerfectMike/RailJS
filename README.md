# RailJS

A lightweight event bus for building modular JavaScript applications with strict module isolation.

RailJS is a simple, well-tested event emitter that helps you build applications using isolated modules that communicate only through events. Perfect for projects where you want clear boundaries between components without the complexity of a full framework.

## Features

-   **Module Isolation**: Modules communicate exclusively through events, not direct imports
-   **Data Safety**: Automatic deep cloning prevents unintended side effects between modules
-   **Simple API**: Familiar event emitter pattern with attach/detach module lifecycle
-   **Hot-swappable**: Add or remove modules at runtime without restarting
-   **Universal**: Works in Node.js, Deno, and browsers
-   **TypeScript Support**: Full type definitions for type-safe development
-   **Testing-friendly**: Built-in utilities for testing modules in isolation

## Core Concept

```
Module A ──┐
Module B ──┼─── RAIL (central event bus) ───>
Module C ──┘

- Modules communicate only through events
- All events flow through the central Rail
- Modules can be attached/detached at runtime
- Each module maintains its own state and logic
```

## Quick Start

### Installation

```bash
npm install @railjs/core
# or
yarn add @railjs/core
```

### CDN Usage (Browser)

```html
<!-- UMD build (development) -->
<script src="https://unpkg.com/@railjs/core/dist/rail.umd.js"></script>

<!-- UMD build (production, minified) -->
<script src="https://unpkg.com/@railjs/core/dist/rail.umd.min.js"></script>

<script>
  const rail = new RailJS.Rail({ debug: true });
  // Use rail...
</script>
```

### TypeScript Support

RailJS includes full TypeScript definitions out of the box:

```typescript
import { Rail, RailModule, RailOptions } from 'railjs';

interface UserData {
	email: string;
	name: string;
}

const rail = new Rail({ debug: true });

// Type-safe event handlers
rail.on<UserData>('user.created', (data) => {
	console.log(data.email); // TypeScript knows data has email property
});

// Type-safe event emission
rail.emit<UserData>('user.created', { email: 'user@example.com', name: 'John' });
```

See `example.ts` for a complete TypeScript usage example.

### Run the Demo

```bash
# Node.js
node demo.js

# Deno
deno run --allow-read demo.js

# Browser (serve the files)
python -m http.server 8000
# Then open http://localhost:8000
```

### Example Output

Modules communicating through events:

```
🚂 [demo-app] Rail started in debug mode
🔗 [demo-app] Attached module 'auth'
🔗 [demo-app] Attached module 'database'
🔗 [demo-app] Attached module 'email'

🔥 [demo-app] Emitting 'user.login': {email: "demo@example.com", password: "demo123"}
   ↳ auth handling 'user.login'
🔐 Auth: Processing login attempt...
🔥 [demo-app] Emitting 'auth.success': {token: "jwt-1234", user: {...}}
   ↳ database handling 'auth.success'
   ↳ email handling 'auth.success'
💾 Database: Saving login session...
📧 Email: Sending welcome email...
```

## 📂 Project Structure

```
railjs-starter/
├── README.md           # This file
├── rail.js            # Core Rail implementation
├── demo.js            # Working demo application
├── test.js            # Test suite
└── modules/           # Example modules
    ├── auth.js        # Authentication
    ├── database.js    # Data storage
    ├── email.js       # Email notifications
    ├── logger.js      # Logging system
    └── notifications.js # User notifications
```

## 🧩 Creating Your First Module

```javascript
// my-module.js
export const myModule = {
	name: 'my-module',

	connect(rail) {
		// Listen for events
		rail.on(
			'input.event',
			(data) => {
				console.log('Processing:', data);

				// Do your work here
				const result = processData(data);

				// Emit the result
				rail.emit('output.event', result);
			},
			'my-module'
		);
	},

	disconnect(rail) {
		// Cleanup if needed
	},
};

// Attach to your rail
import { Rail } from './rail.js';
const rail = new Rail({ debug: true });
rail.attach(myModule);
```

## 🔥 Core API

### Creating a Rail

```javascript
import { Rail } from './rail.js';

const rail = new Rail({
	name: 'my-app', // Optional: Rail name for debugging
	debug: true, // Optional: Enable debug logging
	clone: true, // Optional: Deep clone event data (default: true)
});
```

**Performance vs Safety:**
- `clone: true` (default) - Guarantees data isolation between modules but slower
- `clone: false` - Better performance but modules can modify shared data

### Module Pattern

Every module follows this simple pattern:

```javascript
const module = {
	name: 'module-name', // Required: Unique module name

	connect(rail) {
		// Called when attached
		rail.on('event', handler, 'module-name');
	},

	disconnect(rail) {
		// Called when detached (optional)
		// Cleanup code
	},
};
```

### Event Communication

```javascript
// Emit events (synchronous)
rail.emit('user.login', { email: 'user@example.com', password: 'secret' });

// Emit events (asynchronous) - waits for all handlers to complete
const results = await rail.emitAsync('user.login', {
	email: 'user@example.com',
	password: 'secret'
});
// results: [{ module: 'auth', result: {...}, error: null }, ...]

// Listen for events
rail.on(
	'user.login',
	(data) => {
		console.log('Login attempt:', data.email);
	},
	'auth-module'
);

// Listen with async handlers
rail.on(
	'user.login',
	async (data) => {
		const user = await database.findUser(data.email);
		return user; // Return value available in emitAsync results
	},
	'auth-module'
);

// Remove listeners (returns unsubscribe function)
const unsubscribe = rail.on('event', handler);
unsubscribe(); // Stop listening
```

### Module Management

```javascript
// Attach modules
rail.attach(authModule);
rail.attach(databaseModule);

// Detach modules (safe at any time)
rail.detach('auth-module');

// Get module info
rail.getModules(); // ['database', 'email', 'logger']
rail.getEvents(); // { 'user.login': ['auth'], 'email.send': ['email'] }
rail.getStats(); // { modules: 3, events: 12, totalListeners: 25 }
```

## 🧪 Testing Your Modules

RailJS modules are trivially testable:

```javascript
import { Rail } from './rail.js';

// Test a module in isolation
const rail = new Rail();
rail.attach(myModule);

// Send test events
rail.emit('test.input', { data: 'test' });

// Wait for results
const result = await rail.waitFor('test.output');
console.log('Module output:', result);
```

### Running Tests

```bash
# Run tests with Vitest
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run legacy test suite
npm run test:legacy
```

**Test Coverage:**
- 20 comprehensive test cases
- 81.75% code coverage
- Tests for cloning, async handlers, module lifecycle, error isolation

## 🎨 Example: Building a Chat App

```javascript
// chat-room.js
const chatRoomModule = {
	name: 'chat-room',
	rooms: new Map(),

	connect(rail) {
		rail.on(
			'chat.join',
			(data) => {
				const { roomId, userId, username } = data;

				if (!this.rooms.has(roomId)) {
					this.rooms.set(roomId, new Set());
				}

				this.rooms.get(roomId).add({ userId, username });

				rail.emit('chat.user.joined', { roomId, userId, username });
			},
			'chat-room'
		);

		rail.on(
			'chat.message',
			(data) => {
				const { roomId, userId, message } = data;

				rail.emit('chat.message.broadcast', {
					roomId,
					userId,
					message,
					timestamp: new Date(),
				});
			},
			'chat-room'
		);
	},
};

// message-history.js
const messageHistoryModule = {
	name: 'message-history',
	history: new Map(),

	connect(rail) {
		rail.on(
			'chat.message.broadcast',
			(data) => {
				const { roomId } = data;

				if (!this.history.has(roomId)) {
					this.history.set(roomId, []);
				}

				this.history.get(roomId).push(data);

				rail.emit('message.stored', {
					roomId,
					messageId: data.timestamp,
				});
			},
			'message-history'
		);
	},
};

// Connect them
rail.attach(chatRoomModule);
rail.attach(messageHistoryModule);

// Use the system
rail.emit('chat.join', { roomId: 'general', userId: 1, username: 'Alice' });
rail.emit('chat.message', { roomId: 'general', userId: 1, message: 'Hello!' });
```

## Data Isolation

RailJS automatically clones event data to prevent modules from affecting each other:

### Preventing Side Effects

```javascript
const original = { secret: 'password123' };

rail.on('process.data', (data) => {
	data.secret = 'hacked!'; // This won't affect the original
});

rail.emit('process.data', original);
console.log(original.secret); // Still 'password123'
```

### Module Isolation

```javascript
// ❌ Avoid: Direct module dependencies
import OtherModule from './other-module';
OtherModule.getData();

// ✅ Prefer: Event-based communication
rail.emit('data.request', { type: 'user' });
rail.on('data.response', (data) => { /* handle data */ });
```

### Error Isolation

```javascript
rail.on(
	'risky.operation',
	() => {
		throw new Error('Module crashed!');
	},
	'broken-module'
);

rail.on(
	'risky.operation',
	() => {
		console.log('I still work!'); // ✅ This still executes
	},
	'good-module'
);

rail.emit('risky.operation'); // Both handlers run, error is contained
```

## 🎯 Common Patterns

### Request-Response Pattern

```javascript
// Async request-response (recommended)
rail.on('user.get', async (data) => {
	const user = await database.findUser(data.userId);
	return user; // Return the data directly
}, 'database');

const results = await rail.emitAsync('user.get', { userId: 123 });
const user = results[0].result; // Get result from first handler

// Traditional event-based request-response
rail.emit('user.get', { userId: 123 });

rail.on(
	'user.get',
	(data) => {
		const user = database.findUser(data.userId);
		rail.emit('user.data', { userId: data.userId, user });
	},
	'database'
);
```

### Chain of Processing

```javascript
// Input validation
rail.on(
	'user.register',
	(data) => {
		if (isValid(data)) {
			rail.emit('user.validated', data);
		} else {
			rail.emit('validation.failed', { errors });
		}
	},
	'validator'
);

// Create user
rail.on(
	'user.validated',
	(data) => {
		const user = createUser(data);
		rail.emit('user.created', user);
	},
	'user-manager'
);

// Send welcome email
rail.on(
	'user.created',
	(user) => {
		rail.emit('email.send', {
			to: user.email,
			template: 'welcome',
			data: user,
		});
	},
	'email'
);
```

### State Management

```javascript
const stateModule = {
	name: 'state',
	store: new Map(),

	connect(rail) {
		rail.on(
			'state.set',
			(data) => {
				this.store.set(data.key, data.value);
				rail.emit('state.changed', {
					key: data.key,
					value: data.value,
				});
			},
			'state'
		);

		rail.on(
			'state.get',
			(data) => {
				const value = this.store.get(data.key);
				rail.emit('state.value', { key: data.key, value });
			},
			'state'
		);
	},
};
```

## 🛠️ Debugging Tools

### Debug Mode

```javascript
const rail = new Rail({ debug: true });

// Shows all events:
// 🔥 [my-app] Emitting 'user.login': {email: "test@example.com"}
//    ↳ auth handling 'user.login'
//    ↳ logger handling 'user.login'
```

### Event History

```javascript
// Get recent events
const history = rail.getHistory(10);
console.log('Last 10 events:', history);

// Clear history
rail.clearHistory();
```

### Wait for Events (Testing)

```javascript
// Wait for specific event
const result = await rail.waitFor('auth.success', 5000); // 5 second timeout

// Use in tests
test('login works', async () => {
	rail.emit('user.login', credentials);
	const result = await rail.waitFor('auth.success');
	expect(result.token).toBeDefined();
});
```

## 🚀 Next Steps

### 1. Try the Examples

-   Run `node demo.js` to see the full system in action
-   Modify modules and see how they interact
-   Try detaching modules while the system runs

### 2. Build Your Own Modules

-   Start with the module template above
-   Follow the single responsibility principle
-   Use clear event names (noun.verb format)

### 3. Common Module Ideas

-   **API Gateway**: Handle HTTP requests → emit internal events
-   **Rate Limiter**: Monitor events → emit rate limit warnings
-   **Cache**: Store/retrieve data based on events
-   **Analytics**: Track events → emit metrics
-   **Queue**: Buffer events → emit when ready to process

### 4. Architecture Patterns

-   **CQRS**: Separate read/write modules
-   **Event Sourcing**: Store all events, replay state
-   **Microservices**: Each module as a separate service
-   **Plugin System**: Dynamically load/unload modules

## 📖 Event Naming Conventions

Use clear, consistent event names:

```javascript
// Good event names
'user.login'; // user performs login
'auth.success'; // authentication succeeded
'email.send'; // request to send email
'email.sent'; // email was sent
'payment.process'; // process a payment
'payment.completed'; // payment finished successfully
'data.user.create'; // create user in database
'cache.invalidate'; // clear cache

// Avoid these
'login'; // too vague
'userAuthSuccess'; // not dot-separated
'EMAIL_SEND'; // use lowercase
'handleUserLogin'; // sounds like function name
```

## Use Cases

RailJS works well for:

- **Modular applications** where you want clear component boundaries
- **Plugin systems** that need to add/remove functionality at runtime
- **Microservices coordination** within a single process
- **Testing** complex systems by swapping modules with mocks
- **Event sourcing** architectures
- **AI-assisted development** where isolated contexts help language models understand code

## 🐛 Troubleshooting

### Common Issues

**Module not responding to events**

```javascript
// ❌ Wrong: forgot module name
rail.on('event', handler);

// ✅ Correct: include module name
rail.on('event', handler, 'my-module');
```

**Data contamination between modules**

```javascript
// ❌ Wrong: modifying input data
rail.on('process', (data) => {
	data.processed = true; // This affects other modules!
});

// ✅ Correct: don't modify input, emit new data
rail.on('process', (data) => {
	const result = { ...data, processed: true };
	rail.emit('processed', result);
});
```

**Module won't detach cleanly**

```javascript
// ❌ Wrong: anonymous function
rail.on('event', (data) => {
	/* handler */
});

// ✅ Correct: named function for cleanup
const handler = (data) => {
	/* handler */
};
rail.on('event', handler, 'my-module');
```

### Getting Help

-   Check the console for debug output
-   Use `rail.getStats()` to see system status
-   Run `node test.js` to verify core functionality
-   Look at example modules for patterns

## Performance Considerations

RailJS deep-clones all event data by default to ensure module isolation. For high-throughput applications where performance is critical and you trust your modules not to mutate shared data, you can disable cloning:

```javascript
// High-performance mode (no data cloning)
const rail = new Rail({ clone: false });

// Or toggle it at runtime
rail.setClone(false); // Disable cloning
rail.setClone(true);  // Re-enable cloning
```

**Trade-offs:**
- **With cloning (default)**: Slower, but modules cannot accidentally contaminate each other's data
- **Without cloning**: Faster, but you must ensure modules don't mutate event data

Use `clone: false` only when:
- Performance benchmarks show cloning is a bottleneck
- Your modules treat event data as immutable
- You're emitting events in tight loops (thousands per second)

### Benchmark Results

Run `npm run benchmark` to see performance on your machine. Typical results:

```
Event emission (with cloning):     2,444,611 ops/sec
Event emission (without cloning):  3,622,440 ops/sec
Event with 10 listeners (cloning): 1,077,500 ops/sec
Async event emission:                725,016 ops/sec
```

**Key takeaways:**
- Cloning adds ~30-50% overhead
- Still handles millions of events per second
- Memory efficient: 1000 modules + 1000 events = ~0.3 MB
- For most applications, the default settings are perfectly fine

## When Not to Use RailJS

- **Simple applications** - Event-driven architecture adds complexity you may not need
- **Performance-critical real-time systems** - Deep cloning overhead may be too high
- **Tightly coupled logic** - Some problems are better solved with direct function calls

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.

---

**Built with clarity and simplicity in mind.**
