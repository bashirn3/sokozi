import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { createRequire } from "node:module"

// createRequire rather than a static import: the plugin's ESM build cannot
// dynamic-require medusa-config.ts, and when it fails it silently falls back to
// a base of "/" — which 404s every panel asset once the backend strips the
// /seller prefix. Mercur's own template carries the same note.
const require = createRequire(import.meta.url)
const { mercurDashboardPlugin } = require("@mercurjs/dashboard-sdk/vite")

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  // Baked into the panel at build time. The backend serves this bundle, so in
  // production it has to be the deployed backend origin or the panel's API
  // calls go to localhost from a customer's browser.
  const backendUrl = env.VITE_MERCUR_BACKEND_URL || env.MERCUR_BACKEND_URL

  return {
    plugins: [
      react(),
      mercurDashboardPlugin({
        // The plugin reads the vendor-ui module's `path` out of the Medusa
        // config to work out the base the assets are served under. Ours lives
        // in apps/backend rather than the template's packages/api.
        medusaConfigPath: "../backend/medusa-config.ts",
        ...(backendUrl ? { backendUrl } : {}),
      }),
    ],
  }
})
