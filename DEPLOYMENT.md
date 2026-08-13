# Deployment

This is a TanStack Start app built with Vite + Nitro, so it can be deployed to
any platform Nitro supports. The build auto-detects the target from the hosting
platform's environment; you can always override it with `NITRO_PRESET`.

## 1. Required environment variables

Set these in your platform's dashboard (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `EXTERNAL_SUPABASE_URL` | Supabase project URL used by the CMS |
| `EXTERNAL_SUPABASE_ANON_KEY` | Supabase anon key |
| `SESSION_SECRET` | Encrypts the admin session cookie (32+ chars) |
| `SITE_ADMIN_PASSWORD` | Password for the admin area |

They are read lazily inside server functions, so a missing value never breaks
the build - only the feature that needs it.

## 2. Build commands per platform

| Platform | Build command | Output |
| --- | --- | --- |
| Lovable / Cloudflare Workers | `npm run build` | `dist/server` |
| Vercel | `npm run build` (auto-detected) | `.vercel/output` |
| Netlify | `npm run build` (auto-detected) | `.netlify` |
| Node (VPS, Docker, Render, Railway, Fly) | `npm run build` (default outside Lovable) | `.output/server/index.mjs` |
| Bun | `npm run build:bun` | `.output/server/index.mjs` |
| Deno Deploy | `npm run build:deno` | `.output/server` |
| Any other Nitro preset | `NITRO_PRESET=<preset> npm run build` | preset-specific |

Node version: 20 or newer (see `engines` in `package.json`).

### Self-hosted Node

```bash
npm ci
npm run build
node .output/server/index.mjs   # listens on $PORT (default 3000)
```

### Docker

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

## 3. Routing

Routes are server-rendered, so no `_redirects` / `vercel.json` rewrite rules are
needed. Do not add `BrowserRouter` or `HashRouter`.

## 4. Notes

- The admin session cookie is `secure`, so the deployed site must be served over
  HTTPS (every platform above does this by default).
- Do not commit a real `.env` file; use platform secrets instead.

## 5. Render (web service)

Render builds fine but the *deploy/start* step fails when the build targets
Cloudflare (output `dist/server`, no `.output/server/index.mjs`). Use the Node
preset so Render gets a real Node server to start:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build command | `npm install && npm run build` |
| Start command | `npm start` (`node .output/server/index.mjs`) |
| Health check path | `/` |
| `NODE_VERSION` | `22` |

Add `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_ANON_KEY`, `SESSION_SECRET`
and `SITE_ADMIN_PASSWORD` in the service's Environment tab.

`render.yaml` in the repo root already encodes all of this — in Render choose
**New > Blueprint**, point it at this repo, then fill in the four secret
values.

The server binds to `$PORT` automatically; do not hardcode a port.
