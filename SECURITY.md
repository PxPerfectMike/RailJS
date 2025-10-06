# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in RailJS, please report it by:

1. **DO NOT** open a public issue
2. Email the details to the repository maintainers via GitHub
3. Open a private security advisory on GitHub

### What to Include

Please include the following information:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)
- Your contact information

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies by severity
  - Critical: Within 7 days
  - High: Within 30 days
  - Medium: Within 90 days
  - Low: Next minor release

### Disclosure Policy

- We will acknowledge receipt of your report
- We will provide regular updates on our progress
- We will notify you when the vulnerability is fixed
- We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

When using RailJS:

### 1. Data Validation

Always validate event data before processing:

```javascript
rail.on('user.input', (data) => {
  // Validate input
  if (!data || typeof data.text !== 'string') {
    return;
  }

  // Sanitize
  const clean = sanitize(data.text);

  // Process
  processInput(clean);
}, 'input-handler');
```

### 2. Avoid Executing User-Provided Code

Never use `eval()` or `Function()` with event data:

```javascript
// ❌ DANGEROUS
rail.on('execute', (data) => {
  eval(data.code); // Never do this!
});

// ✅ SAFE
rail.on('execute', (data) => {
  // Use a safe alternative like a whitelist of functions
  const allowedActions = { add, subtract, multiply };
  if (allowedActions[data.action]) {
    allowedActions[data.action](data.params);
  }
});
```

### 3. Module Isolation

RailJS provides data isolation via deep cloning. Keep this enabled for untrusted data:

```javascript
// ✅ Safe: Cloning enabled (default)
const rail = new Rail({ clone: true });

// ⚠️ Only disable for trusted, internal modules
const fastRail = new Rail({ clone: false });
```

### 4. Rate Limiting

Implement rate limiting for public-facing modules:

```javascript
const rateLimiter = {
  name: 'rate-limiter',
  limits: new Map(),

  connect(rail) {
    rail.on('public.api', (data) => {
      if (this.isRateLimited(data.userId)) {
        rail.emit('rate-limit.exceeded', { userId: data.userId });
        return;
      }
      // Process request
    }, 'rate-limiter');
  },

  isRateLimited(userId) {
    // Implement rate limiting logic
  }
};
```

### 5. Error Handling

Don't leak sensitive information in error messages:

```javascript
rail.on('rail.error', (data) => {
  // ❌ Don't expose internals
  console.log('Error:', data.error.stack);

  // ✅ Log safely
  logger.error('Module error', {
    module: data.module,
    event: data.event,
    // Sanitize error message
    message: sanitizeError(data.error)
  });
}, 'error-logger');
```

### 6. Dependency Security

Keep dependencies updated:

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Known Security Considerations

### Deep Cloning Performance

While deep cloning provides data isolation, it has performance implications:

- **Trade-off**: Safety vs Speed
- **Recommendation**: Keep cloning enabled unless performance testing shows it's a bottleneck
- **Risk**: Disabling cloning allows modules to mutate shared data

### Event History

Event history stores all emitted events:

```javascript
// History grows unbounded by default
const rail = new Rail();
rail.emit('event', sensitiveData); // Stored in history!

// Clear history periodically
rail.clearHistory();
```

### Module Trust

Modules have full access to the Rail instance:

- Only attach trusted modules
- Review third-party modules before use
- Modules can emit any event, including system events

## Security Updates

Security updates will be released as:

- **Patch versions** for security fixes in current minor version
- **Security advisories** on GitHub
- **npm security advisories**

Subscribe to:
- GitHub repository notifications
- npm package updates
- Security advisories

## Contact

For security concerns, please use GitHub's private security advisory feature or contact the maintainers directly through the repository.

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who report vulnerabilities.
