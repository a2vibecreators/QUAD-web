import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export',  // Disabled - we have API routes that need Node.js runtime
  trailingSlash: false,
  // Required for API routes to work
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // TypeScript and ESLint checking re-enabled (Jan 5, 2026)
  // All type errors fixed - ready for production builds
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
