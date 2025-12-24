# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

### Install dependencies
- `npm install`

### Run the API in development
- `npm run dev`
  - Runs `node --watch src/index.js`.
  - Loads environment variables from `.env` via `dotenv/config`.
  - Starts the HTTP server on `process.env.PORT` or `3000`.

### Linting and formatting
- Lint all files: `npm run lint`
- Lint and auto-fix: `npm run lint:fix`
- Format all files with Prettier: `npm run format`
- Check formatting only (no writes): `npm run format:check`

ESLint is configured in `eslint.config.js` with custom rules and ignores (`node_modules/**`, `coverage/**`, `logs/**`, `drizzle/**`). Test files under `tests/**/*.js` will automatically get Jest-style globals if/when they are added.

### Database (Drizzle ORM)
Drizzle is configured in `drizzle.config.js` and `src/config/database.js` to use PostgreSQL via Neon.

Before running any DB-related commands, ensure `DATABASE_URL` is set in your environment (or `.env`).

- Generate migrations from the Drizzle schema (`src/models/*.js`):
  - `npm run db:generate`
- Apply migrations to the database:
  - `npm run db:migrate`
- Open Drizzle Studio (DB browser):
  - `npm run db:studio`

Generated artifacts and migrations are written to the `drizzle/` directory.

### Tests
- There is currently **no** test runner or `npm test` script configured.
- ESLint is prepared to recognize Jest-style globals for files in `tests/**/*.js`; if a test framework is added, document its commands here and wire it into `package.json`.

## High-level architecture

This project is an Express-based HTTP API with a simple authentication domain, using Drizzle ORM with Neon/PostgreSQL, Zod for validation, and Winston for logging.

### Entry point and server startup
- `src/index.js`
  - Imports `dotenv/config` to load environment variables.
  - Imports `./server.js` to bootstrap the HTTP server.
- `src/server.js`
  - Imports the Express app from `./app.js`.
  - Reads `PORT` from the environment (default `3000`).
  - Calls `app.listen(PORT, ...)` and logs the listening URL to the console.

### Express app and HTTP surface
- `src/app.js`
  - Creates the Express app instance.
  - Global middleware stack:
    - `helmet()` for security headers.
    - `cors()` with default configuration.
    - `express.json()` and `express.urlencoded({ extended: true })` for body parsing.
    - `cookie-parser` for reading/writing cookies.
  - HTTP request logging:
    - Uses `morgan('combined', ...)` with a custom `stream` that forwards log lines to the shared Winston logger from `src/config/logger.js`.
  - Core routes:
    - `GET /` — simple “Hello, World!” response plus an info log.
    - `GET /health` — health-check endpoint returning `{ status, timestamp, uptime }`.
    - `GET /api` — basic API liveness check.
  - Feature routes:
    - Mounts the auth router at `app.use('/api/auth', authRoutes)` from `src/routes/auth.routes.js`.

### Module resolution and directory structure
The project uses Node ESM with `"type": "module"` in `package.json` and import aliases defined under the `imports` field:
- `#config/*` → `./src/config/*`
- `#middleware/*` → `./src/middleware/*`
- `#models/*` → `./src/models/*`
- `#controllers/*` → `./src/controllers/*`
- `#routes/*` → `./src/routes/*`
- `#utils/*` → `./src/utils/*`
- `#validations/*` → `./src/validations/*`
- `#services/*` → `./src/services/*`

Prefer these aliases over long relative paths when wiring controllers, services, and utilities.

### Authentication domain layering
The auth flow is implemented as a classic Express layered architecture:
- Routes: `src/routes/auth.routes.js` defines `/api/auth` endpoints. Currently, `POST /sign-up` uses the full stack, while `sign-in` and `sign-out` are placeholders.
- Controller: `src/controllers/auth.controller.js` (`signUpController`) validates the request with Zod, calls the service, signs a JWT, sets a secure cookie, logs the event, and returns a sanitized user payload.
- Service: `src/services/auth.service.js` performs domain logic such as checking for existing users, hashing passwords with `bcrypt`, and interacting with the database via Drizzle.
- Model: `src/models/user.model.js` declares the `users` table (id, name, email, password, role, timestamps) using `drizzle-orm/pg-core`.
- Validation: `src/validations/auth.validation.js` centralizes Zod schemas for sign-up and sign-in payloads.
- Utilities: `src/utils/jwt.js`, `src/utils/cookies.js`, and `src/utils/format.js` encapsulate JWT handling, cookie management, and validation error formatting.

When adding new endpoints, follow this routing → controller → service → model/utility pattern.

### Database and Drizzle ORM
- `src/config/database.js` uses `@neondatabase/serverless` to create a Neon SQL client and wraps it with Drizzle (`drizzle-orm/neon-http`), exporting `{ db, sql }`.
- `drizzle.config.js` points Drizzle Kit at `./src/models/*.js` as the schema source, outputs artifacts into `./drizzle`, and reads `DATABASE_URL` from the environment.
- The `drizzle/` directory holds generated SQL migrations and metadata; it is ignored by ESLint.

Use the `npm run db:*` scripts to manage database schema and explore the database via Drizzle Studio.

### Logging and observability
- `src/config/logger.js` configures a Winston logger that:
  - Logs JSON with timestamps and stack traces to `logs/error.log` (errors only) and `logs/combined.log` (all levels).
  - Adds a colorized, human-readable console transport when `NODE_ENV !== 'production'`.
  - Uses the `lOG_LEVEL` environment variable (note the casing) to set the log level, defaulting to `info`.
- HTTP access logs from `morgan` are piped into this logger via the custom `stream` in `src/app.js`.

### Environment configuration
Key environment variables used by the app:
- `PORT` — HTTP server port (defaults to `3000`).
- `DATABASE_URL` — PostgreSQL connection string used by both the runtime (`src/config/database.js`) and Drizzle Kit (`drizzle.config.js`).
- `NODE_ENV` — controls production vs. development behavior (logger transports, cookie `secure` flag, etc.).
- `JWT_SECRET` — secret key for signing and verifying JWTs in `src/utils/jwt.js` (a development fallback is provided but should be overridden).
- `lOG_LEVEL` — Winston log level in `src/config/logger.js`.

Ensure these are set (usually via a local `.env` file loaded by `dotenv/config`) before running the app or database commands.
