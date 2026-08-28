import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Credentials are read from the environment and never inlined. If the API key
// is absent the provider is not registered at all, so a checkout without
// Stripe configured falls back to the system default provider instead of the
// backend failing to boot.
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
    // These two are not optional bookkeeping. withMercur registers admin-ui
    // and vendor-ui through its plugin with no options at all, but Mercur's
    // own DashboardModuleOptions declares name, path and appDir as required.
    // The services therefore never finish onApplicationStart, their express
    // app is never built, and Mercur's `matcher: "*"` GET middleware calls the
    // resulting undefined anyway — so every GET request 500s, /health
    // included. The failure looks like a total deployment outage rather than a
    // missing dashboard. Declaring the modules here with disable: true makes
    // that middleware bail out before it reaches the missing app.
    //
    // Turn these on by pointing appDir at a real dashboard build and dropping
    // disable, once we decide we want Mercur's panels.
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: { disable: true, name: 'Admin', path: '/app', appDir: '.' },
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: { disable: true, name: 'Vendor', path: '/vendor', appDir: '.' },
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
