# Sokozi

**Soko Yako Mkononi** — a mobile-first ecommerce marketplace for Tanzania, built on [Medusa](https://medusajs.com) with the Next.js starter storefront.

## What's included

- **Backend** (`apps/backend`) — Medusa commerce engine with Tanzania region, TZS currency, and seeded catalog
- **Storefront** (`apps/storefront`) — Mobile-first Next.js shop with Sokozi branding
- **Products** — Electronics, Fashion, Home categories with prices from your business plan (TZS)
- **Shipping** — City delivery TZS 5,000 / Express TZS 8,000
- **UI features** — Search, Today's Deals carousel, TikTok-style product feed, WhatsApp order button, M-Pesa placeholder

## Prerequisites

- Node.js 20–24 (Node 25+ is not supported)
- PostgreSQL running locally
- pnpm

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

## Deploy to Medusa Cloud

1. Install the Cloud CLI: `npm install -g @medusajs/mcloud`
2. Sign up / log in: `mcloud signup` then `mcloud login`
3. Push this repo to GitHub
4. Create a project at [cloud.medusajs.com](https://cloud.medusajs.com):
   - **Project root**: `apps/backend`
   - **Storefront root**: `apps/storefront`
   - **Region**: `ap-southeast-1` (closest to Tanzania)
   - **Subdomain**: e.g. `sokozi-store`

See [Medusa Cloud docs](https://docs.medusajs.com/cloud/projects).

## Next steps

- Connect real M-Pesa / Airtel Money / Tigo Pesa payment providers
- Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to your business WhatsApp
- Upload product photos and videos in the admin dashboard
- Add Beauty category products

## Catalog (TZS)

| Category | Products |
|----------|----------|
| Electronics | Earbuds 25,000 · Charger 10,000 · Power bank 35,000 · LED lights 15,000 |
| Fashion | T-shirt 15,000 · Cap 10,000 · Sneakers 60,000 |
| Home | Blender 45,000 · Containers 20,000 |
