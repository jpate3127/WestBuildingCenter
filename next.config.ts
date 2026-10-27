import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Sent on every response. The site may be framed only by itself; HSTS only in
 * production (local dev is plain http).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  experimental: {
    // Admin uploads (flyer PDFs, project photos) go through the proxy and
    // server actions; 32 MB covers a few phone photos at once.
    proxyClientMaxBodySize: "32mb",
    serverActions: { bodySizeLimit: "32mb" },
  },
  poweredByHeader: false,
  reactCompiler: true,
  // CLAUDE.md is the project's notes; skip the generated AGENTS.md.
  agentRules: false,
  // The dev badge sits right where the phone action bar is.
  devIndicators: false,
  serverExternalPackages: ["sharp"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Uploaded images are content-addressed by key; cache them hard.
      { source: "/img/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      // Nothing under /admin should be cached by a shared cache.
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
};

export default nextConfig;
