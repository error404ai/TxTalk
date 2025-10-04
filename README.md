yarn dlx turbo build
yarn exec turbo build --filter=docs
yarn exec turbo dev
yarn exec turbo dev --filter=web
yarn exec turbo login
yarn exec turbo link

# solMessage monorepo

Ready-to-build messaging stack powered by Hono, tRPC, TypeORM, and a Vite + TanStack Router frontend. The structure mirrors the `rofasware-turbo-repo` layout, minus the serverless configuration.

## Project layout

| Path            | Description                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `apps/api`      | Hono + tRPC server with TypeORM and MySQL. Exposes routers and types as the `@solmessage/api` workspace package. |
| `apps/frontend` | Vite SSR app (Express server + TanStack Router) wired to the API through a shared tRPC client.                   |
| `packages/*`    | Shared ESLint and TypeScript configurations, plus a UI primitives package.                                       |

## Prerequisites

- Node.js 18+
- pnpm 9+
- MySQL 8 (or compatible)

## Quick start (local tooling)

```bash
pnpm install

# Copy baseline environment variables
cp apps/api/.env.example apps/api/.env
cp apps/frontend/.env.example apps/frontend/.env # optional – create and set VITE_API_URL if you need overrides

# Start the API
pnpm --filter @solmessage/api dev

# In another terminal, start the SSR frontend
pnpm --filter frontend run dev
```

The API listens on `http://localhost:8000` by default. The frontend dev server runs on `http://localhost:5173` and proxies SSR requests through `apps/frontend/server.js`.

## Database

- Connection is managed through TypeORM (`apps/api/src/database.ts`).
- Default credentials target `solmessage_db` on `localhost:3306` with username `root`/`password`.
- Adjust `apps/api/.env` to point at your database. When running locally you can instantly seed a welcome message:

```bash
pnpm --filter @solmessage/api db:seed
```

## tRPC integration

- Public procedures live in `apps/api/src/routers`.
- Client-side hooks are generated via `@solmessage/api/router` and consumed in the frontend (`apps/frontend/src/trpc`).
- `HydrationBoundary` + React Query ensures SSR data hydration works out of the box.

## Useful scripts

| Command                               | Description                                               |
| ------------------------------------- | --------------------------------------------------------- |
| `pnpm --filter @solmessage/api dev`   | Start the Hono API with automatic reload (`tsx --watch`). |
| `pnpm --filter @solmessage/api build` | Build the API package and emit types for consumers.       |
| `pnpm --filter frontend run dev`      | Launch the Vite SSR dev server.                           |
| `pnpm --filter frontend run build`    | Produce client + server bundles for the frontend.         |
| `pnpm turbo run build`                | Build all apps and packages with caching enabled.         |

## Docker usage

### Development stack

Spin up the entire stack (API, SSR frontend, MySQL, phpMyAdmin) with hot reload:

```bash
docker compose up --build
```

- API: <http://localhost:8000>
- Frontend SSR: <http://localhost:5173>
- phpMyAdmin: <http://localhost:8080> (default credentials `root` / `password`)

The dev compose file mounts your working tree into the containers while keeping dependencies inside named volumes, so code changes take effect immediately.

### Production stack

Build and run optimized images locally:

```bash
docker compose -f docker-compose-prod.yml up --build -d
```

Exposed endpoints:

- API: <http://localhost:8000>
- Frontend: <http://localhost:4173>
- phpMyAdmin: <http://localhost:8080>

Override credentials and ports via environment variables defined in `docker-compose-prod.yml` when deploying.

## Environment reference

| Variable                                                  | Where                | Purpose                                                     |
| --------------------------------------------------------- | -------------------- | ----------------------------------------------------------- |
| `PORT`                                                    | `apps/api/.env`      | API HTTP port (defaults to `8000`).                         |
| `VITE_APP_URL`                                            | `apps/api/.env`      | Allowed CORS origin for the frontend app.                   |
| `CORS_ORIGINS`                                            | `apps/api/.env`      | Optional comma-separated origins overriding `VITE_APP_URL`. |
| `DB_HOST`/`DB_PORT`/`DB_USERNAME`/`DB_PASSWORD`/`DB_NAME` | `apps/api/.env`      | MySQL connection parameters.                                |
| `API_URL`                                                 | `apps/frontend/.env` | SSR fetch base URL used by the frontend server.             |
| `VITE_API_URL`                                            | `apps/frontend/.env` | Browser fetch base URL used by the client bundle.           |

## Next steps

- Add authentication middleware and swap the seed data for your real domain models.
- Create additional routers under `apps/api/src/routers` and reuse their types in the frontend via `@solmessage/api/router`.
- Wire up automated migrations once you disable `synchronize` in `database.ts` for production deployments.
