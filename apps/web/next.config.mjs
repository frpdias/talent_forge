/** @type {import('next').NextConfig} */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://fjudsjzfnysaztcwlwgm.supabase.co https://vercel.com https://vercel.live",
      "font-src 'self' https://fonts.gstatic.com https://vercel.live",
      "connect-src 'self' https://fjudsjzfnysaztcwlwgm.supabase.co wss://fjudsjzfnysaztcwlwgm.supabase.co https://accounts.google.com https://vercel.live https://api.brevo.com",
      isDev
        ? "frame-src 'self' http://localhost:8051 https://vercel.live"
        : "frame-src 'self' https://vercel.live",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  // Fixa o root do monorepo apenas em produção — evita varredura do monorepo em dev
  ...(!isDev && {
    outputFileTracingRoot: join(__dirname, '../../'),
  }),
};

export default nextConfig;
