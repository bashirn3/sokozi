# Deploying the Sokozi backend

The Medusa backend runs on Render. The storefront runs on Vercel. The backend
cannot run on Vercel: it needs PostgreSQL and a long-running server.

`render.yaml` at the repo root is the blueprint. Everything below is either a
dashboard action or a one-time shell command, because none of it can be
committed safely.

## Before you start

Both the database and the web service are pinned to the **frankfurt** region.
Render cannot change a resource's region after creation. If you create these in
the wrong region the only fix is to delete and recreate them, which means losing
the database.

Both are on paid plans on purpose:

| Resource | Plan | Why not free |
|---|---|---|
| `sokozi-db` | `basic-256mb` | Free Postgres on Render expires and is then deleted. |
| `sokozi-backend` | `starter` | Free web services sleep when idle. The first request after a sleep is slow enough to look broken. |

## The seed runs itself. Do not run it again.

This is the single most important thing on this page.

`startCommand` runs `medusa db:migrate`. In Medusa v2 that command also executes
the data migration scripts in `apps/backend/src/migration-scripts/`, which is
where `initial-data-seed.ts` lives. Medusa records every script it has run in the
`script_migrations` table, so:

- On a **fresh** database the seed runs once, automatically, during the first
  deploy. The Tanzania region, the catalog, the categories, the shipping options
  and the Sokozi Store sales channel are all created for you.
- On **every deploy after that** the seed is skipped, because the table already
  records it.

You do not need to run the seed by hand, and you should not. Running
`medusa exec ./src/migration-scripts/initial-data-seed.ts` or `pnpm backend:seed`
bypasses that tracking table entirely. On an already-seeded database that is a
second run, which duplicates the store, region, sales channel, publishable key
and warehouse before failing on the duplicate product handles.

To confirm the seed landed, open a Render shell and run:

```bash
psql $DATABASE_URL -c "SELECT script_name FROM script_migrations;"
```

`initial-data-seed.ts` should be in the list.

## One-time post-deploy steps

### 1. Wait for the first deploy to go green, then check health

```bash
curl https://<your-backend>.onrender.com/health
```

It must return `200`. If it does not, read the deploy logs before continuing.

### 2. Create the admin user

There is no admin user until you make one. This is the only step the blueprint
cannot do for you.

Generate a password locally, where you can see it and store it:

```bash
openssl rand -base64 32
```

Then, in the Render shell for `sokozi-backend`:

```bash
pnpm --filter @dtc/backend exec medusa user -e admin@sokozi.co.tz -p '<the generated password>'
```

Log in at `https://<your-backend>.onrender.com/app`, then **change the password
from inside the admin immediately**. The value you typed is now in your shell
history and in the Render session log.

### 3. Copy the production publishable key

Admin, then Settings, then Publishable API Keys.

**This key is not the same as your local one.** Every database gets its own. Copy
the production key from the deployed admin, not from your machine.

## Vercel, storefront

- Root directory: `apps/storefront`
- Function region: **`fra1`**

  Set this deliberately. The storefront's data fetching happens server side, so
  every page render is a call from the Vercel function to the Render backend in
  Frankfurt. Putting the functions in Cape Town (`cpt1`) adds a Europe round trip
  to each one. Static assets are served from the CDN edge nearest the visitor
  regardless of where functions run, so Tanzanian visitors still get local
  delivery of the assets. Region selection requires a Vercel Pro plan, which is
  also required because Hobby is licensed for non-commercial use only.

Environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://<your-backend>.onrender.com` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | the production key from step 3 |
| `NEXT_PUBLIC_BASE_URL` | the deployed storefront URL |
| `NEXT_PUBLIC_DEFAULT_REGION` | `tz` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | digits only, including country code |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key |

Note that `MEDUSA_BACKEND_URL` without the `NEXT_PUBLIC_` prefix is **not read by
this storefront**. `src/lib/config.ts` only ever reads
`NEXT_PUBLIC_MEDUSA_BACKEND_URL`. Setting the unprefixed one does nothing. It
appears in some older notes for this project and is a red herring.

## Three traps

### 1. The Vercel build fails without the publishable key

`check-env-variables.js` runs at the top of `next.config.js` and calls
`process.exit(1)` if `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is unset. The build
fails with a missing variable error rather than anything that points at Vercel
configuration. Set the variable before the first deploy.

### 2. The Vercel build needs the backend awake

The storefront prerenders category and product pages at build time using
`generateStaticParams`, which calls the backend. If the backend is asleep,
restarting or unreachable during a Vercel build, those pages come out empty or
the build fails.

Deploy the backend first, confirm `/health`, then deploy the storefront.

### 3. CORS must match the deployed origin exactly

`STORE_CORS`, `ADMIN_CORS` and `AUTH_CORS` in `render.yaml` currently point at
`https://storefront-inky-iota.vercel.app`. If the storefront lands on a different
domain, update all three. No trailing slashes. A mismatch shows up in the browser
as requests failing with no useful error in the UI.

## Deploy order

1. Create the blueprint on Render. Wait for green.
2. `curl https://<backend>/health`
3. Create the admin user, then rotate the password from inside the admin.
4. Copy the production publishable key from `<backend>/app`.
5. Set the Vercel environment variables.
6. Deploy the storefront.
7. Open `https://<storefront>/tz`

## Secrets

`JWT_SECRET` and `COOKIE_SECRET` are generated by Render itself via
`generateValue: true` in `render.yaml`. No human ever sees or pastes them, which
is safer than generating them by hand, and they are never in the repository.

To rotate either one, change the value in the Render dashboard and redeploy.
Rotating `JWT_SECRET` invalidates every existing admin and customer session.
Rotating `COOKIE_SECRET` invalidates existing carts. Neither is destructive to
data, but both log everyone out, so do it deliberately rather than casually.

`STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET` are declared with `sync: false`,
which means Render prompts for them in the dashboard and never reads them from
this file. Do not put key values in `render.yaml`.

## Stripe on the Tanzania region

Registering the Stripe module in `medusa-config.ts` is not enough on its own. The
provider also has to be enabled on the region, and that is a dashboard action:

Admin, then Settings, then Regions, then Tanzania, then enable
`pp_stripe_stripe`.

Until that is done the region only offers `pp_system_default` and the storefront
checkout will not show a card form.

The live webhook secret cannot be issued until the backend has a public URL, so
live keys are necessarily a post-deploy step. Build and verify in test mode
first.

## Product images

No file storage provider is configured. Admin image uploads are written to the
container's local disk, and Render replaces that disk on every deploy and
restart. Uploaded images will disappear.

The seeded products reference Unsplash URLs, so the catalog looks correct without
uploads. **Do not upload product images through the admin until a file provider
such as S3 is configured.** Anything uploaded before then is lost.
