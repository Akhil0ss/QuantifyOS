import type { NextConfig } from "next";

// Server-side only: used by Next.js rewrites to proxy /api/* to backend
// This avoids HTTPS mixed-content by proxying through Vercel's server
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://80.225.250.239';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
