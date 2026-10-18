# Backend — ScribeCode

Express 5 API written in TypeScript, running on **Node.js** (package management is done with Bun).

## Structure

```
src/
  handler.ts                # Express app export
  app.ts                    # Express app assembly (middleware + routes)
  config/                   # validated env (zod) and structured logger (pino)
  lib/                      # infrastructure (Prisma client)
  routes/index.ts           # central API registry (mounts feature routers)
  modules/<feature>/        # feature modules: routes + controller + service (+ schema)
  middleware/               # error handling, 404, logging, validation
  errors/                   # AppError hierarchy
  types/                    # shared API types (response envelope)
prisma/schema.prisma        # datasource + generator (no models yet)
prisma.config.ts            # Prisma CLI configuration
app.mjs                     # Vercel entrypoint for the bundled app
scripts/start-server.ts     # local and self-hosted server bootstrap
```

Each feature is a self-contained module. Routes delegate to controllers (HTTP concerns), which
delegate to services (business logic). Cross-cutting concerns live in `middleware/`.

## Scripts

Run from the repository root or this directory:

- `bun run dev` — generate the Prisma client and start `tsx watch` (http://localhost:4000)
- `bun run build` — bundle to `dist/` with tsup
- `bun run start` — run the built output with plain Node (`node dist/scripts/start-server.js`)
- `bun run lint` / `bun run check-types` / `bun run test`
- `bun run db:generate` / `db:migrate` / `db:deploy` / `db:push` / `db:studio`

For Vercel, see [the deployment guide](../../docs/vercel-deployment.md).

## Environment

Copy `.env.example` to `.env`. Configuration is validated at startup with Zod; the process exits
with a clear message if anything is missing or malformed.

| Variable       | Description                                    |
| -------------- | ---------------------------------------------- |
| `NODE_ENV`     | `development` \| `test` \| `production`        |
| `PORT`         | HTTP port (default `4000`)                     |
| `DATABASE_URL` | PostgreSQL connection string                   |
| `CORS_ORIGIN`  | Comma-separated list of allowed origins        |
| `LOG_LEVEL`    | `pino` level (default `info`)                  |
| `APP_VERSION`  | Version reported by the health endpoint        |

## Database

Prisma targets PostgreSQL. There are intentionally **no models yet** — schemas are added alongside
their features. The generated client is emitted to `src/generated/prisma` (gitignored).

`prisma generate` does not require a running database. `prisma migrate` / `db push` do.

## API

All endpoints are mounted under `/api/v1` and return a consistent envelope:

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

- `GET /api/v1/health` — liveness (no database required). Supports `?verbose=true`.
- `GET /api/v1/health/ready` — readiness (checks database connectivity).
