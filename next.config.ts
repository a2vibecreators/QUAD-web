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
  // TODO: Re-enable type checking after full Prisma migration is complete
  // Temporarily disabled during Java backend migration
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
