import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Suppress hydration warnings from third-party libraries like Privy
  reactStrictMode: false,
};

export default nextConfig;
