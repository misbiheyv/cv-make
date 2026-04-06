import type { NextConfig } from 'next';

const { version } = require('./package.json');

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer'],
  output: 'standalone',
  turbopack: {
    root: process.cwd(),
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default nextConfig;
