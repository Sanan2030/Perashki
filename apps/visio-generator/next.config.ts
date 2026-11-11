import type { NextConfig } from "next";
const basePath = process.env.PERASHKI_BASE_PATH ?? '/tools/visio-generator';

const config: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
};

export default config;
