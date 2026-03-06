/** @type {import('next').NextConfig} */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  transpilePackages: ['@talentforge/types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fjudsjzfnysaztcwlwgm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Fixa o root do monorepo apenas em produção — evita varredura do monorepo em dev
  ...(!isDev && {
    outputFileTracingRoot: join(__dirname, '../../'),
  }),
};

export default nextConfig;
