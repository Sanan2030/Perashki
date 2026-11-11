import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.PERASHKI_BASE_PATH ?? '/tools/overtimer',
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
