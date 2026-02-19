// next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Your existing config...
  serverExternalPackages: ['@react-pdf/renderer', '@react-pdf/primitives', '@react-pdf/image'],

};

export default nextConfig;
