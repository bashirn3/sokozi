# Sokozi

**Soko Yako Mkononi** — a mobile-first ecommerce store for Tanzania, built on [Medusa](https://medusajs.com) with the Next.js starter storefront.

## What's included

- **Backend** (`apps/backend`) — Medusa commerce engine with Tanzania region, TZS currency, and seeded catalog
- **Storefront** (`apps/storefront`) — Mobile-first Next.js shop with Sokozi branding
- **Products** — Electronics, Fashion, Home and Beauty categories, priced in TZS
- **Shipping** — City delivery TZS 5,000 / Express TZS 8,000
- **UI features** — Product search, Today's Deals rail, horizontal product feed, and a WhatsApp order button that appears only when a number is configured

## Prerequisites

- Node.js 20 to 22 (Node 25 is not supported)
- PostgreSQL 15 or newer, running locally
- pnpm 10.29.1 (`corepack enable`)

Copy `apps/backend/.env.template` to `apps/backend/.env` and
`apps/storefront/.env.template` to `apps/storefront/.env.local`, then fill them
in. The storefront build exits with a missing variable error if
`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is unset.

## Local development

```bash
cd sokozi

# Terminal 1 — backend
cd apps/backend && pnpm dev

# Terminal 2 — storefront
cd apps/storefront && pnpm dev
```

| Service | URL |
|---------|-----|
| Storefront | http://localhost:8000 |
| Admin | http://localhost:9000/app |
| API | http://localhost:9000 |

**Admin login**

- Email: `admin@sokozi.co.tz`
- Password: `supersecret`

## Deploy

The backend runs on Render and the storefront on Vercel. The backend cannot run
on Vercel: it needs PostgreSQL and a long-running server.

`render.yaml` is the blueprint. See [DEPLOY-BACKEND.md](./DEPLOY-BACKEND.md) for
the full procedure, including the one-time admin user step and the reason you
must not run the seed by hand.

## Next steps

- Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to the business WhatsApp number
- Configure a file storage provider before uploading product images. Without
  one, admin uploads are written to local disk and vanish on the next deploy.
- Replace the Unsplash placeholder images with real product photography

## Catalog (TZS)

| Category | Products |
|----------|----------|
| Electronics | Earbuds 25,000 · Charger 10,000 · Power bank 35,000 · LED lights 15,000 |
| Fashion | T-shirt 15,000 · Cap 10,000 · Sneakers 60,000 |
| Home | Blender 45,000 · Containers 20,000 |
| Beauty | Shea butter moisturizer 12,000 |
