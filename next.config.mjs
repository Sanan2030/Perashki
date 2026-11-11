import { portalRoutes } from './scripts/deployment.mjs';

/** @type {import('next').NextConfig} */
const config = {
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async rewrites() {
    return { beforeFiles: portalRoutes.map(source => ({ source, destination: '/index.html' })) };
  },
};
export default config;
