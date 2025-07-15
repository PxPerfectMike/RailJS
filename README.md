# RailJS - Event-Driven Architecture for AI Development

🚂 **Build with modules, not monoliths**

RailJS is an event-driven architecture pattern designed specifically for AI-assisted development. It enables developers to build complex applications using completely isolated modules that communicate only through a central event rail.

## ✨ Why RailJS?

-   **🤖 AI-Optimized**: Each module fits in one AI context window
-   **🔒 True Isolation**: Modules literally cannot import each other
-   **🚀 Zero Contamination**: Clean data flow prevents module interference
-   **🔧 Delete-Safe**: Remove any module without breaking your app
-   **⚡ Transport Agnostic**: Same code works across threads, processes, and networks

## 🎯 The Core Concept

```
Module A ──┐
Module B ──┼─── RAIL (all events flow here) ───>
Module C ──┘

- Modules NEVER communicate directly
- ALL communication goes through the Rail
- Modules can be attached/detached at runtime
- Perfect for AI development (small, isolated contexts)
```

## 🚀 Quick Start

### 1. Download the Starter Kit

```bash
# Option 1: Download directly
curl -O https://github.com/railjs/starter/archive/main.zip
unzip main.zip
cd railjs-starter-main

# Option 2: Clone the repo
git clone https://github.com/railjs/starter.git
cd starter
```

### 2. Run the Demo

```bash
# Node.js
node demo.js

# Deno
deno run --allow-read demo.js

# Browser (serve the files)
python -m http.server 8000
# Then open http://localhost:8000
```

### 3. See the Magic

Watch modules communicate through events:

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
});
```

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
// Emit events
rail.emit('user.login', { email: 'user@example.com', password: 'secret' });

// Listen for events
rail.on(
	'user.login',
	(data) => {
		console.log('Login attempt:', data.email);
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

Run the included test suite:

```bash
node test.js
```

Expected output:

```
🧪 Running: Basic event emission and listening
✅ Passed: Basic event emission and listening
🧪 Running: Data contamination prevention
✅ Passed: Data contamination prevention
...
🎉 All tests passed!
```

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

## 🔒 Security Features

RailJS provides security by design:

### Data Isolation

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
// This is IMPOSSIBLE in RailJS
import OtherModule from './other-module'; // ❌ Modules can't import each other

// Modules communicate ONLY through events
rail.emit('need.data'); // ✅ The RailJS way
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
// Request data
rail.emit('user.get', { userId: 123 });

// Respond with data
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

## 🤖 AI Development Tips

RailJS is optimized for AI assistants:

1. **One Module = One Context**: Each module fits in AI memory
2. **Clear Contracts**: Events define exact inputs/outputs
3. **No Hidden Dependencies**: AI can see all connections
4. **Easy Testing**: AI can test modules in isolation
5. **Simple Patterns**: Consistent structure across all modules

### AI Prompt Template

```
You are building RailJS modules. Critical rules:
1. Modules CANNOT import other modules
2. Modules communicate ONLY via rail.emit() and rail.on()
3. Each module does ONE thing well
4. Use this exact template:

export const myModule = {
  name: 'module-name',
  connect(rail) {
    rail.on('input.event', (data) => {
      // Process data
      rail.emit('output.event', result);
    }, 'module-name');
  }
};

Module must handle: [describe what this module should do]
Listen for: [list input events]
Emit: [list output events]
```

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

## 📜 License

MIT License - feel free to use RailJS in your projects!

## 🤝 Contributing

RailJS is in early development. We'd love your feedback:

1. Try building an app with RailJS
2. Report issues or confusing parts
3. Share interesting modules you create
4. Suggest improvements to the core API

---

**🚂 Happy building with RailJS!**

_"The first framework designed for AI development"_
# RailJS
