# Migration Guide

Guide for migrating from other event systems to RailJS.

## From Node.js EventEmitter

### Before (EventEmitter)

```javascript
const EventEmitter = require('events');
const emitter = new EventEmitter();

// Listen
emitter.on('data', (data) => {
  console.log(data);
});

// Emit
emitter.emit('data', { value: 123 });
```

### After (RailJS)

```javascript
import { Rail } from '@railjs/core';
const rail = new Rail();

// Listen (with module name for cleanup)
rail.on('data', (data) => {
  console.log(data);
}, 'my-module');

// Emit
rail.emit('data', { value: 123 });
```

### Key Differences

| Feature | EventEmitter | RailJS |
|---------|-------------|---------|
| Data safety | No cloning | Deep cloning by default |
| Module concept | No | Built-in modules |
| Async support | Limited | Full `emitAsync()` |
| Cleanup | Manual | Automatic via `detach()` |

## From Redux

### Before (Redux)

```javascript
// Action creators
const addTodo = (text) => ({
  type: 'ADD_TODO',
  text
});

// Reducer
function todosReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_TODO':
      return [...state, { text: action.text, completed: false }];
    default:
      return state;
  }
}

// Store
const store = createStore(todosReducer);

// Subscribe
store.subscribe(() => {
  console.log(store.getState());
});

// Dispatch
store.dispatch(addTodo('Learn RailJS'));
```

### After (RailJS)

```javascript
import { Rail } from '@railjs/core';
const rail = new Rail();

// State module
const stateModule = {
  name: 'state',
  state: { todos: [] },

  connect(rail) {
    rail.on('todo.add', (data) => {
      this.state.todos = [...this.state.todos, {
        text: data.text,
        completed: false
      }];
      rail.emit('state.changed', this.state);
    }, 'state');
  }
};

rail.attach(stateModule);

// Subscribe to changes
rail.on('state.changed', (state) => {
  console.log(state);
}, 'logger');

// Dispatch (emit event)
rail.emit('todo.add', { text: 'Learn RailJS' });
```

### Key Differences

| Feature | Redux | RailJS |
|---------|-------|---------|
| Centralized state | Yes | Optional (per module) |
| Reducers | Required | Not needed |
| Actions | Type strings | Event names |
| Side effects | Middleware (thunk/saga) | Built-in async |
| DevTools | Redux DevTools | Debug mode + history |

## From Pub/Sub Libraries

### Before (PubSub.js)

```javascript
import PubSub from 'pubsub-js';

// Subscribe
const token = PubSub.subscribe('MESSAGE', (msg, data) => {
  console.log(msg, data);
});

// Publish
PubSub.publish('MESSAGE', { text: 'hello' });

// Unsubscribe
PubSub.unsubscribe(token);
```

### After (RailJS)

```javascript
import { Rail } from '@railjs/core';
const rail = new Rail();

// Subscribe
const unsubscribe = rail.on('MESSAGE', (data) => {
  console.log(data);
}, 'my-module');

// Publish
rail.emit('MESSAGE', { text: 'hello' });

// Unsubscribe
unsubscribe();
```

### Key Differences

| Feature | PubSub | RailJS |
|---------|---------|---------|
| Topic/Event names | Strings | Strings (same) |
| Namespacing | Manual | Via module names |
| Data isolation | No | Yes (deep clone) |
| Module lifecycle | No | `attach()`/`detach()` |

## From Custom Event Systems

### Migration Checklist

1. **Replace global emitter** with Rail instance:
   ```javascript
   // Before
   const emitter = new MyEmitter();

   // After
   const rail = new Rail();
   ```

2. **Wrap listeners in modules**:
   ```javascript
   // Before
   emitter.on('event', handler);

   // After
   const myModule = {
     name: 'my-module',
     connect(rail) {
       rail.on('event', handler, 'my-module');
     }
   };
   rail.attach(myModule);
   ```

3. **Use `emitAsync()` for async operations**:
   ```javascript
   // Before
   emitter.on('fetch', async (data) => {
     const result = await api.fetch(data);
     emitter.emit('fetch-done', result);
   });

   // After
   rail.on('fetch', async (data) => {
     return await api.fetch(data);
   }, 'api-module');

   const results = await rail.emitAsync('fetch', data);
   ```

4. **Enable performance mode** if needed:
   ```javascript
   // If you don't need data isolation
   const rail = new Rail({ clone: false });
   ```

5. **Add debug logging** during migration:
   ```javascript
   const rail = new Rail({ debug: true });
   ```

## Common Patterns

### Request/Response

**Before (callbacks):**
```javascript
emitter.on('get-user', (id, callback) => {
  const user = db.getUser(id);
  callback(user);
});

emitter.emit('get-user', 123, (user) => {
  console.log(user);
});
```

**After (RailJS):**
```javascript
// Option 1: Event-based
rail.on('get-user', (data) => {
  const user = db.getUser(data.id);
  rail.emit('user-result', { id: data.id, user });
}, 'db');

// Option 2: Async (recommended)
rail.on('get-user', async (data) => {
  return await db.getUser(data.id);
}, 'db');

const results = await rail.emitAsync('get-user', { id: 123 });
const user = results[0].result;
```

### Middleware/Interceptors

**Before (middleware chain):**
```javascript
app.use((data, next) => {
  console.log('Log:', data);
  next();
});

app.use((data, next) => {
  data.timestamp = Date.now();
  next();
});
```

**After (RailJS):**
```javascript
// Logger module
const loggerModule = {
  name: 'logger',
  connect(rail) {
    rail.on('request', (data) => {
      console.log('Log:', data);
    }, 'logger');
  }
};

// Timestamp module
const timestampModule = {
  name: 'timestamp',
  connect(rail) {
    rail.on('request', (data) => {
      // Note: Don't mutate data, emit new event instead
      rail.emit('request.timestamped', {
        ...data,
        timestamp: Date.now()
      });
    }, 'timestamp');
  }
};
```

## Performance Considerations

### When Migrating High-Throughput Systems

1. **Benchmark before and after**:
   ```bash
   npm run benchmark
   ```

2. **Consider disabling cloning** for hot paths:
   ```javascript
   const rail = new Rail({ clone: false });
   ```

3. **Use `emit()` instead of `emitAsync()`** when possible:
   ```javascript
   // Faster (fire-and-forget)
   rail.emit('event', data);

   // Slower (waits for all handlers)
   await rail.emitAsync('event', data);
   ```

## Troubleshooting

### "My modules are contaminating each other"

Make sure cloning is enabled (default):
```javascript
const rail = new Rail({ clone: true }); // Explicit
```

### "Performance is slower than before"

Try disabling cloning for performance-critical paths:
```javascript
const rail = new Rail({ clone: false });
```

Or use selective cloning:
```javascript
const rail = new Rail({ clone: true });

// Disable for specific hot path
rail.setClone(false);
rail.emit('hot-path-event', data);
rail.setClone(true);
```

### "How do I handle circular dependencies?"

RailJS prevents circular dependencies by design. Instead:

```javascript
// Don't: Direct import
import moduleB from './module-b';

// Do: Event-based communication
rail.on('module-b.request', (data) => {
  rail.emit('module-a.response', result);
}, 'module-a');
```

## Need Help?

- Check the [examples](./examples/) directory
- Review the [README](./README.md) for API documentation
- Open an issue on GitHub
