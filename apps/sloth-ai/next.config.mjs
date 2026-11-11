/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.PERASHKI_STATIC_EXPORT === '1' ? { output: 'export', trailingSlash: true, images: { unoptimized: true }, turbopack: { root: process.env.PERASHKI_REPO_ROOT } } : {}),
  basePath: process.env.PERASHKI_BASE_PATH || '',
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
