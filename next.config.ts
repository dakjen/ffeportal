// next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Your existing config...
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer', '@react-pdf/primitives', '@react-pdf/image'],
  },
};

export default nextConfig;
