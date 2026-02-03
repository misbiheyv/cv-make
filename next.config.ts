import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer'],
  output: 'standalone',
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
