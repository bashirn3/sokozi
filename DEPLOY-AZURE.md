# Deploying Sokozi to Azure

This replaces the earlier Render plan. `render.yaml` and `DEPLOY-BACKEND.md` were
removed when the target changed.

**Status: deployed and serving.**

| | |
|---|---|
| Storefront | https://sokozi-storefront-bashir.azurewebsites.net/tz |
| Admin | https://sokozi-backend-bashir.azurewebsites.net/app |
| Resource group | `swe` (shared, pre-existing) |
| Region | South Africa North |

Read [the deployment record](#what-actually-happened) before running the scripts
again. Six defects only appeared when the scripts were run against real Azure,
and each one reported success while leaving something broken.

## What actually happened

**The resource group could not be created.** The account holds no permissions at
subscription scope and full rights inside five existing groups, so `az group
create` is forbidden while everything inside a group is allowed. The scripts now
reuse an existing group; pass `RG=` to choose one. `az group exists` is useless
for the check, returning Forbidden rather than false.

**The registry landed in the wrong region.** `az acr create` without `-l` inherits
the resource group's region, so reusing a group made for something else put the
registry an ocean away from everything else.

**`--database-name` became an error.** It now applies only to elastic clusters.
The database is created as its own step.

**`az webapp create` produced an app that could not pull its image.** It prepends
the registry host to an image name that already carries it, giving
`acr.io/acr.io/image:tag`, and does not persist the registry credentials at all.
Both are set explicitly after creation. It also crashes after succeeding, on some
CLI builds, while fetching a publish profile, so its exit code means nothing.

**The backend crash looped while looking healthy.** `medusa build` emits a
self-contained server into `.medusa/server`, and it has to be started from
inside that directory. Started from the source directory it migrates
successfully, fails to find the admin's `index.html`, and exits. Migrations
succeeded on every loop, so the database looked perfectly fine while nothing
served a request.

**The storefront served 503 with a correct bundle.** `ENV` does not cross a
Docker stage boundary, and `check-env-variables.js` runs on every start rather
than only during the build. The `NEXT_PUBLIC_*` values were inlined correctly and
the process still exited immediately. The runner stage now redeclares them.

**Stripe was registered but not linked to the region.** The seed created the
region before Stripe existed as a provider, so checkout offered only the system
provider. Verify with `/store/payment-providers?region_id=...`, not by checking
that the provider exists.

## The principle this plan is built on

Sokozi is an MVP that may not survive contact with customers. So the rule is:
**nothing Azure specific in the code.** If the product stops, you have spent
credits rather than engineering time. If it grows and outgrows Azure, you move
without a rewrite.

That rule is why the plan below skips a custom Azure Blob storage provider, which
would be roughly half a day of code that only ever runs on Azure.

## Architecture

| Piece | Azure service | Notes |
|---|---|---|
| Backend, Medusa | App Service, Linux container | Long running Node 22, always on |
| Storefront, Next.js | App Service, Linux container | Server rendered, needs a Node process |
| Database | PostgreSQL Flexible Server, Burstable B1ms | Postgres 15 or newer |
| Redis | **skipped for MVP** | See below |
| Product images | **open decision** | See below |

**Region: South Africa North, Johannesburg.** It is the Azure region closest to
Dar es Salaam. Put every resource in it. Cross region database calls would be
paid on every page render.

**Both apps share one App Service Plan.** A plan hosts multiple apps, so one B1
instance serves the backend and the storefront rather than paying for two.

### Why containers rather than source deploys

App Service's Oryx builder does not understand pnpm workspaces well, and this is a
pnpm Turborepo. A Dockerfile per app is far more predictable, and the images are
portable to anything that runs containers.

### Why Redis is skipped

Medusa logs `redisUrl not found. A fake redis instance will be used` and warns
that the local event bus is not for production. That warning is about running
**more than one instance**. On a single always on instance the in memory event
bus and workflow engine behave correctly.

Skipping it removes a service, its cost, and its configuration. Add
`@medusajs/medusa/event-bus-redis` and `workflow-engine-redis`, both of which
already ship with Medusa, on the day you scale past one replica. Not before.

## Open decision: product images

No file provider is configured, so admin uploads currently write to the
container's local disk and disappear on the next deploy.

Azure Blob Storage is **not S3 compatible**, and Medusa 2.18 ships only
`file-local` and `file-s3`. There is no Azure provider.

| Option | Effort | Cost | If the product stops |
|---|---|---|---|
| Custom Azure Blob provider | About half a day | Credits | Half a day gone, code useless elsewhere |
| **`file-s3` pointed at Cloudflare R2** | **About 20 minutes** | **Free tier** | 20 minutes gone, config is portable |
| Keep pasting image URLs | None | Free | Nothing gone, upload stays broken |

**Recommended: R2.** `file-s3` already ships with Medusa, so this is configuration
rather than code, and the same configuration points at AWS S3 or Backblaze later.

The argument against pasting URLs is not technical. The shop owner photographs
stock on a phone. URL only means uploading somewhere else first and fetching a
public link, on a phone. Twenty minutes buys a working upload button for the
person who uses this every day.

## Rough monthly cost

Estimates. Confirm in the Azure pricing calculator for South Africa North before
relying on them.

| | |
|---|---|
| App Service Plan B1, both apps | about 13 USD |
| PostgreSQL Flexible Server, Burstable B1ms | about 12 to 15 USD |
| Redis | 0, skipped |
| Cloudflare R2 | 0 on the free tier |
| **Total** | **about 25 to 30 USD per month** |

**Known risk.** B1 is one core and 1.75 GB shared between a Medusa backend and a
Next.js server. That is tight. If it runs out of memory the fix is moving to B2,
roughly double, not re architecting. It is a cheap mistake to make and to undo.

## Phases

| | Work | Owner |
|---|---|---|
| 1 | Two Dockerfiles, R2 configuration, env templates, this document | Repo work, about 2 hours |
| 2 | Resource group, Postgres, App Service Plan, two web apps | Azure portal or `az` CLI |
| 3 | Backend deploy, admin user, publishable key | Both |
| 4 | Storefront deploy, CORS pointed at real domains | Both |
| 5 | Run the end to end test plan against the deployed site | Manual |

## Traps that will cost time otherwise

### Azure Postgres requires SSL

`DATABASE_URL` needs `?sslmode=require`. Medusa's driver may also need
`rejectUnauthorized: false` for the Azure certificate authority. Expect one round
of connection debugging on first deploy.

### The seed runs itself, so do not run it by hand

`medusa db:migrate` also executes the data migration scripts in
`src/migration-scripts/`, which is where the Sokozi seed lives, and Medusa records
each one in the `script_migrations` table. A fresh database is seeded
automatically on first start, and skipped on every deploy after.

Running `medusa exec ./src/migration-scripts/initial-data-seed.ts` or
`pnpm backend:seed` bypasses that tracking. On an already seeded database that is
a second run, which duplicates the store, region, sales channel, publishable key
and warehouse before failing on duplicate product handles.

There is a guard in the seed that catches this, but do not rely on it. Just do not
run it.

To confirm the seed landed:

```bash
psql "$DATABASE_URL" -c "SELECT script_name FROM script_migrations;"
```

### The admin user has to be created by hand

There is no admin user until you make one. Generate a password where you can see
it:

```bash
openssl rand -base64 32
```

Then, in a shell on the backend container:

```bash
pnpm --filter @dtc/backend exec medusa user -e admin@sokozi.co.tz -p '<generated>'
```

Log in at `https://<backend>/app` and **change the password from inside the admin
immediately**. The value you typed is now in your shell history.

### The publishable key differs per database

Every database issues its own. Take it from the deployed admin under Settings,
Publishable API Keys. Never reuse the local one.

### The storefront build calls the backend

Category and product pages are prerendered with `generateStaticParams`, which
calls the backend at build time. If the backend is down or restarting, those pages
build empty or the build fails.

Deploy the backend first, confirm `/health`, then build the storefront.

### The storefront build fails without the publishable key

`check-env-variables.js` runs at the top of `next.config.js` and exits if
`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is unset. The error does not point at the
real cause. Set it before the first storefront build.

### CORS must match the deployed origins exactly

`STORE_CORS`, `ADMIN_CORS` and `AUTH_CORS` need the real Azure domains, no
trailing slashes. A mismatch shows up in the browser as requests failing with
nothing useful in the UI.

### Node 22

Not 25. Pin it in the Dockerfiles.

## Environment variables

Backend:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Include `?sslmode=require` |
| `JWT_SECRET`, `COOKIE_SECRET` | `openssl rand -base64 32` each, set in app settings, never committed |
| `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` | Exact deployed origins |
| `STRIPE_API_KEY` | Test key until go live |
| `STRIPE_WEBHOOK_SECRET` | Cannot be issued until the backend has a public URL |

Storefront:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | The deployed backend URL |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | From the deployed admin, not local |
| `NEXT_PUBLIC_BASE_URL` | The deployed storefront URL |
| `NEXT_PUBLIC_DEFAULT_REGION` | `tz` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Digits only. Blank hides the button |
| `NEXT_PUBLIC_STRIPE_KEY` | Publishable key |

`MEDUSA_BACKEND_URL` without the `NEXT_PUBLIC_` prefix is **never read** by this
storefront. `src/lib/config.ts` only reads the prefixed one. It appears in older
notes for this project and is a red herring.

## Deferred

Redis, a custom Azure Blob provider, autoscaling, a staging environment, VNet
integration, and a CI/CD pipeline. Deploy by pushing an image. Automate it when
the product has earned the automation.
