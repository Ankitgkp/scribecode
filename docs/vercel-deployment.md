# Deploy Scribecode on Vercel

The root `vercel.json` deploys `apps/backend` and `apps/frontend` as two Services in **one Vercel project**. The backend is an Express Function; the frontend is a Vite static site. Public `/api/*` requests go to the backend, and all other paths go to the frontend. The backend receives the original `/api/v1/*` path, matching its Express routes. The frontend service rewrites deep links such as `/repositories` to `index.html`.

No service binding is declared: the frontend calls the API from the browser through the public `/api` route, and the backend does not call the frontend. Vercel service bindings are for server-side service-to-service calls. Add a binding on the caller if one is introduced later; do not use a binding URL in Vite client code.

## 1. Prepare the database

Create a hosted PostgreSQL database reachable from Vercel. Keep its connection string for `DATABASE_URL`. Use a pooled connection string for Functions if your database provider offers one; run migrations with a direct connection when the provider requires it. Never put the URL in `VITE_` variables or commit it.

## 2. Create one Vercel project

Use a Vercel account with Services beta access and a current CLI version. Import this Git repository into Vercel with **Root Directory** set to the repository root. The root `vercel.json` defines both services; do not select either app directory as the project root. Use Node.js 24.x for the backend. Vercel builds each service independently. The backend service generates Prisma and bundles `app.mjs`'s imported Express handler; the frontend service builds to `dist`.

Set these Production environment variables in the Vercel project:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Hosted PostgreSQL connection string |
| `FRONTEND_URL` | The project's public origin, for example `https://scribecode.vercel.app` |
| `CORS_ORIGIN` | The same public origin |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID, if using GitHub sign-in |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App secret, if using GitHub sign-in |
| `GITHUB_OAUTH_CALLBACK_URL` | `https://YOUR-PROJECT-DOMAIN/api/v1/auth/github/callback` |
| `LLM_PROVIDER` | `mock`, `openai`, or `deepseek` |
| `LLM_API_KEY` or `DEEPSEEK_API_KEY` | Required for the selected real LLM provider |

Leave `VITE_API_BASE_URL` unset so the frontend uses its default `/api/v1`. Do not set `BACKEND_ORIGIN` or a service binding variable for this deployment. Other backend settings are documented in `apps/backend/.env.example`; do not set `PORT` for the Function.

If using GitHub sign-in, create a [GitHub OAuth App](https://github.com/settings/developers) with the exact public callback URL above. Use the stable production domain, not a changing Preview URL.

Deploy the project, then apply the Prisma migrations. From the linked repository root, run:

```sh
vercel env run -e production -- bun run db:deploy
```

Run `db:deploy` after future Prisma migrations as well. If the database provider needs a separate direct migration URL, run `bun run db:deploy` in an environment with that URL set as `DATABASE_URL`.

## 3. Verify

Check `https://YOUR-PROJECT-DOMAIN/api/v1/health` and `/api/v1/health/ready`. Open `/repositories` directly in a fresh tab to check frontend deep links. Paste a public GitHub repository URL and confirm its file tree and first chapter load. If GitHub sign-in is configured, complete the OAuth flow and check `/api/v1/auth/me` on the same domain.

For local Services routing, run `vercel dev -L` from the repository root. Regular `bun run dev` still runs Vite and Express separately; Vite's local `/api` proxy targets `http://localhost:4000` by default.

Preview deployments need Preview database credentials and suitable OAuth settings. A production OAuth callback URL returns users to production. Vercel Functions have execution and connection limits; keep the backend near the database and use a connection pool for production traffic.
