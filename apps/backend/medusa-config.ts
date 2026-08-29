import fs from 'node:fs'
import path from 'node:path'

import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Credentials are read from the environment and never inlined. If the API key
// is absent the provider is not registered at all, so a checkout without
// Stripe configured falls back to the system default provider instead of the
// backend failing to boot.
/**
 * Where a panel's built assets live.
 *
 * Two answers, because the config runs from two places. In the source tree the
 * panel is a sibling workspace at apps/<name>. In the production artifact only
 * .medusa/server ships, and the panels are copied into
 * .medusa/server/dashboards/<name> by scripts/bundle-dashboards.mjs after
 * `medusa build` — the compiled config runs from the artifact root, so
 * __dirname points there.
 */
const dashboardAppDir = (name: string) => {
  const bundled = path.join(__dirname, 'dashboards', name)
  return fs.existsSync(bundled) ? bundled : path.join(__dirname, `../${name}`)
}

const stripeApiKey = process.env.STRIPE_API_KEY

// S3-compatible object storage for admin image uploads. Configured for
// Cloudflare R2, but the same provider works with AWS S3, Backblaze B2 or any
// other S3-compatible store, which is why nothing here is host specific.
//
// Without it Medusa falls back to local disk, and on a container host that disk
// is replaced on every deploy, so uploaded images disappear. Registration is
// gated on the bucket being set so local development works untouched.
const s3Bucket = process.env.S3_BUCKET

// withMercur wraps the same object defineConfig takes and calls defineConfig
// itself, so it replaces that call rather than nesting inside it. It also
// disables Medusa's own admin dashboard, replaces Medusa's middlewares, turns
// on the rbac feature flag, and appends the @mercurjs/core plugin. The modules
// listed below are spread in ahead of its own and survive untouched.
module.exports = withMercur({
  // withMercur disables Medusa's dashboard by default, on the assumption that
  // Mercur's own admin panel replaces it. That panel is not built here, so
  // without this the store has no management UI at all.
  admin: { disable: false },
  // Turns on the public seller sign-up form in the vendor panel, so a vendor
  // can create their own store instead of being created for them by hand.
  featureFlags: {
    seller_registration: true,
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      // Mercur's vendor panel is served from its own origin.
      vendorCors: process.env.VENDOR_CORS ?? 'http://localhost:5174',
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    // Mercur's own panels. withMercur registers these modules through its
    // plugin with no options at all, while their DashboardModuleOptions
    // declares path and appDir as required — so left alone the services never
    // finish onApplicationStart, and the `matcher: "*"` GET middleware calls an
    // app that was never built. Every GET request 500s, /health included, which
    // reads as a total outage rather than a missing dashboard.
    //
    // The two halves of the marketplace. At /seller a vendor registers and
    // manages their own products, orders, fulfilment and payouts. At /dashboard
    // an operator approves sellers and confirms the products they submit into
    // the shared catalogue, and handles commissions and payouts. Without the
    // second, those are scripts run by hand and a vendor who signs up is
    // blocked on someone noticing.
    //
    // Medusa's own dashboard stays at /app. It knows nothing about sellers, but
    // it is what the store was run from before and there is no reason to take
    // it away.
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      // viteDevServerPort is set away from Mercur's default of 7000, which on
      // macOS is AirPlay Receiver. In development the panel probes that port to
      // decide whether to proxy a Vite dev server, finds ControlCenter
      // listening, proxies /dashboard to it and serves a 403 — with the panel
      // built and present the whole time. Mercur's own code warns about this
      // ("hijack the dashboard when an unrelated process listens on the dev
      // port"); production skips the probe entirely.
      options: {
        name: 'Admin',
        path: '/dashboard',
        appDir: dashboardAppDir('admin'),
        viteDevServerPort: 7010,
      },
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        name: 'Vendor',
        path: '/seller',
        appDir: dashboardAppDir('vendor'),
        viteDevServerPort: 7011,
      },
    },
    ...(s3Bucket
      ? [
          {
            resolve: "@medusajs/medusa/file",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/file-s3",
                  id: "s3",
                  // These option names are snake_case. The provider class
                  // exposes a camelCase config internally, but the options it
                  // accepts are S3FileServiceOptions from
                  // @medusajs/framework/types, which is snake_case. Passing
                  // camelCase fails at boot with "Access key ID and secret
                  // access key are required".
                  options: {
                    // Public base URL images are served from. For R2 this is
                    // the bucket's public r2.dev address or a custom domain.
                    file_url: process.env.S3_FILE_URL,
                    access_key_id: process.env.S3_ACCESS_KEY_ID,
                    secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                    // R2 ignores region but the SDK requires one.
                    region: process.env.S3_REGION || "auto",
                    bucket: s3Bucket,
                    endpoint: process.env.S3_ENDPOINT,
                    // R2 rejects requests carrying an ACL header, so the
                    // provider has to omit it entirely. Bucket access is
                    // controlled by R2's own public access setting instead.
                    acl: false,
                    additional_client_config: { forcePathStyle: true },
                  },
                },
              ],
            },
          },
        ]
      : []),
    ...(stripeApiKey
      ? [
          {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: stripeApiKey,
                    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                  },
                },
              ],
            },
          },
        ]
      : []),
  ]
})
