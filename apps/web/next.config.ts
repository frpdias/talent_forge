import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fjudsjzfnysaztcwlwgm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/darwin-x64',
      'node_modules/@esbuild/linux-x64',
    ],
  },
};

export default nextConfig;
