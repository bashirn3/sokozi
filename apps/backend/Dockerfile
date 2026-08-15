# Medusa backend.
#
# Built from the repository root, not from this directory, because this is a
# pnpm workspace and the lockfile lives at the root:
#
#   docker build -f apps/backend/Dockerfile -t sokozi-backend .
#
# Nothing here is Azure specific. The image runs on any container host.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate
WORKDIR /app

# Dependencies first, so a source change does not reinstall everything.
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY apps/backend/package.json apps/backend/
RUN pnpm install --filter @dtc/backend... --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY apps/backend apps/backend
RUN pnpm --filter @dtc/backend build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app ./

# Medusa serves the store API, the admin dashboard at /app, and /health here.
# App Service injects PORT; 9000 is the local default.
ENV PORT=9000
EXPOSE 9000

# db:migrate also runs the data migration scripts in src/migration-scripts,
# which is where the Sokozi seed lives. Medusa records each one in
# script_migrations, so a fresh database is seeded exactly once and every
# deploy after this is a no-op. Do not add a separate seed step.
CMD ["sh", "-c", "pnpm --filter @dtc/backend exec medusa db:migrate && pnpm --filter @dtc/backend start"]
