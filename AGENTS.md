# AGENTS.md

Instructions for AI coding agents working on this repository.

## Project Overview

Full-stack road trip planning app. Monorepo with pnpm workspaces:

```
packages/
  shared/   # Zod schemas & shared TypeScript types (@roadtrip/shared)
  api/      # Express.js REST API (@roadtrip/api)
  web/      # React SPA (@roadtrip/web)
```

## Setup

```bash
pnpm install
cp packages/api/.env.example packages/api/.env  # then fill in values
```

## Dev Commands

```bash
pnpm dev           # start all packages (recommended)
pnpm type-check    # must pass before any PR
pnpm format        # auto-format with Prettier
pnpm lint          # ESLint
```

## Code Style

- No semicolons, single quotes, 2-space indent (enforced by Prettier)
- TypeScript strict mode — no `any`, no implicit returns
- Zod for all runtime validation — define schemas in `shared`, import in `api` and `web`
- All code, comments and documentation must be in english (except for translation files)

## Architecture Rules

### Shared package
- Only pure TypeScript: types, Zod schemas, validators
- No runtime dependencies on Node or browser APIs

### API package
- Each resource has its own route file in `src/routes/`
- Use the existing error handling middleware (`src/middleware/errorHandler.ts`)
- All authenticated routes use the auth middleware
- Database access only through Drizzle ORM — no raw SQL

### Web package
- Data fetching via React Query (`@tanstack/react-query`)
- UI components from Ant Design — prefer existing components over custom ones
- Map rendering with MapLibre GL via `react-map-gl`
- No direct `fetch` calls — use the existing API client abstraction

## Database

Schema lives in `packages/api/src/db/schema.ts`. After any schema change:

```bash
pnpm --filter @roadtrip/api db:generate   # generate migration
pnpm --filter @roadtrip/api db:migrate    # apply migration
```

## CI Checks

All three must pass before merging:
1. `pnpm type-check`
2. `pnpm format:check`
3. `pnpm lint`
