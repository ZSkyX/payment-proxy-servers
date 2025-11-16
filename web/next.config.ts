import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Suppress hydration warnings from third-party libraries like Privy
  reactStrictMode: false,
  // Set the workspace root to the web directory to avoid parent lockfile detection
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
