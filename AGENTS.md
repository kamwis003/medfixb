# AGENTS.md - Development Guide for AI Coding Agents

This guide provides essential information for agentic coding tools working in the V-Campus Express codebase.

## Project Overview

V-Campus Express is a TypeScript/Express.js API built with clean architecture, Prisma ORM (v7), PostgreSQL, and comprehensive API documentation via Swagger.

**Tech Stack:** TypeScript 5.9+, Express 5.2+, Prisma 7.2+, PostgreSQL, Node.js 18+, Zod 4.2+, Supabase

**Package Manager:** pnpm (required)

---

## Build, Lint & Test Commands

### Development
```bash
pnpm dev                    # Start dev server with hot-reload (nodemon)
pnpm build                  # Compile TypeScript to dist/
pnpm start                  # Run compiled production code
```

### Database (Prisma)
```bash
pnpm prisma generate        # Generate Prisma client from schema
pnpm prisma migrate dev     # Create and apply migration
pnpm prisma migrate deploy  # Apply migrations (production)
pnpm prisma studio          # Open Prisma Studio GUI
pnpm prisma db push         # Push schema without migration (dev only)
```

### Testing
```bash
pnpm test                   # Run all tests (currently not configured)
# No test runner configured yet - add jest/vitest when implementing tests
```

**Running a Single Test:** Not yet configured. When implemented, use:
- Jest: `pnpm jest path/to/test.test.ts`
- Vitest: `pnpm vitest path/to/test.spec.ts`

---

## Project Structure

```
src/
├── config/             # Environment validation (Zod), Swagger config
├── controllers/        # Request handlers (thin layer)
├── services/           # Business logic layer
│   └── interfaces/     # Service interface definitions
├── routes/             # Route definitions with API versioning
│   └── api/v1/        # Version 1 API routes
├── middlewares/        # Express middleware (auth, errors)
├── data/              # Data access layer
│   └── data-sources/postgresql/  # Prisma client singleton
├── utils/             # Utilities, errors, types, functions
│   ├── errors/        # Custom error classes
│   ├── functions/     # Utility functions (asyncHandler, etc.)
│   ├── types/         # Type definitions
│   └── constants/     # Constants
└── libs/              # External library configurations
    └── zod/schemas/   # Zod validation schemas

prisma/
├── schema.prisma      # Database schema
├── migrations/        # Migration history
└── dbml/             # Database documentation
```

---

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode enabled** - All strict type checking rules active
- **Module:** CommonJS (target: ES2016)
- **Path alias:** `@/*` maps to `src/*`
- **Output:** Compiled to `dist/`
- **Source maps:** Enabled for debugging

### Naming Conventions
- **Files/Folders:** kebab-case (`user-service.ts`, `auth-handler.ts`)
- **Classes/Interfaces:** PascalCase (`AppError`, `IUserService`)
- **Variables/Functions:** camelCase (`getUserById`, `asyncHandler`)
- **Constants:** UPPERCASE (`DATABASE_URL`, `PORT`)
- **Enums:** PascalCase for type, UPPERCASE for values
- **Boolean variables:** Prefix with verb (`isLoading`, `hasError`, `canDelete`)
- **Function names:** Start with verb (`getUser`, `createOrder`, `validateInput`)

### Import Organization
```typescript
// 1. External packages (Node built-ins, npm packages)
import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

// 2. Internal absolute imports (using @ alias or relative from src/)
import { asyncHandler } from '@/utils/functions/async-handler'
import { AppError } from '@/utils/errors/app-errors'

// 3. Relative imports
import { userService } from '../services/user-service'
import { IUserService } from './interfaces/i-user-service'

// 4. Types/Interfaces (if separate)
import type { User } from '../../../generated/prisma/client'
```

### TypeScript Style
- **Always declare explicit types** for function parameters and return values
- **Avoid `any`** - use `unknown` if type is truly unknown
- **Use interfaces** for object shapes and service contracts
- **Prefer `type` for unions, intersections, and utility types**
- **Use `as const`** for literal values that shouldn't change
- **Single export per file** (use named exports, avoid default exports)

### Functions
- **Keep functions focused** - Aim for <20 lines
- **Use early returns** to reduce nesting
- **Extract complex logic** into utility functions
- **Use descriptive names** with verb prefix
- **Leverage functional patterns:** map, filter, reduce
- **Use arrow functions** for simple operations
- **Use named functions** for complex logic

### Error Handling

**MUST use custom error classes** from `src/utils/errors/app-errors.ts`:
```typescript
import { AppError, NotFoundError, BadRequestError, ValidationError,
         UnauthorizedError, ForbiddenError } from '../utils/errors/app-errors'

// In services:
if (!user) {
  throw new NotFoundError('User not found', 'errors.user_not_found')
}

// Custom error:
throw new AppError('Custom error', 400, { field: 'value' }, 'errors.custom')
```

**MUST wrap async controllers** with `asyncHandler`:
```typescript
import { asyncHandler } from '../utils/functions/async-handler'

export const getUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Controller logic - errors automatically caught and passed to next()
  }
)
```

**Error response format** (handled by error middleware):
```typescript
{
  status: 'error',
  message: 'Human-readable message',
  translationKey: 'errors.not_found',  // For i18n
  data?: { /* Additional error context */ }
}
```

### Validation
- **Use Zod** for all input validation and environment variables
- **Validate at boundaries** (request entry points)
- **Define schemas separately** in `src/libs/zod/schemas/`

### Logging

V-Campus Express uses a **centralized logging system** located at `src/utils/functions/logger.ts` that provides structured logging with service-specific loggers.

**NEVER use `console.log`, `console.error`, `console.warn`, or `console.debug` directly.** Always use the logger.

#### Creating a Logger

Create a logger instance for your service using the `createLogger` factory function:

```typescript
import { createLogger } from '@/utils/functions/logger'

const logger = createLogger('UserService')  // Use descriptive service name
```

#### Log Levels

The logger supports four levels in ascending order of severity:

- **`debug`** - Detailed diagnostic information for development/debugging
  - Example: Function entry/exit, variable values, flow tracing
  - Only shown when `LOG_LEVEL=DEBUG`

- **`info`** - General informational messages about application flow
  - Example: Service initialization, successful operations, state changes
  - Default level in development

- **`warn`** - Warning messages for potentially harmful situations
  - Example: Deprecated API usage, recoverable errors, fallback behavior
  - Does not interrupt execution

- **`error`** - Error messages for serious problems
  - Example: Unhandled exceptions, failed operations, data corruption
  - Should be investigated and resolved

#### Usage Examples

```typescript
import { createLogger } from '@/utils/functions/logger'

const logger = createLogger('UserService')

// Simple message
logger.info('User service initialized')

// With metadata object
logger.info('User created', { userId: '123', email: 'user@example.com' })

// With error object
try {
  await someOperation()
} catch (error) {
  logger.error('Operation failed', { error, userId: '123' })
}

// Debug with multiple metadata
logger.debug('Processing request', { method: 'POST', path: '/users' }, { body: req.body })

// Warning
logger.warn('Cache miss', { key: 'user:123', fallback: 'database' })
```

#### Environment Configuration

Configure logging behavior via environment variables:

- **`LOG_LEVEL`** (optional) - Minimum log level to output
  - Values: `DEBUG`, `INFO`, `WARN`, `ERROR`
  - Default: `DEBUG` in development, `INFO` in production
  - Example: `LOG_LEVEL=WARN` (only shows warn and error logs)

- **`LOG_FORMAT`** (optional) - Output format
  - Values: `json`, `pretty`
  - Default: `json` in production, `pretty` in development
  - JSON format is ideal for log aggregation services
  - Pretty format is human-readable with colors for terminal

#### Runtime behavior

- Default log level is DEBUG in development and INFO in production unless overridden by LOG_LEVEL.
- Log formatting is JSON in production or when LOG_FORMAT=json; otherwise it is pretty-printed with colors.
- WARN and ERROR entries are written to stderr; INFO and DEBUG entries go to stdout.
- Metadata arguments are preserved; a single meta argument is emitted as meta, multiple arguments as an array.

#### Best Practices

- **Use descriptive service names** - Include layer context (`UserService`, `AuthController`, `PrismaRepository`)
- **Include relevant metadata** - Add context that helps debugging (IDs, error objects, input parameters)
- **Choose appropriate log levels** - Don't use `error` for validation failures, `info` for debugging details
- **Log at boundaries** - Log entry/exit of major operations, especially in services
- **Never log sensitive data** - Avoid passwords, tokens, credit cards, PII
- **Use structured metadata** - Pass objects rather than concatenating strings
- **Log errors with context** - Include the error object and relevant identifiers

### Prisma & Database
- **Use Prisma Client singleton** from `src/data/data-sources/postgresql/prisma-client.ts`
- **Import from generated path:** `import { User } from '../../../generated/prisma/client'`
- **Use transactions** for multi-step operations: `prisma.$transaction([...])`
- **Handle Prisma errors** specifically (wrap in try-catch if needed)
- **Never expose raw Prisma client** in API responses
- **Use meaningful model names** in PascalCase
- **Create migrations** for all schema changes: `pnpm prisma migrate dev --name descriptive_name`
- **Never modify existing migrations**

### API Response Format
```typescript
// Success
res.status(200).json({
  success: true,
  data: { user }
})

// Error (handled by errorHandler middleware)
throw new NotFoundError('Resource not found')
```

### Swagger Documentation
**MUST include Swagger JSDoc** for all routes:
```typescript
/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id', getUserController)
```

---

## Architecture Patterns

### Clean Architecture Layers
1. **Routes** → Define endpoints, apply middleware
2. **Controllers** → Handle HTTP concerns (req/res), call services
3. **Services** → Business logic, call data layer
4. **Data Layer** → Prisma operations, database access

**NEVER skip layers** - always follow the flow.

### Service Pattern
```typescript
// Interface (src/services/interfaces/i-user-service.ts)
export interface IUserService {
  getUser: (userId: string) => Promise<User>
}

// Implementation (src/services/user-service.ts)
export const userService: IUserService = {
  async getUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundError('User not found')
    return user
  }
}
```

### Controller Pattern
```typescript
export const getUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const user = await userService.getUser(id)
    res.status(200).json({ success: true, data: { user } })
  }
)
```

---

## Important Notes from Cursor Rules

### From `.cursor/rules/typescript.mdc`:
- Maintain clean architecture with proper layer separation
- Use Zod for all validation
- Include Swagger docs for all endpoints
- Follow existing naming conventions strictly
- Implement proper error handling using custom error classes
- Use asyncHandler for all async controllers

### From `.cursor/rules/prisma.mdc`:
- Use type-safe Prisma client operations
- Create repository patterns for complex queries
- Implement soft delete with `deletedAt` timestamp where appropriate
- Use Prisma middleware for cross-cutting concerns
- Keep Prisma code in dedicated modules
- Separate data access logic from business logic

---

## Common Tasks

### Adding a New Endpoint
1. Define interface in `src/services/interfaces/`
2. Implement service in `src/services/`
3. Create controller in `src/controllers/`
4. Add route in `src/routes/api/v1/`
5. Include Swagger documentation
6. Test manually via Swagger UI at `/api-docs`

### Adding a New Model
1. Update `prisma/schema.prisma`
2. Run `pnpm prisma migrate dev --name add_model_name`
3. Run `pnpm prisma generate`
4. Create service interface and implementation
5. Add controllers and routes

---

## Environment Variables

Validated via Zod in `src/config/env.ts`. Required variables:
- `NODE_ENV` (development|production|test)
- `PORT` (default: 3000)
- `DATABASE_URL` (PostgreSQL connection string)
- `SUPABASE_*` (URL, keys, secrets)
- `REDIS_URL`
- `CACHE_TTL_*` (cache expiration times)
- `LOG_LEVEL` (optional: DEBUG|INFO|WARN|ERROR)
- `LOG_FORMAT` (optional: json|pretty)

**App will exit on startup if environment validation fails.**

---

## Tips for AI Agents

1. **Always use asyncHandler** for async controllers
2. **Always throw custom error classes** (never plain Error)
3. **Always include Swagger docs** for new routes
4. **Always create migrations** for schema changes
5. **Never use `any`** type
6. **Follow the existing file structure** exactly
7. **Import Prisma client** from the singleton in `src/data/`
8. **Use kebab-case** for all file names
9. **Keep controllers thin** - move logic to services
10. **Test via Swagger UI** at `http://localhost:3000/api-docs`
11. **Always use the logger** from `@/utils/functions/logger` - never use `console.log/error/warn/debug`
12. **Always use context7 for up-do-date framework and library documentation**
13. **You can store memory inside memory bank MCP** for future reference
