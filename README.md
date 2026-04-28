# devops

Node.js (ESM) backend project that looks like an API/service foundation with Express, validation, structured logging, and Drizzle ORM migrations.

> Repo: https://github.com/gustavohoze/devops

## Tech Stack

- Node.js (ES Modules)
- Express
- Drizzle ORM + drizzle-kit
- Postgres (Neon Serverless driver)
- Auth/security utilities: bcrypt, jsonwebtoken, helmet, cors
- Logging: morgan, winston
- Validation: zod
- Tooling: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- A Postgres database (Neon recommended based on deps)

### Install

```bash
npm install
```

### Environment

This repo contains a `.env` file in version control. Review it before running locally.

### Run (dev)

```bash
npm run dev
```

## Database

- Generate migrations:

```bash
npm run db:generate
```

- Run migrations:

```bash
npm run db:migrate
```

- Open Drizzle Studio:

```bash
npm run db:studio
```

## Code Layout (conventional)

The project uses import aliases:

- `#config/*` → `src/config/*`
- `#middleware/*` → `src/middleware/*`
- `#models/*` → `src/models/*`
- `#controllers/*` → `src/controllers/*`
- `#routes/*` → `src/routes/*`
- `#utils/*` → `src/utils/*`
- `#validations/*` → `src/validations/*`
- `#services/*` → `src/services/*`

## License

No license is currently specified in this repository.
