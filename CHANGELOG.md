# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release preparation
- Production-ready build system
- Comprehensive documentation

## [0.1.0] - 2025-01-XX

### Added
- Core `Rail` class with event emission and listening
- Module system with `attach()` and `detach()` methods
- Automatic deep cloning for data isolation (configurable)
- Async event handler support with `emitAsync()`
- TypeScript definitions with full generic support
- Performance optimization options (`clone: true/false`)
- Comprehensive test suite (21 tests, 81.75% coverage)
- Vitest test runner with coverage reporting
- Build system with esbuild (ESM, CJS, UMD formats)
- Minified production builds (~5KB)
- Benchmark suite showing 2.4M+ ops/sec
- Browser compatibility: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Node.js 14+ and Deno 1.0+ support
- Example applications:
  - API Gateway
  - State Management
  - Plugin System
- Migration guide from EventEmitter, Redux, and other systems
- Contributing guidelines
- Code of Conduct
- MIT License

### Features
- Event-driven architecture with module isolation
- Hot-swappable modules (runtime attach/detach)
- Error isolation between modules
- Event history tracking for debugging
- `waitFor()` utility for testing
- Debug mode with event tracing
- Module statistics and introspection

### Performance
- 2.4M+ events/sec with cloning enabled
- 3.6M+ events/sec with cloning disabled
- Memory efficient: ~0.3MB for 1000 modules + 1000 events
- Cloning overhead: ~30-50%

### Documentation
- Comprehensive README with examples
- API documentation with TypeScript types
- Real-world examples directory
- Migration guide from other systems
- Browser compatibility matrix
- Performance benchmarks

## Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X.0.0): Incompatible API changes
- **MINOR** version (0.X.0): New features, backward compatible
- **PATCH** version (0.0.X): Bug fixes, backward compatible

### What Triggers a Version Bump?

#### MAJOR (Breaking Changes)
- Removing or renaming public methods
- Changing method signatures
- Removing configuration options
- Changing default behavior in incompatible ways
- Dropping support for Node.js/browser versions

#### MINOR (New Features)
- Adding new public methods
- Adding new configuration options
- Adding new events
- Performance improvements
- New examples or documentation

#### PATCH (Bug Fixes)
- Fixing bugs without changing APIs
- Documentation corrections
- Internal refactoring
- Dependency updates
- Test improvements

### Pre-release Versions

Development versions follow this format:
- Alpha: `0.1.0-alpha.1`
- Beta: `0.1.0-beta.1`
- Release Candidate: `0.1.0-rc.1`

## Future Roadmap

Planned for future releases:

### 0.2.0
- [ ] Middleware system
- [ ] Event wildcards (`user.*`)
- [ ] Priority-based event handling
- [ ] Event namespacing improvements

### 0.3.0
- [ ] Distributed events (multi-process)
- [ ] Event persistence/replay
- [ ] Advanced debugging tools
- [ ] Performance optimizations

### 1.0.0
- [ ] Stable API
- [ ] Production battle-tested
- [ ] Complete documentation
- [ ] Community plugins/modules

## Links

- [GitHub Repository](https://github.com/PxPerfectMike/RailJS)
- [npm Package](https://www.npmjs.com/package/@railjs/core)
- [Issue Tracker](https://github.com/PxPerfectMike/RailJS/issues)
