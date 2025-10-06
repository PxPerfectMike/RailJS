# RailJS v0.1.0 - Initial Release

A lightweight event bus for building modular JavaScript applications with strict module isolation.

## 🎉 First Release

This is the initial production release of RailJS, a simple yet powerful event-driven architecture for JavaScript/TypeScript applications.

## ✨ Features

- **Module Isolation**: Modules communicate exclusively through events, not direct imports
- **Data Safety**: Automatic deep cloning prevents unintended side effects between modules
- **Simple API**: Familiar event emitter pattern with attach/detach module lifecycle
- **Hot-swappable**: Add or remove modules at runtime without restarting
- **Universal**: Works in Node.js 14+, Deno 1.0+, and modern browsers
- **TypeScript Support**: Full type definitions with generic support
- **Async Support**: `emitAsync()` for async handlers with structured results
- **Performance**: 2.4M+ events/sec with cloning, 3.6M+ without
- **Testing-friendly**: Built-in `waitFor()` utility for testing

## 📦 Installation

```bash
npm install railjs-core
```

## 🚀 Quick Start

```javascript
import { Rail } from '@railjs/core';

const rail = new Rail();

// Listen for events
rail.on('user.login', (data) => {
  console.log('User logged in:', data.username);
}, 'auth-module');

// Emit events
rail.emit('user.login', { username: 'john' });
```

## 📊 Stats

- **Package Size**: 24.3 KB (unpacked: 128 KB)
- **Minified**: ~5 KB
- **Test Coverage**: 72.6%
- **Tests**: 20 passing
- **Build Formats**: ESM, CJS, UMD (all with minified versions)

## 📚 Documentation

- [README](https://github.com/PxPerfectMike/RailJS#readme)
- [API Documentation](https://github.com/PxPerfectMike/RailJS/blob/main/rail.d.ts)
- [Examples](https://github.com/PxPerfectMike/RailJS/tree/main/examples)
- [Migration Guide](https://github.com/PxPerfectMike/RailJS/blob/main/MIGRATION.md)
- [Contributing](https://github.com/PxPerfectMike/RailJS/blob/main/CONTRIBUTING.md)

## 🔒 Security

See [SECURITY.md](https://github.com/PxPerfectMike/RailJS/blob/main/SECURITY.md) for security best practices and vulnerability reporting.

## 📄 License

MIT License - see [LICENSE](https://github.com/PxPerfectMike/RailJS/blob/main/LICENSE)
