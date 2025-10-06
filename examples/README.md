# RailJS Examples

Real-world examples demonstrating different use cases for RailJS.

## Running Examples

```bash
# API Gateway example
node examples/api-gateway.js

# State Management example
node examples/state-management.js

# Plugin System example
node examples/plugin-system.js
```

## Examples

### 1. API Gateway (`api-gateway.js`)

Demonstrates building a microservices API gateway with:
- Request routing to different services
- Analytics tracking
- Rate limiting
- Service isolation

**Concepts shown:**
- Request/response pattern
- Multiple modules handling the same event
- Service coordination

### 2. State Management (`state-management.js`)

Shows how to build a Redux-like state management system:
- Central state store
- State updates via events
- UI reactivity
- Action logging

**Concepts shown:**
- State management pattern
- Event-driven updates
- Time-travel debugging (via logger)

### 3. Plugin System (`plugin-system.js`)

Demonstrates a hot-swappable plugin architecture:
- Dynamic plugin loading/unloading
- Plugin isolation
- Core + plugins pattern
- Runtime module replacement

**Concepts shown:**
- Module attach/detach
- Hot-swapping modules
- Plugin architecture
- Extensibility

## Key Patterns

All examples demonstrate:
- **Module isolation**: Modules don't directly import each other
- **Event-driven**: All communication through events
- **Composability**: Modules can be mixed and matched
- **Testability**: Each module can be tested independently
