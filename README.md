# Codebase Explorer

An AI-powered web app for understanding existing GitHub repositories — especially large ones
produced by AI coding tools. Connect GitHub, pick a repository, explore its file tree, select a
file, and see what it does and how it relates to the rest of the app. The default workspace is
**Quick interview preparation**: a file-by-file project story with speaking checkpoints and an AI coach inside each slide.

Understanding goes beyond dependency graphs: a file's imports and importers are shown as a focused,
clickable neighbourhood, and an AI-generated architecture map groups the repository into modules.

> The repository folder stays named `scribecode`; the product display name lives in
> `apps/frontend/src/config/app.ts` and can be changed in one place.

## How it works

1. **Connect GitHub** — via an OAuth App, or a personal access token for local development.
2. **Pick a repository** — your GitHub repositories are listed and can be connected to the app.
3. **Explore the file tree** — the tree is synced from GitHub and cached in PostgreSQL.
4. **Open a file** — the explanation leads: a short purpose in large text, a few crisp highlights, then an
   **annotated walkthrough** where each major block (function, class, hook, config) sits beside a
   short, colour-coded callout pointing at its code. Full explanations live behind "More detail",
   and the untouched source is one toggle away.
5. **See the connections** — a focused dependency view shows what the selected file imports, what
   imports it, and which packages it pulls in. Any file can be clicked to walk the chain, and the
   most connected files act as a map of the repository.
6. **Zoom out** — an AI-generated architecture map groups the repository into modules and lists how
   they relate, instead of drawing an unreadable graph.
7. **Practice your story** — follow a reading route from likely entry files through their imports,
   reveal speaking notes, mark stops practiced, and ask questions without leaving the slide.
   The route covers every synced file, with lighter stops for assets and generated files. It is a
   reading guide, not a runtime trace. Interview mode hides the tree and keeps code, explanation,
   and chapter navigation in one viewport. Speaking notes and the coach open in an optional overlay.
   The first two chapters preload automatically; once started, the story stays two chapters ahead.
   Source and explanations share the navigation cache and in-flight requests, and sync invalidates both.
   Other file explanations load on demand and are cached by file identity;
   coaching answers are grounded in a bounded selection of source files and cached for repeated questions.
   In the map, select a file in the tree or drag it onto the canvas to follow annotated connections.

Both views are generated once per repository (and cached), so switching tabs is instant and never
re-runs the graph build or the model.

## Stack

| Area           | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| Monorepo       | Turborepo + Bun workspaces                                                 |
| Frontend       | React, TypeScript (strict), Vite, Tailwind CSS v4, React Router            |
| Backend        | Node.js, TypeScript, Express 5, Prisma, PostgreSQL, Zod, Pino              |
| Visualization  | Structured HTML/CSS views (focused dependency lists, grouped module cards) |
| GitHub         | Official GitHub REST API via Octokit, plus the OAuth web flow              |
| AI             | Provider-agnostic LLM adapter (OpenAI-compatible endpoints) with a mock    |
| Tooling        | ESLint, Prettier, Vitest, Supertest                                        |

Bun manages dependencies and runs workspace scripts. The backend **executes on Node.js** (not the
Bun runtime).

## Layout

```
apps/
  frontend/   React + Vite SPA
    src/
      app/          router + providers
      components/   reusable UI (ui/) and shell components
      features/     auth, repositories, explorer, analysis, visualization, health
      hooks/        shared hooks (useAsyncResource)
      layouts/      page layouts
      pages/        route screens
      services/     API client
      types/        shared types (API envelope, graph)
  backend/    Express API
    src/
      config/       env + logger
      errors/       AppError
      lib/          github (Octokit client, OAuth, token store), llm (provider adapter), prisma
      middleware/   auth, validation, error handling, logging
      modules/      auth, repositories, files, graph, analysis, health
        <module>/   routes / controller / service / schema (+ mapper)
      routes/       central route registry
      schemas/      shared request schemas
      types/        API envelope, graph contract, Express augmentation
packages/
  eslint-config/       shared ESLint flat configs (base / react / node)
  typescript-config/   shared tsconfig presets (base / vite / node)
```

Each backend feature module defines its routes independently and is mounted in
`apps/backend/src/routes/index.ts`. Frontend code is organized by feature, with reusable UI kept in
`components/ui` and feature-specific UI alongside its feature.

## Requirements

- [Bun](https://bun.sh) `1.3+` (package manager + task runner)
- **Node.js 24+** (required to run the backend)
- PostgreSQL (needed for migrations and any data-backed endpoint)

## Getting started

```sh
bun install
cp apps/backend/.env.example apps/backend/.env
```

Apply the database schema (requires PostgreSQL):

```sh
bun run db:migrate      # or: bun run db:push
```

Then start everything from the repository root:

```sh
bun run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000 (health: http://localhost:4000/api/v1/health)

The Vite dev server proxies `/api` to the backend, so the frontend can call the API without CORS
configuration in development.

## Connecting GitHub

Two options, both backed by the same account/session model:

- **Personal access token (simplest for local dev).** Paste a token with `repo` and `read:user`
  scopes on the home page. No OAuth credentials required.
- **OAuth App.** Create one at <https://github.com/settings/developers> with callback URL
  `http://localhost:4000/api/v1/auth/github/callback`, then set `GITHUB_CLIENT_ID` and
  `GITHUB_CLIENT_SECRET` in `apps/backend/.env`.

## AI integration

The LLM layer (`apps/backend/src/lib/llm`) is provider-agnostic and speaks the OpenAI-compatible
chat-completions protocol:

| `LLM_PROVIDER` | Key                | Default model   | Default base URL              |
| -------------- | ------------------ | --------------- | ----------------------------- |
| `mock`         | —                  | `mock`          | — (fully offline)             |
| `openai`       | `LLM_API_KEY`      | `gpt-4o-mini`   | `https://api.openai.com/v1`   |
| `deepseek`     | `DEEPSEEK_API_KEY` | `deepseek-chat` | `https://api.deepseek.com`    |

- `mock` (the default) runs fully offline with deterministic output, so the app works without a key.
- `deepseek` uses DeepSeek's low-cost `deepseek-chat` model by default; set `LLM_MODEL=deepseek-reasoner`
  for deeper reasoning.
- `LLM_BASE_URL` and `LLM_MODEL` override the defaults for any provider.
- `DEEPSEEK_API_KEY` falls back to `LLM_API_KEY` when unset.
- If a provider is selected without a key, the app logs a warning and uses the mock provider.

Structured calls request guaranteed-JSON output (`LLM_JSON_MODE=true`). AI results are cached in the
database and can be regenerated on demand.

## Root scripts

| Command               | Description                                        |
| --------------------- | -------------------------------------------------- |
| `bun run dev`         | Run all apps in development (via Turborepo)        |
| `bun run build`       | Build all apps                                     |
| `bun run lint`        | Lint all packages                                  |
| `bun run check-types` | Type-check all packages                            |
| `bun run test`        | Run all test suites                                |
| `bun run format`      | Format with Prettier (`format:check` to verify)    |
| `bun run db:generate` | Generate the Prisma client                         |
| `bun run db:migrate`  | Create/apply a development migration               |
| `bun run db:push`     | Push the schema to the database                    |
| `bun run db:studio`   | Open Prisma Studio                                 |

Scope any command to a single app with a Turbo filter, e.g. `turbo run dev --filter=@repo/backend`.

## Environment

- **Frontend** (`apps/frontend/.env`): `VITE_API_BASE_URL` — exposed to the browser; keep secrets out.
- **Backend** (`apps/backend/.env`): server-only configuration, validated at startup with Zod —
  database, session, GitHub, and LLM settings. Copy `apps/backend/.env.example` and adjust.

Real `.env` files are gitignored.

## Database

Prisma targets PostgreSQL (`apps/backend/prisma.config.ts`). The initial migration lives in
`apps/backend/prisma/migrations`. Models:

| Model            | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `User`           | A person, keyed by their GitHub login               |
| `GitHubAccount`  | The stored GitHub access token and scopes           |
| `Session`        | Opaque session tokens delivered via an httpOnly cookie |
| `Repository`     | A connected repository                              |
| `RepositoryFile` | Cached file-tree entries for a repository           |
| `Analysis`       | AI artifacts (file-block walkthroughs, architecture maps) as JSON |

`prisma generate` runs automatically before dev/build/type-check/test.

## API surface

All endpoints live under `/api/v1`, are registered in `apps/backend/src/routes/index.ts`, and return
a consistent envelope: `{ success: true, data }` or `{ success: false, error: { code, message } }`.

| Method | Path                                              | Description                              |
| ------ | ------------------------------------------------- | ---------------------------------------- |
| GET    | `/health`, `/health/ready`                         | Liveness / readiness                     |
| GET    | `/auth/github`, `/auth/github/callback`            | OAuth connect flow                       |
| POST   | `/auth/pat`                                        | Connect with a personal access token     |
| GET    | `/auth/me`                                         | Current session                          |
| POST   | `/auth/logout`                                     | End the session                          |
| GET    | `/repositories/available`                          | Repositories on the connected account    |
| GET    | `/repositories`                                    | Connected repositories                   |
| POST   | `/repositories`                                    | Connect a repository                     |
| GET    | `/repositories/:owner/:name`                       | Connected repository details             |
| POST   | `/repositories/:owner/:name/sync`                  | Refresh the cached file tree             |
| GET    | `/files/:owner/:name/tree`                         | File tree                                |
| GET    | `/files/:owner/:name/content?path=`                | File contents                            |
| GET    | `/graph/:owner/:name/dependency?refresh=`          | Dependency graph (cached per repo)       |
| POST   | `/analysis/:owner/:name/prepare`                   | Cached project tour and dependency map   |
| POST   | `/analysis/:owner/:name/interview/question`        | Cached, source-grounded interview answer |
| POST   | `/analysis/:owner/:name/file`                      | AI block walkthrough for a file           |
| POST   | `/analysis/:owner/:name/architecture`              | AI architecture map                      |

Every `/repositories`, `/files`, `/graph`, and `/analysis` route requires an authenticated session.
