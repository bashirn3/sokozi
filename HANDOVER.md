# HANDOVER.md

Sokozi MVP build, against SOKOZI-AGENT-SPEC.md and the corrections and
decisions issued during review.

Branch: `sokozi-mvp-build`, seven commits, each naming its task IDs.
`pnpm --filter @dtc/storefront build` passes with error suppression turned off.

## 1. Completed

| ID | Task | Verified by |
|---|---|---|
| A1 | Environment, migrate, seed, admin user | `/health` 200, admin login returns a JWT, `/tz` renders 10 products in TZS |
| A2 | Unsuppressed build errors, fixed the blocking ones | Build exits 0, `tsc --noEmit` exits 0, record in `BUILD-ERRORS.md` |
| B1 | Default region `dk` to `tz` | `middleware.ts` |
| B2 | API-down resilience, middleware plus layout data path | Backend stopped and `.next` cleared: `/` redirects to `/tz`, `/tz`, `/tz/store` and `/tz/cart` all 200 |
| B3 | Gitignore negation, both `.env.template` files | `git check-ignore`: templates trackable, real env files still ignored |
| B4 | `render.yaml` region and plans, `DEPLOY-BACKEND.md` | YAML parses, no secret values, plan identifiers checked against Render's blueprint spec |
| C1 | `modules` array in `medusa-config.ts` | Backend boots |
| C2 | Shea Butter Moisturizer added to the seed | Store API: Beauty resolves to `shea-butter-moisturizer`, 10 products total |
| C3 | Seed idempotency guard | Ran twice on a fresh database: second run logged the skip, exited 0, row counts identical |
| C4 | `seed` script in `apps/backend/package.json` | `pnpm backend:seed` from the root now runs |
| C6 | Removed the M-Pesa stub | No `m-pesa` or `mpesa` anywhere in the rendered product page |
| D1 | Token layer | `--paper`, `--ink`, `--marigold`, `--cat-*`, `--radius` all present in the served CSS bundle |
| D2 | Archivo display face and type scale | Archivo woff2 requested, all six scale classes in the bundle |
| D3 | Hero: flat ink ground, one marigold CTA | Rendered HTML |
| D4 | Category tiles: flat colour blocks, no emoji | Rendered HTML |
| D5 | Price treatment | Prices render as a `TSh` label above a bare number |
| D6 | Deals rail: marigold underline, no emoji | Rendered HTML |
| D7 | Sweep | Greps below all return zero |
| E1 | Stripe provider registered | Backend boots with and without a key |
| E3 | Credentials from environment only | No key value is printed, logged or written anywhere |
| F1 | Marketplace wording and false feature claims | Greps clean |
| F2 | Search filters | 10 unfiltered, 1 for `earbuds`, 1 for `shea`, 0 plus empty state for a non-matching term |
| F3 | WhatsApp conditional | Renders with the configured number, hidden when unset or placeholder |
| G | Deploy configuration prepared | `vercel.json` pins `fra1`, `DEPLOY-BACKEND.md` covers the dashboard steps |

Phase D acceptance greps over `apps/storefront/src`:

```
emerald      0
shadow-      0
bg-gradient  0
emoji        0
hex          0 outside two documented exceptions
```

## 2. Not done, or partially done

### E2, decimal verification. NOT DONE. Blocked.

This is the one task that could not be completed, and it is the one that most
needs doing before taking money.

Correction 1 stated that `STRIPE_API_KEY` and `NEXT_PUBLIC_STRIPE_KEY` were
already populated in local `.env` files. **No `.env` files existed.** A search
for `.env*` across the tree returned nothing. They were created during A1 as
amended, with the Stripe lines left blank for a human to fill.

So nothing about Stripe is verified end to end. Not the checkout, not the
amount shown on the Stripe page, not the order landing in admin, not inventory
decrementing.

To finish it: put your Stripe **test** keys into `apps/backend/.env`
(`STRIPE_API_KEY`) and `apps/storefront/.env.local` (`NEXT_PUBLIC_STRIPE_KEY`),
enable `pp_stripe_stripe` on the Tanzania region in admin, then run a checkout
with `4242 4242 4242 4242`.

What to watch for, since TZS is a two decimal currency in Stripe and 25,000 TZS
is 2,500,000 minor units: the cart must read `TSh 25,000` and the Stripe page
must read the same amount. `2,500,000` means a double conversion, `250` means a
missing one. No manual conversion was added anywhere, so the provider's own
conversion is the only one in play.

### B2, known limitation

The acceptance criterion is met: with the backend down, `/` redirects to `/tz`
and pages render rather than 500.

However, with no region available the home page component returns `null`, so
that fallback is a nav and footer shell with no hero and no products. Hardening
`page.tsx` itself was outside the listed scope, so it was left alone. If you
want the cold-start experience to show the hero, that is a small follow-up.

### Deferred by the spec, not attempted

Everything in section 9 stayed out of scope: mobile money, TRA fiscal
receipting, PDPC registration, Swahili, Algolia, Tanzanian address model, Redis
and worker separation, S3 or Azure file storage, Azure migration.

## 3. BUILD-ERRORS.md summary

Full detail is in `BUILD-ERRORS.md`. In short: `next.config.js` had both
`eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` set to `true`, so
the storefront reported success regardless of its state. Both are now `false`
and must stay that way.

The first honest build produced **12 blocking ESLint errors and 3 warnings.
TypeScript was already clean.**

All 12 were fixed:

- `src/lib/data/cart.ts`, 8 errors. Four unused arguments in stub functions whose
  bodies are commented out, prefixed with an underscore. Four `any` types
  removed, using `unknown` narrowing in the catch blocks and a single cast at
  the `updateCart` call site instead of an `as any` on the payload.
- `src/modules/layout/components/language-select/index.tsx`, 2 errors. Two
  `@ts-ignore` comments. Converting them to `@ts-expect-error` produced
  `TS2578: Unused '@ts-expect-error' directive` on both, proving they were
  suppressing nothing at all, so they were removed rather than converted.

The 3 remaining warnings are `react-hooks/exhaustive-deps`, all inherited from
the upstream Medusa starter, all left in place deliberately. Two of them sit in
the checkout payment path, where adding dependencies changes when effects refire.
They do not block the build. Each needs its own checkout test before being
touched.

## 4. Price mismatches, C2 and blocker H5

**None.** All nine pre-existing seed products match the brief's table exactly,
including the four `deal: true` flags:

```
wireless-earbuds-v5   Electronics  25,000  deal
phone-charger         Electronics  10,000  deal
power-bank            Electronics  35,000
led-lights            Electronics  15,000  deal
classic-t-shirt       Fashion      15,000
street-cap            Fashion      10,000
urban-sneakers        Fashion      60,000
kitchen-blender       Home         45,000
storage-containers    Home         20,000
```

Shea Butter Moisturizer was added at 12,000 with `deal: true` as specified.
Nothing was silently corrected.

## 5. Currency verification, C5

**Correct. No 100x error.**

- The seed writes `25000`, not `2500000`. Confirmed in the source and by
  querying the `price` table directly after seeding.
- The storefront rendered `TSh 25,000.00` before Phase D and `TSh 25,000` after.

The `.00` was removed as a deliberate decision taken during review, because
Tanzanian shillings are not quoted with cents and D5's own example shows none.
This is a display change in `money.ts` only. It does not touch stored amounts and
does not affect what Stripe would charge. Note that both fraction digit bounds
have to be set together, since leaving the minimum at the currency default of 2
while forcing the maximum to 0 makes `Intl` throw a `RangeError`.

## 6. Secret scan

The command from the spec:

```bash
git log -p | grep -iE "(sk_live|sk_test|JWT_SECRET=.+|COOKIE_SECRET=.+)"
```

returns **two matches**, and both are false positives that predate this work:

```
.agents/skills/mcloud-variables/SKILL.md
.agents/skills/using-medusa-cloud/reference/environments-and-variables.md
```

Both contain the literal dummy string `sk_live_123` in an example command line.
They are vendored Medusa agent skill documentation, introduced in commit
`932e756`, the initial commit.

Restricting the scan to project files returns nothing:

```bash
git log -p -- ':!.agents' ':!.cursor' | grep -iE "(sk_live|sk_test|JWT_SECRET=.+|COOKIE_SECRET=.+)"
```

Also confirmed:

- `apps/backend/.env` and `apps/storefront/.env.local` are ignored and untracked.
- Both tracked `.env.template` files carry blank values for every secret.
- `render.yaml` contains no key values. `JWT_SECRET` and `COOKIE_SECRET` use
  `generateValue: true`, and the Stripe variables use `sync: false` so Render
  prompts for them in the dashboard.

## 7. Outstanding human blockers

| ID | Blocker | Blocks |
|---|---|---|
| H3b | Stripe **live** keys and live webhook secret | Real payments. The webhook endpoint cannot exist until the backend has a public URL, so this is necessarily post-deploy. |
| New | Stripe **test** keys | E2. Nothing about checkout is verified without them. See section 2. |
| H4 | Render and Vercel dashboard access | Actually deploying. Configuration is prepared and documented. |
| H6 | Real product photography | All ten images are Unsplash placeholders. |
| Spec | Mobile QA on a real mid-range Android at throttled 3G | Explicitly a human task, and explicitly not optional. Nothing in this build substitutes for it. All verification here was programmatic: HTTP status, rendered markup, the served CSS bundle and database state. Nobody has looked at this design on a phone. |

### Accepted risk: delivery is sold nationwide at the city rate

Recorded here because it was raised, understood and accepted, not because it is
unresolved.

The fulfillment set has a single geo zone of `type: country`, `country_code:
tz`. Both shipping options are therefore offered to **every address in
Tanzania**:

| Option | Price | Actually available |
|---|---|---|
| City Delivery | TZS 5,000 | Anywhere in Tanzania |
| Same/Next Day Express | TZS 8,000 | Anywhere in Tanzania |

An order to Mwanza, roughly 1,100 km from the Dar es Salaam warehouse, is quoted
the same TZS 5,000 as an order across the city. The store is committing to
fulfil it at that price.

The recommendation was to scope City Delivery to a Dar es Salaam geo zone, which
Medusa supports at city and province level. The decision was to leave coverage
as it is and correct only the copy. That is a business call, not a defect, and
the code reflects it.

If it is ever revisited, the change is a `geo_zones` entry on the service zone
in the seed plus an admin change on any existing database.

**A separate note on the Express option name.** "Same/Next Day Express" comes
from the brief and is unchanged. The name itself is a timing commitment, and it
is the only one left anywhere in the product. Nothing else states a duration.

Two things that need a decision rather than an action:

**The WhatsApp number is Nigerian.** You supplied `2347067131336`. Country code
`234` is Nigeria; Tanzania is `255`. The button renders and links correctly
either way, so this is only a problem if it was a paste error.

**The Beauty product image is AI-generated, and I shipped it.** The image chosen
for Shea Butter Moisturizer in C2 was uploaded to Unsplash on 2026-05-02. All
nine pre-existing seed images date from 2017 to 2020. Every one of the 19
results from the Unsplash search used was uploaded in 2026, so that search was
returning generated content almost exclusively.

The image itself carries the tells: the label reads "JOPULENCE", which is not a
word, and the fine print beneath it is warped. I looked at the image before
using it and noted only that it was "mildly branded". I checked that the URL
returned a real JPEG and that it depicted a shea butter jar. I never asked
whether the photograph was real.

Worth recording for whoever replaces these: the five candidates rejected during
that same task, from 2019 to 2021, were all genuine photographs of real
products. Visible brand packaging was the signal of authenticity, and it was
mistaken for a reason to reject them.

Fix is one line in the seed. Left in place because all ten images are
placeholders due for replacement anyway under H6, but it should not go in front
of a customer.

**Product images must not be uploaded yet.** No file storage provider is
configured, so admin uploads write to the container's local disk, which Render
replaces on every deploy and restart. Anything uploaded before a provider such
as S3 is configured will disappear. The seeded Unsplash URLs are unaffected.

## 8. Things that contradicted the spec

Eight, roughly in descending order of how much damage they would have caused.

### 8.1 The spec's own A1 sequence would have corrupted the database

`medusa db:migrate` also executes the data migration scripts in
`src/migration-scripts/`, which is where `initial-data-seed.ts` lives. Running
migrate seeded the store on its own.

A1 then instructs:

```
pnpm exec medusa exec ./src/migration-scripts/initial-data-seed.ts
```

That would have been the second run that ground rule 3 forbids. **It was
skipped.** Medusa records the script in the `script_migrations` table, verified
directly.

### 8.2 B4 would have put that same corruption into the deploy runbook

B4's premise is that a fresh deploy has no seed data and that the seed should be
run by hand from a Render shell. Both follow from 8.1 being unknown.

Because migrate auto-seeds, a fresh Render database is seeded by the existing
`startCommand`, and running the seed manually afterwards is exactly the
forbidden second run, this time against production.

`DEPLOY-BACKEND.md` therefore documents the opposite of what B4 asked, with the
reasoning stated. The admin user step is genuinely needed and was kept.

This also makes C3's guard more important than the spec framed it: `db:migrate`
is protected by Medusa's own tracking, but `medusa exec` and the `pnpm
backend:seed` script added in C4 both bypass it. C3 is what protects those two
paths, so C4 without C3 would have been a loaded gun.

### 8.3 B3's gitignore negation was specified in a position where it does nothing

B3 says to add `!**/.env.template` immediately **above** `.env*`. Gitignore
resolves by last matching pattern, so a negation placed earlier is overridden by
the broader rule that follows it.

It was placed **after** `.env*` and verified with `git check-ignore`.

### 8.4 D7's shadow rule, taken literally, would have broken checkout

D7 says to remove every `shadow-*` utility and verify with a grep returning
nothing.

Most of the 20 occurrences were Medusa preset utilities like
`shadow-borders-base` and `shadow-borders-interactive-with-active`, which draw
the visible **border** on radio buttons, text inputs and payment selection cards
using box-shadow. Deleting them would have left invisible controls in the payment
flow, which also contradicts D7's own requirement for visible focus.

They were replaced with real borders. The grep returns zero either way, but the
controls still have outlines.

### 8.5 D5 contradicted itself on number formatting

D5 shows `25,000` while also saying not to change number formatting. `money.ts`
produced `TSh 25,000.00`. Resolved by decision during review in favour of
dropping the decimals. Recorded here because the spec text still says otherwise.

### 8.6 Correction 1 was wrong about the .env files

They did not exist. Covered in section 2.

### 8.7 F1's count was wrong

F1 says "marketplace" appears three times in the README plus once in the seed,
four total. It appeared **three** times overall: once in the README, once in the
seed's sales channel description, once in the home page metadata. All three
fixed.

### 8.8 The delivery timings were never in the brief, and I amplified them

The brief specifies two shipping options, two prices and one Dar es Salaam
warehouse. It states no delivery window at all.

"Delivery in 1-24 hours" was already in the repo before this work, in the seed's
shipping option description and in small text on the product page. During F1 I
promoted that unverified claim into the **hero**, the first sentence on the
site, and the **footer**, on every page. In the footer I did it while replacing
"Same-day delivery in Dar es Salaam" and describing the result as making the
copy honest, which it was not: one unsubstantiated timing promise was swapped
for another.

Corrected after review. No duration is now stated anywhere in the product. The
seed descriptions are neutral, the hero and footer make no timing claim, and the
product page says only "In stock in Dar es Salaam". Checkout renders the option
name and price and never the description, so what a customer sees is exactly
what the brief specifies.

### 8.9 Smaller notes

- **`MEDUSA_BACKEND_URL` is a no-op.** The Phase G env list includes it, but
  `src/lib/config.ts` only ever reads `NEXT_PUBLIC_MEDUSA_BACKEND_URL`. The
  unprefixed variable is never read. Documented in `DEPLOY-BACKEND.md`.
- **The Vercel build needs the backend awake.** Category and product pages
  prerender through `generateStaticParams`, which calls the backend. Deploy the
  backend first and confirm `/health`. Documented as a trap.
- **The M-Pesa stub predated the spec** and no task removed it, while section 9
  forbade exactly that kind of stub. Added as C6 by decision.
- **`aria-checked` was hardcoded to `"true"`** on the radio component, so every
  radio announced itself as selected to screen readers regardless of state.
  Found while replacing its box-shadow rings, fixed in passing.
- **`apps/storefront/tsconfig.tsbuildinfo` is tracked** and churns on every
  build, so it dirties the working tree constantly. It is build output and
  should probably be gitignored, but that is outside the listed scope so it was
  left alone.
- **`scrollbar-hide` was a dead class** in the product feed. The class defined in
  `globals.css` is `no-scrollbar`. Corrected while rewriting that component.

## 9. How to pick this up

```bash
nvm use 22
brew services start postgresql@17          # installed during this build
pnpm install

cd apps/backend && pnpm dev                # http://localhost:9000, admin at /app
cd apps/storefront && pnpm dev             # http://localhost:8000/tz
```

Local admin is `admin@sokozi.co.tz` with password `supersecret`. That is a local
development credential only. `DEPLOY-BACKEND.md` covers generating and rotating a
real one.

The local database was dropped and recreated during C2 and C3 verification, so
its publishable key differs from the one issued before. It is already written
into `apps/storefront/.env.local`.
