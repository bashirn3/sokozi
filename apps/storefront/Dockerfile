# Next.js storefront.
#
# Built from the repository root, not from this directory:
#
#   docker build -f apps/storefront/Dockerfile \
#     --build-arg NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://<backend> \
#     --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... \
#     -t sokozi-storefront .
#
# Two things about this build that are easy to get wrong:
#
# 1. NEXT_PUBLIC_* variables are inlined at BUILD time, not read at runtime.
#    They have to be present as build args or the image ships with the wrong
#    values baked in. Changing one means rebuilding, not restarting.
#
# 2. The build calls the backend. Category and product pages are prerendered
#    with generateStaticParams, so the backend must be deployed and answering
#    /health before this image is built, or those pages come out empty.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY apps/storefront/package.json apps/storefront/
RUN pnpm install --filter @dtc/storefront... --frozen-lockfile

FROM base AS build
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_REGION=tz
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ARG NEXT_PUBLIC_STRIPE_KEY
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    NEXT_PUBLIC_STRIPE_KEY=$NEXT_PUBLIC_STRIPE_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/storefront/node_modules ./apps/storefront/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY apps/storefront apps/storefront
# check-env-variables.js exits here if the publishable key is missing, with an
# error that does not name the real cause.
RUN pnpm --filter @dtc/storefront build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/apps/storefront

ENV PORT=8000
EXPOSE 8000

# next start honours PORT, which App Service injects.
CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT:-8000}"]
