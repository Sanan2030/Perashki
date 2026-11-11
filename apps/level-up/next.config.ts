import type { NextConfig } from 'next';
const config: NextConfig = {
  ...(process.env.PERASHKI_STATIC_EXPORT === '1' ? { output: 'export' as const, trailingSlash: true, images: { unoptimized: true }, turbopack: { root: process.env.PERASHKI_REPO_ROOT } } : {}),
  basePath: process.env.PERASHKI_BASE_PATH || '',
  env: { NEXT_PUBLIC_BASE_PATH: process.env.PERASHKI_BASE_PATH || '' },
  allowedDevOrigins: ['127.0.0.1'],
  poweredByHeader: false,
  async headers() {
    if (process.env.PERASHKI_STATIC_EXPORT === '1') return [];
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: process.env.PERASHKI_BASE_PATH ? 'SAMEORIGIN' : 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
