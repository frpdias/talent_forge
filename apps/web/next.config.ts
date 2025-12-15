import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Limit file tracing to the monorepo root to avoid Next scanning parent directories
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
