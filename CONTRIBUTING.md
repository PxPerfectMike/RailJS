# Contributing to RailJS

Thank you for your interest in contributing to RailJS! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Code samples** demonstrating the issue
- **Environment details** (Node.js version, OS, etc.)

### Suggesting Features

Feature suggestions are welcome! Please:

- **Check existing feature requests** first
- **Clearly describe the use case** and benefits
- **Provide examples** of how the feature would work
- **Consider alternatives** you've evaluated

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** with clear, descriptive commits
3. **Add tests** for any new functionality
4. **Ensure all tests pass**: `npm test`
5. **Update documentation** as needed
6. **Submit a pull request**

## Development Setup

### Prerequisites

- Node.js 14.0 or higher
- npm or yarn

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/railjs.git
cd railjs

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run benchmarks
npm run benchmark

# Build the project
npm run build

# Type check
npm run type-check
```

## Project Structure

```
railjs/
├── rail.js              # Core Rail implementation
├── rail.d.ts            # TypeScript definitions
├── rail.test.js         # Vitest test suite
├── test.js              # Legacy test suite
├── demo.js              # Demo application
├── benchmark.js         # Performance benchmarks
├── build.js             # Build script
├── examples/            # Example applications
├── dist/                # Build output (generated)
└── modules/             # Example modules
```

## Coding Standards

### JavaScript Style

- Use **ES2020+** features
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes
- Prefer **const** over let when possible
- Use **arrow functions** for callbacks
- Include **JSDoc comments** for public APIs

### Example

```javascript
/**
 * Emit an event to all listeners
 * @param {string} event - Event name to emit
 * @param {any} data - Data to send with the event
 * @returns {number} Number of handlers called
 */
emit(event, data = {}) {
	// Implementation
}
```

## Testing Guidelines

### Writing Tests

- Place tests in `rail.test.js` (Vitest format)
- Use descriptive test names: `it('should deep clone complex objects', ...)`
- Test both success and failure cases
- Aim for 80%+ code coverage

### Test Structure

```javascript
import { describe, it, expect } from 'vitest';
import { Rail } from './rail.js';

describe('Feature name', () => {
	it('should do something specific', () => {
		const rail = new Rail();
		// Arrange
		const expected = 'result';

		// Act
		const actual = rail.someMethod();

		// Assert
		expect(actual).toBe(expected);
	});
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (useful during development)
npm run test:watch

# Run legacy test suite
npm run test:legacy
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI/CD changes
- **chore**: Other changes (dependencies, etc.)

### Examples

```
feat(core): Add support for async event handlers

- Implement emitAsync() method
- Return structured results with errors
- Update TypeScript definitions

Closes #123
```

```
fix(clone): Handle RegExp objects in deep clone

Previously RegExp objects were not properly cloned,
leading to shared state between modules.

Fixes #456
```

## Documentation

### Updating README

When adding features:
- Add API documentation
- Include usage examples
- Update the feature list
- Add migration notes if needed

### Adding Examples

Place examples in the `examples/` directory:
- Create a self-contained `.js` file
- Add clear comments explaining the concept
- Update `examples/README.md`

## Performance

### Running Benchmarks

```bash
npm run benchmark
```

### Performance Considerations

- Deep cloning has overhead (~30-50%)
- Consider the impact on high-throughput scenarios
- Add benchmarks for performance-critical changes
- Document performance characteristics

## Continuous Integration

All pull requests automatically run through our CI pipeline:

### CI Checks

- **Tests**: Run on Node.js 18.x, 20.x, and 22.x
- **Coverage**: Minimum 80% coverage required
- **Build**: Verify all distribution formats build correctly
- **Type Check**: Validate TypeScript definitions
- **Benchmarks**: Performance regression detection
- **Security**: CodeQL analysis for vulnerabilities

### Workflow Files

- `.github/workflows/ci.yml`: Main CI pipeline
- `.github/workflows/publish.yml`: Automated npm publishing on release
- `.github/workflows/codeql.yml`: Security analysis

### Fixing CI Failures

If CI fails on your PR:

1. Check the error message in the Actions tab
2. Run the failing command locally (`npm test`, `npm run build`, etc.)
3. Fix the issue and push the changes
4. CI will automatically re-run

## Release Process

(For maintainers)

### Creating a Release

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Run full test suite: `npm test`
4. Run coverage check: `npm run test:coverage`
5. Build and verify: `npm run build`
6. Commit changes: `git commit -am "chore: bump version to v0.x.0"`
7. Create git tag: `git tag v0.x.0`
8. Push commits: `git push`
9. Push tag: `git push origin v0.x.0`
10. Create GitHub release from the tag
11. Automated workflow will publish to npm

### Manual Publishing (if needed)

```bash
npm publish --access public
```

Note: The CI/CD pipeline automatically publishes to npm when a GitHub release is created.

## Questions?

- Open an issue for questions
- Check existing issues and PRs
- Review the [README](README.md) and [examples](examples/)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
