# Frontend — Scribecode

React + TypeScript (strict) single-page app built with Vite, Tailwind CSS v4 and React Router.

## Structure

```
src/
  app/            # application shell: App, providers, router
  layouts/        # route layouts
  pages/          # route-level composition (no business logic)
  features/       # feature-oriented modules (components + hooks + api)
  components/     # shared, app-wide components
  components/ui/  # shadcn/ui primitives
  services/       # API client / data access
  hooks/          # shared hooks
  lib/            # utilities and validated runtime config
  types/          # shared TypeScript types
  styles/         # global styles
```

## Scripts

Run from the repository root or this directory:

- `bun run dev` — start the Vite dev server (defaults to http://localhost:5173)
- `bun run build` — production build to `dist/`
- `bun run preview` — preview the production build
- `bun run lint` — ESLint
- `bun run check-types` — TypeScript type checking
- `bun run test` — Vitest (jsdom)

## Configuration

Copy `.env.example` to `.env` and adjust as needed. Only `VITE_`-prefixed variables are exposed to the browser.

- `VITE_API_BASE_URL` — base URL for the API (defaults to `/api/v1`, proxied to the backend in dev).

In development, requests to `/api` are proxied to the backend (`http://localhost:4000` by default; override with `BACKEND_ORIGIN`).
