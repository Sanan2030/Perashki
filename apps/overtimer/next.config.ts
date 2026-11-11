import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.PERASHKI_STATIC_EXPORT === '1' ? { output: 'export' as const, trailingSlash: true, images: { unoptimized: true }, turbopack: { root: process.env.PERASHKI_REPO_ROOT } } : {}),
  basePath: process.env.PERASHKI_BASE_PATH || '',
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
