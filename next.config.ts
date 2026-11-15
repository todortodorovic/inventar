import type { NextConfig } from "next"
import { siteConfig } from "./src/config/site"

const all = siteConfig.locales.join("|")

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // The default locale is served without a prefix (`/`, `/inventory`…) and
  // rendered from `/[lang]` with lang = default. Its prefixed URLs redirect
  // back, so every page has one canonical address. Other locales keep their
  // prefix (`/en/inventory`). Rewrites run after static files, so `/_next`
  // and `/icon.svg` are never touched.
  async rewrites() {
    return [
      { source: "/", destination: `/${siteConfig.defaultLocale}` },
      {
        source: `/:path((?!(?:${all})(?:/|$)).+)`,
        destination: `/${siteConfig.defaultLocale}/:path`,
      },
    ]
  },
  async redirects() {
    return [
      { source: `/${siteConfig.defaultLocale}`, destination: "/", permanent: true },
      { source: `/${siteConfig.defaultLocale}/:path*`, destination: "/:path*", permanent: true },
    ]
  },
}

export default nextConfig
