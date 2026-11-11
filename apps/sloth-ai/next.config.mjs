/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.PERASHKI_BASE_PATH ?? '/tools/sloth-ai',
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  reactStrictMode: true,
};

export default nextConfig;
