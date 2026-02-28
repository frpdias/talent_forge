/** @type {import('next').NextConfig} */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
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
  // Fixa o root do monorepo — impede Next.js de inferir diretórios externos
  outputFileTracingRoot: join(__dirname, '../../'),
};

export default nextConfig;
