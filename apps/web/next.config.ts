import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@worker-app/api', '@worker-app/ui'],
  output: 'standalone',
};

export default nextConfig;
