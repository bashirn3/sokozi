# BUILD-ERRORS.md

Diagnostic record for task A2.

`apps/storefront/next.config.js` had `eslint.ignoreDuringBuilds` and
`typescript.ignoreBuildErrors` both set to `true`, so the storefront reported a
successful build regardless of what was wrong with it. Both are now `false` and
must stay that way.

This file records everything that surfaced on the first honest build.

## Summary

| Category | Count | Blocking | Status |
|---|---|---|---|
| TypeScript errors | 0 | n/a | Clean, verified with `tsc --noEmit` |
| ESLint errors | 12 | yes | All fixed |
| ESLint warnings | 3 | no | Left in place, see below |

The build passes with both flags at `false`.

## Blocking errors found, and how each was fixed

### src/lib/data/cart.ts

Eight errors, all in dead or loosely typed code that the suppression had been
hiding.

| Line | Rule | Original | Fix |
|---|---|---|---|
| 281 | no-unused-vars | `applyGiftCard(code: string)` | Renamed to `_code`. The whole function body is commented out. |
| 293 | no-unused-vars | `removeDiscount(code: string)` | Renamed to `_code`. Body commented out. |
| 305 | no-unused-vars | `removeGiftCard(codeToRemove: string, ...)` | Renamed to `_codeToRemove`. Body commented out. |
| 306 | no-unused-vars | `giftCards: any[]` | Renamed to `_giftCards`. |
| 306 | no-explicit-any | `giftCards: any[]` | Retyped `unknown[]`. |
| 331 | no-explicit-any | `catch (e: any) { return e.message }` | `catch (e)` with `e instanceof Error ? e.message : String(e)`. |
| 361 | no-explicit-any | `} as any` on the address payload | Declared `const data: Record<string, unknown>`, cast once at the `updateCart` call site. |
| 380 | no-explicit-any | `catch (e: any) { return e.message }` | Same narrowing as line 331. |

No behaviour change. `applyGiftCard`, `removeDiscount` and `removeGiftCard` are
all empty stubs with commented-out bodies in the upstream Medusa starter. They
are left as stubs, only their signatures were made lint-clean.

### src/modules/layout/components/language-select/index.tsx

Two errors, and the fix turned up something worth knowing.

| Line | Rule | Original |
|---|---|---|
| 135 | ban-ts-comment | `/* @ts-ignore */` above `<ReactCountryFlag>` |
| 169 | ban-ts-comment | `/* @ts-ignore */` above `<ReactCountryFlag>` |

Converting both to `@ts-expect-error` produced `TS2578: Unused '@ts-expect-error'
directive` on both lines. **The suppressions were suppressing nothing.** There is
no type error on either JSX element. Both comments were removed outright rather
than converted.

This is exactly the kind of thing `ignoreBuildErrors: true` keeps invisible: dead
suppressions accumulate and nobody can tell which ones are load bearing.

## Non-blocking warnings, not fixed

Three `react-hooks/exhaustive-deps` warnings, all inherited from the upstream
Medusa Next.js starter and all in code outside the scope of this work.

| File | Line | Missing dependencies |
|---|---|---|
| `src/modules/checkout/components/shipping/index.tsx` | 110 | `_pickupMethods`, `_shippingMethods`, `cart.id`, `shippingMethodId` |
| `src/modules/checkout/components/shipping-address/index.tsx` | 84 | `customer.email` |
| `src/modules/products/components/product-actions/index.tsx` | 96 | `pathname`, `router`, `searchParams` |

These are left alone deliberately. Adding the missing dependencies to a
`useEffect` in checkout can change when the effect refires, which is a behaviour
change in the payment path, and the spec's ground rules forbid refactoring beyond
listed scope. They do not block the build.

If they are ever addressed, each needs its own test of the checkout flow rather
than a blanket autofix.

## Reproducing

```bash
nvm use 22
pnpm --filter @dtc/storefront build     # must exit 0
cd apps/storefront && pnpm exec tsc --noEmit   # must exit 0
```

The build reads `apps/storefront/.env.local`. It hard-exits with a missing
variable error if `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is unset, because
`check-env-variables.js` runs at the top of `next.config.js`.
